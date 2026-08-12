import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { getDevModeOperatorClaims } from "./dev-mode.js";
import { prisma } from "../lib/prisma.js";
import { buildApp } from "../main.js";

/**
 * Runs under `pnpm test:devmode` against its own DB, with DISABLE_AUTH
 * left at its default (on) — the opposite of every other integration
 * test file, which forces DISABLE_AUTH=false to exercise real auth. See
 * vitest.config.ts for why this file is excluded from the default run.
 */
describe("dev mode (auth disabled)", () => {
  it("creates a default org + admin on first use, then reuses it", async () => {
    const first = await getDevModeOperatorClaims();
    expect(first.role).toBe("admin");

    const second = await getDevModeOperatorClaims();
    expect(second).toEqual(first);

    const orgCount = await prisma.org.count();
    expect(orgCount).toBe(1);
  });

  describe("protected routes with no Authorization header", () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = buildApp();
      await app.ready();
    });

    afterAll(async () => {
      await app.close();
      await prisma.$disconnect();
    });

    it("allows GET /facilities with no token", async () => {
      const res = await app.inject({ method: "GET", url: "/facilities" });
      expect(res.statusCode).toBe(200);
    });

    it("allows POST /facilities with no token, scoped to the dev-mode org", async () => {
      const claims = await getDevModeOperatorClaims();
      const res = await app.inject({
        method: "POST",
        url: "/facilities",
        payload: { name: "Dev Mode Facility" },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().orgId).toBe(claims.orgId);
    });

    it("ignores a garbage Authorization header rather than rejecting it", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/facilities",
        headers: { authorization: "Bearer this-is-not-a-real-token" },
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
