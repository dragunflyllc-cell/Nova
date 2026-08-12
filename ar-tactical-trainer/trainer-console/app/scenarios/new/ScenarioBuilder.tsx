"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TargetDefinition, TargetPlacement, PassFailRule } from "@art/shared-types";
import { api } from "@/lib/api";
import { getClientToken } from "@/lib/auth-client";
import type { Facility } from "@art/shared-types";

interface Props {
  facilities: Facility[];
  targetDefinitions: TargetDefinition[];
}

interface PlacedTarget {
  key: string;
  targetDefinitionId: string;
  x: number;
  z: number;
  rotationYDeg: number;
}

// 20m x 20m open-ground grid rendered at 28px/m.
const METERS = 20;
const PX_PER_METER = 28;
const CANVAS_PX = METERS * PX_PER_METER;

const KIND_COLOR: Record<TargetDefinition["kind"], string> = {
  hostile: "#e0483f",
  hostage: "#e0b23f",
  nonThreat: "#4caf6b",
};

export function ScenarioBuilder({ facilities, targetDefinitions }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [facilityId, setFacilityId] = useState<string>("");
  const [selectedDefId, setSelectedDefId] = useState(targetDefinitions[0]?.id ?? "");
  const [placed, setPlaced] = useState<PlacedTarget[]>([]);
  const [allHostilesNeutralized, setAllHostilesNeutralized] = useState(true);
  const [noHostageHits, setNoHostageHits] = useState(true);
  const [timeLimitMin, setTimeLimitMin] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!selectedDefId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // The canvas is square and scales to fit the screen (phone or laptop —
    // see globals.css), so pixels-per-meter must come from the actual
    // rendered size, not the CANVAS_PX/PX_PER_METER design constants —
    // those only size the element and space the background grid lines.
    const pxPerMeter = rect.width / METERS;
    // Canvas is top-down: screen-x -> world x, screen-y -> world z (forward).
    const x = Number((px / pxPerMeter - METERS / 2).toFixed(2));
    const z = Number((py / pxPerMeter).toFixed(2));
    setPlaced((prev) => [
      ...prev,
      { key: crypto.randomUUID(), targetDefinitionId: selectedDefId, x, z, rotationYDeg: 180 },
    ]);
  }

  function updateRotation(key: string, rotationYDeg: number) {
    setPlaced((prev) => prev.map((p) => (p.key === key ? { ...p, rotationYDeg } : p)));
  }

  function removeTarget(key: string) {
    setPlaced((prev) => prev.filter((p) => p.key !== key));
  }

  function defFor(id: string) {
    return targetDefinitions.find((d) => d.id === id);
  }

  async function handleSubmit() {
    setError(null);
    if (!name || placed.length === 0) {
      setError("Name and at least one placed target are required.");
      return;
    }
    const token = getClientToken();
    if (!token) {
      setError("Your session expired — please sign in again.");
      return;
    }
    setSubmitting(true);
    try {
      const targets: Omit<TargetPlacement, "id" | "scenarioId">[] = placed.map((p) => ({
        targetDefinitionId: p.targetDefinitionId,
        anchor: {
          kind: "world",
          position: { x: p.x, y: 0, z: p.z },
          rotationYDeg: p.rotationYDeg,
        },
        behaviorScript: [{ atMs: 0, setState: "hostile" }],
      }));
      const passFailRules: PassFailRule[] = [];
      if (allHostilesNeutralized) {
        passFailRules.push({
          description: "All hostile targets must be neutralized",
          kind: "allHostilesNeutralized",
        });
      }
      if (noHostageHits) {
        passFailRules.push({
          description: "No hits on hostage/non-threat targets",
          kind: "noHostageHits",
        });
      }
      if (timeLimitMin !== "") {
        passFailRules.push({
          description: `Complete within ${timeLimitMin} minute(s)`,
          kind: "underTimeLimitMs",
          value: Number(timeLimitMin) * 60_000,
        });
      }

      const scenario = await api.createScenario(token, {
        name,
        facilityId: facilityId || null,
        targets: targets as TargetPlacement[],
        passFailRules,
      });
      router.push(`/scenarios/${scenario.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scenario");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-2">
      <div className="panel">
        <h2>Details</h2>
        <div className="form-row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Room Clear — Hallway Ambush" />
        </div>
        <div className="form-row">
          <label>Facility (optional — leave blank for open ground)</label>
          <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
            <option value="">Open ground</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <h2>Pass / fail</h2>
        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={allHostilesNeutralized}
              onChange={(e) => setAllHostilesNeutralized(e.target.checked)}
            />{" "}
            All hostiles must be neutralized
          </label>
        </div>
        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={noHostageHits}
              onChange={(e) => setNoHostageHits(e.target.checked)}
            />{" "}
            No hits on hostages / non-threats
          </label>
        </div>
        <div className="form-row">
          <label>Time limit (minutes, optional)</label>
          <input
            type="number"
            min={0}
            value={timeLimitMin}
            onChange={(e) => setTimeLimitMin(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>

        {error && <p style={{ color: "var(--bad)" }}>{error}</p>}
        <div className="form-actions">
          <button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create scenario"}
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Place targets</h2>
        <div className="form-row">
          <label>Target type to place (click the grid below to drop one)</label>
          <select value={selectedDefId} onChange={(e) => setSelectedDefId(e.target.value)}>
            {targetDefinitions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div
          onClick={handleCanvasClick}
          style={{
            width: "100%",
            maxWidth: CANVAS_PX,
            aspectRatio: "1 / 1",
            background:
              "repeating-linear-gradient(0deg, #1c211e, #1c211e 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, #1c211e, #1c211e 1px, transparent 1px, transparent 28px)",
            backgroundColor: "var(--bg-panel-2)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            position: "relative",
            cursor: "crosshair",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: 2,
              height: "100%",
              background: "var(--border)",
            }}
          />
          <div
            style={{ position: "absolute", top: 4, left: 8, fontSize: 11, color: "var(--text-dim)" }}
          >
            operator start (z=0)
          </div>
          {placed.map((p) => {
            const def = defFor(p.targetDefinitionId);
            // Percentages, not the fixed PX_PER_METER — the canvas itself
            // scales (aspectRatio square, width up to CANVAS_PX) to fit
            // whatever screen it's on, phone included.
            const left = `${((p.x + METERS / 2) / METERS) * 100}%`;
            const top = `${(p.z / METERS) * 100}%`;
            return (
              <div
                key={p.key}
                title={def?.name}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: 14,
                  height: 14,
                  marginLeft: -7,
                  marginTop: -7,
                  borderRadius: "50%",
                  background: def ? KIND_COLOR[def.kind] : "#888",
                  border: "2px solid #0b0e0d",
                }}
              />
            );
          })}
        </div>

        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Target</th>
              <th>Pos (x, z)</th>
              <th>Facing°</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {placed.map((p) => (
              <tr key={p.key}>
                <td>{defFor(p.targetDefinitionId)?.name}</td>
                <td>
                  {p.x}m, {p.z}m
                </td>
                <td>
                  <input
                    type="number"
                    style={{ width: 70 }}
                    value={p.rotationYDeg}
                    onChange={(e) => updateRotation(p.key, Number(e.target.value))}
                  />
                </td>
                <td>
                  <button type="button" className="secondary" onClick={() => removeTarget(p.key)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {placed.length === 0 && (
              <tr>
                <td colSpan={4} className="text-dim">
                  Click the grid to place your first target.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
