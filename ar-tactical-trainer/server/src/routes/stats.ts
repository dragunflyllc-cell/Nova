import type { FastifyInstance } from "fastify";
import { computeOperatorStats } from "../stats/rollup.js";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../auth/plugin.js";

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/operators/:id/stats", { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const operator = await prisma.operator.findUnique({ where: { id } });
    if (!operator || operator.orgId !== req.operator!.orgId) {
      reply.code(404);
      return { error: "operator not found" };
    }
    return computeOperatorStats(id);
  });
}
