/**
 * Turns a stream of raw fills (one contract at a time) into closed,
 * round-trip trades with realized P&L — using FIFO matching, the
 * convention most futures broker statements use.
 *
 * Deliberately scoped to points, not dollars: converting a point gain into
 * a dollar amount requires each contract's tick value/multiplier (e.g. ES
 * is $50/point, MES is $5/point), and there's no contract reference table
 * yet. `realizedPointsPnl` is signed (positive = profit) and the caller is
 * responsible for multiplying by the right contract's point value once
 * that data exists.
 *
 * A "trade" here means one flat-to-flat cycle: opened from a flat position,
 * possibly scaled in/out across several fills, and closed back to flat (or
 * flipped directly into the opposite direction, which closes the current
 * trade and opens a new one from the leftover quantity of the same fill).
 */

export type FillSide = "buy" | "sell";

export interface MatchableFill {
  externalFillId: string;
  side: FillSide;
  quantity: number;
  price: number;
  filledAt: Date;
}

export interface MatchedTrade {
  direction: "long" | "short";
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  realizedPointsPnl: number;
  openedAt: Date;
  closedAt: Date;
  openFillIds: string[];
  closeFillIds: string[];
}

interface OpenLot {
  remainingQty: number;
  price: number;
  externalFillId: string;
}

interface TradeAccumulator {
  direction: "long" | "short";
  openedAt: Date;
  openFillIds: Set<string>;
  closeFillIds: Set<string>;
  entryWeightedSum: number;
  exitWeightedSum: number;
  matchedQty: number;
  realizedPointsPnl: number;
}

function finalizeTrade(acc: TradeAccumulator, closedAt: Date): MatchedTrade {
  return {
    direction: acc.direction,
    quantity: acc.matchedQty,
    entryPrice: acc.entryWeightedSum / acc.matchedQty,
    exitPrice: acc.exitWeightedSum / acc.matchedQty,
    realizedPointsPnl: acc.realizedPointsPnl,
    openedAt: acc.openedAt,
    closedAt,
    openFillIds: [...acc.openFillIds],
    closeFillIds: [...acc.closeFillIds],
  };
}

/**
 * Matches fills for a SINGLE contract symbol. Fills for different symbols
 * must be grouped and matched separately by the caller — mixing symbols
 * here would produce meaningless results.
 */
export function matchFillsToTrades(fills: MatchableFill[]): MatchedTrade[] {
  const sorted = [...fills].sort((a, b) => a.filledAt.getTime() - b.filledAt.getTime());
  const trades: MatchedTrade[] = [];

  let lots: OpenLot[] = [];
  let positionSide: FillSide | null = null; // side of the fill(s) that OPENED the current position
  let acc: TradeAccumulator | null = null;

  for (const fill of sorted) {
    if (lots.length === 0) {
      // Flat -> this fill opens a new position.
      positionSide = fill.side;
      lots = [{ remainingQty: fill.quantity, price: fill.price, externalFillId: fill.externalFillId }];
      acc = {
        direction: fill.side === "buy" ? "long" : "short",
        openedAt: fill.filledAt,
        openFillIds: new Set([fill.externalFillId]),
        closeFillIds: new Set(),
        entryWeightedSum: 0,
        exitWeightedSum: 0,
        matchedQty: 0,
        realizedPointsPnl: 0,
      };
      continue;
    }

    if (fill.side === positionSide) {
      // Same direction as the current position: scaling in, extends this trade.
      lots.push({ remainingQty: fill.quantity, price: fill.price, externalFillId: fill.externalFillId });
      acc!.openFillIds.add(fill.externalFillId);
      continue;
    }

    // Opposite direction: closes (fully or partially) the open position.
    acc!.closeFillIds.add(fill.externalFillId);
    let remainingToMatch = fill.quantity;
    const sign = acc!.direction === "long" ? 1 : -1;

    while (remainingToMatch > 0 && lots.length > 0) {
      const lot = lots[0]!;
      const matchedQty = Math.min(remainingToMatch, lot.remainingQty);

      acc!.entryWeightedSum += lot.price * matchedQty;
      acc!.exitWeightedSum += fill.price * matchedQty;
      acc!.matchedQty += matchedQty;
      acc!.realizedPointsPnl += sign * (fill.price - lot.price) * matchedQty;

      lot.remainingQty -= matchedQty;
      remainingToMatch -= matchedQty;
      if (lot.remainingQty === 0) {
        lots.shift();
      }
    }

    if (lots.length === 0) {
      // Fully flat: this trade is done.
      trades.push(finalizeTrade(acc!, fill.filledAt));
      acc = null;
      positionSide = null;

      if (remainingToMatch > 0) {
        // The closing fill was larger than the open position — it flips
        // straight into a new position in the opposite direction with the leftover.
        positionSide = fill.side;
        lots = [{ remainingQty: remainingToMatch, price: fill.price, externalFillId: fill.externalFillId }];
        acc = {
          direction: fill.side === "buy" ? "long" : "short",
          openedAt: fill.filledAt,
          openFillIds: new Set([fill.externalFillId]),
          closeFillIds: new Set(),
          entryWeightedSum: 0,
          exitWeightedSum: 0,
          matchedQty: 0,
          realizedPointsPnl: 0,
        };
      }
    }
  }

  return trades;
}

/** Groups a mixed batch of fills by contract symbol and matches each group independently. */
export function matchFillsBySymbol(
  fillsBySymbol: Map<string, MatchableFill[]>,
): Map<string, MatchedTrade[]> {
  const result = new Map<string, MatchedTrade[]>();
  for (const [symbol, fills] of fillsBySymbol) {
    result.set(symbol, matchFillsToTrades(fills));
  }
  return result;
}
