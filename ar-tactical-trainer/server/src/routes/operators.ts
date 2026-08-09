import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toTargetDefinition } from "../lib/mappers.js";

const createOperatorSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["operator", "trainer", "admin"]),
});

export async function operatorRoutes(app: FastifyInstance): Promise<void> {
  app.get("/operators", async (req) => {
    const { orgId } = req.query as { orgId?: string };
    const operators = await prisma.operator.findMany({
      where: orgId ? { orgId } : undefined,
      orderBy: { createdAt: "asc" },
    });
    return operators;
  });

  app.post("/operators", async (req, reply) => {
    const body = createOperatorSchema.parse(req.body);
    const operator = await prisma.operator.create({ data: body });
    reply.code(201);
    return operator;
  });

  app.get("/target-definitions", async () => {
    const defs = await prisma.targetDefinition.findMany();
    return defs.map(toTargetDefinition);
  });
}
