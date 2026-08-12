import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, registerTestOrg, authHeader } from "../test-helpers.js";
import { prisma } from "../lib/prisma.js";

describe("auth flow", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("registers a new org + admin and returns a usable token", async () => {
    const { token, operatorId } = await registerTestOrg(app);
    expect(token).toBeTruthy();

    const me = await app.inject({ method: "GET", url: "/auth/me", headers: authHeader(token) });
    expect(me.statusCode).toBe(200);
    expect(me.json().id).toBe(operatorId);
  });

  it("rejects a duplicate email on register", async () => {
    const { email } = await registerTestOrg(app);
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { orgName: "Another Org", name: "Someone Else", email, password: "whateverpassword" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("logs in with the correct password", async () => {
    const { email } = await registerTestOrg(app);
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "correcthorsebattery" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeTruthy();
  });

  it("rejects a wrong password", async () => {
    const { email } = await registerTestOrg(app);
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "not-the-password" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects login for an email that doesn't exist", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "nobody@example.com", password: "whatever123" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects /auth/me and other protected routes with no token", async () => {
    const me = await app.inject({ method: "GET", url: "/auth/me" });
    expect(me.statusCode).toBe(401);

    const facilities = await app.inject({ method: "GET", url: "/facilities" });
    expect(facilities.statusCode).toBe(401);
  });

  it("roster members added via POST /operators have no password and can't log in", async () => {
    const { token } = await registerTestOrg(app);
    const rosterEmail = `roster-${crypto.randomUUID()}@example.com`;
    const add = await app.inject({
      method: "POST",
      url: "/operators",
      headers: authHeader(token),
      payload: { name: "Field Operator", email: rosterEmail, role: "operator" },
    });
    expect(add.statusCode).toBe(201);
    expect(add.json()).not.toHaveProperty("passwordHash");

    const loginAttempt = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: rosterEmail, password: "anything-at-all" },
    });
    expect(loginAttempt.statusCode).toBe(401);
  });

  it("returns 400 (not 500) for a malformed request body", async () => {
    const { token } = await registerTestOrg(app);
    const res = await app.inject({
      method: "POST",
      url: "/operators",
      headers: authHeader(token),
      payload: { name: "Bad Email", email: "not-an-email", role: "operator" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().issues).toBeDefined();
  });

  it("only trainer/admin can add roster members", async () => {
    const { token, orgId } = await registerTestOrg(app);
    // Demote-by-construction: create a plain operator directly, then try to
    // add a roster member using that operator's identity via a hand-signed
    // scenario isn't possible through the API (operators can't log in), so
    // instead assert the route itself enforces the role check by requesting
    // as a token whose role claim is not trainer/admin.
    const jwt = await import("jsonwebtoken");
    const { env } = await import("../env.js");
    const operatorToken = jwt.sign({ operatorId: "fake", orgId, role: "operator" }, env.accessTokenSecret);

    const res = await app.inject({
      method: "POST",
      url: "/operators",
      headers: authHeader(operatorToken),
      payload: { name: "Should Fail", email: "should-fail@example.com", role: "operator" },
    });
    expect(res.statusCode).toBe(403);
  });
});
