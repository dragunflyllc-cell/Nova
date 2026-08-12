import type { HitZone } from "./target.js";

export type SessionOutcome = "pass" | "fail" | "aborted" | "inProgress";

export interface Session {
  id: string;
  scenarioId: string;
  operatorId: string;
  trainerId: string;
  startedAt: string;
  endedAt: string | null;
  outcome: SessionOutcome;
}

/** One trigger pull, logged by `Stats/StatsTracker.cs` and flushed to the
 * server. `timestampMs` is an absolute epoch-ms timestamp (so it lines up
 * with recorded video/photo timestamps for after-action review — see
 * `MediaAsset.timestampMs` below). `reactionTimeMs` = time from the target
 * entering "hostile" state to this shot; `splitTimeMs` = time since the
 * operator's previous shot in the same session (null for the first shot). */
export interface ShotEvent {
  id: string;
  sessionId: string;
  targetPlacementId: string;
  timestampMs: number;
  hit: boolean;
  hitZone: HitZone | null;
  reactionTimeMs: number | null;
  splitTimeMs: number | null;
}

export type MediaKind = "video" | "photo";

/** `timestampMs` is absolute epoch-ms, matching `ShotEvent.timestampMs`, so
 * the after-action review UI can line up recorded footage with shot events
 * on one timeline. */
export interface MediaAsset {
  id: string;
  sessionId: string;
  kind: MediaKind;
  url: string;
  timestampMs: number;
}

/** Server-computed rollup for an operator's stats dashboard. */
export interface OperatorStatsSummary {
  operatorId: string;
  sessionCount: number;
  shotCount: number;
  accuracyPct: number;
  avgReactionTimeMs: number | null;
  avgSplitTimeMs: number | null;
  hitsByZone: Record<HitZone, number>;
  hostageHitCount: number;
}
