import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type WebSocket from "ws";
import { buildTestApp, registerTestOrg, authHeader } from "../test-helpers.js";
import { prisma } from "../lib/prisma.js";

function nextMessage(ws: WebSocket): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    ws.once("message", (data: Buffer) => resolve(JSON.parse(data.toString())));
  });
}

describe("trainer<->operator WS relay", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("relays trainer->operator and operator->trainer messages, and persists SHOT_EVENT", async () => {
    const { token, operatorId: trainerId } = await registerTestOrg(app);
    const defId = (await prisma.targetDefinition.findFirstOrThrow()).id;

    const rosterRes = await app.inject({
      method: "POST",
      url: "/operators",
      headers: authHeader(token),
      payload: { name: "WS Operator", email: `ws-${crypto.randomUUID()}@example.com`, role: "operator" },
    });
    const operatorId = rosterRes.json().id;

    const scenarioRes = await app.inject({
      method: "POST",
      url: "/scenarios",
      headers: authHeader(token),
      payload: {
        name: "WS Test Scenario",
        facilityId: null,
        targets: [
          {
            targetDefinitionId: defId,
            anchor: { kind: "world", position: { x: 0, y: 0, z: 3 }, rotationYDeg: 180 },
            behaviorScript: [],
          },
        ],
        passFailRules: [],
      },
    });
    const scenario = scenarioRes.json();
    const targetPlacementId = scenario.targets[0].id;

    const sessionRes = await app.inject({
      method: "POST",
      url: "/sessions",
      headers: authHeader(token),
      payload: { scenarioId: scenario.id, operatorId, trainerId },
    });
    const sessionId = sessionRes.json().id;

    const trainerWs = await app.injectWS("/ws");
    const operatorWs = await app.injectWS("/ws");

    trainerWs.send(JSON.stringify({ type: "JOIN", sessionId, role: "trainer" }));
    operatorWs.send(JSON.stringify({ type: "JOIN", sessionId, role: "operator" }));
    // give the relay a tick to register both JOINs before sending
    await new Promise((r) => setTimeout(r, 50));

    const operatorReceived = nextMessage(operatorWs);
    trainerWs.send(
      JSON.stringify({
        type: "SET_TARGET_STATE",
        sessionId,
        ts: Date.now(),
        payload: { targetPlacementId, state: "hostile" },
      }),
    );
    const fromTrainer = await operatorReceived;
    expect(fromTrainer).toMatchObject({
      type: "SET_TARGET_STATE",
      payload: { targetPlacementId, state: "hostile" },
    });

    const shotId = crypto.randomUUID();
    const trainerReceived = nextMessage(trainerWs);
    operatorWs.send(
      JSON.stringify({
        type: "SHOT_EVENT",
        sessionId,
        ts: Date.now(),
        payload: {
          id: shotId,
          sessionId,
          targetPlacementId,
          timestampMs: Date.now(),
          hit: true,
          hitZone: "chest",
          reactionTimeMs: 600,
          splitTimeMs: null,
        },
      }),
    );
    const fromOperator = await trainerReceived;
    expect(fromOperator).toMatchObject({ type: "SHOT_EVENT", payload: { id: shotId, hit: true } });

    // the relay must have persisted it, not just forwarded it
    const persisted = await prisma.shotEvent.findUnique({ where: { id: shotId } });
    expect(persisted).not.toBeNull();
    expect(persisted?.hit).toBe(true);
    expect(persisted?.hitZone).toBe("chest");

    trainerWs.close();
    operatorWs.close();
  });
});
