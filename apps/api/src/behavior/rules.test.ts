import assert from "node:assert/strict";
import { test } from "node:test";
import type { MatchedTrade } from "../trades/matching.js";
import { checkRule, checkRules, type TradingRuleRecord } from "./rules.js";

function trade(
  pnl: number,
  quantity: number,
  openedMinutes: number,
  closedMinutes: number,
  overrides: Partial<MatchedTrade> = {},
): MatchedTrade {
  return {
    direction: "long",
    quantity,
    entryPrice: 100,
    exitPrice: 100 + pnl,
    realizedPointsPnl: pnl,
    openedAt: new Date(openedMinutes * 60_000),
    closedAt: new Date(closedMinutes * 60_000),
    openFillIds: ["open"],
    closeFillIds: [`close-${openedMinutes}`],
    ...overrides,
  };
}

test("MAX_TRADES_PER_DAY passes under the limit and fails over it", () => {
  const rule: TradingRuleRecord = { id: "r1", type: "MAX_TRADES_PER_DAY", params: { max: 2 } };
  const trades = [trade(10, 1, 0, 1), trade(10, 1, 10, 11), trade(10, 1, 20, 21)];
  const results = checkRule(rule, trades);
  assert.equal(results.length, 3);
  assert.equal(results[0]!.passed, true);
  assert.equal(results[1]!.passed, true);
  assert.equal(results[2]!.passed, false); // 3rd trade same day, over the limit of 2
});

test("MAX_TRADES_PER_DAY resets across day boundaries (UTC)", () => {
  const rule: TradingRuleRecord = { id: "r1", type: "MAX_TRADES_PER_DAY", params: { max: 1 } };
  const day1 = 0;
  const day2 = 24 * 60; // next day, in minutes-from-epoch
  const trades = [trade(10, 1, day1, day1 + 1), trade(10, 1, day2, day2 + 1)];
  const results = checkRule(rule, trades);
  assert.equal(results[0]!.passed, true);
  assert.equal(results[1]!.passed, true); // both are the "1st trade of their day"
});

test("MIN_COOLDOWN_AFTER_LOSS_MINUTES flags a too-quick re-entry after a loss", () => {
  const rule: TradingRuleRecord = { id: "r2", type: "MIN_COOLDOWN_AFTER_LOSS_MINUTES", params: { minutes: 30 } };
  const trades = [trade(-5, 1, 0, 1), trade(10, 1, 2, 3)];
  const results = checkRule(rule, trades);
  assert.equal(results.length, 1); // only the re-entry trade is evaluated, not the loss itself
  assert.equal(results[0]!.passed, false);
});

test("MIN_COOLDOWN_AFTER_LOSS_MINUTES passes a re-entry that waited long enough", () => {
  const rule: TradingRuleRecord = { id: "r2", type: "MIN_COOLDOWN_AFTER_LOSS_MINUTES", params: { minutes: 30 } };
  const trades = [trade(-5, 1, 0, 1), trade(10, 1, 45, 46)];
  const results = checkRule(rule, trades);
  assert.equal(results[0]!.passed, true);
});

test("MIN_COOLDOWN_AFTER_LOSS_MINUTES doesn't evaluate a trade with no prior loss", () => {
  const rule: TradingRuleRecord = { id: "r2", type: "MIN_COOLDOWN_AFTER_LOSS_MINUTES", params: { minutes: 30 } };
  const trades = [trade(10, 1, 0, 1), trade(10, 1, 2, 3)];
  const results = checkRule(rule, trades);
  assert.equal(results.length, 0);
});

test("MAX_POSITION_SIZE flags oversized trades", () => {
  const rule: TradingRuleRecord = { id: "r3", type: "MAX_POSITION_SIZE", params: { maxQuantity: 2 } };
  const results = checkRule(rule, [trade(10, 5, 0, 1)]);
  assert.equal(results[0]!.passed, false);
});

test("MAX_DAILY_LOSS_POINTS accumulates losses across the day and flags once the limit is breached", () => {
  const rule: TradingRuleRecord = { id: "r4", type: "MAX_DAILY_LOSS_POINTS", params: { maxLossPoints: 10 } };
  const trades = [trade(-6, 1, 0, 1), trade(-6, 1, 10, 11)];
  const results = checkRule(rule, trades);
  assert.equal(results[0]!.passed, true); // running loss 6, under 10
  assert.equal(results[1]!.passed, false); // running loss 12, over 10
});

test("MAX_DAILY_LOSS_POINTS ignores winning trades when accumulating loss", () => {
  const rule: TradingRuleRecord = { id: "r4", type: "MAX_DAILY_LOSS_POINTS", params: { maxLossPoints: 5 } };
  const trades = [trade(20, 1, 0, 1), trade(-3, 1, 10, 11)];
  const results = checkRule(rule, trades);
  assert.equal(results[1]!.passed, true); // net still positive, running loss is 0
});

test("TRADING_HOURS_WINDOW_UTC flags a trade opened outside the window", () => {
  const rule: TradingRuleRecord = {
    id: "r5",
    type: "TRADING_HOURS_WINDOW_UTC",
    params: { startHourUtc: 9, endHourUtc: 16 },
  };
  const openedAt2am = new Date(Date.UTC(2026, 0, 1, 2, 0, 0));
  const closedAt = new Date(Date.UTC(2026, 0, 1, 2, 1, 0));
  const results = checkRule(rule, [trade(10, 1, 0, 1, { openedAt: openedAt2am, closedAt })]);
  assert.equal(results[0]!.passed, false);
});

test("TRADING_HOURS_WINDOW_UTC passes a trade inside the window", () => {
  const rule: TradingRuleRecord = {
    id: "r5",
    type: "TRADING_HOURS_WINDOW_UTC",
    params: { startHourUtc: 9, endHourUtc: 16 },
  };
  const openedAt10am = new Date(Date.UTC(2026, 0, 1, 10, 0, 0));
  const closedAt = new Date(Date.UTC(2026, 0, 1, 10, 1, 0));
  const results = checkRule(rule, [trade(10, 1, 0, 1, { openedAt: openedAt10am, closedAt })]);
  assert.equal(results[0]!.passed, true);
});

test("checkRules runs every rule against the trade set", () => {
  const rules: TradingRuleRecord[] = [
    { id: "r1", type: "MAX_TRADES_PER_DAY", params: { max: 1 } },
    { id: "r3", type: "MAX_POSITION_SIZE", params: { maxQuantity: 1 } },
  ];
  const results = checkRules(rules, [trade(10, 2, 0, 1)]);
  assert.equal(results.length, 2);
  assert.equal(results.every((r) => r.ruleId === "r1" || r.ruleId === "r3"), true);
});
