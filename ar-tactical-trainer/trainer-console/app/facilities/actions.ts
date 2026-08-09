"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { DEMO_ORG_ID } from "@/lib/org";

export async function createFacilityAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  if (!name) return;
  await api.createFacility({ orgId: DEMO_ORG_ID, name });
  revalidatePath("/facilities");
}
