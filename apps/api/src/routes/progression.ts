import type { FastifyInstance } from "fastify";
import { prisma } from "@nova/db";
import { characterFamilies, levelForXp } from "@nova/nova-dex";
import { BEHAVIOR_UNLOCK_RULES, checkBehaviorUnlocks } from "../behavior/unlocks.js";
import { checkQuests, QUESTS } from "../behavior/quests.js";
import { authenticate } from "../plugins/authenticate.js";
import { getMatchedTradesForUser } from "../trades/service.js";

function familyName(familyId: string): string {
  return characterFamilies.find((f) => f.id === familyId)?.name ?? familyId;
}

export async function progressionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/quests", { preHandler: authenticate }, async (request, reply) => {
    const completions = await prisma.questCompletion.findMany({ where: { userId: request.userId } });
    const completedIds = new Set(completions.map((c) => c.questId));
    return reply.send(
      QUESTS.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        xpReward: q.xpReward,
        unlockFamilyId: q.unlockFamilyId,
        unlockFamilyName: q.unlockFamilyId ? familyName(q.unlockFamilyId) : undefined,
        completed: completedIds.has(q.id),
      })),
    );
  });

  // Checks behavior-signal unlock thresholds AND quest completion, and
  // auto-claims any newly-qualified family — this is how a trader collects
  // more than their one starter (there's no separate "catch" UI; the
  // character just appears once your real trading, or your progress on a
  // quest, reveals it). Safe to call repeatedly: BEHAVIOR_UNLOCK_RULES
  // re-check against already-owned families, and quest completions are
  // gated by the QuestCompletion table so a reward is never granted twice.
  app.post("/me/progression/sync", { preHandler: authenticate }, async (request, reply) => {
    const userId = request.userId!;

    const [owned, eventCounts, trades, rules, ruleEvents, completions, user] = await Promise.all([
      prisma.userCharacter.findMany({ where: { userId } }),
      prisma.behaviorEvent.groupBy({ by: ["signal"], where: { userId }, _count: { signal: true } }),
      getMatchedTradesForUser(userId),
      prisma.tradingRule.count({ where: { userId, active: true } }),
      prisma.behaviorEvent.findMany({
        where: { userId, signal: { in: ["RULE_ADHERENCE", "RULE_VIOLATION"] } },
        orderBy: { detectedAt: "asc" },
        select: { signal: true },
      }),
      prisma.questCompletion.findMany({ where: { userId } }),
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);

    const ownedFamilyIds = new Set(owned.map((oc) => oc.familyId));
    const signalCounts = Object.fromEntries(eventCounts.map((e) => [e.signal, e._count.signal]));
    const behaviorUnlocks = checkBehaviorUnlocks(signalCounts, ownedFamilyIds);

    const completedQuestIds = new Set(completions.map((c) => c.questId));
    const newlyCompletedQuests = checkQuests(
      {
        tradeCount: trades.length,
        ruleCount: rules,
        ruleEventsChronological: ruleEvents.map((e) => ({ signal: e.signal as "RULE_ADHERENCE" | "RULE_VIOLATION" })),
      },
      completedQuestIds,
    );

    const familiesToUnlock = new Map<string, string>(); // familyId -> reason
    for (const u of behaviorUnlocks) familiesToUnlock.set(u.familyId, u.reason);
    for (const q of newlyCompletedQuests) {
      if (q.unlockFamilyId && !ownedFamilyIds.has(q.unlockFamilyId)) {
        familiesToUnlock.set(q.unlockFamilyId, `Completed the "${q.title}" quest.`);
      }
    }

    const claimed = await prisma.$transaction(
      [...familiesToUnlock.keys()].map((familyId) => prisma.userCharacter.create({ data: { userId, familyId } })),
    );

    for (const q of newlyCompletedQuests) {
      await prisma.questCompletion.create({ data: { userId, questId: q.id } });
    }

    const xpGained = newlyCompletedQuests.reduce((sum, q) => sum + q.xpReward, 0);
    const updatedUser =
      xpGained > 0
        ? await prisma.user.update({
            where: { id: userId },
            data: { xp: user.xp + xpGained, level: levelForXp(user.xp + xpGained) },
          })
        : user;

    return reply.send({
      unlockedFamilies: claimed.map((c) => ({
        familyId: c.familyId,
        familyName: familyName(c.familyId),
        reason: familiesToUnlock.get(c.familyId)!,
      })),
      completedQuests: newlyCompletedQuests.map((q) => ({ id: q.id, title: q.title, xpReward: q.xpReward })),
      accountXp: updatedUser.xp,
      accountLevel: updatedUser.level,
      behaviorUnlockProgress: BEHAVIOR_UNLOCK_RULES.map((rule) => ({
        familyId: rule.familyId,
        familyName: familyName(rule.familyId),
        signal: rule.signal,
        progress: Math.min(signalCounts[rule.signal] ?? 0, rule.minCount),
        needed: rule.minCount,
        unlocked: ownedFamilyIds.has(rule.familyId) || familiesToUnlock.has(rule.familyId),
      })),
    });
  });
}
