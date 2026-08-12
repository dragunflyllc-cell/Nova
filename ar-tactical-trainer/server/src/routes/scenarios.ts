import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toScenario } from "../lib/mappers.js";
import { authenticate } from "../auth/plugin.js";

const vec3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });

const spatialAnchorSchema = z.union([
  z.object({ kind: z.literal("world"), position: vec3Schema, rotationYDeg: z.number() }),
  z.object({
    kind: z.literal("facilityAnchor"),
    anchorId: z.string(),
    offset: vec3Schema,
    rotationYDeg: z.number(),
  }),
]);

const behaviorStepSchema = z.object({
  atMs: z.number().int().nonnegative(),
  setState: z.enum(["idle", "hostile", "compliant", "neutralized", "noShootHostage"]),
});

const targetPlacementInputSchema = z.object({
  targetDefinitionId: z.string().min(1),
  anchor: spatialAnchorSchema,
  appearanceOverride: z
    .object({
      skinVariant: z.string().optional(),
      outfitVariant: z.string().optional(),
      weaponVariant: z.string().nullable().optional(),
    })
    .partial()
    .optional(),
  behaviorScript: z.array(behaviorStepSchema).default([]),
});

const passFailRuleSchema = z.object({
  description: z.string(),
  kind: z.enum([
    "allHostilesNeutralized",
    "noHostageHits",
    "underTimeLimitMs",
    "minAccuracyPct",
  ]),
  value: z.number().optional(),
});

const createScenarioSchema = z.object({
  name: z.string().min(1),
  facilityId: z.string().nullable().default(null),
  targets: z.array(targetPlacementInputSchema).default([]),
  passFailRules: z.array(passFailRuleSchema).default([]),
});

export async function scenarioRoutes(app: FastifyInstance): Promise<void> {
  app.get("/scenarios", { preHandler: authenticate }, async (req) => {
    const rows = await prisma.scenario.findMany({
      where: { orgId: req.operator!.orgId },
      include: { targets: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toScenario);
  });

  // Called directly by the operator app to load its assigned scenario —
  // no login flow on the device, so this stays open; the scenario ID
  // itself is the capability. See docs/ARCHITECTURE.md.
  app.get("/scenarios/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.scenario.findUnique({
      where: { id },
      include: { targets: true },
    });
    if (!row) {
      reply.code(404);
      return { error: "scenario not found" };
    }
    return toScenario(row);
  });

  app.post("/scenarios", { preHandler: authenticate }, async (req, reply) => {
    const body = createScenarioSchema.parse(req.body);
    const row = await prisma.scenario.create({
      data: {
        orgId: req.operator!.orgId,
        name: body.name,
        facilityId: body.facilityId,
        createdBy: req.operator!.operatorId,
        passFailRulesJson: JSON.stringify(body.passFailRules),
        targets: {
          create: body.targets.map((t) => ({
            targetDefinitionId: t.targetDefinitionId,
            anchorJson: JSON.stringify(t.anchor),
            appearanceOverrideJson: t.appearanceOverride
              ? JSON.stringify(t.appearanceOverride)
              : null,
            behaviorScriptJson: JSON.stringify(t.behaviorScript),
          })),
        },
      },
      include: { targets: true },
    });
    reply.code(201);
    return toScenario(row);
  });
}
