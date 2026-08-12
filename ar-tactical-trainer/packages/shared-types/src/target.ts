export type TargetKind = "hostile" | "hostage" | "nonThreat";

export type HitZone = "head" | "chest" | "limb";

/** Catalog entry a trainer picks from (or customizes) when authoring a
 * scenario. Maps 1:1 to a prefab in `operator-app/Assets/.../TargetCatalog`. */
export interface TargetDefinition {
  id: string;
  name: string;
  kind: TargetKind;
  modelRef: string;
  /** Trainer-tunable defaults; a placement may override any of these. */
  defaultAppearance: {
    skinVariant: string;
    outfitVariant: string;
    weaponVariant: string | null;
  };
}

export type TargetRuntimeState =
  | "idle"
  | "hostile"
  | "compliant"
  | "neutralized"
  | "noShootHostage";

/** One step in a target's scripted behavior timeline, driven by
 * `Scenario/ScenarioRunner.cs`. Steps are either time-triggered or fired
 * live by the trainer over the WebSocket relay (see ws-protocol.ts). */
export interface BehaviorStep {
  atMs: number;
  setState: TargetRuntimeState;
}

export interface TargetPlacement {
  id: string;
  scenarioId: string;
  targetDefinitionId: string;
  anchor: import("./geometry.js").SpatialAnchor;
  appearanceOverride?: Partial<TargetDefinition["defaultAppearance"]>;
  behaviorScript: BehaviorStep[];
}
