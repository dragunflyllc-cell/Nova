"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { TOKEN_COOKIE, TOKEN_COOKIE_MAX_AGE_SECONDS } from "@/lib/auth-constants";

export async function registerAction(formData: FormData): Promise<void> {
  const orgName = String(formData.get("orgName") ?? "");
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!orgName || !name || !email || password.length < 8) {
    redirect(
      "/register?error=" +
        encodeURIComponent("All fields are required and password must be at least 8 characters."),
    );
  }

  const result = await api.register({ orgName, name, email, password }).catch(() => null);
  if (!result) {
    redirect("/register?error=" + encodeURIComponent("Could not register — that email may already be in use."));
  }

  cookies().set(TOKEN_COOKIE, result.accessToken, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_COOKIE_MAX_AGE_SECONDS,
  });
  redirect("/");
}
