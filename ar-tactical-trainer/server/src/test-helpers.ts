import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./main.js";

export interface RegisteredOrg {
  app: FastifyInstance;
  token: string;
  operatorId: string;
  orgId: string;
  email: string;
}

/** Spins up a fresh app instance and registers a brand-new org + admin
 * (unique email each call) via the real /auth/register route. */
export async function registerTestOrg(app: FastifyInstance, orgName = "Test Org"): Promise<RegisteredOrg> {
  const email = `${randomUUID()}@example.com`;
  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { orgName, name: "Test Admin", email, password: "correcthorsebattery" },
  });
  if (res.statusCode !== 201) {
    throw new Error(`registerTestOrg failed: ${res.statusCode} ${res.body}`);
  }
  const body = res.json();
  return { app, token: body.accessToken, operatorId: body.operator.id, orgId: body.operator.orgId, email };
}

export function buildTestApp(): FastifyInstance {
  return buildApp();
}

export function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}
