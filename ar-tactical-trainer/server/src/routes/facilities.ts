import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toFacility, toScanLayout } from "../lib/mappers.js";
import { authenticate } from "../auth/plugin.js";

const createFacilitySchema = z.object({
  name: z.string().min(1),
});

const vec3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });

const createScanLayoutSchema = z.object({
  meshAssetUrl: z.string().min(1),
  capturedByOperatorId: z.string().min(1),
  anchors: z.array(
    z.object({ anchorId: z.string(), label: z.string(), position: vec3Schema }),
  ),
});

export async function facilityRoutes(app: FastifyInstance): Promise<void> {
  app.get("/facilities", { preHandler: authenticate }, async (req) => {
    const rows = await prisma.facility.findMany({
      where: { orgId: req.operator!.orgId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toFacility);
  });

  app.post("/facilities", { preHandler: authenticate }, async (req, reply) => {
    const body = createFacilitySchema.parse(req.body);
    const row = await prisma.facility.create({ data: { ...body, orgId: req.operator!.orgId } });
    reply.code(201);
    return toFacility(row);
  });

  app.get("/facilities/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.facility.findUnique({
      where: { id },
      include: { scanLayouts: { orderBy: { capturedAt: "desc" } } },
    });
    if (!row || row.orgId !== req.operator!.orgId) {
      reply.code(404);
      return { error: "facility not found" };
    }
    return { ...toFacility(row), scanLayouts: row.scanLayouts.map(toScanLayout) };
  });

  // Called directly by the operator app after a facility scan — no login
  // flow on the device, so this stays open. See docs/ARCHITECTURE.md.
  app.post("/facilities/:id/scan-layouts", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = createScanLayoutSchema.parse(req.body);
    const facility = await prisma.facility.findUnique({ where: { id } });
    if (!facility) {
      reply.code(404);
      return { error: "facility not found" };
    }
    const row = await prisma.scanLayout.create({
      data: {
        facilityId: id,
        meshAssetUrl: body.meshAssetUrl,
        capturedByOperatorId: body.capturedByOperatorId,
        anchorsJson: JSON.stringify(body.anchors),
      },
    });
    reply.code(201);
    return toScanLayout(row);
  });
}
