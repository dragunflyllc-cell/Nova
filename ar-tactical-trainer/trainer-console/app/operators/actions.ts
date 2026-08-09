"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { getActionToken } from "@/lib/session";

export async function createOperatorAction(formData: FormData) {
  const token = getActionToken();
  if (token === null) return;

  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "operator") as "operator" | "trainer" | "admin";
  if (!name || !email) return;

  await api.addRosterMember(token, { name, email, role });
  revalidatePath("/operators");
}
