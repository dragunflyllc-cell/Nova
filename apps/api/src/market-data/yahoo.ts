import { z } from "zod";

/**
 * Delayed futures quotes for Nova's paper-trading engine, via Yahoo
 * Finance's public chart endpoint — not an official/licensed data feed,
 * but the standard free source thousands of open-source tools (the
 * `yfinance` Python library and its many derivatives) already rely on for
 * exactly this. No API key, no funded account, no partner program.
 *
 * VERIFIED: the endpoint URL and response shape (`chart.result[0].meta.
 * regularMarketPrice` / `.regularMarketTime`) are extremely well-documented
 * — this is one of the most widely reverse-engineered public data sources
 * in existence, not a one-off assumption.
 *
 * NOT VERIFIED IN THIS ENVIRONMENT: this sandbox's network egress policy
 * blocks query1.finance.yahoo.com entirely (same "host not in allowlist"
 * behavior as every other external API touched in this project), so this
 * has not been exercised against a real response here. `parseQuote`
 * throws loudly with the raw payload on any shape mismatch rather than
 * silently coercing, so a real failure surfaces immediately once this
 * runs somewhere with open network access.
 *
 * Delayed, not real-time — typically ~15-20 minutes behind the actual
 * market on index/futures symbols. Fine for a practice/gamification loop;
 * explicitly not a stand-in for live trading conditions (see
 * docs/ARCHITECTURE.md's paper-trading section).
 */

const CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

/** Nova's own contract symbols -> Yahoo's continuous-futures tickers. */
const SYMBOL_MAP: Record<string, string> = {
  ES: "ES=F",
  MES: "MES=F",
  NQ: "NQ=F",
  MNQ: "MNQ=F",
  CL: "CL=F",
  MCL: "MCL=F",
  GC: "GC=F",
  MGC: "MGC=F",
};

export function supportedSymbols(): string[] {
  return Object.keys(SYMBOL_MAP);
}

const chartResponseSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          meta: z.object({
            symbol: z.string(),
            regularMarketPrice: z.number(),
            regularMarketTime: z.number(),
          }),
        }),
      )
      .nullable(),
    error: z.object({ code: z.string(), description: z.string() }).nullable(),
  }),
});

export interface DelayedQuote {
  symbol: string;
  price: number;
  asOf: Date;
}

export async function fetchDelayedQuote(symbol: string): Promise<DelayedQuote> {
  const yahooSymbol = SYMBOL_MAP[symbol.toUpperCase()];
  if (!yahooSymbol) {
    throw new Error(`Unsupported symbol for paper trading: ${symbol}. Supported: ${supportedSymbols().join(", ")}`);
  }

  const response = await fetch(`${CHART_BASE}/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NovaPaperTrading/1.0)" },
  });
  if (!response.ok) {
    throw new Error(`Yahoo Finance quote request failed: ${response.status} ${await response.text()}`);
  }

  const parsed = chartResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`Yahoo Finance response didn't match the expected shape (see market-data/yahoo.ts header): ${parsed.error.message}`);
  }
  const { chart } = parsed.data;
  if (chart.error) {
    throw new Error(`Yahoo Finance returned an error for ${yahooSymbol}: ${chart.error.code} — ${chart.error.description}`);
  }
  const result = chart.result?.[0];
  if (!result) {
    throw new Error(`Yahoo Finance returned no data for ${yahooSymbol}`);
  }

  return {
    symbol: symbol.toUpperCase(),
    price: result.meta.regularMarketPrice,
    asOf: new Date(result.meta.regularMarketTime * 1000),
  };
}
