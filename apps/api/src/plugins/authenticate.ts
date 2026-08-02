import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../auth/tokens.js";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    await reply.code(401).send({ error: "Missing bearer token" });
    return;
  }
  try {
    request.userId = await verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    await reply.code(401).send({ error: "Invalid or expired token" });
  }
}
