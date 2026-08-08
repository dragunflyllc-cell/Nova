/**
 * Scores one EvaluationAttempt's current stage against real matched trades.
 *
 * Same honesty boundary as behavior/rules.ts: everything here is computed
 * purely from MatchedTrade data (timestamps, quantity, realized points
 * P&L), scaled to dollars by a trader-declared pointValueUsd — Nova has no
 * per-contract tick-value reference table yet (see trades/matching.ts's
 * header), so this is self-declared, not verified against broker data.
 *
 * Two deliberate scope decisions, both flagged rather than silently assumed:
 * - **Static, not trailing, drawdown.** Max overall drawdown is measured
 *   from the tier's fixed starting balance, not a trailing high-water mark.
 *   Trailing drawdown (what some real firms use) is a real, different rule
 *   shape — not built here.
 * - **Equity curve from closed trades only.** There's no intra-trade
 *   unrealized P&L in MatchedTrade, so the equity curve only moves at each
 *   trade's close — same boundary as everything else built on this data.
 */

import type { EvaluationStatus, EvaluationTier } from "@nova/types";
import type { MatchedTrade } from "../trades/matching.js";

export interface EvaluationEvalResult {
  equityCents: number;
  profitCents: number;
  tradingDaysCount: number;
  dailyLossBreached: boolean;
  worstDailyLossCents: number;
  overallDrawdownBreached: boolean;
  worstDrawdownCents: number;
  profitTargetReached: boolean;
  minTradingDaysMet: boolean;
  nextStatus: EvaluationStatus;
  detail: string[];
}

function dayKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * `currentStatus` must be a "live" stage (ACTIVE or FUNDED_ACTIVE) — terminal
 * statuses (PASSED, FAILED, FUNDED_BREACHED) aren't re-evaluated by this
 * function; callers should only invoke it for attempts still in play.
 * `trades` should already be filtered to the current stage's window (trades
 * opened at or after the stage's startedAt) — this function doesn't filter
 * by date itself, matching checkRule's contract in behavior/rules.ts.
 */
export function evaluateAttempt(
  tier: EvaluationTier,
  pointValueUsd: number,
  currentStatus: "ACTIVE" | "FUNDED_ACTIVE",
  trades: MatchedTrade[],
): EvaluationEvalResult {
  const sorted = [...trades].sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime());
  const startingBalanceCents = tier.virtualBalanceCents;

  let equityCents = startingBalanceCents;
  let worstEquityCents = startingBalanceCents;
  const dailyPnlCents = new Map<string, number>();
  const tradingDays = new Set<string>();

  for (const trade of sorted) {
    const pnlCents = Math.round(trade.realizedPointsPnl * pointValueUsd * 100);
    equityCents += pnlCents;
    worstEquityCents = Math.min(worstEquityCents, equityCents);

    const day = dayKeyUtc(trade.closedAt);
    tradingDays.add(day);
    dailyPnlCents.set(day, (dailyPnlCents.get(day) ?? 0) + pnlCents);
  }

  let worstDailyLossCents = 0;
  for (const dayPnlCents of dailyPnlCents.values()) {
    worstDailyLossCents = Math.max(worstDailyLossCents, -dayPnlCents);
  }
  const worstDrawdownCents = Math.max(0, startingBalanceCents - worstEquityCents);
  const profitCents = equityCents - startingBalanceCents;

  const dailyLossLimitCents = Math.round(tier.maxDailyLossPct * startingBalanceCents);
  const drawdownLimitCents = Math.round(tier.maxOverallDrawdownPct * startingBalanceCents);
  const profitTargetCents = Math.round(tier.profitTargetPct * startingBalanceCents);

  const dailyLossBreached = worstDailyLossCents > dailyLossLimitCents;
  const overallDrawdownBreached = worstDrawdownCents > drawdownLimitCents;
  const profitTargetReached = profitCents >= profitTargetCents;
  const minTradingDaysMet = tradingDays.size >= tier.minTradingDays;

  const detail: string[] = [
    `Equity $${(equityCents / 100).toFixed(2)} (started $${(startingBalanceCents / 100).toFixed(2)})`,
    `Worst daily loss $${(worstDailyLossCents / 100).toFixed(2)} (limit $${(dailyLossLimitCents / 100).toFixed(2)})`,
    `Worst drawdown $${(worstDrawdownCents / 100).toFixed(2)} (limit $${(drawdownLimitCents / 100).toFixed(2)})`,
    `${tradingDays.size} trading day(s) (min ${tier.minTradingDays})`,
  ];

  let nextStatus: EvaluationStatus = currentStatus;
  if (dailyLossBreached || overallDrawdownBreached) {
    nextStatus = currentStatus === "ACTIVE" ? "FAILED" : "FUNDED_BREACHED";
    detail.push(dailyLossBreached ? "Daily loss limit breached." : "Overall drawdown limit breached.");
  } else if (currentStatus === "ACTIVE" && profitTargetReached && minTradingDaysMet) {
    nextStatus = "PASSED";
    detail.push("Profit target reached with minimum trading days met — evaluation passed.");
  }

  return {
    equityCents,
    profitCents,
    tradingDaysCount: tradingDays.size,
    dailyLossBreached,
    worstDailyLossCents,
    overallDrawdownBreached,
    worstDrawdownCents,
    profitTargetReached,
    minTradingDaysMet,
    nextStatus,
    detail,
  };
}

/**
 * How much a funded trader can cash out right now: the trader's split of
 * whatever raw profit hasn't already been accounted for by a prior PAID
 * payout. `paidProfitCents` is the running baseline
 * (EvaluationAttempt.paidProfitCents) — see schema.prisma's doc comment.
 */
export function calculatePayout(
  tier: EvaluationTier,
  equityCents: number,
  virtualBalanceCents: number,
  paidProfitCents: number,
): { payableProfitCents: number; payoutAmountCents: number } {
  const totalProfitCents = Math.max(0, equityCents - virtualBalanceCents);
  const payableProfitCents = Math.max(0, totalProfitCents - paidProfitCents);
  const payoutAmountCents = Math.round(payableProfitCents * tier.profitSplitPct);
  return { payableProfitCents, payoutAmountCents };
}
