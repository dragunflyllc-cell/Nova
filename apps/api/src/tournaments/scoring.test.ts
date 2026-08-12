import assert from "node:assert/strict";
import { test } from "node:test";
import { computeScore, rankEntries } from "./scoring.js";

test("ACCOUNT_XP_GAINED scores the gain since joining, not the lifetime total", () => {
  const score = computeScore({ metric: "ACCOUNT_XP_GAINED", startXp: 500, currentXp: 620, adherenceCount: 0, violationCount: 0 });
  assert.equal(score, 120);
});

test("CHARACTER_XP_GAINED floors at 0 rather than going negative", () => {
  const score = computeScore({ metric: "CHARACTER_XP_GAINED", startXp: 300, currentXp: 250, adherenceCount: 0, violationCount: 0 });
  assert.equal(score, 0);
});

test("BEHAVIOR_NET_ADHERENCE is adherence minus violations, can go negative", () => {
  const score = computeScore({ metric: "BEHAVIOR_NET_ADHERENCE", startXp: 0, currentXp: 0, adherenceCount: 3, violationCount: 5 });
  assert.equal(score, -2);
});

test("rankEntries sorts by score descending and pays out the fixed distribution", () => {
  const entries = [
    { userId: "a", score: 100, joinedAt: new Date(3) },
    { userId: "b", score: 300, joinedAt: new Date(1) },
    { userId: "c", score: 200, joinedAt: new Date(2) },
  ];
  const ranked = rankEntries(entries, 10_000);
  assert.deepEqual(
    ranked.map((r) => r.userId),
    ["b", "c", "a"],
  );
  assert.equal(ranked[0]!.rank, 1);
  assert.equal(ranked[0]!.prizeCents, 5_000); // 50%
  assert.equal(ranked[1]!.prizeCents, 3_000); // 30%
  assert.equal(ranked[2]!.prizeCents, 2_000); // 20%
});

test("rankEntries breaks ties by earlier joinedAt, and only the top 3 are paid", () => {
  const entries = [
    { userId: "late", score: 50, joinedAt: new Date(100) },
    { userId: "early", score: 50, joinedAt: new Date(10) },
    { userId: "fourth", score: 10, joinedAt: new Date(1) },
    { userId: "fifth", score: 5, joinedAt: new Date(1) },
  ];
  const ranked = rankEntries(entries, 1_000);
  assert.deepEqual(
    ranked.map((r) => r.userId),
    ["early", "late", "fourth", "fifth"],
  );
  assert.equal(ranked[0]!.rank, 1);
  assert.equal(ranked[1]!.rank, 2);
  assert.equal(ranked[2]!.prizeCents, 200); // 3rd place, 20%
  assert.equal(ranked[3]!.prizeCents, 0); // 4th place, unpaid
});
