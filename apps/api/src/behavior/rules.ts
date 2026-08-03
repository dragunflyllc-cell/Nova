/**
 * Checks user-authored TradingRule rows against real matched trades.
 *
 * Every rule type here is checkable purely from MatchedTrade data
 * (timestamps, quantity, price, realized P&L) — same honesty boundary as
 * scoring.ts. A trader can't yet tell Nova "always wait for a confirmed
 * candle close" and have it verified; that class of freeform rule needs an
 * actual AI reviewing context this data doesn't contain, and is a separate,
 * not-yet-built feature (see docs/ARCHITECTURE.md).
 */

import type { MatchedTrade } from "../trades/matching.js";
import { tradeRefFor } from "../trades/service.js";

export type TradingRuleType =
  | "MAX_TRADES_PER_DAY"
  | "MIN_COOLDOWN_AFTER_LOSS_MINUTES"
  | "MAX_POSITION_SIZE"
  | "MAX_DAILY_LOSS_POINTS"
  | "TRADING_HOURS_WINDOW_UTC";

export interface TradingRuleRecord {
  id: string;
  type: TradingRuleType;
  params: Record<string, number>;
}

export interface RuleCheckResult {
  ruleId: string;
  type: TradingRuleType;
  /** Stable-ish per-trade identifier: its closing fill ids joined. */
  tradeRef: string;
  trade: MatchedTrade;
  passed: boolean;
  detail: string;
}

function dayKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * Checks one rule against every trade it applies to, returning one result
 * per (rule, trade) pair that the rule actually evaluates. Trades must be
 * passed in already merged across symbols for account-wide rules
 * (MAX_TRADES_PER_DAY, MAX_DAILY_LOSS_POINTS, MIN_COOLDOWN_AFTER_LOSS_MINUTES)
 * to be meaningful — same requirement as scoreTrades in scoring.ts.
 */
export function checkRule(rule: TradingRuleRecord, trades: MatchedTrade[]): RuleCheckResult[] {
  const sorted = [...trades].sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());

  switch (rule.type) {
    case "MAX_TRADES_PER_DAY": {
      const max = rule.params.max ?? Infinity;
      const countByDay = new Map<string, number>();
      const results: RuleCheckResult[] = [];
      for (const trade of sorted) {
        const day = dayKeyUtc(trade.openedAt);
        const countSoFar = (countByDay.get(day) ?? 0) + 1;
        countByDay.set(day, countSoFar);
        results.push({
          ruleId: rule.id,
          type: rule.type,
          tradeRef: tradeRefFor(trade),
          trade,
          passed: countSoFar <= max,
          detail: `Trade #${countSoFar} on ${day} (limit ${max}/day)`,
        });
      }
      return results;
    }

    case "MIN_COOLDOWN_AFTER_LOSS_MINUTES": {
      const minMinutes = rule.params.minutes ?? 0;
      const results: RuleCheckResult[] = [];
      let previous: MatchedTrade | null = null;
      for (const trade of sorted) {
        if (previous && previous.realizedPointsPnl < 0) {
          const gapMinutes = (trade.openedAt.getTime() - previous.closedAt.getTime()) / 60_000;
          if (gapMinutes >= 0) {
            results.push({
              ruleId: rule.id,
              type: rule.type,
              tradeRef: tradeRefFor(trade),
              trade,
              passed: gapMinutes >= minMinutes,
              detail: `Re-entered ${gapMinutes.toFixed(1)} min after a loss (rule requires ${minMinutes} min)`,
            });
          }
        }
        previous = trade;
      }
      return results;
    }

    case "MAX_POSITION_SIZE": {
      const maxQuantity = rule.params.maxQuantity ?? Infinity;
      return sorted.map((trade) => ({
        ruleId: rule.id,
        type: rule.type,
        tradeRef: tradeRefFor(trade),
        trade,
        passed: trade.quantity <= maxQuantity,
        detail: `Size ${trade.quantity} (limit ${maxQuantity})`,
      }));
    }

    case "MAX_DAILY_LOSS_POINTS": {
      const maxLossPoints = rule.params.maxLossPoints ?? Infinity;
      const pnlByDay = new Map<string, number>();
      const results: RuleCheckResult[] = [];
      for (const trade of sorted) {
        const day = dayKeyUtc(trade.closedAt);
        const runningPnl = (pnlByDay.get(day) ?? 0) + trade.realizedPointsPnl;
        pnlByDay.set(day, runningPnl);
        const runningLoss = Math.max(0, -runningPnl);
        results.push({
          ruleId: rule.id,
          type: rule.type,
          tradeRef: tradeRefFor(trade),
          trade,
          passed: runningLoss <= maxLossPoints,
          detail: `Running ${day} loss ${runningLoss.toFixed(1)}pts (limit ${maxLossPoints}pts)`,
        });
      }
      return results;
    }

    case "TRADING_HOURS_WINDOW_UTC": {
      const startHour = rule.params.startHourUtc ?? 0;
      const endHour = rule.params.endHourUtc ?? 24;
      return sorted.map((trade) => {
        const hour = trade.openedAt.getUTCHours();
        const withinWindow = startHour <= endHour ? hour >= startHour && hour < endHour : hour >= startHour || hour < endHour;
        return {
          ruleId: rule.id,
          type: rule.type,
          tradeRef: tradeRefFor(trade),
          trade,
          passed: withinWindow,
          detail: `Opened at ${hour}:00 UTC (window ${startHour}:00–${endHour}:00 UTC)`,
        };
      });
    }
  }
}

export function checkRules(rules: TradingRuleRecord[], trades: MatchedTrade[]): RuleCheckResult[] {
  return rules.flatMap((rule) => checkRule(rule, trades));
}
