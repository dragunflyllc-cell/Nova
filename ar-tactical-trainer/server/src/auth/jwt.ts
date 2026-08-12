import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface AccessTokenClaims {
  operatorId: string;
  orgId: string;
  role: "operator" | "trainer" | "admin";
}

const ACCESS_TOKEN_TTL = "12h";

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.accessTokenSecret, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenClaims | null {
  try {
    return jwt.verify(token, env.accessTokenSecret) as AccessTokenClaims & jwt.JwtPayload;
  } catch {
    return null;
  }
}
