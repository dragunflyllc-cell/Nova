import { api, API_URL_PUBLIC } from "@/lib/api";
import { requireSession } from "@/lib/session";

export default async function SessionReviewPage({ params }: { params: { id: string } }) {
  const { token } = await requireSession();
  const session = await api.getSession(token, params.id);
  const scenario = await api.getScenario(session.scenarioId);
  const targetDefinitions = await api.listTargetDefinitions();
  const defById = new Map(targetDefinitions.map((d) => [d.id, d]));

  const hitCount = session.shotEvents.filter((s) => s.hit).length;
  const accuracy = session.shotEvents.length
    ? Math.round((hitCount / session.shotEvents.length) * 100)
    : 0;

  return (
    <main className="container">
      <h1>After-action review — {scenario.name}</h1>
      <p className="text-dim">
        {new Date(session.startedAt).toLocaleString()}
        {session.endedAt ? ` – ${new Date(session.endedAt).toLocaleTimeString()}` : " (in progress)"}
        {" · "}
        outcome:{" "}
        <span
          className={`badge ${session.outcome === "pass" ? "badge-hit" : session.outcome === "fail" ? "badge-miss" : ""}`}
        >
          {session.outcome}
        </span>
      </p>

      <div className="grid grid-3">
        <div className="stat-tile">
          <div className="value">{session.shotEvents.length}</div>
          <div className="label">Shots fired</div>
        </div>
        <div className="stat-tile">
          <div className="value">{accuracy}%</div>
          <div className="label">Accuracy</div>
        </div>
        <div className="stat-tile">
          <div className="value">
            {session.shotEvents.filter((s) => s.hit && defById.get(scenario.targets.find((t) => t.id === s.targetPlacementId)?.targetDefinitionId ?? "")?.kind === "hostage").length}
          </div>
          <div className="label">Hostage hits</div>
        </div>
      </div>

      <div className="panel">
        <h2>Shot timeline</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Target</th>
              <th>Result</th>
              <th>Reaction</th>
              <th>Split</th>
            </tr>
          </thead>
          <tbody>
            {session.shotEvents.map((shot) => {
              const def = defById.get(
                scenario.targets.find((t) => t.id === shot.targetPlacementId)?.targetDefinitionId ?? "",
              );
              return (
                <tr key={shot.id}>
                  <td>{new Date(shot.timestampMs).toLocaleTimeString()}</td>
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
            {session.shotEvents.length === 0 && (
              <tr>
                <td colSpan={5} className="text-dim">
                  No shots recorded for this session.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Recorded media</h2>
        <div className="grid grid-3">
          {session.mediaAssets.map((m) => (
            <div key={m.id} className="stat-tile">
              <div className="label" style={{ marginBottom: 8 }}>
                {m.kind} · {new Date(m.timestampMs).toLocaleTimeString()}
              </div>
              {m.kind === "video" ? (
                <video controls style={{ width: "100%" }} src={`${API_URL_PUBLIC}${m.url}`} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${API_URL_PUBLIC}${m.url}`} alt="Session capture" style={{ width: "100%" }} />
              )}
            </div>
          ))}
          {session.mediaAssets.length === 0 && (
            <p className="text-dim">
              No footage/photos uploaded for this session yet (uploaded by the operator app via
              `Recording/SessionRecorder.cs` and `Recording/PhotoCapture.cs`).
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
