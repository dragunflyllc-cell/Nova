/**
 * Pure scoring/ranking for tournaments — same style and honesty boundary as
 * propfirm/evaluation.ts: everything here is computed from data Nova
 * already has (XP counters, BehaviorEvent counts), nothing fabricated.
 *
 * CLAUDE.md's Nova Leagues section is explicit that "winning money alone
 * should never determine rank" — none of the three metrics is raw P&L.
 */

export type TournamentMetric = "ACCOUNT_XP_GAINED" | "CHARACTER_XP_GAINED" | "BEHAVIOR_NET_ADHERENCE";

export interface ScoreContext {
  metric: TournamentMetric;
  /** XP snapshot at join time — ACCOUNT_XP_GAINED/CHARACTER_XP_GAINED only. */
  startXp: number;
  /** Current value of the same XP counter — ACCOUNT_XP_GAINED/CHARACTER_XP_GAINED only. */
  currentXp: number;
  /** RULE_ADHERENCE BehaviorEvent count since joining — BEHAVIOR_NET_ADHERENCE only. */
  adherenceCount: number;
  /** RULE_VIOLATION BehaviorEvent count since joining — BEHAVIOR_NET_ADHERENCE only. */
  violationCount: number;
}

/**
 * Score is always "progress made during the tournament," never a lifetime
 * total — an XP metric measures the gain since `startXp`, floored at 0 so
 * XP lost to some future decay mechanic can't produce a negative score.
 */
export function computeScore(ctx: ScoreContext): number {
  switch (ctx.metric) {
    case "ACCOUNT_XP_GAINED":
    case "CHARACTER_XP_GAINED":
      return Math.max(0, ctx.currentXp - ctx.startXp);
    case "BEHAVIOR_NET_ADHERENCE":
      return ctx.adherenceCount - ctx.violationCount;
  }
}

/** Share of the prize pool paid to 1st/2nd/3rd place; everyone else gets 0. */
export const PRIZE_DISTRIBUTION = [0.5, 0.3, 0.2];

export interface RankableEntry {
  userId: string;
  score: number;
  joinedAt: Date;
}

export interface RankedEntry extends RankableEntry {
  rank: number;
  prizeCents: number;
}

/**
 * Ranks by score descending; ties break by earlier `joinedAt` (the earlier
 * joiner ranks higher). Every entry gets a distinct rank on purpose — this
 * sidesteps splitting a place's prize share across tied entries, which
 * would need its own design decision. Only the top `PRIZE_DISTRIBUTION.length`
 * ranks receive a nonzero prize.
 */
export function rankEntries(entries: RankableEntry[], prizePoolCents: number): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score || a.joinedAt.getTime() - b.joinedAt.getTime());
  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    prizeCents: index < PRIZE_DISTRIBUTION.length ? Math.round(prizePoolCents * PRIZE_DISTRIBUTION[index]!) : 0,
  }));
}
