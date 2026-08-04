/**
 * Maps accumulated behavior signals (persisted BehaviorEvent rows — see
 * schema.prisma) to a NovaDex family that gets auto-unlocked once the
 * threshold is crossed. This is the "your real trading revealed a new
 * character" mechanism discussed for how a trader collects more than their
 * one starter.
 *
 * Deliberately small: only signals the behavior-scoring/rules engine can
 * actually detect today (apps/api/src/behavior/scoring.ts and rules.ts) map
 * to an unlock. As more signals get built, more of the NovaDex opens up —
 * this list is meant to grow, not be exhaustive on day one (see
 * packages/nova-dex's "the NovaDex is never done" principle).
 *
 * Each target family's own base-stage archetype was picked to match the
 * signal it's unlocked by, so the unlock reads as "your trades revealed
 * this tendency," not an arbitrary reward: REVENGE_TRADE -> Revenge Rhino
 * (archetype: reckless), COOLDOWN_AFTER_LOSS -> Cautious Turtle (archetype:
 * disciplined), RULE_ADHERENCE -> Rookie Elephant (archetype: consistent).
 */

import type { BehaviorSignalType } from "@nova/db";

export interface BehaviorUnlockRule {
  signal: BehaviorSignalType;
  minCount: number;
  familyId: string;
  reason: string;
}

export const BEHAVIOR_UNLOCK_RULES: BehaviorUnlockRule[] = [
  {
    signal: "REVENGE_TRADE",
    minCount: 3,
    familyId: "rhino-line",
    reason: "Your trades revealed a reckless, revenge-driven streak.",
  },
  {
    signal: "COOLDOWN_AFTER_LOSS",
    minCount: 3,
    familyId: "turtle-line",
    reason: "Your trades revealed real discipline after a loss.",
  },
  {
    signal: "RULE_ADHERENCE",
    minCount: 5,
    familyId: "elephant-line",
    reason: "Your consistency in following your own rules revealed itself.",
  },
];

export interface UnlockCheckResult {
  familyId: string;
  reason: string;
  signal: BehaviorSignalType;
  count: number;
}

/**
 * `signalCounts` should be every occurrence of each signal for this user
 * (not deduped by rule — e.g. RULE_ADHERENCE from three different rules
 * each still counts). `alreadyOwnedFamilyIds` is checked so a family that's
 * already been claimed (by any means) is never returned again.
 */
export function checkBehaviorUnlocks(
  signalCounts: Partial<Record<BehaviorSignalType, number>>,
  alreadyOwnedFamilyIds: Set<string>,
): UnlockCheckResult[] {
  const results: UnlockCheckResult[] = [];
  for (const rule of BEHAVIOR_UNLOCK_RULES) {
    if (alreadyOwnedFamilyIds.has(rule.familyId)) continue;
    const count = signalCounts[rule.signal] ?? 0;
    if (count >= rule.minCount) {
      results.push({ familyId: rule.familyId, reason: rule.reason, signal: rule.signal, count });
    }
  }
  return results;
}
