import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toSession, toShotEvent, toMediaAsset } from "../lib/mappers.js";
import { authenticate } from "../auth/plugin.js";

const createSessionSchema = z.object({
  scenarioId: z.string().min(1),
  operatorId: z.string().min(1),
  trainerId: z.string().min(1),
});

const endSessionSchema = z.object({
  outcome: z.enum(["pass", "fail", "aborted"]),
});

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/sessions", { preHandler: authenticate }, async (req) => {
    const { operatorId, scenarioId } = req.query as {
      operatorId?: string;
      scenarioId?: string;
    };
    const rows = await prisma.session.findMany({
      where: { operatorId, scenarioId, scenario: { orgId: req.operator!.orgId } },
      orderBy: { startedAt: "desc" },
    });
    return rows.map(toSession);
  });

  app.post("/sessions", { preHandler: authenticate }, async (req, reply) => {
    const body = createSessionSchema.parse(req.body);
    const orgId = req.operator!.orgId;

    const [scenario, operator, trainer] = await Promise.all([
      prisma.scenario.findUnique({ where: { id: body.scenarioId } }),
      prisma.operator.findUnique({ where: { id: body.operatorId } }),
      prisma.operator.findUnique({ where: { id: body.trainerId } }),
    ]);
    if (scenario?.orgId !== orgId || operator?.orgId !== orgId || trainer?.orgId !== orgId) {
      reply.code(404);
      return { error: "scenario, operator, or trainer not found in your org" };
    }

    const row = await prisma.session.create({ data: body });
    reply.code(201);
    return toSession(row);
  });

  app.get("/sessions/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.session.findFirst({
      where: { id, scenario: { orgId: req.operator!.orgId } },
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

  app.patch("/sessions/:id/end", { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = endSessionSchema.parse(req.body);
    const existing = await prisma.session.findFirst({
      where: { id, scenario: { orgId: req.operator!.orgId } },
    });
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
