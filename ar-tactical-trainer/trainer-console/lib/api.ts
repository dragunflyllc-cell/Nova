import type {
  Facility,
  ScanLayout,
  ScenarioDefinition,
  Session,
  ShotEvent,
  MediaAsset,
  OperatorStatsSummary,
  TargetDefinition,
} from "@art/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export interface Operator {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: "operator" | "trainer" | "admin";
  createdAt: string;
}

export const api = {
  listOperators: (orgId?: string) =>
    request<Operator[]>(`/operators${orgId ? `?orgId=${orgId}` : ""}`),
  createOperator: (input: Pick<Operator, "orgId" | "name" | "email" | "role">) =>
    request<Operator>("/operators", { method: "POST", body: JSON.stringify(input) }),

  listTargetDefinitions: () => request<TargetDefinition[]>("/target-definitions"),

  listFacilities: (orgId?: string) =>
    request<Facility[]>(`/facilities${orgId ? `?orgId=${orgId}` : ""}`),
  createFacility: (input: { orgId: string; name: string }) =>
    request<Facility>("/facilities", { method: "POST", body: JSON.stringify(input) }),
  getFacility: (id: string) =>
    request<Facility & { scanLayouts: ScanLayout[] }>(`/facilities/${id}`),

  listScenarios: (orgId?: string) =>
    request<ScenarioDefinition[]>(`/scenarios${orgId ? `?orgId=${orgId}` : ""}`),
  getScenario: (id: string) => request<ScenarioDefinition>(`/scenarios/${id}`),
  createScenario: (
    input: Omit<ScenarioDefinition, "id" | "createdAt">,
  ) => request<ScenarioDefinition>("/scenarios", { method: "POST", body: JSON.stringify(input) }),

  createSession: (input: { scenarioId: string; operatorId: string; trainerId: string }) =>
    request<Session>("/sessions", { method: "POST", body: JSON.stringify(input) }),
  getSession: (id: string) =>
    request<Session & { shotEvents: ShotEvent[]; mediaAssets: MediaAsset[] }>(`/sessions/${id}`),
  endSession: (id: string, outcome: "pass" | "fail" | "aborted") =>
    request<Session>(`/sessions/${id}/end`, {
      method: "PATCH",
      body: JSON.stringify({ outcome }),
    }),

  getOperatorStats: (operatorId: string) =>
    request<OperatorStatsSummary>(`/operators/${operatorId}/stats`),
};

export const API_URL_PUBLIC = API_URL;
