import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import type { UserCharacter } from "@nova/db";
import { characterFamilies, currentStageForFamily, levelForXp } from "@nova/nova-dex";
import { totalXpFromTrades } from "../behavior/scoring.js";
import { authenticate } from "../plugins/authenticate.js";
import { getMatchedTradesForUser } from "../trades/service.js";

const claimSchema = z.object({
  familyId: z.string().min(1),
});

function serializeOwnedCharacter(owned: UserCharacter) {
  const family = characterFamilies.find((f) => f.id === owned.familyId);
  const level = levelForXp(owned.xp);
  const stage = currentStageForFamily(owned.familyId, level);
  return {
    id: owned.id,
    familyId: owned.familyId,
    familyName: family?.name ?? owned.familyId,
    xp: owned.xp,
    level,
    stage,
    capturedAt: owned.capturedAt.toISOString(),
  };
}

export async function characterRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/characters", { preHandler: authenticate }, async (request, reply) => {
    const owned = await prisma.userCharacter.findMany({
      where: { userId: request.userId },
      orderBy: { capturedAt: "asc" },
    });
    return reply.send(owned.map(serializeOwnedCharacter));
  });

  app.post("/me/characters/claim", { preHandler: authenticate }, async (request, reply) => {
    const body = claimSchema.parse(request.body);
    const family = characterFamilies.find((f) => f.id === body.familyId);
    if (!family) {
      return reply.code(404).send({ error: "Unknown character family" });
    }
    const existing = await prisma.userCharacter.findUnique({
      where: { userId_familyId: { userId: request.userId!, familyId: body.familyId } },
    });
    if (existing) {
      return reply.code(409).send({ error: "Already captured this family" });
    }
    const owned = await prisma.userCharacter.create({
      data: { userId: request.userId!, familyId: body.familyId },
    });
    return reply.code(201).send(serializeOwnedCharacter(owned));
  });

  // Recomputes XP from real trading behavior (apps/api/src/behavior/scoring.ts)
  // and writes it to every owned character. This SETS xp from a full
  // recompute over all of the user's matched trades rather than
  // incrementing it — deliberately, so calling this twice in a row (or
  // after the same fills sync again) is idempotent without needing a
  // "last synced trade" cursor. It does mean every owned character gets
  // the same xp today; there's no per-archetype attribution of which
  // character a given behavior signal should favor yet (e.g. a revenge
  // trade penalizing an "impulsive" character more than a "patient" one)
  // — a real v1 simplification, not an oversight.
  app.post("/me/characters/sync-xp", { preHandler: authenticate }, async (request, reply) => {
    const owned = await prisma.userCharacter.findMany({ where: { userId: request.userId } });
    if (owned.length === 0) {
      return reply.code(404).send({ error: "Claim a starter character before syncing XP" });
    }

    const trades = await getMatchedTradesForUser(request.userId!);
    const xpFromBehavior = totalXpFromTrades(trades);

    const updated = await prisma.$transaction(
      owned.map((oc) => prisma.userCharacter.update({ where: { id: oc.id }, data: { xp: xpFromBehavior } })),
    );

    return reply.send({
      tradesScored: trades.length,
      xpFromBehavior,
      characters: updated.map(serializeOwnedCharacter),
    });
  });
}
