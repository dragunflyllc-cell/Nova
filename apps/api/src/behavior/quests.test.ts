import assert from "node:assert/strict";
import { test } from "node:test";
import { checkQuests, isQuestComplete, QUESTS } from "./quests.js";

const firstClose = QUESTS.find((q) => q.id === "first-close")!;
const ruleSetter = QUESTS.find((q) => q.id === "rule-setter")!;
const cleanStreak = QUESTS.find((q) => q.id === "clean-streak")!;

test("first-close completes once a trade exists", () => {
  assert.equal(isQuestComplete(firstClose, { tradeCount: 0, ruleCount: 0, ruleEventsChronological: [] }), false);
  assert.equal(isQuestComplete(firstClose, { tradeCount: 1, ruleCount: 0, ruleEventsChronological: [] }), true);
});

test("rule-setter completes once a rule exists", () => {
  assert.equal(isQuestComplete(ruleSetter, { tradeCount: 0, ruleCount: 0, ruleEventsChronological: [] }), false);
  assert.equal(isQuestComplete(ruleSetter, { tradeCount: 0, ruleCount: 1, ruleEventsChronological: [] }), true);
});

test("clean-streak requires at least 5 events, all adherence", () => {
  const fourGood = Array(4).fill({ signal: "RULE_ADHERENCE" as const });
  assert.equal(isQuestComplete(cleanStreak, { tradeCount: 0, ruleCount: 0, ruleEventsChronological: fourGood }), false);

  const fiveGood = Array(5).fill({ signal: "RULE_ADHERENCE" as const });
  assert.equal(isQuestComplete(cleanStreak, { tradeCount: 0, ruleCount: 0, ruleEventsChronological: fiveGood }), true);
});

test("clean-streak only looks at the most recent 5 events", () => {
  const events = [
    { signal: "RULE_VIOLATION" as const }, // old violation, should be excluded from the last-5 window
    ...Array(5).fill({ signal: "RULE_ADHERENCE" as const }),
  ];
  assert.equal(isQuestComplete(cleanStreak, { tradeCount: 0, ruleCount: 0, ruleEventsChronological: events }), true);
});

test("clean-streak fails if any of the last 5 is a violation", () => {
  const events = [
    ...Array(4).fill({ signal: "RULE_ADHERENCE" as const }),
    { signal: "RULE_VIOLATION" as const },
  ];
  assert.equal(isQuestComplete(cleanStreak, { tradeCount: 0, ruleCount: 0, ruleEventsChronological: events }), false);
});

test("checkQuests excludes already-completed quests", () => {
  const ctx = { tradeCount: 1, ruleCount: 1, ruleEventsChronological: [] };
  const results = checkQuests(ctx, new Set(["first-close"]));
  const ids = results.map((q) => q.id);
  assert.equal(ids.includes("first-close"), false);
  assert.equal(ids.includes("rule-setter"), true);
});
