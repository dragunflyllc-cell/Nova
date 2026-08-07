import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import { fetchFills, listAccounts } from "../brokers/rithmic.js";
import { authenticate } from "../plugins/authenticate.js";
import { decrypt, encrypt } from "../security/encryption.js";

/**
 * Rithmic connection flow — direct credentials like ProjectX, not OAuth:
 * a Rithmic username/password is a durable login (from whichever
 * Rithmic-cleared broker issued it), not a redirect-based grant. Nova
 * holds no Rithmic-issued app-level secret per user — only the
 * Nova-wide RITHMIC_SYSTEM_NAME/RITHMIC_GATEWAY_URL (see env.ts) plus
 * each user's own login.
 */
const connectSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  accountId: z.string().min(1).optional(),
});

export async function rithmicRoutes(app: FastifyInstance): Promise<void> {
  app.post("/me/brokers/rithmic/connect", { preHandler: authenticate }, async (request, reply) => {
    const body = connectSchema.parse(request.body);
    const creds = { username: body.username, password: body.password };

    let accounts;
    try {
      accounts = await listAccounts(creds);
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : "Rithmic login failed" });
    }
    if (accounts.length === 0) {
      return reply.code(400).send({ error: "No Rithmic accounts found for that login." });
    }

    let account = accounts[0]!;
    if (body.accountId) {
      const match = accounts.find((a) => a.accountId === body.accountId);
      if (!match) {
        return reply.code(400).send({
          error: `No Rithmic account "${body.accountId}" for that login. Available: ${accounts.map((a) => a.accountId).join(", ")}`,
        });
      }
      account = match;
    }

    await prisma.brokerConnection.upsert({
      where: { userId_provider: { userId: request.userId!, provider: "RITHMIC" } },
      create: {
        userId: request.userId!,
        provider: "RITHMIC",
        accessToken: "rithmic-direct-credentials", // no separate access token — see refreshToken below
        refreshToken: encrypt(body.password),
        externalAccountId: account.accountId,
        externalUsername: body.username,
        expiresAt: new Date("2100-01-01"), // Rithmic logins don't expire the way OAuth tokens do
      },
      update: {
        refreshToken: encrypt(body.password),
        externalAccountId: account.accountId,
        externalUsername: body.username,
      },
    });

    return reply.send({ status: "connected", provider: "rithmic", account: { accountId: account.accountId } });
  });

  app.post("/me/brokers/rithmic/sync", { preHandler: authenticate }, async (request, reply) => {
    const connection = await prisma.brokerConnection.findUnique({
      where: { userId_provider: { userId: request.userId!, provider: "RITHMIC" } },
    });
    if (!connection) {
      return reply.code(404).send({ error: "No Rithmic account connected" });
    }
    if (!connection.externalAccountId || !connection.externalUsername || !connection.refreshToken) {
      return reply.code(500).send({ error: "Rithmic connection is missing required fields — reconnect it." });
    }

    const creds = { username: connection.externalUsername, password: decrypt(connection.refreshToken) };

    let fills;
    try {
      fills = await fetchFills(creds, connection.externalAccountId);
    } catch (err) {
      return reply.code(502).send({ error: err instanceof Error ? err.message : "Rithmic fill sync failed" });
    }

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
}
