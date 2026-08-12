import type { TargetRuntimeState } from "./target.js";
import type { ShotEvent } from "./session.js";
import type { Vec3 } from "./geometry.js";

/**
 * Wire protocol for the trainer-console <-> server <-> operator-app relay
 * (`server/src/ws`, `operator-app/.../Networking/TrainerLinkClient.cs`).
 * The server is a dumb relay scoped by `sessionId` plus a persister: every
 * message is broadcast to the other party in the same session and, where
 * noted, written to the DB.
 */

export interface WsEnvelope<T extends string, P> {
  type: T;
  sessionId: string;
  ts: number;
  payload: P;
}

// ---- Trainer -> Operator ----

export type TrainerToOperatorMessage =
  | WsEnvelope<"SPAWN_TARGET", { targetPlacementId: string }>
  | WsEnvelope<"DESPAWN_TARGET", { targetPlacementId: string }>
  | WsEnvelope<"SET_TARGET_STATE", { targetPlacementId: string; state: TargetRuntimeState }>
  | WsEnvelope<"START_SCENARIO", { scenarioId: string }>
  | WsEnvelope<"END_SCENARIO", Record<string, never>>;

// ---- Operator -> Trainer (server persists SHOT_EVENT + SESSION_*) ----

export type OperatorToTrainerMessage =
  | WsEnvelope<"TELEMETRY", { operatorPosition: Vec3; headingYDeg: number }>
  | WsEnvelope<"SHOT_EVENT", ShotEvent>
  | WsEnvelope<"TARGET_STATE_CHANGED", { targetPlacementId: string; state: TargetRuntimeState }>
  | WsEnvelope<"SESSION_STARTED", { operatorId: string; scenarioId: string }>
  | WsEnvelope<"SESSION_ENDED", { outcome: "pass" | "fail" | "aborted" }>;

export type RelayMessage = TrainerToOperatorMessage | OperatorToTrainerMessage;

/** First message on connect, from either party, to join the relay room. */
export interface WsJoinMessage {
  type: "JOIN";
  sessionId: string;
  role: "trainer" | "operator";
}
