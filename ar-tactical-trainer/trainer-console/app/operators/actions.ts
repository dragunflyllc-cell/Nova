"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { DEMO_ORG_ID } from "@/lib/org";

export async function createOperatorAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "operator") as "operator" | "trainer" | "admin";
  if (!name || !email) return;

  await api.createOperator({ orgId: DEMO_ORG_ID, name, email, role });
  revalidatePath("/operators");
}
