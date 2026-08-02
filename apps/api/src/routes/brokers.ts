import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import { signStateToken, verifyStateToken } from "../auth/tokens.js";
import { tradovateAdapter } from "../brokers/tradovate.js";
import { authenticate } from "../plugins/authenticate.js";
import { decrypt, encrypt } from "../security/encryption.js";

const OAUTH_STATE_PURPOSE = "tradovate-oauth";

const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export async function brokerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/brokers/tradovate/connect", { preHandler: authenticate }, async (request, reply) => {
    const state = await signStateToken(request.userId!, OAUTH_STATE_PURPOSE);
    return reply.redirect(tradovateAdapter.getAuthorizationUrl(state));
  });

  // Hit by Tradovate's redirect, not our own client — no Bearer token available here.
  app.get("/brokers/tradovate/callback", async (request, reply) => {
    const { code, state } = callbackQuerySchema.parse(request.query);

    let userId: string;
    try {
      userId = await verifyStateToken(state, OAUTH_STATE_PURPOSE);
    } catch {
      return reply.code(400).send({ error: "Invalid or expired connection request. Please try connecting again." });
    }

    const tokens = await tradovateAdapter.exchangeCodeForTokens(code);

    await prisma.brokerConnection.upsert({
      where: { userId_provider: { userId, provider: "TRADOVATE" } },
      create: {
        userId,
        provider: "TRADOVATE",
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        expiresAt: tokens.expiresAt,
      },
      update: {
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        expiresAt: tokens.expiresAt,
      },
    });

    return reply.send({ status: "connected", provider: "tradovate" });
  });

  app.post("/me/brokers/tradovate/sync", { preHandler: authenticate }, async (request, reply) => {
    const connection = await prisma.brokerConnection.findUnique({
      where: { userId_provider: { userId: request.userId!, provider: "TRADOVATE" } },
    });
    if (!connection) {
      return reply.code(404).send({ error: "No Tradovate account connected" });
    }
    if (connection.expiresAt < new Date()) {
      return reply
        .code(409)
        .send({ error: "Tradovate connection has expired — reconnect via /brokers/tradovate/connect" });
    }

    const fills = await tradovateAdapter.fetchFills({
      accessToken: decrypt(connection.accessToken),
      expiresAt: connection.expiresAt,
    });

    const existing = await prisma.brokerFill.findMany({
      where: { connectionId: connection.id, externalFillId: { in: fills.map((f) => f.externalFillId) } },
      select: { externalFillId: true },
    });
    const existingIds = new Set(existing.map((f) => f.externalFillId));
    const newFills = fills.filter((f) => !existingIds.has(f.externalFillId));

    if (newFills.length > 0) {
      await prisma.brokerFill.createMany({
        data: newFills.map((f) => ({
          connectionId: connection.id,
          externalFillId: f.externalFillId,
          contractSymbol: f.contractSymbol,
          side: f.side,
          quantity: f.quantity,
          price: f.price,
          filledAt: f.filledAt,
          raw: f.raw as object,
        })),
      });
    }

    return reply.send({ fetched: fills.length, stored: newFills.length });
  });

  app.get("/me/fills", { preHandler: authenticate }, async (request, reply) => {
    const connections = await prisma.brokerConnection.findMany({ where: { userId: request.userId } });
    const fills = await prisma.brokerFill.findMany({
      where: { connectionId: { in: connections.map((c) => c.id) } },
      orderBy: { filledAt: "desc" },
    });
    return reply.send(
      fills.map((f) => ({
        id: f.id,
        contractSymbol: f.contractSymbol,
        side: f.side,
        quantity: f.quantity,
        price: f.price,
        filledAt: f.filledAt.toISOString(),
      })),
    );
  });
}
