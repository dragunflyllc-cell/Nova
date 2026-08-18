import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { supportedSymbols } from "./yahoo.js";

// fetchDelayedQuote itself isn't unit-tested here since it makes a real
// network call (same convention as exchangeCodeForTokens/login in the
// other broker adapters, which also aren't mocked) — this covers the pure
// parts: the symbol map.

test("supports the core Nova contract symbols", () => {
  const symbols = supportedSymbols();
  for (const s of ["ES", "MES", "NQ", "MNQ", "CL", "MCL", "GC", "MGC"]) {
    assert.ok(symbols.includes(s), `expected ${s} to be supported`);
  }
});
