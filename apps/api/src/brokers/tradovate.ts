import { z } from "zod";
import { env } from "../env.js";
import type { BrokerAdapter, BrokerTokens, NormalizedFill } from "./types.js";

/**
 * Tradovate adapter.
 *
 * Getting real client_id/client_secret no longer requires Tradovate's
 * Partner program, which stalled with no response — Application Settings →
 * API Access tab → "OAuth Registration" in any live, funded (>$1000)
 * Tradovate account is self-serve: complete the self-attestation, sign the
 * digital usage agreement, register an app (title + redirect URI), and
 * Tradovate hands back a client_id/client_secret immediately. Third-party
 * apps built this way (TradersPost, PickMyTrade, TradeSyncer) don't require
 * their end users to buy the API Access add-on themselves — only the
 * account used to register the OAuth app needs it. See
 * docs/ARCHITECTURE.md#broker-integrations for the full writeup.
 *
 * VERIFIED against Tradovate's own public repos/community docs at build time:
 *   - Authorization URL: https://trader.tradovate.com/oauth
 *   - Token exchange:    POST https://live.tradovateapi.com/auth/oauthtoken
 *   - Token renewal:     POST {base}/auth/renewaccesstoken (Bearer: current,
 *                         still-unexpired access token — not a refresh_token;
 *                         Tradovate's OAuth exchange never issues one).
 *                         Access tokens live ~90 minutes.
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
 *   - The exact renewaccesstoken response shape (assumed below: accessToken
 *     + expirationTime, sourced from community-forum/wiki descriptions, not
 *     primary docs).
 */

const AUTHORIZE_URL = "https://trader.tradovate.com/oauth";
const TOKEN_URL = "https://live.tradovateapi.com/auth/oauthtoken";
const API_BASE =
  env.TRADOVATE_ENV === "live" ? "https://live.tradovateapi.com/v1" : "https://demo.tradovateapi.com/v1";
const RENEW_URL = `${API_BASE}/auth/renewaccesstoken`;

const tokenResponseSchema = z.union([
  z.object({ access_token: z.string(), expires_in: z.number() }),
  z.object({ error: z.string(), error_description: z.string().optional() }),
]);

const renewResponseSchema = z.union([
  z.object({ accessToken: z.string(), expirationTime: z.string() }),
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

  /**
   * `refreshToken` here is semantically the current, still-unexpired access
   * token — Tradovate's renewal mechanism reuses it as Bearer auth rather
   * than issuing a separate refresh_token (see file header). Callers must
   * renew before the ~90-minute access token actually expires; once it has,
   * this call fails and the user has to reconnect via getAuthorizationUrl.
   */
  async refreshTokens(refreshToken: string): Promise<BrokerTokens> {
    const response = await fetch(RENEW_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    if (!response.ok) {
      throw new Error(`Tradovate token renewal failed: ${response.status} ${await response.text()}`);
    }
    const json = renewResponseSchema.parse(await response.json());
    if ("error" in json) {
      throw new Error(`Tradovate token renewal failed: ${json.error} — ${json.error_description ?? ""}`);
    }
    return { accessToken: json.accessToken, expiresAt: new Date(json.expirationTime) };
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
