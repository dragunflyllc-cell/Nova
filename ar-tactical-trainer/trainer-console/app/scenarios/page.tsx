import Link from "next/link";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";

export default async function ScenariosPage() {
  const { token } = await requireSession();
  const scenarios = await api.listScenarios(token);

  return (
    <main className="container">
      <h1>Scenarios</h1>
      <div className="form-actions" style={{ marginBottom: 16 }}>
        <Link href="/scenarios/new">
          <button type="button">+ New scenario</button>
        </Link>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Targets</th>
              <th>Facility</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.targets.length}</td>
                <td>{s.facilityId ? s.facilityId : "open ground"}</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>
                  <Link href={`/scenarios/${s.id}`}>View</Link>
                </td>
              </tr>
            ))}
            {scenarios.length === 0 && (
              <tr>
                <td colSpan={5} className="text-dim">
                  No scenarios authored yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
