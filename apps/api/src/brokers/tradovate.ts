import { z } from "zod";
import { env } from "../env.js";
import type { BrokerAdapter, BrokerTokens, NormalizedFill } from "./types.js";

/**
 * Tradovate adapter.
 *
 * VERIFIED against Tradovate's own public repos/community docs at build time:
 *   - Authorization URL: https://trader.tradovate.com/oauth
 *   - Token exchange:    POST https://live.tradovateapi.com/auth/oauthtoken
 *   - REST base:         https://{demo|live}.tradovateapi.com/v1
 *   - Fills:             GET {base}/fill/list  (Bearer auth)
 *
 * NOT VERIFIED — Tradovate's official docs (api.tradovate.com,
 * partner.tradovate.com) returned 403 to automated fetches, so these
 * pieces are best-effort and MUST be checked against a real account
 * before this is trusted with real user data:
 *   - The exact field names on a fill/list item (assumed below: id,
 *     contractId or symbol, action ("Buy"/"Sell"), qty, price, timestamp).
 *     `parseFill` validates strictly and throws with the raw payload
 *     attached on any mismatch, rather than silently coercing bad data —
 *     that error is the signal to come back and fix this mapping.
 *   - Whether the OAuth token response includes a usable refresh_token.
 *     `refreshTokens` throws until this is confirmed rather than guess.
 */

const AUTHORIZE_URL = "https://trader.tradovate.com/oauth";
const TOKEN_URL = "https://live.tradovateapi.com/auth/oauthtoken";
const API_BASE =
  env.TRADOVATE_ENV === "live" ? "https://live.tradovateapi.com/v1" : "https://demo.tradovateapi.com/v1";

const tokenResponseSchema = z.union([
  z.object({ access_token: z.string(), expires_in: z.number() }),
  z.object({ error: z.string(), error_description: z.string().optional() }),
]);

// Best-effort shape — see file header. Kept permissive on unknown extra
// fields (`.passthrough()`) but strict on the ones we actually read.
const rawFillSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    contractId: z.union([z.string(), z.number()]).optional(),
    symbol: z.string().optional(),
    action: z.string().optional(),
    side: z.string().optional(),
    qty: z.number().optional(),
    quantity: z.number().optional(),
    price: z.number(),
    timestamp: z.string().optional(),
    tradeDate: z.string().optional(),
  })
  .passthrough();

export function parseFill(raw: unknown): NormalizedFill {
  const parsed = rawFillSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Tradovate fill did not match the assumed shape (see brokers/tradovate.ts header): ${JSON.stringify(raw)}`,
    );
  }
  const f = parsed.data;
  const sideRaw = (f.action ?? f.side ?? "").toLowerCase();
  const side = sideRaw.includes("sell") ? "sell" : sideRaw.includes("buy") ? "buy" : undefined;
  const quantity = f.qty ?? f.quantity;
  const symbol = f.symbol ?? (f.contractId !== undefined ? String(f.contractId) : undefined);
  const filledAtRaw = f.timestamp ?? f.tradeDate;

  if (!side || quantity === undefined || !symbol || !filledAtRaw) {
    throw new Error(
      `Tradovate fill was missing a required field after best-effort mapping: ${JSON.stringify(raw)}`,
    );
  }

  return {
    externalFillId: String(f.id),
    contractSymbol: symbol,
    side,
    quantity,
    price: f.price,
    filledAt: new Date(filledAtRaw),
    raw,
  };
}

export const tradovateAdapter: BrokerAdapter = {
  provider: "TRADOVATE",

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.TRADOVATE_CLIENT_ID,
      redirect_uri: env.TRADOVATE_REDIRECT_URI,
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCodeForTokens(code: string): Promise<BrokerTokens> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env.TRADOVATE_CLIENT_ID,
      client_secret: env.TRADOVATE_CLIENT_SECRET,
      redirect_uri: env.TRADOVATE_REDIRECT_URI,
      code,
    });
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = tokenResponseSchema.parse(await response.json());
    if ("error" in json) {
      throw new Error(`Tradovate token exchange failed: ${json.error} — ${json.error_description ?? ""}`);
    }
    return {
      accessToken: json.access_token,
      expiresAt: new Date(Date.now() + json.expires_in * 1000),
    };
  },

  async refreshTokens(): Promise<BrokerTokens> {
    throw new Error(
      "Tradovate token refresh is not implemented: the OAuth token exchange response format we could " +
        "verify (community docs) only confirmed access_token + expires_in, with no confirmed refresh_token " +
        "field. Confirm the real renewal mechanism against Tradovate's Partner API docs (requires partner " +
        "access) before implementing this — do not guess.",
    );
  },

  async fetchFills(tokens: BrokerTokens): Promise<NormalizedFill[]> {
    const response = await fetch(`${API_BASE}/fill/list`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Tradovate fill/list request failed: ${response.status} ${await response.text()}`);
    }
    const raw = await response.json();
    if (!Array.isArray(raw)) {
      throw new Error(`Expected fill/list to return an array, got: ${JSON.stringify(raw)}`);
    }
    return raw.map(parseFill);
  },
};
