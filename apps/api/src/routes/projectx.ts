import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import { fetchTrades, listAccounts, login } from "../brokers/projectx.js";
import { authenticate } from "../plugins/authenticate.js";
import { decrypt, encrypt } from "../security/encryption.js";

/**
 * ProjectX Gateway connection flow — deliberately not OAuth like Tradovate's.
 * A ProjectX API key is a durable, user-issued secret (bought as a
 * self-serve add-on in the trader's own account settings), so the user just
 * pastes username + API key directly rather than being redirected through
 * an authorization screen. Nova needs no app-level client id/secret for
 * this provider at all.
 */
const connectSchema = z.object({
  username: z.string().min(1),
  apiKey: z.string().min(1),
  accountName: z.string().min(1).optional(),
});

export async function projectXRoutes(app: FastifyInstance): Promise<void> {
  app.post("/me/brokers/projectx/connect", { preHandler: authenticate }, async (request, reply) => {
    const body = connectSchema.parse(request.body);

    let session;
    try {
      session = await login(body.username, body.apiKey);
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : "ProjectX login failed" });
    }

    const accounts = await listAccounts(session.token);
    if (accounts.length === 0) {
      return reply.code(400).send({ error: "No active ProjectX accounts found for that login." });
    }

    let account = accounts[0]!;
    if (body.accountName) {
      const match = accounts.find((a) => a.name.toUpperCase() === body.accountName!.toUpperCase());
      if (!match) {
        return reply.code(400).send({
          error: `No ProjectX account named "${body.accountName}". Available: ${accounts.map((a) => a.name).join(", ")}`,
        });
      }
      account = match;
    }

    await prisma.brokerConnection.upsert({
      where: { userId_provider: { userId: request.userId!, provider: "PROJECTX" } },
      create: {
        userId: request.userId!,
        provider: "PROJECTX",
        accessToken: encrypt(session.token),
        refreshToken: encrypt(body.apiKey),
        externalAccountId: String(account.id),
        externalUsername: body.username,
        expiresAt: session.expiresAt,
      },
      update: {
        accessToken: encrypt(session.token),
        refreshToken: encrypt(body.apiKey),
        externalAccountId: String(account.id),
        externalUsername: body.username,
        expiresAt: session.expiresAt,
      },
    });

    return reply.send({
      status: "connected",
      provider: "projectx",
      account: { id: account.id, name: account.name, balance: account.balance, simulated: account.simulated },
    });
  });

  app.post("/me/brokers/projectx/sync", { preHandler: authenticate }, async (request, reply) => {
    const connection = await prisma.brokerConnection.findUnique({
      where: { userId_provider: { userId: request.userId!, provider: "PROJECTX" } },
    });
    if (!connection) {
      return reply.code(404).send({ error: "No ProjectX account connected" });
    }
    if (!connection.externalAccountId || !connection.externalUsername || !connection.refreshToken) {
      return reply.code(500).send({ error: "ProjectX connection is missing required fields — reconnect it." });
    }

    // Re-authenticate on every sync rather than trying to reuse/refresh a
    // cached JWT — sync is an infrequent, on-demand operation, so the extra
    // login call is cheap and avoids any stale-token edge cases.
    let session;
    try {
      session = await login(connection.externalUsername, decrypt(connection.refreshToken));
    } catch (err) {
      return reply.code(502).send({ error: err instanceof Error ? err.message : "ProjectX re-authentication failed" });
    }

    await prisma.brokerConnection.update({
      where: { id: connection.id },
      data: { accessToken: encrypt(session.token), expiresAt: session.expiresAt },
    });

    const fills = await fetchTrades(session.token, Number(connection.externalAccountId));

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
