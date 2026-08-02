import type { User as PrismaUser } from "@nova/db";
import type { SubscriptionTier, User } from "@nova/types";

export function toPublicUser(user: PrismaUser): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    tier: user.tier.toLowerCase() as SubscriptionTier,
    xp: user.xp,
    level: user.level,
    createdAt: user.createdAt.toISOString(),
  };
}
