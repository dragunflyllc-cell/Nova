"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getActionToken } from "@/lib/session";

export async function startSessionAction(scenarioId: string, formData: FormData) {
  const token = getActionToken();
  if (token === null) redirect("/login");

  const operatorId = String(formData.get("operatorId") ?? "");
  const trainerId = String(formData.get("trainerId") ?? "");
  if (!operatorId || !trainerId) return;

  const session = await api.createSession(token, { scenarioId, operatorId, trainerId });
  redirect(`/sessions/${session.id}/live`);
}
