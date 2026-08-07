import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { extractAccountId, parseFill } from "./rithmic.js";

// The sidecar converts real Rithmic protobuf messages via reflection, so
// the true field names aren't confirmed until this runs against a live
// login (see rithmic.ts header). These fixtures cover the plausible
// field-name variants parseFill/extractAccountId try, and confirm the
// loud-failure path for anything unrecognized.

test("parses a fill using ssboe/usecs timestamp and transaction_type", () => {
  const fill = parseFill({
    fill_id: 42,
    symbol: "ESZ6",
    price: 5123.25,
    qty: 2,
    transaction_type: "Buy",
    ssboe: 1786000000,
    usecs: 500000,
  });
  assert.equal(fill.externalFillId, "42");
  assert.equal(fill.contractSymbol, "ESZ6");
  assert.equal(fill.side, "buy");
  assert.equal(fill.quantity, 2);
  assert.equal(fill.price, 5123.25);
  assert.equal(fill.filledAt.getTime(), 1786000000 * 1000 + 500);
});

test("accepts alternate field-name variants (fillId/instrument/side/fill_time)", () => {
  const fill = parseFill({
    fillId: "abc",
    instrument: "MESZ6",
    side: "Sell",
    fill_size: -1,
    fill_price: 5100,
    fill_time: "2026-08-01T15:00:00Z",
  });
  assert.equal(fill.contractSymbol, "MESZ6");
  assert.equal(fill.side, "sell");
  assert.equal(fill.quantity, 1);
});

test("throws on a payload missing every recognized side field", () => {
  assert.throws(() => parseFill({ fill_id: 1, symbol: "ES", price: 100, qty: 1, ssboe: 1786000000 }));
});

test("throws on a payload that isn't an object at all", () => {
  assert.throws(() => parseFill("not-a-fill"));
});

test("extractAccountId finds account_id", () => {
  assert.equal(extractAccountId({ account_id: "12345" }), "12345");
});

test("extractAccountId finds accountId variant", () => {
  assert.equal(extractAccountId({ accountId: 999 }), "999");
});

test("extractAccountId returns undefined when nothing matches", () => {
  assert.equal(extractAccountId({ name: "whatever" }), undefined);
});
