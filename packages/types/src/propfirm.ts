/**
 * "No-capital" prop firm: Nova runs its own funded-trader program without
 * ever putting real trading capital behind a trader's evaluation or funded
 * account. Every account here is simulated — a trader pays an evaluation
 * fee, trades against rule-based risk limits, and (if they pass and stay
 * within the funded-stage limits) earns a payout sourced from the pool of
 * evaluation fees, not from real trading gains. See
 * apps/api/src/propfirm/evaluation.ts and docs/ARCHITECTURE.md for the
 * mechanics and the honesty boundaries this is scoped to.
 */

export type EvaluationStatus =
  | "ACTIVE"
  | "PASSED"
  | "FAILED"
  | "FUNDED_ACTIVE"
  | "FUNDED_BREACHED";

export type PayoutStatus = "PENDING" | "PAID" | "DENIED";

/** Static challenge configuration — content, not user data (same pattern as packages/nova-dex). */
export interface EvaluationTier {
  id: string;
  name: string;
  feeCents: number;
  virtualBalanceCents: number;
  profitTargetPct: number;
  maxDailyLossPct: number;
  maxOverallDrawdownPct: number;
  minTradingDays: number;
  /** Share of funded-stage profit paid out to the trader, e.g. 0.8 for an 80/20 split. */
  profitSplitPct: number;
}

export interface EvaluationAttempt {
  id: string;
  userId: string;
  tierId: string;
  /** Trader-declared dollars-per-point for the contract they intend to trade — Nova has no
   *  per-contract tick-value reference table yet (see docs/ARCHITECTURE.md), so this is
   *  self-declared, not verified against broker data. */
  pointValueUsd: number;
  status: EvaluationStatus;
  startedAt: string;
  endedAt?: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  evaluationAttemptId: string;
  amountCents: number;
  status: PayoutStatus;
  requestedAt: string;
  resolvedAt?: string;
}
