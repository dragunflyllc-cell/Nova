import { z } from "zod";
import type { NormalizedFill } from "./types.js";

/**
 * ProjectX Gateway adapter (TopstepX's broker API — also usable by any prop
 * firm/broker running the same ProjectX Gateway backend, not just Topstep).
 *
 * Unlike Tradovate, this is genuinely self-serve: a trader buys the
 * "ProjectX API" add-on in their own account settings and gets a
 * username + API key immediately — no partner application, no waiting on
 * anyone's business-development team to respond. Each Nova user brings
 * their own key; Nova itself needs no app-level client id/secret.
 *
 * VERIFIED against the real request/response shapes used by the
 * `project-x-py` open-source SDK (github.com/TexasCoding/project-x-py,
 * source read directly — not docs prose, which 403s to automated fetches
 * the same way Tradovate's did):
 *   - Base URL:        https://api.topstepx.com/api
 *   - Login:            POST {base}/Auth/loginKey  { userName, apiKey } -> { token }
 *   - Accounts:          POST {base}/Account/search { onlyActiveAccounts: true }
 *                        -> { success, accounts: [{ id, name, balance, canTrade, isVisible, simulated }] }
 *   - Trades:            GET {base}/trades/search?accountId&startDate&endDate&limit
 *                        (Bearer auth) -> Trade[] directly (not wrapped)
 *   - Trade shape:       { id, accountId, contractId, creationTimestamp,
 *                          price, profitAndLoss, fees, side (0=Buy,1=Sell),
 *                          size, voided, orderId }
 *
 * NOT VERIFIED against a real account — this hasn't been run against a live
 * ProjectX API key yet:
 *   - Whether the login response ever includes an explicit `success`/error
 *     wrapper on failure, or just a non-2xx status. `login` handles both.
 *   - Exact behavior of the rate limiter (documented elsewhere as ~429 on
 *     excess); no retry/backoff is implemented here yet.
 *   - Real-time streaming (SignalR hubs at rtc.topstepx.com) isn't used —
 *     this only does REST polling via /trades/search, called on demand from
 *     /me/brokers/projectx/sync rather than a persistent connection.
 */

const API_BASE = "https://api.topstepx.com/api";

export interface ProjectXSession {
  token: string;
  expiresAt: Date;
}

export interface ProjectXAccount {
  id: number;
  name: string;
  balance: number;
  canTrade: boolean;
  simulated: boolean;
}

const loginResponseSchema = z.object({
  token: z.string().min(1),
  success: z.boolean().optional(),
  errorMessage: z.string().nullable().optional(),
});

const accountSchema = z.object({
  id: z.number(),
  name: z.string(),
  balance: z.number(),
  canTrade: z.boolean(),
  isVisible: z.boolean().optional(),
  simulated: z.boolean(),
});

const accountSearchResponseSchema = z.object({
  success: z.boolean(),
  accounts: z.array(accountSchema),
  errorMessage: z.string().nullable().optional(),
});

const tradeSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    contractId: z.string(),
    creationTimestamp: z.string(),
    price: z.number(),
    side: z.number(),
    size: z.number(),
  })
  .passthrough();

/** Decodes the JWT payload to read its `exp` claim, without verifying the signature — we only need the expiry, and the token's authenticity is guaranteed by having just received it over TLS from ProjectX itself. */
function decodeJwtExpiry(token: string): Date {
  const fallback = new Date(Date.now() + 60 * 60 * 1000);
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return fallback;
  try {
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = segment + "=".repeat((4 - (segment.length % 4)) % 4);
    const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { exp?: number };
    if (typeof json.exp === "number") return new Date(json.exp * 1000);
  } catch {
    // Fall through to the default below — an unparseable token still
    // authenticated successfully, so treat it as short-lived rather than fail.
  }
  return fallback;
}

export async function login(userName: string, apiKey: string): Promise<ProjectXSession> {
  const response = await fetch(`${API_BASE}/Auth/loginKey`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, apiKey }),
  });
  if (!response.ok) {
    throw new Error(`ProjectX login failed: ${response.status} ${await response.text()}`);
  }
  const parsed = loginResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`ProjectX login response didn't match the expected shape: ${parsed.error.message}`);
  }
  if (parsed.data.success === false) {
    throw new Error(`ProjectX login rejected: ${parsed.data.errorMessage ?? "unknown error"}`);
  }
  return { token: parsed.data.token, expiresAt: decodeJwtExpiry(parsed.data.token) };
}

export async function listAccounts(token: string): Promise<ProjectXAccount[]> {
  const response = await fetch(`${API_BASE}/Account/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ onlyActiveAccounts: true }),
  });
  if (!response.ok) {
    throw new Error(`ProjectX account search failed: ${response.status} ${await response.text()}`);
  }
  const parsed = accountSearchResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`ProjectX account search response didn't match the expected shape: ${parsed.error.message}`);
  }
  if (!parsed.data.success) {
    throw new Error(`ProjectX account search failed: ${parsed.data.errorMessage ?? "unknown error"}`);
  }
  return parsed.data.accounts;
}

export function parseTrade(raw: unknown): NormalizedFill {
  const parsed = tradeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`ProjectX trade did not match the assumed shape (see brokers/projectx.ts header): ${JSON.stringify(raw)}`);
  }
  const t = parsed.data;
  return {
    externalFillId: String(t.id),
    contractSymbol: t.contractId,
    side: t.side === 0 ? "buy" : "sell",
    quantity: Math.abs(t.size),
    price: t.price,
    filledAt: new Date(t.creationTimestamp),
    raw,
  };
}

export async function fetchTrades(
  token: string,
  accountId: number,
  opts: { startDate?: Date; endDate?: Date; limit?: number } = {},
): Promise<NormalizedFill[]> {
  const endDate = opts.endDate ?? new Date();
  const startDate = opts.startDate ?? new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    accountId: String(accountId),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    limit: String(opts.limit ?? 500),
  });
  const response = await fetch(`${API_BASE}/trades/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`ProjectX trades/search failed: ${response.status} ${await response.text()}`);
  }
  const raw = await response.json();
  if (!Array.isArray(raw)) {
    throw new Error(`Expected trades/search to return an array, got: ${JSON.stringify(raw)}`);
  }
  return raw.map(parseTrade);
}
