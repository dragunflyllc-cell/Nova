import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import type { UserCharacter } from "@nova/db";
import { characterFamilies, currentStageForFamily, levelForXp } from "@nova/nova-dex";
import { authenticate } from "../plugins/authenticate.js";

const claimSchema = z.object({
  familyId: z.string().min(1),
});

const awardXpSchema = z.object({
  amount: z.number().int().positive().max(10_000),
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

  // Temporary: awards XP directly so the capture -> level -> evolve loop is testable
  // end to end. Once trade tracking exists, XP should be earned from real trading
  // behavior (journaled trades, quest completion), not granted through this endpoint.
  app.post("/me/characters/:id/award-xp", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = awardXpSchema.parse(request.body);
    const owned = await prisma.userCharacter.findUnique({ where: { id } });
    if (!owned || owned.userId !== request.userId) {
      return reply.code(404).send({ error: "Character not found" });
    }
    const updated = await prisma.userCharacter.update({
      where: { id },
      data: { xp: { increment: body.amount } },
    });
    return reply.send(serializeOwnedCharacter(updated));
  });
}
