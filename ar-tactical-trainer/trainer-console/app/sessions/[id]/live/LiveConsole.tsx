"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioDefinition, TargetDefinition, TargetRuntimeState } from "@art/shared-types";
import { useTrainerLink } from "@/lib/ws";
import { api } from "@/lib/api";

interface Props {
  sessionId: string;
  scenario: ScenarioDefinition;
  targetDefinitions: TargetDefinition[];
}

const STATES: TargetRuntimeState[] = ["idle", "hostile", "compliant", "neutralized", "noShootHostage"];

export function LiveConsole({ sessionId, scenario, targetDefinitions }: Props) {
  const router = useRouter();
  const { messages, connected, send } = useTrainerLink(sessionId);
  const defById = new Map(targetDefinitions.map((d) => [d.id, d]));
  const [targetStates, setTargetStates] = useState<Record<string, TargetRuntimeState>>({});
  const [ending, setEnding] = useState(false);

  const shotEvents = messages.filter((m) => m.type === "SHOT_EVENT");
  const telemetry = [...messages].reverse().find((m) => m.type === "TELEMETRY");

  function setState(targetPlacementId: string, state: TargetRuntimeState) {
    send({ type: "SET_TARGET_STATE", payload: { targetPlacementId, state } });
    setTargetStates((prev) => ({ ...prev, [targetPlacementId]: state }));
  }

  async function endSession(outcome: "pass" | "fail" | "aborted") {
    setEnding(true);
    send({ type: "END_SCENARIO", payload: {} });
    await api.endSession(sessionId, outcome);
    router.push(`/sessions/${sessionId}`);
  }

  return (
    <div>
      <p>
        Relay status:{" "}
        <span className="badge" style={{ background: connected ? "rgba(76,175,107,.15)" : "rgba(224,72,63,.15)", color: connected ? "var(--good)" : "var(--bad)" }}>
          {connected ? "connected" : "waiting for operator app…"}
        </span>{" "}
        <span className="text-dim">— the operator app joins this same session ID as role "operator".</span>
      </p>

      <div className="grid grid-2">
        <div className="panel">
          <h2>Targets</h2>
          <table>
            <thead>
              <tr>
                <th>Target</th>
                <th>State</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scenario.targets.map((t) => {
                const def = defById.get(t.targetDefinitionId);
                const state = targetStates[t.id] ?? "idle";
                return (
                  <tr key={t.id}>
                    <td>{def?.name ?? t.targetDefinitionId}</td>
                    <td>{state}</td>
                    <td style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => send({ type: "SPAWN_TARGET", payload: { targetPlacementId: t.id } })}
                      >
                        Spawn
                      </button>
                      <select
                        value={state}
                        onChange={(e) => setState(t.id, e.target.value as TargetRuntimeState)}
                      >
                        {STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => send({ type: "DESPAWN_TARGET", payload: { targetPlacementId: t.id } })}
                      >
                        Despawn
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="form-actions" style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() => send({ type: "START_SCENARIO", payload: { scenarioId: scenario.id } })}
            >
              Start scenario
            </button>
            <button type="button" className="secondary" onClick={() => endSession("pass")} disabled={ending}>
              End — Pass
            </button>
            <button type="button" className="secondary" onClick={() => endSession("fail")} disabled={ending}>
              End — Fail
            </button>
            <button type="button" className="secondary" onClick={() => endSession("aborted")} disabled={ending}>
              Abort
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Live shot feed</h2>
          {telemetry && telemetry.type === "TELEMETRY" && (
            <p className="text-dim">
              Operator position: ({telemetry.payload.operatorPosition.x.toFixed(1)},{" "}
              {telemetry.payload.operatorPosition.z.toFixed(1)}), heading{" "}
              {telemetry.payload.headingYDeg.toFixed(0)}°
            </p>
          )}
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
              {shotEvents.map((m) => {
                if (m.type !== "SHOT_EVENT") return null;
                const shot = m.payload;
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
                      {shot.hit && def?.kind === "hostage" && (
                        <span className="badge badge-hostage" style={{ marginLeft: 6 }}>
                          HOSTAGE HIT
                        </span>
                      )}
                    </td>
                    <td>{shot.reactionTimeMs != null ? `${shot.reactionTimeMs}ms` : "—"}</td>
                    <td>{shot.splitTimeMs != null ? `${shot.splitTimeMs}ms` : "—"}</td>
                  </tr>
                );
              })}
              {shotEvents.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-dim">
                    No shots fired yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
