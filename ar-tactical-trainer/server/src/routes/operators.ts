import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toTargetDefinition } from "../lib/mappers.js";
import { authenticate, requireRole } from "../auth/plugin.js";

const addRosterMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["operator", "trainer", "admin"]),
});

// Never return passwordHash to a client, not even a trainer console one.
const publicOperatorSelect = {
  id: true,
  orgId: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function operatorRoutes(app: FastifyInstance): Promise<void> {
  app.get("/operators", { preHandler: authenticate }, async (req) => {
    const operators = await prisma.operator.findMany({
      where: { orgId: req.operator!.orgId },
      orderBy: { createdAt: "asc" },
      select: publicOperatorSelect,
    });
    return operators;
  });

  // Roster-only add: "operator" rows created this way have no password and
  // can't log into the console — only the field roster the trainer console
  // and operator app reference by ID. See docs/ARCHITECTURE.md Auth section.
  app.post(
    "/operators",
    { preHandler: [authenticate, requireRole("trainer", "admin")] },
    async (req, reply) => {
      const body = addRosterMemberSchema.parse(req.body);
      const operator = await prisma.operator.create({
        data: { ...body, orgId: req.operator!.orgId },
        select: publicOperatorSelect,
      });
      reply.code(201);
      return operator;
    },
  );

  app.get("/target-definitions", async () => {
    const defs = await prisma.targetDefinition.findMany();
    return defs.map(toTargetDefinition);
  });
}
