"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { TOKEN_COOKIE } from "@/lib/auth-constants";

export async function startSessionAction(scenarioId: string, formData: FormData) {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) redirect("/login");

  const operatorId = String(formData.get("operatorId") ?? "");
  const trainerId = String(formData.get("trainerId") ?? "");
  if (!operatorId || !trainerId) return;

  const session = await api.createSession(token, { scenarioId, operatorId, trainerId });
  redirect(`/sessions/${session.id}/live`);
}
