import { prisma } from "../lib/prisma.js";
import type { AccessTokenClaims } from "./jwt.js";

/**
 * When env.authDisabled is set, every request is treated as this fixed
 * identity — a single auto-created org/admin — instead of requiring a
 * real login. Cached after first lookup so dev mode doesn't hit the DB on
 * every request; the cache is process-lifetime, which is fine since this
 * identity is only ever created once and never changes underneath it.
 */
let cached: AccessTokenClaims | null = null;

export async function getDevModeOperatorClaims(): Promise<AccessTokenClaims> {
  if (cached) return cached;

  let org = await prisma.org.findFirst();
  if (!org) {
    org = await prisma.org.create({ data: { name: "Dev Mode Org" } });
  }

  let admin = await prisma.operator.findFirst({ where: { orgId: org.id, role: "admin" } });
  if (!admin) {
    admin = await prisma.operator.create({
      data: {
        orgId: org.id,
        name: "Dev Mode Admin",
        email: `dev-mode-admin@${org.id}.local`,
        role: "admin",
      },
    });
  }

  cached = { operatorId: admin.id, orgId: org.id, role: "admin" };
  return cached;
}
