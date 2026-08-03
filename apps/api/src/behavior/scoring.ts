/**
 * Turns closed trades into XP, using only signals that are honestly
 * derivable from MatchedTrade data (timestamps and realized P&L) — no
 * attempt to detect things we can't actually see, like whether a trade
 * followed a written plan. That's the same boundary matching.ts draws
 * around points vs dollars: score what the data supports, document the rest
 * as not-yet-possible rather than fake it.
 *
 * Two behaviors are detectable purely from when trades open relative to a
 * prior loss closing:
 *   - Revenge trading: re-entering within REVENGE_WINDOW_MS of a loss.
 *     Nearly every "reckless"/"impulsive" family in the NovaDex calls this
 *     out by name (FOMO Monkey's "Revenge Trade", Revenge Rhino's "Charge").
 *   - A deliberate cooldown: waiting at least COOLDOWN_WINDOW_MS after a
 *     loss before re-entering. Mirrors Ape Apprentice's "Cooldown" ability.
 *
 * Trades that neither revenge-re-enter nor visibly cool down (or that
 * simply weren't preceded by a loss) just earn the base/win XP with no
 * signal attached — most trades will land here, which is expected.
 */

import type { MatchedTrade } from "../trades/matching.js";

export const BASE_TRADE_XP = 8;
export const WIN_BONUS_XP = 6;
export const REVENGE_WINDOW_MS = 5 * 60_000;
export const REVENGE_PENALTY_MULTIPLIER = 0.5;
export const COOLDOWN_WINDOW_MS = 30 * 60_000;
export const COOLDOWN_BONUS_XP = 4;

export type BehaviorSignal = "revengeTrade" | "cooldownAfterLoss";

export interface ScoredTrade {
  trade: MatchedTrade;
  xp: number;
  signals: BehaviorSignal[];
}

/**
 * Scores a set of trades for one trader across all symbols combined —
 * revenge/cooldown detection is account-wide (a loss on ES followed
 * immediately by a new position on NQ is still a revenge trade), so
 * callers must merge trades across symbols before calling this rather
 * than scoring each symbol's chain in isolation.
 */
export function scoreTrades(trades: MatchedTrade[]): ScoredTrade[] {
  const sorted = [...trades].sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());
  const results: ScoredTrade[] = [];
  let previous: MatchedTrade | null = null;

  for (const trade of sorted) {
    const signals: BehaviorSignal[] = [];
    let xp = BASE_TRADE_XP;
    if (trade.realizedPointsPnl > 0) {
      xp += WIN_BONUS_XP;
    }

    if (previous && previous.realizedPointsPnl < 0) {
      const gapMs = trade.openedAt.getTime() - previous.closedAt.getTime();
      if (gapMs >= 0 && gapMs <= REVENGE_WINDOW_MS) {
        signals.push("revengeTrade");
        xp = Math.round(xp * REVENGE_PENALTY_MULTIPLIER);
      } else if (gapMs >= COOLDOWN_WINDOW_MS) {
        signals.push("cooldownAfterLoss");
        xp += COOLDOWN_BONUS_XP;
      }
    }

    results.push({ trade, xp, signals });
    previous = trade;
  }

  return results;
}

export function totalXpFromTrades(trades: MatchedTrade[]): number {
  return scoreTrades(trades).reduce((sum, r) => sum + r.xp, 0);
}
