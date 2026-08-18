import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import { fetchDelayedQuote, supportedSymbols } from "../market-data/yahoo.js";
import { authenticate } from "../plugins/authenticate.js";

/**
 * Nova's own paper-trading engine — the answer to "we can't get automatic
 * fills without a broker's cooperation." Nova generates the fills itself,
 * matched against real (delayed) market prices, so there's nothing for a
 * user to fabricate: every fill traces back to a price Nova fetched and a
 * timestamp Nova recorded. See docs/ARCHITECTURE.md's paper-trading
 * section for the full reasoning and the real-vs-delayed-data tradeoff.
 *
 * One open position per user at a time — the simplest model that's still
 * genuinely useful, not a full multi-symbol portfolio. Closing it writes
 * the open+close pair as two PAPER BrokerFill rows under a dedicated
 * PAPER BrokerConnection, so the existing trade-matching/XP/behavior
 * pipeline picks it up with zero changes — same trick as MANUAL.
 */

const openSchema = z.object({
  symbol: z.string().min(1),
  direction: z.enum(["long", "short"]),
  quantity: z.number().int().positive(),
});

async function getOrCreatePaperConnection(userId: string) {
  return prisma.brokerConnection.upsert({
    where: { userId_provider: { userId, provider: "PAPER" } },
    create: {
      userId,
      provider: "PAPER",
      accessToken: "paper-trading", // meaningless placeholder — PAPER never does OAuth
      expiresAt: new Date("2100-01-01"),
    },
    update: {},
  });
}

export async function paperRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/paper/quote", { preHandler: authenticate }, async (request, reply) => {
    const { symbol } = request.query as { symbol?: string };
    if (!symbol) {
      return reply.code(400).send({ error: `symbol is required. Supported: ${supportedSymbols().join(", ")}` });
    }
    try {
      const quote = await fetchDelayedQuote(symbol);
      return reply.send({ symbol: quote.symbol, price: quote.price, asOf: quote.asOf.toISOString() });
    } catch (err) {
      return reply.code(502).send({ error: err instanceof Error ? err.message : "Quote request failed" });
    }
  });

  app.get("/me/paper/position", { preHandler: authenticate }, async (request, reply) => {
    const position = await prisma.paperPosition.findUnique({ where: { userId: request.userId! } });
    if (!position) return reply.send(null);
    return reply.send({
      symbol: position.symbol,
      direction: position.direction,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      openedAt: position.openedAt.toISOString(),
    });
  });

  app.post("/me/paper/open", { preHandler: authenticate }, async (request, reply) => {
    const body = openSchema.parse(request.body);
    const symbol = body.symbol.toUpperCase();

    const existing = await prisma.paperPosition.findUnique({ where: { userId: request.userId! } });
    if (existing) {
      return reply.code(409).send({ error: "You already have an open paper position — close it before opening another." });
    }

    let quote;
    try {
      quote = await fetchDelayedQuote(symbol);
    } catch (err) {
      return reply.code(502).send({ error: err instanceof Error ? err.message : "Quote request failed" });
    }

    const position = await prisma.paperPosition.create({
      data: {
        userId: request.userId!,
        symbol,
        direction: body.direction,
        quantity: body.quantity,
        entryPrice: quote.price,
        openedAt: quote.asOf,
      },
    });

    return reply.code(201).send({
      symbol: position.symbol,
      direction: position.direction,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      openedAt: position.openedAt.toISOString(),
    });
  });

  app.post("/me/paper/close", { preHandler: authenticate }, async (request, reply) => {
    const position = await prisma.paperPosition.findUnique({ where: { userId: request.userId! } });
    if (!position) {
      return reply.code(404).send({ error: "No open paper position to close." });
    }

    let quote;
    try {
      quote = await fetchDelayedQuote(position.symbol);
    } catch (err) {
      return reply.code(502).send({ error: err instanceof Error ? err.message : "Quote request failed" });
    }

    const connection = await getOrCreatePaperConnection(request.userId!);

    // A long opens with a buy and closes with a sell; a short opens with a
    // sell and closes with a buy — same convention real broker fills use,
    // so the existing FIFO matching in trades/matching.ts treats this
    // exactly like any other round-trip trade.
    const openSide = position.direction === "long" ? "buy" : "sell";
    const closeSide = position.direction === "long" ? "sell" : "buy";

    await prisma.$transaction([
      prisma.brokerFill.create({
        data: {
          connectionId: connection.id,
          externalFillId: randomUUID(),
          contractSymbol: position.symbol,
          side: openSide,
          quantity: position.quantity,
          price: position.entryPrice,
          filledAt: position.openedAt,
          raw: { source: "paper", event: "open" },
        },
      }),
      prisma.brokerFill.create({
        data: {
          connectionId: connection.id,
          externalFillId: randomUUID(),
          contractSymbol: position.symbol,
          side: closeSide,
          quantity: position.quantity,
          price: quote.price,
          filledAt: quote.asOf,
          raw: { source: "paper", event: "close" },
        },
      }),
      prisma.paperPosition.delete({ where: { userId: request.userId! } }),
    ]);

    const pointsPnl = position.direction === "long" ? quote.price - position.entryPrice : position.entryPrice - quote.price;

    return reply.send({
      symbol: position.symbol,
      direction: position.direction,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      exitPrice: quote.price,
      pointsPnl,
    });
  });
}
