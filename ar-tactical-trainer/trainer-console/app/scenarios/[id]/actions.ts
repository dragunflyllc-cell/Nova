"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api";

export async function startSessionAction(scenarioId: string, formData: FormData) {
  const operatorId = String(formData.get("operatorId") ?? "");
  const trainerId = String(formData.get("trainerId") ?? "");
  if (!operatorId || !trainerId) return;

  const session = await api.createSession({ scenarioId, operatorId, trainerId });
  redirect(`/sessions/${session.id}/live`);
}
