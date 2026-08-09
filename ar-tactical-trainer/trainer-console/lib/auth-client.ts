"use client";

import { TOKEN_COOKIE, AUTH_DISABLED } from "@/lib/auth-constants";

/**
 * Reads the access-token cookie from the browser for client components
 * that call the API directly (ScenarioBuilder, LiveConsole). The cookie is
 * intentionally not httpOnly so both server components (via next/headers)
 * and this can read it — see docs/ARCHITECTURE.md's Auth section for that
 * trade-off. Returns null if not logged in.
 */
export function getClientToken(): string | null {
  if (AUTH_DISABLED) return "dev-mode-no-auth"; // never checked server-side while disabled

  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
