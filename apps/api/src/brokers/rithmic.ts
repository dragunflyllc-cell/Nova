import { z } from "zod";
import { env } from "../env.js";
import type { NormalizedFill } from "./types.js";

/**
 * Rithmic adapter — talks to services/rithmic-sidecar over internal HTTP
 * rather than speaking Rithmic's protocol directly. Rithmic's real wire
 * protocol is Protocol Buffers over WebSocket with no working Node client
 * anywhere and a schema only available via Rithmic's developer dev-kit —
 * see the sidecar's own header comment for the full reasoning. This file
 * only knows about the sidecar's plain-JSON HTTP contract.
 *
 * The sidecar converts whatever Rithmic actually returns via protobuf
 * reflection (no guessed field names on that side), so the exact shape of
 * an account/fill object is genuinely unknown until this runs against a
 * real login. `parseFill` below is written defensively for that reason —
 * same pattern as `apps/api/src/brokers/tradovate.ts`'s `parseFill`: try
 * several plausible field-name variants, throw loudly with the raw
 * payload attached if none match, rather than silently coerce.
 */

export interface RithmicCredentials {
  username: string;
  password: string;
}

export interface RithmicAccount {
  accountId: string;
  raw: unknown;
}

const accountCandidateSchema = z.record(z.unknown());

function connectionBody(creds: RithmicCredentials) {
  return {
    username: creds.username,
    password: creds.password,
    systemName: env.RITHMIC_SYSTEM_NAME,
    gateway: env.RITHMIC_GATEWAY_URL,
  };
}

async function sidecarRequest(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${env.RITHMIC_SIDECAR_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = json && typeof json === "object" && "detail" in json ? (json as { detail: string }).detail : null;
    throw new Error(`Rithmic sidecar request to ${path} failed: ${detail ?? response.status}`);
  }
  return json;
}

export function extractAccountId(raw: unknown): string | undefined {
  const parsed = accountCandidateSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  const candidates = ["account_id", "accountId", "fcm_account_id", "id"];
  for (const key of candidates) {
    const value = parsed.data[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return undefined;
}

export async function listAccounts(creds: RithmicCredentials): Promise<RithmicAccount[]> {
  const raw = await sidecarRequest("/accounts", connectionBody(creds));
  if (!Array.isArray(raw)) {
    throw new Error(`Expected the Rithmic sidecar's /accounts to return an array, got: ${JSON.stringify(raw)}`);
  }
  return raw.map((item) => {
    const accountId = extractAccountId(item);
    if (!accountId) {
      throw new Error(
        `Rithmic account did not contain a recognizable account id field (see brokers/rithmic.ts header): ${JSON.stringify(item)}`,
      );
    }
    return { accountId, raw: item };
  });
}

export function parseFill(raw: unknown): NormalizedFill {
  const parsed = accountCandidateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Rithmic fill was not an object (see brokers/rithmic.ts header): ${JSON.stringify(raw)}`);
  }
  const f = parsed.data;

  const id = f.fill_id ?? f.unique_fill_id ?? f.fillId ?? f.id;
  const symbol = f.symbol ?? f.contract ?? f.instrument;
  const price = f.price ?? f.fill_price ?? f.fillPrice;
  const qtyRaw = f.qty ?? f.quantity ?? f.fill_size ?? f.size;
  const sideRaw = String(f.transaction_type ?? f.side ?? f.buy_sell_type ?? "").toLowerCase();
  const side = sideRaw.includes("sell") ? "sell" : sideRaw.includes("buy") ? "buy" : undefined;

  // Rithmic timestamps commonly come as ssboe (seconds since epoch) +
  // usecs (microseconds) rather than an ISO string — handle both.
  let filledAt: Date | undefined;
  if (typeof f.ssboe === "number") {
    filledAt = new Date(f.ssboe * 1000 + (typeof f.usecs === "number" ? f.usecs / 1000 : 0));
  } else if (typeof f.timestamp === "string" || typeof f.fill_time === "string") {
    filledAt = new Date(String(f.timestamp ?? f.fill_time));
  }

  if (id === undefined || !symbol || price === undefined || qtyRaw === undefined || !side || !filledAt || Number.isNaN(filledAt.getTime())) {
    throw new Error(`Rithmic fill was missing a required field after best-effort mapping: ${JSON.stringify(raw)}`);
  }

  return {
    externalFillId: String(id),
    contractSymbol: String(symbol),
    side,
    quantity: Math.abs(Number(qtyRaw)),
    price: Number(price),
    filledAt,
    raw,
  };
}

export async function fetchFills(
  creds: RithmicCredentials,
  accountId: string,
  opts: { startTime?: Date; endTime?: Date } = {},
): Promise<NormalizedFill[]> {
  const endTime = opts.endTime ?? new Date();
  const startTime = opts.startTime ?? new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
  const raw = await sidecarRequest("/fills", {
    ...connectionBody(creds),
    accountId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  });
  if (!Array.isArray(raw)) {
    throw new Error(`Expected the Rithmic sidecar's /fills to return an array, got: ${JSON.stringify(raw)}`);
  }
  return raw.map(parseFill);
}
