import Link from "next/link";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const { token, operator } = await requireSession();
  const [facilities, scenarios, operators] = await Promise.all([
    api.listFacilities(token),
    api.listScenarios(token),
    api.listOperators(token),
  ]);

  return (
    <main className="container">
      <h1>Overview</h1>
      <p className="text-dim">Signed in as {operator.name} ({operator.role}).</p>
      <div className="grid grid-3">
        <div className="stat-tile">
          <div className="value">{facilities.length}</div>
          <div className="label">Facilities scanned</div>
        </div>
        <div className="stat-tile">
          <div className="value">{scenarios.length}</div>
          <div className="label">Scenarios authored</div>
        </div>
        <div className="stat-tile">
          <div className="value">{operators.length}</div>
          <div className="label">Registered operators</div>
        </div>
      </div>

      <div className="panel">
        <h2>Get started</h2>
        <p className="text-dim">
          1. Register operators and trainers on the <Link href="/operators">Operators</Link> page.
          <br />
          2. Optionally scan a facility from the operator app, then register it under{" "}
          <Link href="/facilities">Facilities</Link>.
          <br />
          3. Build a scenario — place hostile/hostage/non-threat targets — on the{" "}
          <Link href="/scenarios">Scenarios</Link> page.
          <br />
          4. Start a session from a scenario; the operator app connects with the same session ID
          and you get a live target-control view plus after-action review once it ends.
        </p>
      </div>
    </main>
  );
}
