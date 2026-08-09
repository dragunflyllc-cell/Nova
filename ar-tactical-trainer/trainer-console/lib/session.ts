import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, UnauthorizedError, type Operator } from "@/lib/api";
import { TOKEN_COOKIE, AUTH_DISABLED } from "@/lib/auth-constants";

export { TOKEN_COOKIE, TOKEN_COOKIE_MAX_AGE_SECONDS, AUTH_DISABLED } from "@/lib/auth-constants";

/** Server-component guard: redirects to /login if there's no valid session. */
export async function requireSession(): Promise<{ token: string; operator: Omit<Operator, "createdAt"> }> {
  const session = await getOptionalSession();
  if (!session) redirect("/login");
  return session;
}

/** Same as requireSession but returns null instead of redirecting — for the root layout, which also renders /login and /register. */
export async function getOptionalSession(): Promise<{ token: string; operator: Omit<Operator, "createdAt"> } | null> {
  if (AUTH_DISABLED) {
    // The server ignores whatever's in the Authorization header while its
    // own DISABLE_AUTH is on, so an empty token round-trips fine here.
    const operator = await api.me("");
    return { token: "", operator };
  }

  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const operator = await api.me(token);
    return { token, operator };
  } catch (err) {
    if (err instanceof UnauthorizedError) return null;
    throw err;
  }
}

/**
 * For Server Actions (form submit handlers), which can't call an async
 * requireSession() and redirect the same way a page can. Returns "" (a
 * valid, no-auth-needed value the server ignores) when AUTH_DISABLED,
 * the real cookie token when present, or null when the action should
 * bail because there's genuinely no session. Callers must check for
 * `=== null`, not falsiness — "" is a valid token here.
 */
export function getActionToken(): string | null {
  if (AUTH_DISABLED) return "";
  return cookies().get(TOKEN_COOKIE)?.value ?? null;
}
