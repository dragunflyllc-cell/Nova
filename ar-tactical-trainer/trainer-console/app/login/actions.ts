"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { TOKEN_COOKIE, TOKEN_COOKIE_MAX_AGE_SECONDS } from "@/lib/auth-constants";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("Email and password are required."));
  }

  const result = await api.login({ email, password }).catch(() => null);
  if (!result) {
    redirect("/login?error=" + encodeURIComponent("Invalid email or password."));
  }

  cookies().set(TOKEN_COOKIE, result.accessToken, {
    httpOnly: false, // client components (live session, scenario builder) read this directly
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_COOKIE_MAX_AGE_SECONDS,
  });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  cookies().delete(TOKEN_COOKIE);
  redirect("/login");
}
