import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, registerTestOrg, authHeader } from "../test-helpers.js";
import { prisma } from "../lib/prisma.js";

describe("operator stats rollup", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("computes accuracy, avg reaction/split time, hits by zone, and hostage hits from real shot events", async () => {
    const { token, operatorId: trainerId } = await registerTestOrg(app);

    const hostileDefId = (await prisma.targetDefinition.findFirstOrThrow({ where: { kind: "hostile" } })).id;
    const hostageDefId = (await prisma.targetDefinition.findFirstOrThrow({ where: { kind: "hostage" } })).id;

    const rosterRes = await app.inject({
      method: "POST",
      url: "/operators",
      headers: authHeader(token),
      payload: { name: "Stats Operator", email: `stats-${crypto.randomUUID()}@example.com`, role: "operator" },
    });
    const operatorId = rosterRes.json().id;

    const scenarioRes = await app.inject({
      method: "POST",
      url: "/scenarios",
      headers: authHeader(token),
      payload: {
        name: "Stats Test Scenario",
        facilityId: null,
        targets: [
          {
            targetDefinitionId: hostileDefId,
            anchor: { kind: "world", position: { x: 0, y: 0, z: 3 }, rotationYDeg: 180 },
            behaviorScript: [{ atMs: 0, setState: "hostile" }],
          },
          {
            targetDefinitionId: hostageDefId,
            anchor: { kind: "world", position: { x: 1, y: 0, z: 3 }, rotationYDeg: 180 },
            behaviorScript: [{ atMs: 0, setState: "noShootHostage" }],
          },
        ],
        passFailRules: [],
      },
    });
    const scenario = scenarioRes.json();
    const hostilePlacementId = scenario.targets[0].id;
    const hostagePlacementId = scenario.targets[1].id;

    const sessionRes = await app.inject({
      method: "POST",
      url: "/sessions",
      headers: authHeader(token),
      payload: { scenarioId: scenario.id, operatorId, trainerId },
    });
    const sessionId = sessionRes.json().id;

    const baseTs = Date.now();
    const shots = [
      // hit, chest, reaction 800ms — the only shot with a reaction time
      {
        sessionId,
        targetPlacementId: hostilePlacementId,
        timestampMs: baseTs,
        hit: true,
        hitZone: "chest",
        reactionTimeMs: 800,
        splitTimeMs: null,
      },
      // miss — no zone, no reaction/split
      {
        sessionId,
        targetPlacementId: hostilePlacementId,
        timestampMs: baseTs + 500,
        hit: false,
        hitZone: null,
        reactionTimeMs: null,
        splitTimeMs: 500,
      },
      // hit on the hostage — should count toward hostageHitCount, not accuracy exclusion
      {
        sessionId,
        targetPlacementId: hostagePlacementId,
        timestampMs: baseTs + 800,
        hit: true,
        hitZone: "head",
        reactionTimeMs: null,
        splitTimeMs: 300,
      },
    ];

    for (const shot of shots) {
      const res = await app.inject({ method: "POST", url: "/shots", payload: shot });
      expect(res.statusCode).toBe(201);
    }

    const statsRes = await app.inject({
      method: "GET",
      url: `/operators/${operatorId}/stats`,
      headers: authHeader(token),
    });
    expect(statsRes.statusCode).toBe(200);
    const stats = statsRes.json();

    expect(stats.sessionCount).toBe(1);
    expect(stats.shotCount).toBe(3);
    // 2 hits / 3 shots
    expect(stats.accuracyPct).toBeCloseTo((2 / 3) * 100, 5);
    // only one shot carries a reactionTimeMs (800)
    expect(stats.avgReactionTimeMs).toBe(800);
    // two shots carry splitTimeMs: 500 and 300 -> avg 400
    expect(stats.avgSplitTimeMs).toBe(400);
    expect(stats.hitsByZone).toEqual({ head: 1, chest: 1, limb: 0 });
    expect(stats.hostageHitCount).toBe(1);
  });

  it("returns zeroed-out stats for an operator with no sessions", async () => {
    const { token } = await registerTestOrg(app);
    const rosterRes = await app.inject({
      method: "POST",
      url: "/operators",
      headers: authHeader(token),
      payload: { name: "Fresh Operator", email: `fresh-${crypto.randomUUID()}@example.com`, role: "operator" },
    });
    const operatorId = rosterRes.json().id;

    const statsRes = await app.inject({
      method: "GET",
      url: `/operators/${operatorId}/stats`,
      headers: authHeader(token),
    });
    expect(statsRes.statusCode).toBe(200);
    const stats = statsRes.json();
    expect(stats).toMatchObject({
      sessionCount: 0,
      shotCount: 0,
      accuracyPct: 0,
      avgReactionTimeMs: null,
      avgSplitTimeMs: null,
      hostageHitCount: 0,
    });
  });
});
