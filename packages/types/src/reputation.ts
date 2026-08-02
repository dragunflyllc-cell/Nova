export type LeagueTier =
  | "rookie"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master"
  | "grandmaster"
  | "legend";

export interface ReputationScore {
  userId: string;
  score: number;
  disciplineScore: number;
  consistencyScore: number;
  riskManagementScore: number;
  communityContributionScore: number;
}

export interface LeagueStanding {
  userId: string;
  tier: LeagueTier;
  rankWithinTier: number;
  seasonId: string;
}
