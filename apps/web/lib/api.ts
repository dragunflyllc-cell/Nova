import type { CharacterStage, SubscriptionTier } from "@nova/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  tier: SubscriptionTier;
  xp: number;
  level: number;
  createdAt: string;
}

export interface OwnedCharacter {
  id: string;
  familyId: string;
  familyName: string;
  xp: number;
  level: number;
  stage: CharacterStage;
  capturedAt: string;
}

async function parseErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.issues?.[0]?.message ?? body?.error ?? `Request failed (${res.status})`;
}

export async function registerUser(email: string, password: string, displayName: string): Promise<{ user: PublicUser } & AuthTokens> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function loginUser(email: string, password: string): Promise<{ user: PublicUser } & AuthTokens> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getMe(accessToken: string): Promise<PublicUser> {
  const res = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function joinWaitlist(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.issues?.[0]?.message ?? body?.error ?? "Something went wrong. Please try again.");
  }
}

export async function getWaitlistCount(): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/waitlist/count`, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = (await res.json()) as { count: number };
    return data.count;
  } catch {
    return 0;
  }
}
