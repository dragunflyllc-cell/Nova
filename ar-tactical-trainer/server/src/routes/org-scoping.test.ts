import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, registerTestOrg, authHeader } from "../test-helpers.js";
import { prisma } from "../lib/prisma.js";

describe("org scoping", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("an org cannot see another org's facilities", async () => {
    const orgA = await registerTestOrg(app, "Org A PD");
    const orgB = await registerTestOrg(app, "Org B PD");

    const createRes = await app.inject({
      method: "POST",
      url: "/facilities",
      headers: authHeader(orgA.token),
      payload: { name: "Org A Shoothouse" },
    });
    expect(createRes.statusCode).toBe(201);
    const facilityId = createRes.json().id;

    const listAsB = await app.inject({ method: "GET", url: "/facilities", headers: authHeader(orgB.token) });
    expect(listAsB.json().find((f: { id: string }) => f.id === facilityId)).toBeUndefined();

    const getAsB = await app.inject({
      method: "GET",
      url: `/facilities/${facilityId}`,
      headers: authHeader(orgB.token),
    });
    expect(getAsB.statusCode).toBe(404);

    const getAsA = await app.inject({
      method: "GET",
      url: `/facilities/${facilityId}`,
      headers: authHeader(orgA.token),
    });
    expect(getAsA.statusCode).toBe(200);
  });

  it("an org cannot see another org's scenario in the list, but the public-by-design GET /scenarios/:id still works for anyone", async () => {
    const orgA = await registerTestOrg(app, "Org A PD");
    const orgB = await registerTestOrg(app, "Org B PD");
    const defId = (await prisma.targetDefinition.findFirstOrThrow()).id;

    const scenarioRes = await app.inject({
      method: "POST",
      url: "/scenarios",
      headers: authHeader(orgA.token),
      payload: {
        name: "Org A Scenario",
        facilityId: null,
        targets: [
          {
            targetDefinitionId: defId,
            anchor: { kind: "world", position: { x: 0, y: 0, z: 3 }, rotationYDeg: 180 },
            behaviorScript: [{ atMs: 0, setState: "hostile" }],
          },
        ],
        passFailRules: [],
      },
    });
    expect(scenarioRes.statusCode).toBe(201);
    const scenario = scenarioRes.json();
    expect(scenario.orgId).toBe(orgA.orgId);
    expect(scenario.createdBy).toBe(orgA.operatorId);

    const listAsB = await app.inject({ method: "GET", url: "/scenarios", headers: authHeader(orgB.token) });
    expect(listAsB.json().find((s: { id: string }) => s.id === scenario.id)).toBeUndefined();

    // Deliberately open: the operator app loads its assigned scenario with no login.
    const publicFetch = await app.inject({ method: "GET", url: `/scenarios/${scenario.id}` });
    expect(publicFetch.statusCode).toBe(200);
  });

  it("cannot start a session mixing a scenario/operator/trainer from different orgs", async () => {
    const orgA = await registerTestOrg(app, "Org A PD");
    const orgB = await registerTestOrg(app, "Org B PD");
    const defId = (await prisma.targetDefinition.findFirstOrThrow()).id;

    const scenarioRes = await app.inject({
      method: "POST",
      url: "/scenarios",
      headers: authHeader(orgA.token),
      payload: { name: "Org A Scenario 2", facilityId: null, targets: [], passFailRules: [] },
    });
    const scenarioId = scenarioRes.json().id;

    const crossOrgSession = await app.inject({
      method: "POST",
      url: "/sessions",
      headers: authHeader(orgA.token),
      // orgB's admin id used as the operator — must be rejected even though
      // the caller's own token/org (A) is valid.
      payload: { scenarioId, operatorId: orgB.operatorId, trainerId: orgA.operatorId },
    });
    expect(crossOrgSession.statusCode).toBe(404);

    const validSession = await app.inject({
      method: "POST",
      url: "/sessions",
      headers: authHeader(orgA.token),
      payload: { scenarioId, operatorId: orgA.operatorId, trainerId: orgA.operatorId },
    });
    expect(validSession.statusCode).toBe(201);

    const getAsB = await app.inject({
      method: "GET",
      url: `/sessions/${validSession.json().id}`,
      headers: authHeader(orgB.token),
    });
    expect(getAsB.statusCode).toBe(404);
  });
});
