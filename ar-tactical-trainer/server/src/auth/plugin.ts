import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken, type AccessTokenClaims } from "./jwt.js";
import { getDevModeOperatorClaims } from "./dev-mode.js";
import { env } from "../env.js";

declare module "fastify" {
  interface FastifyRequest {
    operator?: AccessTokenClaims;
  }
}

/**
 * preHandler for every trainer-console-facing route (roster/facility/
 * scenario authoring, sessions, stats). Device-facing routes the
 * operator app calls directly (scenario fetch by ID, shot logging, media
 * upload, scan-layout upload, the WS relay) are deliberately NOT behind
 * this — the app has no login flow, and a session/scenario ID already
 * acts as the capability a device needs. See docs/ARCHITECTURE.md's Auth
 * section for the full boundary and its trade-offs.
 *
 * When env.authDisabled (the default today), every request is treated as
 * the fixed dev-mode identity regardless of what — if anything — is in
 * the Authorization header. Real token verification only happens once
 * that's turned off.
 */
export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (env.authDisabled) {
    req.operator = await getDevModeOperatorClaims();
    return;
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    reply.code(401);
    throw new Error("missing bearer token");
  }

  const claims = verifyAccessToken(token);
  if (!claims) {
    reply.code(401);
    throw new Error("invalid or expired token");
  }

  req.operator = claims;
}

export function requireRole(...roles: AccessTokenClaims["role"][]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.operator || !roles.includes(req.operator.role)) {
      reply.code(403);
      throw new Error("insufficient role");
    }
  };
}
