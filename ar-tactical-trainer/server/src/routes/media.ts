import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { toMediaAsset } from "../lib/mappers.js";
import { env } from "../env.js";

function fieldValue(
  fields: Record<string, unknown>,
  name: string,
): string | undefined {
  const field = fields[name] as { value?: unknown } | { value?: unknown }[] | undefined;
  const single = Array.isArray(field) ? field[0] : field;
  return single && "value" in single ? String(single.value) : undefined;
}

async function saveUpload(subdir: string, file: { filename: string; file: NodeJS.ReadableStream }) {
  const dir = join(env.mediaStorageDir, subdir);
  await mkdir(dir, { recursive: true });
  const safeName = `${randomUUID()}-${file.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const diskPath = join(dir, safeName);
  await pipeline(file.file, createWriteStream(diskPath));
  return { diskPath, url: `/media/${subdir}/${safeName}` };
}

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  // Facility-scan meshes and other assets with no session (returns a URL only).
  app.post("/media/upload/mesh", async (req, reply) => {
    const file = await req.file();
    if (!file) {
      reply.code(400);
      return { error: "no file uploaded" };
    }
    const { url } = await saveUpload("mesh", file);
    return { url };
  });

  // Session recordings/photos (creates the MediaAsset row for after-action review).
  app.post("/media/upload/session", async (req, reply) => {
    const file = await req.file();
    if (!file) {
      reply.code(400);
      return { error: "no file uploaded" };
    }
    const fields = file.fields as Record<string, unknown>;
    const sessionId = fieldValue(fields, "sessionId") ?? "";
    const kind = fieldValue(fields, "kind") ?? "";
    const timestampMs = Number(fieldValue(fields, "timestampMs") ?? 0);
    if (!sessionId || (kind !== "video" && kind !== "photo")) {
      reply.code(400);
      return { error: "sessionId and kind (video|photo) are required fields" };
    }
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      reply.code(404);
      return { error: "session not found" };
    }
    const { url } = await saveUpload(`session/${sessionId}`, file);
    const row = await prisma.mediaAsset.create({
      data: { sessionId, kind, url, timestampMs: BigInt(timestampMs) },
    });
    reply.code(201);
    return toMediaAsset(row);
  });
}
