"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { getActionToken } from "@/lib/session";

export async function createFacilityAction(formData: FormData) {
  const token = getActionToken();
  if (token === null) return;

  const name = String(formData.get("name") ?? "");
  if (!name) return;
  await api.createFacility(token, { name });
  revalidatePath("/facilities");
}
