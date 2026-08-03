import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import { checkRules, type TradingRuleRecord } from "../behavior/rules.js";
import { authenticate } from "../plugins/authenticate.js";
import { getMatchedTradesForUser } from "../trades/service.js";

const ruleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("MAX_TRADES_PER_DAY"), params: z.object({ max: z.number().int().positive() }) }),
  z.object({
    type: z.literal("MIN_COOLDOWN_AFTER_LOSS_MINUTES"),
    params: z.object({ minutes: z.number().nonnegative() }),
  }),
  z.object({ type: z.literal("MAX_POSITION_SIZE"), params: z.object({ maxQuantity: z.number().positive() }) }),
  z.object({
    type: z.literal("MAX_DAILY_LOSS_POINTS"),
    params: z.object({ maxLossPoints: z.number().positive() }),
  }),
  z.object({
    type: z.literal("TRADING_HOURS_WINDOW_UTC"),
    params: z.object({
      startHourUtc: z.number().int().min(0).max(23),
      endHourUtc: z.number().int().min(0).max(23),
    }),
  }),
]);

function serializeRule(rule: { id: string; type: string; params: unknown; active: boolean; createdAt: Date }) {
  return {
    id: rule.id,
    type: rule.type,
    params: rule.params,
    active: rule.active,
    createdAt: rule.createdAt.toISOString(),
  };
}

export async function ruleRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/rules", { preHandler: authenticate }, async (request, reply) => {
    const rules = await prisma.tradingRule.findMany({
      where: { userId: request.userId, active: true },
      orderBy: { createdAt: "asc" },
    });
    return reply.send(rules.map(serializeRule));
  });

  app.post("/me/rules", { preHandler: authenticate }, async (request, reply) => {
    const body = ruleSchema.parse(request.body);
    const rule = await prisma.tradingRule.create({
      data: { userId: request.userId!, type: body.type, params: body.params },
    });
    return reply.code(201).send(serializeRule(rule));
  });

  app.delete("/me/rules/:id", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const rule = await prisma.tradingRule.findUnique({ where: { id } });
    if (!rule || rule.userId !== request.userId) {
      return reply.code(404).send({ error: "Rule not found" });
    }
    await prisma.tradingRule.update({ where: { id }, data: { active: false } });
    return reply.code(204).send();
  });

  // Recomputes accountability against every active rule and persists one
  // BehaviorEvent per (rule, trade) pass/fail — the durable log a future
  // reporting layer would read, distinct from the ephemeral XP total in
  // POST /me/characters/sync-xp. Safe to call repeatedly: each event is
  // upserted on (userId, signal, tradeRef, ruleId), so re-checking the same
  // trade against the same rule again just overwrites, never duplicates.
  app.post("/me/rules/check", { preHandler: authenticate }, async (request, reply) => {
    const rules = await prisma.tradingRule.findMany({ where: { userId: request.userId, active: true } });
    if (rules.length === 0) {
      return reply.send({ rulesChecked: 0, results: [] });
    }

    const trades = await getMatchedTradesForUser(request.userId!);
    const ruleRecords: TradingRuleRecord[] = rules.map((r) => ({
      id: r.id,
      type: r.type as TradingRuleRecord["type"],
      params: r.params as Record<string, number>,
    }));
    const results = checkRules(ruleRecords, trades);

    for (const result of results) {
      await prisma.behaviorEvent.upsert({
        where: {
          userId_signal_tradeRef_ruleId: {
            userId: request.userId!,
            signal: result.passed ? "RULE_ADHERENCE" : "RULE_VIOLATION",
            tradeRef: result.tradeRef,
            ruleId: result.ruleId,
          },
        },
        create: {
          userId: request.userId!,
          signal: result.passed ? "RULE_ADHERENCE" : "RULE_VIOLATION",
          tradeRef: result.tradeRef,
          ruleId: result.ruleId,
          detectedAt: result.trade.closedAt,
          metadata: { type: result.type, detail: result.detail },
        },
        update: {
          detectedAt: result.trade.closedAt,
          metadata: { type: result.type, detail: result.detail },
        },
      });
    }

    const violations = results.filter((r) => !r.passed).length;
    return reply.send({
      rulesChecked: rules.length,
      tradesEvaluated: trades.length,
      violations,
      adherent: results.length - violations,
      results: results.map((r) => ({
        ruleId: r.ruleId,
        type: r.type,
        tradeRef: r.tradeRef,
        passed: r.passed,
        detail: r.detail,
      })),
    });
  });

  app.get("/me/behavior-events", { preHandler: authenticate }, async (request, reply) => {
    const events = await prisma.behaviorEvent.findMany({
      where: { userId: request.userId },
      orderBy: { detectedAt: "desc" },
      take: 200,
    });
    return reply.send(
      events.map((e) => ({
        id: e.id,
        signal: e.signal,
        tradeRef: e.tradeRef,
        ruleId: e.ruleId || null,
        detectedAt: e.detectedAt.toISOString(),
        metadata: e.metadata,
      })),
    );
  });

  // Opt-in only, off by default (see schema.prisma's User.dataSharingConsent
  // doc comment). This endpoint only flips the flag on this user's own
  // record — it does not itself export, aggregate, or transmit anything to
  // any third party. Building that export/report layer is a separate,
  // later step that should re-check this flag at read time, not assume it.
  app.put("/me/data-sharing-consent", { preHandler: authenticate }, async (request, reply) => {
    const body = z.object({ consent: z.boolean() }).parse(request.body);
    const updated = await prisma.user.update({
      where: { id: request.userId },
      data: {
        dataSharingConsent: body.consent,
        dataSharingConsentAt: body.consent ? new Date() : null,
      },
    });
    return reply.send({
      dataSharingConsent: updated.dataSharingConsent,
      dataSharingConsentAt: updated.dataSharingConsentAt?.toISOString() ?? null,
    });
  });
}
