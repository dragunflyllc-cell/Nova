import type { HitZone, OperatorStatsSummary } from "@art/shared-types";
import { prisma } from "../lib/prisma.js";

export async function computeOperatorStats(
  operatorId: string,
): Promise<OperatorStatsSummary> {
  const sessions = await prisma.session.findMany({
    where: { operatorId },
    include: {
      shotEvents: {
        include: {
          targetPlacement: { include: { targetDefinition: true } },
        },
      },
    },
  });

  const hitsByZone: Record<HitZone, number> = { head: 0, chest: 0, limb: 0 };
  let shotCount = 0;
  let hitCount = 0;
  let hostageHitCount = 0;
  let reactionSum = 0;
  let reactionCount = 0;
  let splitSum = 0;
  let splitCount = 0;

  for (const session of sessions) {
    for (const shot of session.shotEvents) {
      shotCount += 1;
      if (shot.hit) {
        hitCount += 1;
        if (shot.hitZone && shot.hitZone in hitsByZone) {
          hitsByZone[shot.hitZone as HitZone] += 1;
        }
        if (shot.targetPlacement.targetDefinition.kind === "hostage") {
          hostageHitCount += 1;
        }
      }
      if (shot.reactionTimeMs != null) {
        reactionSum += shot.reactionTimeMs;
        reactionCount += 1;
      }
      if (shot.splitTimeMs != null) {
        splitSum += shot.splitTimeMs;
        splitCount += 1;
      }
    }
  }

  return {
    operatorId,
    sessionCount: sessions.length,
    shotCount,
    accuracyPct: shotCount === 0 ? 0 : (hitCount / shotCount) * 100,
    avgReactionTimeMs: reactionCount === 0 ? null : reactionSum / reactionCount,
    avgSplitTimeMs: splitCount === 0 ? null : splitSum / splitCount,
    hitsByZone,
    hostageHitCount,
  };
}
