"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { TOKEN_COOKIE } from "@/lib/auth-constants";

export async function createFacilityAction(formData: FormData) {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return;

  const name = String(formData.get("name") ?? "");
  if (!name) return;
  await api.createFacility(token, { name });
  revalidatePath("/facilities");
}
