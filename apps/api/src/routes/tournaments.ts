import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";
import type { Tournament as TournamentModel, TournamentEntry as TournamentEntryModel } from "@nova/db";
import { characterFamilies } from "@nova/nova-dex";
import { authenticate } from "../plugins/authenticate.js";
import { computeScore, rankEntries, type ScoreContext, type TournamentMetric } from "../tournaments/scoring.js";

const createTournamentSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    metric: z.enum(["ACCOUNT_XP_GAINED", "CHARACTER_XP_GAINED", "BEHAVIOR_NET_ADHERENCE"]),
    familyId: z.string().optional(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    prizePoolCents: z.number().int().positive(),
  })
  .refine((body) => new Date(body.endAt) > new Date(body.startAt), {
    message: "endAt must be after startAt",
    path: ["endAt"],
  })
  .refine((body) => body.metric !== "CHARACTER_XP_GAINED" || !!body.familyId, {
    message: "familyId is required for CHARACTER_XP_GAINED tournaments",
    path: ["familyId"],
  })
  .refine((body) => !body.familyId || characterFamilies.some((f) => f.id === body.familyId), {
    message: "Unknown familyId",
    path: ["familyId"],
  });

function tournamentStatus(t: TournamentModel, now: Date): "upcoming" | "active" | "completed" {
  if (t.finalizedAt || now >= t.endAt) return "completed";
  if (now < t.startAt) return "upcoming";
  return "active";
}

function serializeTournament(t: TournamentModel) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    metric: t.metric,
    familyId: t.familyId,
    startAt: t.startAt.toISOString(),
    endAt: t.endAt.toISOString(),
    prizePoolCents: t.prizePoolCents,
    finalizedAt: t.finalizedAt?.toISOString() ?? null,
    status: tournamentStatus(t, new Date()),
  };
}

function serializeEntry(e: TournamentEntryModel, liveScore?: number) {
  return {
    id: e.id,
    tournamentId: e.tournamentId,
    userId: e.userId,
    joinedAt: e.joinedAt.toISOString(),
    startXp: e.startXp,
    score: e.finalScore ?? liveScore ?? 0,
    rank: e.rank,
    prizeCents: e.prizeCents,
    finalized: e.finalScore !== null,
  };
}

/**
 * Resolves each entry's current value for the tournament's metric. Account-
 * and character-XP lookups are batched (one query each); the behavior
 * metric is queried per entry because each entry's "since" threshold is its
 * own joinedAt — acceptable at the scale a v1 tournament roster is expected
 * to have, not optimized further.
 */
async function loadScoreContexts(
  tournament: TournamentModel,
  entries: TournamentEntryModel[],
): Promise<Map<string, ScoreContext>> {
  const metric = tournament.metric as TournamentMetric;
  const contexts = new Map<string, ScoreContext>();

  if (metric === "ACCOUNT_XP_GAINED") {
    const users = await prisma.user.findMany({ where: { id: { in: entries.map((e) => e.userId) } } });
    const xpByUser = new Map(users.map((u) => [u.id, u.xp]));
    for (const entry of entries) {
      contexts.set(entry.id, {
        metric,
        startXp: entry.startXp,
        currentXp: xpByUser.get(entry.userId) ?? entry.startXp,
        adherenceCount: 0,
        violationCount: 0,
      });
    }
  } else if (metric === "CHARACTER_XP_GAINED") {
    const characters = await prisma.userCharacter.findMany({
      where: { userId: { in: entries.map((e) => e.userId) }, familyId: tournament.familyId! },
    });
    const xpByUser = new Map(characters.map((c) => [c.userId, c.xp]));
    for (const entry of entries) {
      contexts.set(entry.id, {
        metric,
        startXp: entry.startXp,
        currentXp: xpByUser.get(entry.userId) ?? entry.startXp,
        adherenceCount: 0,
        violationCount: 0,
      });
    }
  } else {
    for (const entry of entries) {
      const [adherenceCount, violationCount] = await Promise.all([
        prisma.behaviorEvent.count({
          where: { userId: entry.userId, signal: "RULE_ADHERENCE", detectedAt: { gte: entry.joinedAt } },
        }),
        prisma.behaviorEvent.count({
          where: { userId: entry.userId, signal: "RULE_VIOLATION", detectedAt: { gte: entry.joinedAt } },
        }),
      ]);
      contexts.set(entry.id, { metric, startXp: 0, currentXp: 0, adherenceCount, violationCount });
    }
  }

  return contexts;
}

export async function tournamentRoutes(app: FastifyInstance): Promise<void> {
  // No admin/back-office role exists yet (same gap as PayoutRequest
  // approval — see schema.prisma's doc comments) — any authenticated user
  // can create a tournament in this v1. A real access-control model is a
  // follow-up, not something to fake here.
  app.post("/tournaments", { preHandler: authenticate }, async (request, reply) => {
    const body = createTournamentSchema.parse(request.body);
    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        description: body.description,
        metric: body.metric,
        familyId: body.metric === "CHARACTER_XP_GAINED" ? body.familyId : null,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        prizePoolCents: body.prizePoolCents,
      },
    });
    return reply.code(201).send(serializeTournament(tournament));
  });

  app.get("/tournaments", async (_request, reply) => {
    const tournaments = await prisma.tournament.findMany({ orderBy: { startAt: "desc" } });
    return reply.send(tournaments.map(serializeTournament));
  });

  app.get("/tournaments/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const tournament = await prisma.tournament.findUnique({ where: { id }, include: { entries: true } });
    if (!tournament) {
      return reply.code(404).send({ error: "Tournament not found" });
    }

    let leaderboard;
    if (tournament.finalizedAt) {
      leaderboard = tournament.entries
        .slice()
        .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
        .map((e) => serializeEntry(e));
    } else {
      const contexts = await loadScoreContexts(tournament, tournament.entries);
      const ranked = rankEntries(
        tournament.entries.map((e) => ({ userId: e.userId, score: computeScore(contexts.get(e.id)!), joinedAt: e.joinedAt })),
        tournament.prizePoolCents,
      );
      const scoreByUserId = new Map(ranked.map((r) => [r.userId, r.score]));
      leaderboard = tournament.entries
        .slice()
        .sort((a, b) => scoreByUserId.get(b.userId)! - scoreByUserId.get(a.userId)!)
        .map((e) => serializeEntry(e, scoreByUserId.get(e.userId)));
    }

    return reply.send({ tournament: serializeTournament(tournament), leaderboard });
  });

  app.post("/tournaments/:id/join", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return reply.code(404).send({ error: "Tournament not found" });
    }
    const now = new Date();
    if (now >= tournament.endAt || tournament.finalizedAt) {
      return reply.code(409).send({ error: "Tournament has already ended" });
    }

    const existing = await prisma.tournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId: id, userId: request.userId! } },
    });
    if (existing) {
      return reply.code(409).send({ error: "Already joined this tournament" });
    }

    let startXp = 0;
    if (tournament.metric === "ACCOUNT_XP_GAINED") {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId! } });
      startXp = user.xp;
    } else if (tournament.metric === "CHARACTER_XP_GAINED") {
      const character = await prisma.userCharacter.findUnique({
        where: { userId_familyId: { userId: request.userId!, familyId: tournament.familyId! } },
      });
      startXp = character?.xp ?? 0;
    }

    const entry = await prisma.tournamentEntry.create({
      data: { tournamentId: id, userId: request.userId!, startXp },
    });
    return reply.code(201).send(serializeEntry(entry));
  });

  // Recomputes every entry's live score and, once endAt has passed, finalizes
  // the tournament: assigns rank/prizeCents/finalScore per rankEntries and
  // sets finalizedAt. Idempotent — a no-op on an already-finalized
  // tournament, same pattern as sync-xp and the prop-firm attempt sync.
  app.post("/tournaments/:id/sync", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tournament = await prisma.tournament.findUnique({ where: { id }, include: { entries: true } });
    if (!tournament) {
      return reply.code(404).send({ error: "Tournament not found" });
    }
    if (tournament.finalizedAt) {
      return reply.send({ tournament: serializeTournament(tournament), finalized: true, leaderboard: null });
    }

    const contexts = await loadScoreContexts(tournament, tournament.entries);
    const ranked = rankEntries(
      tournament.entries.map((e) => ({ userId: e.userId, score: computeScore(contexts.get(e.id)!), joinedAt: e.joinedAt })),
      tournament.prizePoolCents,
    );

    const now = new Date();
    if (now < tournament.endAt) {
      const scoreByUserId = new Map(ranked.map((r) => [r.userId, r.score]));
      return reply.send({
        tournament: serializeTournament(tournament),
        finalized: false,
        leaderboard: tournament.entries
          .slice()
          .sort((a, b) => scoreByUserId.get(b.userId)! - scoreByUserId.get(a.userId)!)
          .map((e) => serializeEntry(e, scoreByUserId.get(e.userId))),
      });
    }

    await prisma.$transaction([
      ...ranked.map((r) =>
        prisma.tournamentEntry.update({
          where: { tournamentId_userId: { tournamentId: id, userId: r.userId } },
          data: { finalScore: r.score, rank: r.rank, prizeCents: r.prizeCents },
        }),
      ),
      prisma.tournament.update({ where: { id }, data: { finalizedAt: now } }),
    ]);

    const finalized = await prisma.tournament.findUniqueOrThrow({ where: { id }, include: { entries: true } });
    return reply.send({
      tournament: serializeTournament(finalized),
      finalized: true,
      leaderboard: finalized.entries.slice().sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)).map((e) => serializeEntry(e)),
    });
  });

  app.get("/me/tournaments", { preHandler: authenticate }, async (request, reply) => {
    const entries = await prisma.tournamentEntry.findMany({
      where: { userId: request.userId },
      include: { tournament: true },
      orderBy: { joinedAt: "desc" },
    });

    const results = [];
    for (const entry of entries) {
      if (entry.finalScore !== null) {
        results.push({ tournament: serializeTournament(entry.tournament), entry: serializeEntry(entry) });
        continue;
      }
      const contexts = await loadScoreContexts(entry.tournament, [entry]);
      results.push({
        tournament: serializeTournament(entry.tournament),
        entry: serializeEntry(entry, computeScore(contexts.get(entry.id)!)),
      });
    }
    return reply.send(results);
  });
}
