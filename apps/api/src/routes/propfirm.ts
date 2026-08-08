import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import type { EvaluationAttempt as EvaluationAttemptModel, PayoutRequest as PayoutRequestModel } from "@nova/db";
import { authenticate } from "../plugins/authenticate.js";
import { calculatePayout, evaluateAttempt } from "../propfirm/evaluation.js";
import { EVALUATION_TIERS, getTier } from "../propfirm/tiers.js";
import { getMatchedTradesForUser } from "../trades/service.js";

const LIVE_STATUSES = new Set(["ACTIVE", "FUNDED_ACTIVE"]);

const startAttemptSchema = z.object({
  tierId: z.string(),
  pointValueUsd: z.number().positive(),
});

function serializeAttempt(a: EvaluationAttemptModel) {
  return {
    id: a.id,
    tierId: a.tierId,
    pointValueUsd: a.pointValueUsd,
    status: a.status,
    startedAt: a.startedAt.toISOString(),
    evaluationPassedAt: a.evaluationPassedAt?.toISOString() ?? null,
    fundedAt: a.fundedAt?.toISOString() ?? null,
    endedAt: a.endedAt?.toISOString() ?? null,
    paidProfitCents: a.paidProfitCents,
  };
}

function serializePayout(p: PayoutRequestModel) {
  return {
    id: p.id,
    evaluationAttemptId: p.evaluationAttemptId,
    amountCents: p.amountCents,
    status: p.status,
    requestedAt: p.requestedAt.toISOString(),
    resolvedAt: p.resolvedAt?.toISOString() ?? null,
  };
}

async function loadOwnedAttempt(userId: string, id: string): Promise<EvaluationAttemptModel | null> {
  const attempt = await prisma.evaluationAttempt.findUnique({ where: { id } });
  if (!attempt || attempt.userId !== userId) return null;
  return attempt;
}

export async function propFirmRoutes(app: FastifyInstance): Promise<void> {
  app.get("/propfirm/tiers", async (_request, reply) => {
    return reply.send(EVALUATION_TIERS);
  });

  // No real capital or real broker order is ever behind virtualBalanceCents —
  // see propfirm/tiers.ts's header. One live (non-terminal) attempt at a
  // time per user: ACTIVE, PASSED (evaluation passed, funded not yet
  // claimed), and FUNDED_ACTIVE all block starting a second attempt.
  app.post("/me/propfirm/attempts", { preHandler: authenticate }, async (request, reply) => {
    const body = startAttemptSchema.parse(request.body);
    const tier = getTier(body.tierId);
    if (!tier) {
      return reply.code(400).send({ error: "Unknown tier" });
    }

    const existing = await prisma.evaluationAttempt.findFirst({
      where: { userId: request.userId, status: { in: ["ACTIVE", "PASSED", "FUNDED_ACTIVE"] } },
    });
    if (existing) {
      return reply.code(409).send({ error: "You already have an active evaluation or funded attempt", attemptId: existing.id });
    }

    const attempt = await prisma.evaluationAttempt.create({
      data: { userId: request.userId!, tierId: tier.id, pointValueUsd: body.pointValueUsd },
    });
    // No payment processor is wired up yet (see docs/ARCHITECTURE.md) — this
    // records the attempt and its fee for the firm-level ledger, but does
    // not actually collect tier.feeCents from anyone.
    return reply.code(201).send({ attempt: serializeAttempt(attempt), tier, feeCollected: false });
  });

  app.get("/me/propfirm/attempts", { preHandler: authenticate }, async (request, reply) => {
    const attempts = await prisma.evaluationAttempt.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: "desc" },
    });
    return reply.send(attempts.map(serializeAttempt));
  });

  // Recomputes the current live stage against real matched trades and
  // persists any status transition. Idempotent and safe to call repeatedly:
  // a no-op once the attempt is in a terminal or awaiting-claim state
  // (FAILED, FUNDED_BREACHED, PASSED), same pattern as sync-xp and
  // /me/rules/check.
  app.post("/me/propfirm/attempts/:id/sync", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const attempt = await loadOwnedAttempt(request.userId!, id);
    if (!attempt) {
      return reply.code(404).send({ error: "Attempt not found" });
    }
    if (!LIVE_STATUSES.has(attempt.status)) {
      return reply.send({ attempt: serializeAttempt(attempt), evaluation: null });
    }

    const tier = getTier(attempt.tierId);
    if (!tier) {
      return reply.code(500).send({ error: "Attempt references an unknown tier" });
    }

    const allTrades = await getMatchedTradesForUser(request.userId!);
    const windowTrades = allTrades.filter((t) => t.openedAt >= attempt.startedAt);
    const result = evaluateAttempt(tier, attempt.pointValueUsd, attempt.status as "ACTIVE" | "FUNDED_ACTIVE", windowTrades);

    let updated = attempt;
    if (result.nextStatus !== attempt.status) {
      const now = new Date();
      updated = await prisma.evaluationAttempt.update({
        where: { id: attempt.id },
        data: {
          status: result.nextStatus,
          evaluationPassedAt: result.nextStatus === "PASSED" ? now : attempt.evaluationPassedAt,
          endedAt: result.nextStatus === "FAILED" || result.nextStatus === "FUNDED_BREACHED" ? now : attempt.endedAt,
        },
      });
    }

    return reply.send({
      attempt: serializeAttempt(updated),
      evaluation: {
        equityCents: result.equityCents,
        profitCents: result.profitCents,
        tradingDaysCount: result.tradingDaysCount,
        dailyLossBreached: result.dailyLossBreached,
        worstDailyLossCents: result.worstDailyLossCents,
        overallDrawdownBreached: result.overallDrawdownBreached,
        worstDrawdownCents: result.worstDrawdownCents,
        profitTargetReached: result.profitTargetReached,
        minTradingDaysMet: result.minTradingDaysMet,
        detail: result.detail,
      },
    });
  });

  app.post("/me/propfirm/attempts/:id/claim-funded", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const attempt = await loadOwnedAttempt(request.userId!, id);
    if (!attempt) {
      return reply.code(404).send({ error: "Attempt not found" });
    }
    if (attempt.status !== "PASSED") {
      return reply.code(409).send({ error: "Attempt has not passed evaluation" });
    }

    // Funded stage gets its own fresh window — startedAt resets so
    // daily-loss/drawdown/min-days are measured from the funded start, not
    // dragged forward from the evaluation stage.
    const now = new Date();
    const updated = await prisma.evaluationAttempt.update({
      where: { id: attempt.id },
      data: { status: "FUNDED_ACTIVE", fundedAt: now, startedAt: now },
    });
    return reply.send(serializeAttempt(updated));
  });

  // Cashes out the trader's split of profit earned since the last payout.
  // Recomputes the live stage first (same as /sync) so a payout can't be
  // requested against a breach that just happened; reserves the payable
  // profit against paidProfitCents immediately on request, not on later
  // approval, so a second request right after can't double-claim the same
  // gain. There is no admin/back-office role yet to move PENDING -> PAID —
  // see schema.prisma's PayoutRequest doc comment and docs/ARCHITECTURE.md.
  app.post("/me/propfirm/attempts/:id/payout-request", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const attempt = await loadOwnedAttempt(request.userId!, id);
    if (!attempt) {
      return reply.code(404).send({ error: "Attempt not found" });
    }
    if (attempt.status !== "FUNDED_ACTIVE") {
      return reply.code(409).send({ error: "Attempt is not an active funded account" });
    }

    const tier = getTier(attempt.tierId);
    if (!tier) {
      return reply.code(500).send({ error: "Attempt references an unknown tier" });
    }

    const allTrades = await getMatchedTradesForUser(request.userId!);
    const windowTrades = allTrades.filter((t) => t.openedAt >= attempt.startedAt);
    const result = evaluateAttempt(tier, attempt.pointValueUsd, "FUNDED_ACTIVE", windowTrades);

    if (result.nextStatus === "FUNDED_BREACHED") {
      const now = new Date();
      await prisma.evaluationAttempt.update({
        where: { id: attempt.id },
        data: { status: "FUNDED_BREACHED", endedAt: now },
      });
      return reply.code(409).send({ error: "Funded account breached its risk limits — no payout available" });
    }

    const { payableProfitCents, payoutAmountCents } = calculatePayout(
      tier,
      result.equityCents,
      tier.virtualBalanceCents,
      attempt.paidProfitCents,
    );
    if (payoutAmountCents <= 0) {
      return reply.code(400).send({ error: "No payable profit since the last payout" });
    }

    const [payout] = await prisma.$transaction([
      prisma.payoutRequest.create({
        data: { userId: request.userId!, evaluationAttemptId: attempt.id, amountCents: payoutAmountCents },
      }),
      prisma.evaluationAttempt.update({
        where: { id: attempt.id },
        data: { paidProfitCents: attempt.paidProfitCents + payableProfitCents },
      }),
    ]);

    return reply.code(201).send(serializePayout(payout));
  });

  app.get("/me/propfirm/payouts", { preHandler: authenticate }, async (request, reply) => {
    const payouts = await prisma.payoutRequest.findMany({
      where: { userId: request.userId },
      orderBy: { requestedAt: "desc" },
    });
    return reply.send(payouts.map(serializePayout));
  });

  // Firm-level economics: the empirical proof of the "no capital" model —
  // fee revenue recorded from evaluation attempts versus payouts owed to
  // funded traders. feeRevenueCents is what tier.feeCents WOULD total if
  // every attempt's fee were actually collected — no payment processor is
  // wired up yet (see POST /me/propfirm/attempts above), so this is the
  // model's intended economics, not a real collected-cash figure.
  app.get("/propfirm/ledger", { preHandler: authenticate }, async (_request, reply) => {
    const attemptsByTier = await prisma.evaluationAttempt.groupBy({
      by: ["tierId"],
      _count: { tierId: true },
    });
    const feeRevenueCents = attemptsByTier.reduce((sum, row) => {
      const tier = getTier(row.tierId);
      return sum + (tier ? tier.feeCents * row._count.tierId : 0);
    }, 0);

    const [requested, paid] = await Promise.all([
      prisma.payoutRequest.aggregate({ _sum: { amountCents: true } }),
      prisma.payoutRequest.aggregate({ _sum: { amountCents: true }, where: { status: "PAID" } }),
    ]);

    return reply.send({
      attempts: attemptsByTier.map((row) => ({ tierId: row.tierId, count: row._count.tierId })),
      feeRevenueCents,
      payoutsRequestedCents: requested._sum.amountCents ?? 0,
      payoutsPaidCents: paid._sum.amountCents ?? 0,
      netCents: feeRevenueCents - (paid._sum.amountCents ?? 0),
    });
  });
}
