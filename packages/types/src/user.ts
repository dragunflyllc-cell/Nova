export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface User {
  id: string;
  email: string;
  displayName: string;
  tier: SubscriptionTier;
  xp: number;
  level: number;
  createdAt: string;
}

export interface CreatorProfile {
  userId: string;
  bio: string;
  verified: boolean;
  reputationScore: number;
  revenueShareBps: number;
}
