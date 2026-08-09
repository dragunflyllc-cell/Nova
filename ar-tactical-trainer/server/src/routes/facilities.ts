import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toFacility, toScanLayout } from "../lib/mappers.js";

const createFacilitySchema = z.object({
  orgId: z.string().min(1),
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
  app.get("/facilities", async (req) => {
    const { orgId } = req.query as { orgId?: string };
    const rows = await prisma.facility.findMany({
      where: orgId ? { orgId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toFacility);
  });

  app.post("/facilities", async (req, reply) => {
    const body = createFacilitySchema.parse(req.body);
    const row = await prisma.facility.create({ data: body });
    reply.code(201);
    return toFacility(row);
  });

  app.get("/facilities/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.facility.findUnique({
      where: { id },
      include: { scanLayouts: { orderBy: { capturedAt: "desc" } } },
    });
    if (!row) {
      reply.code(404);
      return { error: "facility not found" };
    }
    return { ...toFacility(row), scanLayouts: row.scanLayouts.map(toScanLayout) };
  });

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
