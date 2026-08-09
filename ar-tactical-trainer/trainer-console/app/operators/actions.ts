"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { TOKEN_COOKIE } from "@/lib/auth-constants";

export async function createOperatorAction(formData: FormData) {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return;

  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "operator") as "operator" | "trainer" | "admin";
  if (!name || !email) return;

  await api.addRosterMember(token, { name, email, role });
  revalidatePath("/operators");
}
