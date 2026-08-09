import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toShotEvent } from "../lib/mappers.js";

/**
 * REST fallback for logging a shot when the WebSocket relay isn't
 * available (e.g. range has no live network back to the trainer console).
 * The operator app buffers shots locally either way
 * (`Stats/StatsTracker.cs`) and can flush them here after the session.
 */
const createShotSchema = z.object({
  sessionId: z.string().min(1),
  targetPlacementId: z.string().min(1),
  timestampMs: z.number().int().nonnegative(),
  hit: z.boolean(),
  hitZone: z.enum(["head", "chest", "limb"]).nullable().default(null),
  reactionTimeMs: z.number().int().nonnegative().nullable().default(null),
  splitTimeMs: z.number().int().nonnegative().nullable().default(null),
});

export async function shotRoutes(app: FastifyInstance): Promise<void> {
  app.post("/shots", async (req, reply) => {
    const body = createShotSchema.parse(req.body);
    const row = await prisma.shotEvent.create({
      data: { ...body, timestampMs: BigInt(body.timestampMs) },
    });
    reply.code(201);
    return toShotEvent(row);
  });

  app.post("/shots/bulk", async (req, reply) => {
    const body = z.array(createShotSchema).parse(req.body);
    const rows = await prisma.$transaction(
      body.map((shot) =>
        prisma.shotEvent.create({ data: { ...shot, timestampMs: BigInt(shot.timestampMs) } }),
      ),
    );
    reply.code(201);
    return rows.map(toShotEvent);
  });
}
