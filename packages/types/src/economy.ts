export type MarketplaceItemType =
  | "ai_agent"
  | "indicator"
  | "template"
  | "replay_library"
  | "journal"
  | "psychology_program"
  | "voice_pack"
  | "dashboard_theme"
  | "character_skin"
  | "course"
  | "risk_model"
  | "backtesting_system"
  | "behavior_pack";

export interface MarketplaceListing {
  id: string;
  type: MarketplaceItemType;
  creatorId: string;
  title: string;
  priceCents: number;
  isRecurring: boolean;
  novaVerified: boolean;
}

export interface VerifiedStrategy {
  id: string;
  creatorId: string;
  name: string;
  historicalExpectancy: number;
  drawdownPct: number;
  winRatePct: number;
  novaVerified: boolean;
}
