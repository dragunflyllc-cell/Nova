import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTrade } from "./projectx.js";

// Fixtures match the real `Trade` dataclass in project-x-py's models.py,
// read directly from source — see projectx.ts header for what's verified.

test("parses a buy trade (side 0)", () => {
  const fill = parseTrade({
    id: 555,
    accountId: 1001,
    contractId: "CON.F.US.MNQ.Z25",
    creationTimestamp: "2026-08-01T14:32:00Z",
    price: 20152.25,
    profitAndLoss: null,
    fees: 1.42,
    side: 0,
    size: 2,
    voided: false,
    orderId: 999,
  });
  assert.equal(fill.externalFillId, "555");
  assert.equal(fill.contractSymbol, "CON.F.US.MNQ.Z25");
  assert.equal(fill.side, "buy");
  assert.equal(fill.quantity, 2);
  assert.equal(fill.price, 20152.25);
  assert.equal(fill.filledAt.toISOString(), "2026-08-01T14:32:00.000Z");
});

test("parses a sell trade (side 1) and takes the absolute size", () => {
  const fill = parseTrade({
    id: "556",
    contractId: "CON.F.US.MES.Z25",
    creationTimestamp: "2026-08-01T15:00:00Z",
    price: 5100.5,
    side: 1,
    size: -3,
  });
  assert.equal(fill.side, "sell");
  assert.equal(fill.quantity, 3);
});

test("throws on a payload missing a required field", () => {
  assert.throws(() => parseTrade({ id: 1, price: 100, side: 0, size: 1 }));
});

test("throws on a payload that isn't an object at all", () => {
  assert.throws(() => parseTrade("not-a-trade"));
});
