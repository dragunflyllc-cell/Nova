import type { TargetPlacement } from "./target.js";

export interface PassFailRule {
  /** e.g. "no hostile targets left in 'hostile' state", "no hostage-zone hits". */
  description: string;
  kind: "allHostilesNeutralized" | "noHostageHits" | "underTimeLimitMs" | "minAccuracyPct";
  value?: number;
}

export interface ScenarioDefinition {
  id: string;
  orgId: string;
  name: string;
  /** null = open-ground drill, not tied to a scanned facility. */
  facilityId: string | null;
  targets: TargetPlacement[];
  passFailRules: PassFailRule[];
  createdBy: string;
  createdAt: string;
}
