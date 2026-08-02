import assert from "node:assert/strict";
import { test } from "node:test";
import { matchFillsToTrades, type MatchableFill } from "./matching.js";

function fill(id: string, side: "buy" | "sell", quantity: number, price: number, minutesFromEpoch: number): MatchableFill {
  return { externalFillId: id, side, quantity, price, filledAt: new Date(minutesFromEpoch * 60_000) };
}

test("simple long round trip", () => {
  const trades = matchFillsToTrades([fill("1", "buy", 2, 100, 0), fill("2", "sell", 2, 105, 1)]);
  assert.equal(trades.length, 1);
  const [t] = trades;
  assert.equal(t!.direction, "long");
  assert.equal(t!.quantity, 2);
  assert.equal(t!.entryPrice, 100);
  assert.equal(t!.exitPrice, 105);
  assert.equal(t!.realizedPointsPnl, 10); // (105 - 100) * 2
  assert.deepEqual(t!.openFillIds, ["1"]);
  assert.deepEqual(t!.closeFillIds, ["2"]);
});

test("simple short round trip profits when price drops", () => {
  const trades = matchFillsToTrades([fill("1", "sell", 1, 110, 0), fill("2", "buy", 1, 108, 1)]);
  assert.equal(trades.length, 1);
  assert.equal(trades[0]!.direction, "short");
  assert.equal(trades[0]!.realizedPointsPnl, 2); // (110 - 108) * 1
});

test("scaling in (multiple entries) then a single exit", () => {
  const trades = matchFillsToTrades([
    fill("1", "buy", 1, 100, 0),
    fill("2", "buy", 1, 102, 1),
    fill("3", "sell", 2, 110, 2),
  ]);
  assert.equal(trades.length, 1);
  const [t] = trades;
  assert.equal(t!.quantity, 2);
  assert.equal(t!.entryPrice, 101); // weighted avg of 100 and 102
  assert.equal(t!.realizedPointsPnl, 18); // (110-100)*1 + (110-102)*1
  assert.deepEqual(t!.openFillIds, ["1", "2"]);
});

test("scaling out (multiple exits) doesn't finalize until fully flat", () => {
  const trades = matchFillsToTrades([
    fill("1", "buy", 2, 100, 0),
    fill("2", "sell", 1, 105, 1),
    fill("3", "sell", 1, 110, 2),
  ]);
  assert.equal(trades.length, 1);
  const [t] = trades;
  assert.equal(t!.quantity, 2);
  assert.equal(t!.realizedPointsPnl, 15); // (105-100)*1 + (110-100)*1
  assert.deepEqual(t!.closeFillIds, ["2", "3"]);
});

test("an exit larger than the open position flips into a new trade with the leftover", () => {
  const trades = matchFillsToTrades([
    fill("1", "buy", 2, 100, 0), // opens long 2
    fill("2", "sell", 3, 110, 1), // closes the long 2, flips short 1
    fill("3", "buy", 1, 108, 2), // closes the short 1
  ]);
  assert.equal(trades.length, 2);

  const [closedLong, closedShort] = trades;
  assert.equal(closedLong!.direction, "long");
  assert.equal(closedLong!.quantity, 2);
  assert.equal(closedLong!.realizedPointsPnl, 20); // (110-100)*2
  assert.deepEqual(closedLong!.closeFillIds, ["2"]);

  assert.equal(closedShort!.direction, "short");
  assert.equal(closedShort!.quantity, 1);
  assert.equal(closedShort!.entryPrice, 110);
  assert.equal(closedShort!.realizedPointsPnl, 2); // (110-108)*1
  assert.deepEqual(closedShort!.openFillIds, ["2"]);
  assert.deepEqual(closedShort!.closeFillIds, ["3"]);
});

test("a losing trade produces negative pnl", () => {
  const trades = matchFillsToTrades([fill("1", "buy", 1, 100, 0), fill("2", "sell", 1, 95, 1)]);
  assert.equal(trades[0]!.realizedPointsPnl, -5);
});

test("an unclosed position produces no finalized trade yet", () => {
  const trades = matchFillsToTrades([fill("1", "buy", 1, 100, 0)]);
  assert.equal(trades.length, 0);
});

test("empty fill list produces no trades", () => {
  assert.deepEqual(matchFillsToTrades([]), []);
});
