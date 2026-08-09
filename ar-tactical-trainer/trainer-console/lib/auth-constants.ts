// Shared between server-only lib/session.ts and client-only
// lib/auth-client.ts — kept in its own file with no server/client-only
// imports so either side can pull it in.
export const TOKEN_COOKIE = "art_token";
export const TOKEN_COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60;
