import assert from "node:assert/strict";
import { test } from "node:test";
import type { MatchedTrade } from "../trades/matching.js";
import {
  BASE_TRADE_XP,
  COOLDOWN_BONUS_XP,
  REVENGE_PENALTY_MULTIPLIER,
  WIN_BONUS_XP,
  scoreTrades,
  totalXpFromTrades,
} from "./scoring.js";

function trade(
  pnl: number,
  openedMinutes: number,
  closedMinutes: number,
  overrides: Partial<MatchedTrade> = {},
): MatchedTrade {
  return {
    direction: "long",
    quantity: 1,
    entryPrice: 100,
    exitPrice: 100 + pnl,
    realizedPointsPnl: pnl,
    openedAt: new Date(openedMinutes * 60_000),
    closedAt: new Date(closedMinutes * 60_000),
    openFillIds: ["open"],
    closeFillIds: ["close"],
    ...overrides,
  };
}

test("a single winning trade gets base + win bonus, no signals", () => {
  const [scored] = scoreTrades([trade(10, 0, 1)]);
  assert.equal(scored!.xp, BASE_TRADE_XP + WIN_BONUS_XP);
  assert.deepEqual(scored!.signals, []);
});

test("a single losing trade gets base XP only, no signals", () => {
  const [scored] = scoreTrades([trade(-5, 0, 1)]);
  assert.equal(scored!.xp, BASE_TRADE_XP);
  assert.deepEqual(scored!.signals, []);
});

test("re-entering within the revenge window after a loss is penalized", () => {
  const trades = [
    trade(-5, 0, 1), // loss, closes at minute 1
    trade(10, 2, 3), // opens at minute 2 — 1 minute after the loss closed
  ];
  const scored = scoreTrades(trades);
  assert.deepEqual(scored[1]!.signals, ["revengeTrade"]);
  assert.equal(scored[1]!.xp, Math.round((BASE_TRADE_XP + WIN_BONUS_XP) * REVENGE_PENALTY_MULTIPLIER));
});

test("waiting past the cooldown window after a loss earns a bonus", () => {
  const trades = [
    trade(-5, 0, 1), // loss, closes at minute 1
    trade(10, 45, 46), // opens 44 minutes after the loss closed
  ];
  const scored = scoreTrades(trades);
  assert.deepEqual(scored[1]!.signals, ["cooldownAfterLoss"]);
  assert.equal(scored[1]!.xp, BASE_TRADE_XP + WIN_BONUS_XP + COOLDOWN_BONUS_XP);
});

test("a gap that's neither immediate nor a full cooldown gets no signal", () => {
  const trades = [
    trade(-5, 0, 1), // loss, closes at minute 1
    trade(10, 10, 11), // opens 9 minutes later — past revenge window, short of cooldown window
  ];
  const scored = scoreTrades(trades);
  assert.deepEqual(scored[1]!.signals, []);
  assert.equal(scored[1]!.xp, BASE_TRADE_XP + WIN_BONUS_XP);
});

test("re-entering quickly after a WINNING trade is not revenge trading", () => {
  const trades = [
    trade(10, 0, 1), // win
    trade(10, 1, 2), // immediately re-enters
  ];
  const scored = scoreTrades(trades);
  assert.deepEqual(scored[1]!.signals, []);
});

test("scoring is chronological regardless of input order", () => {
  const loss = trade(-5, 0, 1);
  const revengeEntry = trade(10, 2, 3);
  const scoredReversed = scoreTrades([revengeEntry, loss]);
  const revengeScored = scoredReversed.find((s) => s.trade === revengeEntry);
  assert.deepEqual(revengeScored!.signals, ["revengeTrade"]);
});

test("totalXpFromTrades sums every trade's score", () => {
  const trades = [trade(10, 0, 1), trade(-5, 10, 11)];
  const total = totalXpFromTrades(trades);
  assert.equal(total, BASE_TRADE_XP + WIN_BONUS_XP + BASE_TRADE_XP);
});
