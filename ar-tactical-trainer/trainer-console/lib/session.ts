import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, UnauthorizedError, type Operator } from "@/lib/api";
import { TOKEN_COOKIE } from "@/lib/auth-constants";

export { TOKEN_COOKIE, TOKEN_COOKIE_MAX_AGE_SECONDS } from "@/lib/auth-constants";

/** Server-component guard: redirects to /login if there's no valid session. */
export async function requireSession(): Promise<{ token: string; operator: Omit<Operator, "createdAt"> }> {
  const session = await getOptionalSession();
  if (!session) redirect("/login");
  return session;
}

/** Same as requireSession but returns null instead of redirecting — for the root layout, which also renders /login and /register. */
export async function getOptionalSession(): Promise<{ token: string; operator: Omit<Operator, "createdAt"> } | null> {
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
