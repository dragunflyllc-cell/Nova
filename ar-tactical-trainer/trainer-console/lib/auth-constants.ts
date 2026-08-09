// Shared between server-only lib/session.ts and client-only
// lib/auth-client.ts — kept in its own file with no server/client-only
// imports so either side can pull it in.
export const TOKEN_COOKIE = "art_token";
export const TOKEN_COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60;

// Off by default: no login screen, every page just works. Must match the
// server's own DISABLE_AUTH default (server/src/env.ts) — this only
// controls the console's UI/redirect behavior, the server independently
// enforces (or doesn't enforce) auth regardless of what this says.
export const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED !== "false";
