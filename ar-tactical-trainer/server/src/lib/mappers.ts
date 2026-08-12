import type {
  Facility as FacilityRow,
  ScanLayout as ScanLayoutRow,
  Scenario as ScenarioRow,
  TargetPlacement as TargetPlacementRow,
  TargetDefinition as TargetDefinitionRow,
  Session as SessionRow,
  ShotEvent as ShotEventRow,
  MediaAsset as MediaAssetRow,
} from "@prisma/client";
import type {
  Facility,
  ScanLayout,
  ScenarioDefinition,
  TargetPlacement,
  TargetDefinition,
  Session,
  ShotEvent,
  MediaAsset,
  HitZone,
  MediaKind,
  SessionOutcome,
  TargetKind,
} from "@art/shared-types";

export function toFacility(row: FacilityRow): Facility {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toScanLayout(row: ScanLayoutRow): ScanLayout {
  return {
    id: row.id,
    facilityId: row.facilityId,
    meshAssetUrl: row.meshAssetUrl,
    anchors: JSON.parse(row.anchorsJson),
    capturedAt: row.capturedAt.toISOString(),
    capturedByOperatorId: row.capturedByOperatorId,
  };
}

export function toTargetDefinition(row: TargetDefinitionRow): TargetDefinition {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as TargetKind,
    modelRef: row.modelRef,
    defaultAppearance: JSON.parse(row.defaultAppearanceJson),
  };
}

export function toTargetPlacement(row: TargetPlacementRow): TargetPlacement {
  return {
    id: row.id,
    scenarioId: row.scenarioId,
    targetDefinitionId: row.targetDefinitionId,
    anchor: JSON.parse(row.anchorJson),
    appearanceOverride: row.appearanceOverrideJson
      ? JSON.parse(row.appearanceOverrideJson)
      : undefined,
    behaviorScript: JSON.parse(row.behaviorScriptJson),
  };
}

export function toScenario(
  row: ScenarioRow & { targets?: TargetPlacementRow[] },
): ScenarioDefinition {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    facilityId: row.facilityId,
    targets: (row.targets ?? []).map(toTargetPlacement),
    passFailRules: JSON.parse(row.passFailRulesJson),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    scenarioId: row.scenarioId,
    operatorId: row.operatorId,
    trainerId: row.trainerId,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    outcome: row.outcome as SessionOutcome,
  };
}

export function toShotEvent(row: ShotEventRow): ShotEvent {
  return {
    id: row.id,
    sessionId: row.sessionId,
    targetPlacementId: row.targetPlacementId,
    timestampMs: Number(row.timestampMs),
    hit: row.hit,
    hitZone: (row.hitZone as HitZone | null) ?? null,
    reactionTimeMs: row.reactionTimeMs ?? null,
    splitTimeMs: row.splitTimeMs ?? null,
  };
}

export function toMediaAsset(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    sessionId: row.sessionId,
    kind: row.kind as MediaKind,
    url: row.url,
    timestampMs: Number(row.timestampMs),
  };
}
