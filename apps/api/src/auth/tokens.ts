import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../env.js";

const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const accessTokenSecret = new TextEncoder().encode(env.ACCESS_TOKEN_SECRET);

export function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(accessTokenSecret);
}

export async function verifyAccessToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, accessTokenSecret);
  if (typeof payload.sub !== "string") {
    throw new Error("Access token missing subject");
  }
  return payload.sub;
}

/** Opaque, high-entropy refresh token — stored server-side only as a hash, never as a JWT. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const STATE_TOKEN_TTL = "10m";

/**
 * Signed, short-lived CSRF state for OAuth redirect flows (e.g. connecting a
 * broker). The callback endpoint is hit by the broker's redirect, not by our
 * own authenticated client, so there's no Bearer token available there —
 * this carries the userId across the redirect instead, tamper-evident and
 * scoped to `purpose` so it can't be replayed against a different flow.
 */
export function signStateToken(userId: string, purpose: string): Promise<string> {
  return new SignJWT({ sub: userId, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(STATE_TOKEN_TTL)
    .sign(accessTokenSecret);
}

export async function verifyStateToken(token: string, purpose: string): Promise<string> {
  const { payload } = await jwtVerify(token, accessTokenSecret);
  if (typeof payload.sub !== "string" || payload.purpose !== purpose) {
    throw new Error("Invalid state token");
  }
  return payload.sub;
}
