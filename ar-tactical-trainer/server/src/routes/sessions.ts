import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toSession, toShotEvent, toMediaAsset } from "../lib/mappers.js";

const createSessionSchema = z.object({
  scenarioId: z.string().min(1),
  operatorId: z.string().min(1),
  trainerId: z.string().min(1),
});

const endSessionSchema = z.object({
  outcome: z.enum(["pass", "fail", "aborted"]),
});

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/sessions", async (req) => {
    const { operatorId, scenarioId } = req.query as {
      operatorId?: string;
      scenarioId?: string;
    };
    const rows = await prisma.session.findMany({
      where: { operatorId, scenarioId },
      orderBy: { startedAt: "desc" },
    });
    return rows.map(toSession);
  });

  app.post("/sessions", async (req, reply) => {
    const body = createSessionSchema.parse(req.body);
    const row = await prisma.session.create({ data: body });
    reply.code(201);
    return toSession(row);
  });

  app.get("/sessions/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.session.findUnique({
      where: { id },
      include: {
        shotEvents: { orderBy: { timestampMs: "asc" } },
        mediaAssets: { orderBy: { timestampMs: "asc" } },
      },
    });
    if (!row) {
      reply.code(404);
      return { error: "session not found" };
    }
    return {
      ...toSession(row),
      shotEvents: row.shotEvents.map(toShotEvent),
      mediaAssets: row.mediaAssets.map(toMediaAsset),
    };
  });

  app.patch("/sessions/:id/end", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = endSessionSchema.parse(req.body);
    const existing = await prisma.session.findUnique({ where: { id } });
    if (!existing) {
      reply.code(404);
      return { error: "session not found" };
    }
    const row = await prisma.session.update({
      where: { id },
      data: { endedAt: new Date(), outcome: body.outcome },
    });
    return toSession(row);
  });
}
