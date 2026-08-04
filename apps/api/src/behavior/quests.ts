/**
 * A small, fixed set of quests, each checkable from data Nova already has
 * (trade count, rule count, recent rule-check outcomes). No quest here
 * claims to check anything the platform can't actually see — same honesty
 * boundary as scoring.ts and rules.ts.
 */

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  /** Family auto-unlocked on completion, in addition to the XP reward, if any. */
  unlockFamilyId?: string;
}

export const QUESTS: QuestDefinition[] = [
  {
    id: "first-close",
    title: "First Close",
    description: "Close your first trade.",
    xpReward: 20,
  },
  {
    id: "rule-setter",
    title: "Rule Setter",
    description: "Create your first trading rule.",
    xpReward: 20,
  },
  {
    id: "clean-streak",
    title: "Clean Streak",
    description: "Pass your last 5 rule checks in a row with zero violations.",
    xpReward: 50,
    unlockFamilyId: "beaver-line",
  },
];

export interface QuestContext {
  tradeCount: number;
  ruleCount: number;
  /** Every RULE_ADHERENCE/RULE_VIOLATION BehaviorEvent, oldest first. */
  ruleEventsChronological: { signal: "RULE_ADHERENCE" | "RULE_VIOLATION" }[];
}

export function isQuestComplete(quest: QuestDefinition, ctx: QuestContext): boolean {
  switch (quest.id) {
    case "first-close":
      return ctx.tradeCount >= 1;
    case "rule-setter":
      return ctx.ruleCount >= 1;
    case "clean-streak": {
      const lastFive = ctx.ruleEventsChronological.slice(-5);
      return lastFive.length === 5 && lastFive.every((e) => e.signal === "RULE_ADHERENCE");
    }
    default:
      return false;
  }
}

export function checkQuests(ctx: QuestContext, alreadyCompletedQuestIds: Set<string>): QuestDefinition[] {
  return QUESTS.filter((q) => !alreadyCompletedQuestIds.has(q.id) && isQuestComplete(q, ctx));
}
