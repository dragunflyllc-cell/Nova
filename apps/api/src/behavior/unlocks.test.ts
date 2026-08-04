import assert from "node:assert/strict";
import { test } from "node:test";
import { checkBehaviorUnlocks } from "./unlocks.js";

test("no unlocks when counts are below every threshold", () => {
  const results = checkBehaviorUnlocks({ REVENGE_TRADE: 2, COOLDOWN_AFTER_LOSS: 1 }, new Set());
  assert.deepEqual(results, []);
});

test("unlocks a family once its signal threshold is met", () => {
  const results = checkBehaviorUnlocks({ REVENGE_TRADE: 3 }, new Set());
  assert.equal(results.length, 1);
  assert.equal(results[0]!.familyId, "rhino-line");
});

test("does not re-suggest a family the user already owns", () => {
  const results = checkBehaviorUnlocks({ REVENGE_TRADE: 5 }, new Set(["rhino-line"]));
  assert.deepEqual(results, []);
});

test("can unlock multiple families at once if multiple thresholds are met", () => {
  const results = checkBehaviorUnlocks({ REVENGE_TRADE: 3, COOLDOWN_AFTER_LOSS: 3, RULE_ADHERENCE: 5 }, new Set());
  assert.equal(results.length, 3);
  const familyIds = results.map((r) => r.familyId).sort();
  assert.deepEqual(familyIds, ["elephant-line", "rhino-line", "turtle-line"]);
});

test("missing signal counts default to zero, not a crash", () => {
  const results = checkBehaviorUnlocks({}, new Set());
  assert.deepEqual(results, []);
});
