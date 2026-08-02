import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFill } from "./tradovate.js";

// These fixtures encode our best-effort assumption of Tradovate's fill/list
// shape (see tradovate.ts header) — not confirmed against a real response.
// If the real shape differs, parseFill should fail loudly, which is the
// behavior the later tests in this file assert on.

test("parses a fill using the assumed field names", () => {
  const fill = parseFill({
    id: 12345,
    contractId: 98765,
    action: "Buy",
    qty: 2,
    price: 5123.25,
    timestamp: "2026-08-01T14:32:00Z",
  });
  assert.equal(fill.externalFillId, "12345");
  assert.equal(fill.contractSymbol, "98765");
  assert.equal(fill.side, "buy");
  assert.equal(fill.quantity, 2);
  assert.equal(fill.price, 5123.25);
  assert.equal(fill.filledAt.toISOString(), "2026-08-01T14:32:00.000Z");
});

test("accepts the alternate field-name variants (symbol/side/quantity/tradeDate)", () => {
  const fill = parseFill({
    id: "abc",
    symbol: "ESZ6",
    side: "Sell",
    quantity: 1,
    price: 5100,
    tradeDate: "2026-08-01T15:00:00Z",
  });
  assert.equal(fill.contractSymbol, "ESZ6");
  assert.equal(fill.side, "sell");
});

test("throws on a payload missing every recognized side/action field", () => {
  assert.throws(() => parseFill({ id: 1, qty: 1, price: 100, timestamp: "2026-08-01T00:00:00Z" }));
});

test("throws on a payload that isn't an object at all", () => {
  assert.throws(() => parseFill("not-a-fill"));
});
