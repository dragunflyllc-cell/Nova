import { prisma } from "@nova/db";
import { matchFillsToTrades, type MatchableFill, type MatchedTrade } from "./matching.js";

export interface UserMatchedTrade extends MatchedTrade {
  contractSymbol: string;
}

/**
 * Loads a user's stored fills across every connected broker, groups them by
 * contract symbol (matching.ts only handles one symbol at a time), and
 * returns every closed trade unsorted — callers that need chronological
 * order (e.g. behavior scoring) or a specific display order (e.g. newest
 * first) apply that themselves.
 */
export async function getMatchedTradesForUser(userId: string): Promise<UserMatchedTrade[]> {
  const connections = await prisma.brokerConnection.findMany({ where: { userId } });
  const fills = await prisma.brokerFill.findMany({
    where: { connectionId: { in: connections.map((c) => c.id) } },
    orderBy: { filledAt: "asc" },
  });

  const bySymbol = new Map<string, MatchableFill[]>();
  for (const f of fills) {
    if (f.side !== "buy" && f.side !== "sell") {
      continue; // defensive: only fills we wrote ourselves should exist, and they're always "buy"/"sell"
    }
    const list = bySymbol.get(f.contractSymbol) ?? [];
    list.push({ externalFillId: f.externalFillId, side: f.side, quantity: f.quantity, price: f.price, filledAt: f.filledAt });
    bySymbol.set(f.contractSymbol, list);
  }

  return [...bySymbol.entries()].flatMap(([contractSymbol, symbolFills]) =>
    matchFillsToTrades(symbolFills).map((t) => ({ contractSymbol, ...t })),
  );
}
