import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import { authenticate } from "../plugins/authenticate.js";

/**
 * Lets a trader type in their own fills by hand — a MANUAL BrokerConnection
 * (no real OAuth, accessToken is a meaningless placeholder) rather than a
 * new concept, so every existing route that reads fills through a user's
 * broker connections (trades/service.ts, sync-xp, /me/rules/check,
 * /me/progression/sync) picks these up automatically with zero changes.
 * This exists specifically so someone can test the whole pipeline against
 * their real trade history today, without waiting on Tradovate partner API
 * approval (see docs/ARCHITECTURE.md's broker-integrations section).
 */
const fillSchema = z.object({
  contractSymbol: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  filledAt: z.string().datetime(),
});

async function getOrCreateManualConnection(userId: string) {
  return prisma.brokerConnection.upsert({
    where: { userId_provider: { userId, provider: "MANUAL" } },
    create: {
      userId,
      provider: "MANUAL",
      accessToken: "manual-entry", // meaningless placeholder — MANUAL never does OAuth
      expiresAt: new Date("2100-01-01"), // manual connections never expire
    },
    update: {},
  });
}

export async function fillRoutes(app: FastifyInstance): Promise<void> {
  app.post("/me/fills/manual", { preHandler: authenticate }, async (request, reply) => {
    const body = fillSchema.parse(request.body);
    const connection = await getOrCreateManualConnection(request.userId!);

    const fill = await prisma.brokerFill.create({
      data: {
        connectionId: connection.id,
        externalFillId: randomUUID(),
        contractSymbol: body.contractSymbol.toUpperCase(),
        side: body.side,
        quantity: body.quantity,
        price: body.price,
        filledAt: new Date(body.filledAt),
        raw: { source: "manual" },
      },
    });

    return reply.code(201).send({
      id: fill.id,
      contractSymbol: fill.contractSymbol,
      side: fill.side,
      quantity: fill.quantity,
      price: fill.price,
      filledAt: fill.filledAt.toISOString(),
    });
  });

  app.delete("/me/fills/manual/:id", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const connection = await getOrCreateManualConnection(request.userId!);
    const fill = await prisma.brokerFill.findUnique({ where: { id } });
    if (!fill || fill.connectionId !== connection.id) {
      return reply.code(404).send({ error: "Fill not found" });
    }
    await prisma.brokerFill.delete({ where: { id } });
    return reply.code(204).send();
  });
}
