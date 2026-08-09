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

export class UnauthorizedError extends Error {}

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new UnauthorizedError("session expired — please log in again");
  }
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

export interface AuthResult {
  accessToken: string;
  operator: Omit<Operator, "createdAt">;
}

export const api = {
  register: (input: { orgName: string; name: string; email: string; password: string }) =>
    request<AuthResult>("/auth/register", null, { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request<AuthResult>("/auth/login", null, { method: "POST", body: JSON.stringify(input) }),
  me: (token: string) => request<Omit<Operator, "createdAt">>("/auth/me", token),

  listOperators: (token: string) => request<Operator[]>("/operators", token),
  addRosterMember: (token: string, input: { name: string; email: string; role: "operator" | "trainer" | "admin" }) =>
    request<Operator>("/operators", token, { method: "POST", body: JSON.stringify(input) }),

  listTargetDefinitions: () => request<TargetDefinition[]>("/target-definitions", null),

  listFacilities: (token: string) => request<Facility[]>("/facilities", token),
  createFacility: (token: string, input: { name: string }) =>
    request<Facility>("/facilities", token, { method: "POST", body: JSON.stringify(input) }),
  getFacility: (token: string, id: string) =>
    request<Facility & { scanLayouts: ScanLayout[] }>(`/facilities/${id}`, token),

  listScenarios: (token: string) => request<ScenarioDefinition[]>("/scenarios", token),
  // Public: the operator app loads a scenario by ID with no login of its own.
  getScenario: (id: string) => request<ScenarioDefinition>(`/scenarios/${id}`, null),
  createScenario: (
    token: string,
    input: Omit<ScenarioDefinition, "id" | "createdAt" | "orgId" | "createdBy">,
  ) => request<ScenarioDefinition>("/scenarios", token, { method: "POST", body: JSON.stringify(input) }),

  createSession: (token: string, input: { scenarioId: string; operatorId: string; trainerId: string }) =>
    request<Session>("/sessions", token, { method: "POST", body: JSON.stringify(input) }),
  getSession: (token: string, id: string) =>
    request<Session & { shotEvents: ShotEvent[]; mediaAssets: MediaAsset[] }>(`/sessions/${id}`, token),
  endSession: (token: string, id: string, outcome: "pass" | "fail" | "aborted") =>
    request<Session>(`/sessions/${id}/end`, token, {
      method: "PATCH",
      body: JSON.stringify({ outcome }),
    }),

  getOperatorStats: (token: string, operatorId: string) =>
    request<OperatorStatsSummary>(`/operators/${operatorId}/stats`, token),
};

export const API_URL_PUBLIC = API_URL;
