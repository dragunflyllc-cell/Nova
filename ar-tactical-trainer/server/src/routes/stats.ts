import type { FastifyInstance } from "fastify";
import { computeOperatorStats } from "../stats/rollup.js";

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/operators/:id/stats", async (req) => {
    const { id } = req.params as { id: string };
    return computeOperatorStats(id);
  });
}
