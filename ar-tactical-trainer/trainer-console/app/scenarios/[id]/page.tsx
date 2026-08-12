import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { startSessionAction } from "./actions";

export default async function ScenarioDetailPage({ params }: { params: { id: string } }) {
  const { token } = await requireSession();
  const [scenario, operators, targetDefinitions] = await Promise.all([
    api.getScenario(params.id),
    api.listOperators(token),
    api.listTargetDefinitions(),
  ]);
  const defById = new Map(targetDefinitions.map((d) => [d.id, d]));
  const operatorRoster = operators.filter((o) => o.role === "operator");
  const trainerRoster = operators.filter((o) => o.role === "trainer" || o.role === "admin");
  const boundAction = startSessionAction.bind(null, scenario.id);

  return (
    <main className="container">
      <h1>{scenario.name}</h1>
      <p className="text-dim">
        {scenario.facilityId ? `Facility: ${scenario.facilityId}` : "Open ground"} ·{" "}
        {scenario.targets.length} target(s)
      </p>

      <div className="panel">
        <h2>Targets</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Kind</th>
              <th>Position</th>
              <th>Behavior script</th>
            </tr>
          </thead>
          <tbody>
            {scenario.targets.map((t) => {
              const def = defById.get(t.targetDefinitionId);
              return (
                <tr key={t.id}>
                  <td>{def?.name ?? t.targetDefinitionId}</td>
                  <td>{def?.kind}</td>
                  <td>
                    {t.anchor.kind === "world"
                      ? `(${t.anchor.position.x}, ${t.anchor.position.y}, ${t.anchor.position.z})`
                      : `anchor ${t.anchor.anchorId}`}
                  </td>
                  <td>{t.behaviorScript.map((s) => `${s.atMs}ms → ${s.setState}`).join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Pass / fail rules</h2>
        <ul>
          {scenario.passFailRules.map((r, i) => (
            <li key={i}>{r.description}</li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h2>Start a session</h2>
        <form action={boundAction}>
          <div className="grid grid-2">
            <div className="form-row">
              <label>Operator</label>
              <select name="operatorId" required>
                {operatorRoster.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Trainer running this session</label>
              <select name="trainerId" required>
                {trainerRoster.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Start session &amp; open live console</button>
          </div>
        </form>
      </div>
    </main>
  );
}
