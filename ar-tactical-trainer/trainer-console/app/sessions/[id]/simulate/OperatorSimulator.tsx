"use client";

import { useMemo, useRef, useState } from "react";
import type {
  ScenarioDefinition,
  TargetDefinition,
  TargetRuntimeState,
  HitZone,
  ShotEvent,
} from "@art/shared-types";
import { useOperatorLink } from "@/lib/ws";

interface Props {
  sessionId: string;
  operatorId: string;
  scenario: ScenarioDefinition;
  targetDefinitions: TargetDefinition[];
}

const STATE_LABEL: Record<TargetRuntimeState, string> = {
  idle: "Idle",
  hostile: "HOSTILE",
  compliant: "Compliant",
  neutralized: "Neutralized",
  noShootHostage: "Hostage — DO NOT SHOOT",
};

const STATE_COLOR: Record<TargetRuntimeState, string> = {
  idle: "var(--text-dim)",
  hostile: "var(--bad)",
  compliant: "var(--warn)",
  neutralized: "var(--text-dim)",
  noShootHostage: "var(--warn)",
};

export function OperatorSimulator({ sessionId, operatorId, scenario, targetDefinitions }: Props) {
  const { messages, connected, send } = useOperatorLink(sessionId);
  const defById = new Map(targetDefinitions.map((d) => [d.id, d]));
  const [firedShots, setFiredShots] = useState<ShotEvent[]>([]);
  const lastShotAtRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  if (!startedRef.current && connected) {
    startedRef.current = true;
    send({ type: "SESSION_STARTED", payload: { operatorId, scenarioId: scenario.id } });
  }

  // The message envelope's own `ts` (set by the trainer console when it
  // dispatched the command) is the real transition time — using it instead
  // of a local clock keeps reaction-time math correct regardless of when
  // this tab happened to render.
  const targetState = useMemo(() => {
    const map: Record<string, TargetRuntimeState> = {};
    for (const m of messages) {
      if (m.type === "SET_TARGET_STATE") map[m.payload.targetPlacementId] = m.payload.state;
    }
    return map;
  }, [messages]);

  const becameHostileAt = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of messages) {
      if (m.type === "SET_TARGET_STATE" && m.payload.state === "hostile") {
        map[m.payload.targetPlacementId] = m.ts;
      }
    }
    return map;
  }, [messages]);

  const visible = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const t of scenario.targets) map[t.id] = true; // spawned by default, matching ScenarioRunner.cs
    for (const m of messages) {
      if (m.type === "SPAWN_TARGET") map[m.payload.targetPlacementId] = true;
      if (m.type === "DESPAWN_TARGET") map[m.payload.targetPlacementId] = false;
    }
    return map;
  }, [messages, scenario.targets]);

  const ended = messages.some((m) => m.type === "END_SCENARIO");

  function fire(targetPlacementId: string, hit: boolean, hitZone: HitZone | null) {
    const now = Date.now();
    const hostileAt = becameHostileAt[targetPlacementId];
    const shot: ShotEvent = {
      id: crypto.randomUUID(),
      sessionId,
      targetPlacementId,
      timestampMs: now,
      hit,
      hitZone,
      reactionTimeMs: hostileAt ? now - hostileAt : null,
      splitTimeMs: lastShotAtRef.current ? now - lastShotAtRef.current : null,
    };
    lastShotAtRef.current = now;
    send({ type: "SHOT_EVENT", payload: shot });
    setFiredShots((prev) => [shot, ...prev]);
  }

  return (
    <div className="grid grid-2">
      <div className="panel">
        <h2>Targets</h2>
        <p>
          Relay:{" "}
          <span
            className="badge"
            style={{
              background: connected ? "rgba(76,175,107,.15)" : "rgba(224,72,63,.15)",
              color: connected ? "var(--good)" : "var(--bad)",
            }}
          >
            {connected ? "connected as operator" : "connecting…"}
          </span>
          {ended && (
            <span className="badge badge-miss" style={{ marginLeft: 8 }}>
              SESSION ENDED
            </span>
          )}
        </p>

        {scenario.targets.map((t) => {
          const def = defById.get(t.targetDefinitionId);
          const state = targetState[t.id] ?? "idle";
          const isVisible = visible[t.id];
          if (!isVisible) {
            return (
              <div key={t.id} className="stat-tile" style={{ marginBottom: 12, opacity: 0.5 }}>
                <div className="label">{def?.name ?? t.targetDefinitionId} — despawned</div>
              </div>
            );
          }
          return (
            <div key={t.id} className="stat-tile" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong>{def?.name ?? t.targetDefinitionId}</strong>
                <span style={{ color: STATE_COLOR[state], fontWeight: 600, fontSize: 12 }}>
                  {STATE_LABEL[state]}
                </span>
              </div>
              <div className="form-actions">
                <button type="button" disabled={ended} onClick={() => fire(t.id, true, "head")}>
                  Hit — Head
                </button>
                <button type="button" disabled={ended} onClick={() => fire(t.id, true, "chest")}>
                  Hit — Chest
                </button>
                <button type="button" disabled={ended} onClick={() => fire(t.id, true, "limb")}>
                  Hit — Limb
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={ended}
                  onClick={() => fire(t.id, false, null)}
                >
                  Miss
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <h2>Shots fired this tab</h2>
        <table>
          <thead>
            <tr>
              <th>Target</th>
              <th>Result</th>
              <th>Reaction</th>
              <th>Split</th>
            </tr>
          </thead>
          <tbody>
            {firedShots.map((shot) => {
              const def = defById.get(
                scenario.targets.find((t) => t.id === shot.targetPlacementId)?.targetDefinitionId ?? "",
              );
              return (
                <tr key={shot.id}>
                  <td>{def?.name ?? shot.targetPlacementId}</td>
                  <td>
                    <span className={`badge ${shot.hit ? "badge-hit" : "badge-miss"}`}>
                      {shot.hit ? `HIT — ${shot.hitZone}` : "MISS"}
                    </span>
                  </td>
                  <td>{shot.reactionTimeMs != null ? `${shot.reactionTimeMs}ms` : "—"}</td>
                  <td>{shot.splitTimeMs != null ? `${shot.splitTimeMs}ms` : "—"}</td>
                </tr>
              );
            })}
            {firedShots.length === 0 && (
              <tr>
                <td colSpan={4} className="text-dim">
                  No shots fired yet — click a target's Hit/Miss buttons.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="text-dim" style={{ marginTop: 12 }}>
          These are being scored and stored for real — the trainer's live console (open it in
          another tab) sees them arrive live, and they'll show up in this session's after-action
          review and the operator's stats once the session ends.
        </p>
      </div>
    </div>
  );
}
