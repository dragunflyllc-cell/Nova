export interface BrokerTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface NormalizedFill {
  externalFillId: string;
  contractSymbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  filledAt: Date;
  raw: unknown;
}

/**
 * A broker-agnostic contract every integration implements. Tradovate is the
 * first adapter (apps/api/src/brokers/tradovate.ts) — Rithmic, NinjaTrader,
 * and others plug in behind this same interface later without touching the
 * routes or database layer that consume it.
 */
export interface BrokerAdapter {
  provider: "TRADOVATE";
  getAuthorizationUrl(state: string): string;
  exchangeCodeForTokens(code: string): Promise<BrokerTokens>;
  /** Not every provider's OAuth flow issues a usable refresh token — implementations may throw if unsupported. */
  refreshTokens(refreshToken: string): Promise<BrokerTokens>;
  fetchFills(tokens: BrokerTokens): Promise<NormalizedFill[]>;
}
