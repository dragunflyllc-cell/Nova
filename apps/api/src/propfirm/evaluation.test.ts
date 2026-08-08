import assert from "node:assert/strict";
import { test } from "node:test";
import type { EvaluationTier } from "@nova/types";
import type { MatchedTrade } from "../trades/matching.js";
import { calculatePayout, evaluateAttempt } from "./evaluation.js";

const tier: EvaluationTier = {
  id: "test-tier",
  name: "Test",
  feeCents: 5_000,
  virtualBalanceCents: 100_000, // $1,000
  profitTargetPct: 0.08, // $80
  maxDailyLossPct: 0.04, // $40
  maxOverallDrawdownPct: 0.08, // $80
  minTradingDays: 2,
  profitSplitPct: 0.8,
};

const DAY_MS = 24 * 60 * 60 * 1000;

function trade(pnlPoints: number, dayOffset: number, overrides: Partial<MatchedTrade> = {}): MatchedTrade {
  const closedAt = new Date(dayOffset * DAY_MS + 60_000);
  return {
    direction: pnlPoints >= 0 ? "long" : "short",
    quantity: 1,
    entryPrice: 100,
    exitPrice: 100 + pnlPoints,
    realizedPointsPnl: pnlPoints,
    openedAt: new Date(dayOffset * DAY_MS),
    closedAt,
    openFillIds: [`open-${dayOffset}`],
    closeFillIds: [`close-${dayOffset}`],
    ...overrides,
  };
}

test("passes once profit target is reached and min trading days are met", () => {
  const trades = [trade(50, 0), trade(40, 1)]; // $50 + $40 = $90 profit across 2 days, pointValueUsd=1
  const result = evaluateAttempt(tier, 1, "ACTIVE", trades);
  assert.equal(result.profitCents, 9_000);
  assert.equal(result.profitTargetReached, true);
  assert.equal(result.tradingDaysCount, 2);
  assert.equal(result.minTradingDaysMet, true);
  assert.equal(result.nextStatus, "PASSED");
});

test("stays ACTIVE when profit target is reached but min trading days are not", () => {
  const trades = [trade(90, 0)]; // hits target in a single day
  const result = evaluateAttempt(tier, 1, "ACTIVE", trades);
  assert.equal(result.profitTargetReached, true);
  assert.equal(result.minTradingDaysMet, false);
  assert.equal(result.nextStatus, "ACTIVE");
});

test("fails on a daily loss breach", () => {
  const trades = [trade(-50, 0)]; // $50 loss in one day, limit is $40
  const result = evaluateAttempt(tier, 1, "ACTIVE", trades);
  assert.equal(result.dailyLossBreached, true);
  assert.equal(result.nextStatus, "FAILED");
});

test("fails on overall drawdown breach even without any single day breaching the daily limit", () => {
  // Four separate days, each losing $30 (under the $40 daily limit), but the
  // cumulative drawdown of $120 breaches the $80 overall limit.
  const trades = [trade(-30, 0), trade(-30, 1), trade(-30, 2), trade(-30, 3)];
  const result = evaluateAttempt(tier, 1, "ACTIVE", trades);
  assert.equal(result.dailyLossBreached, false);
  assert.equal(result.overallDrawdownBreached, true);
  assert.equal(result.nextStatus, "FAILED");
});

test("funded stage breaches to FUNDED_BREACHED, not FAILED, and ignores profit target", () => {
  const trades = [trade(-50, 0)];
  const result = evaluateAttempt(tier, 1, "FUNDED_ACTIVE", trades);
  assert.equal(result.nextStatus, "FUNDED_BREACHED");
});

test("funded stage with no breach and profit stays FUNDED_ACTIVE (no profit target at this stage)", () => {
  const trades = [trade(200, 0), trade(200, 1)]; // well past what would be a profit target
  const result = evaluateAttempt(tier, 1, "FUNDED_ACTIVE", trades);
  assert.equal(result.dailyLossBreached, false);
  assert.equal(result.overallDrawdownBreached, false);
  assert.equal(result.nextStatus, "FUNDED_ACTIVE");
});

test("calculatePayout splits unpaid profit by the tier's profit split", () => {
  const { payableProfitCents, payoutAmountCents } = calculatePayout(tier, 110_000, 100_000, 0);
  assert.equal(payableProfitCents, 10_000); // $100 raw profit
  assert.equal(payoutAmountCents, 8_000); // 80% split -> $80
});

test("calculatePayout excludes profit already accounted for by a prior payout", () => {
  const { payableProfitCents, payoutAmountCents } = calculatePayout(tier, 120_000, 100_000, 10_000);
  assert.equal(payableProfitCents, 10_000); // $200 total raw profit minus $100 already accounted for
  assert.equal(payoutAmountCents, 8_000);
});

test("calculatePayout never goes negative when equity has dropped back below the paid baseline", () => {
  const { payableProfitCents, payoutAmountCents } = calculatePayout(tier, 105_000, 100_000, 10_000);
  assert.equal(payableProfitCents, 0);
  assert.equal(payoutAmountCents, 0);
});
