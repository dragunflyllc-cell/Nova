/**
 * Static evaluation-challenge tiers — content, not user data, same "fixed
 * list in code" pattern as behavior/quests.ts's QUESTS. Figures are Nova's
 * own, illustrative numbers (round dollar amounts, common risk-limit
 * shapes), not copied from any specific real firm's fee schedule.
 *
 * This IS the "no capital" mechanic: virtualBalanceCents is never backed by
 * a real brokerage account anywhere in this codebase — a trader's
 * evaluation and funded-stage P&L are both computed from their own real
 * trades (via MatchedTrade) scaled by a trader-declared pointValueUsd, not
 * from any account Nova actually funds. See evaluation.ts and
 * docs/ARCHITECTURE.md for the full mechanics and honesty boundaries.
 */

import type { EvaluationTier } from "@nova/types";

export const EVALUATION_TIERS: EvaluationTier[] = [
  {
    id: "spark-10k",
    name: "Spark",
    feeCents: 4_900,
    virtualBalanceCents: 1_000_000, // $10,000
    profitTargetPct: 0.08,
    maxDailyLossPct: 0.04,
    maxOverallDrawdownPct: 0.08,
    minTradingDays: 4,
    profitSplitPct: 0.8,
  },
  {
    id: "ignite-50k",
    name: "Ignite",
    feeCents: 9_900,
    virtualBalanceCents: 5_000_000, // $50,000
    profitTargetPct: 0.08,
    maxDailyLossPct: 0.05,
    maxOverallDrawdownPct: 0.1,
    minTradingDays: 5,
    profitSplitPct: 0.85,
  },
  {
    id: "blaze-150k",
    name: "Blaze",
    feeCents: 24_900,
    virtualBalanceCents: 15_000_000, // $150,000
    profitTargetPct: 0.1,
    maxDailyLossPct: 0.05,
    maxOverallDrawdownPct: 0.1,
    minTradingDays: 6,
    profitSplitPct: 0.9,
  },
];

export function getTier(tierId: string): EvaluationTier | undefined {
  return EVALUATION_TIERS.find((t) => t.id === tierId);
}
