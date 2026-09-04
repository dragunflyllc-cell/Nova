import Link from "next/link";
import { api } from "@/lib/api";
import { OperatorSimulator } from "./OperatorSimulator";

/**
 * Stands in for the real operator-app phone during development — no
 * Unity/Xcode/iPhone needed. Deliberately public, same as the real device:
 * only needs the sessionId + scenarioId + operatorId the trainer console
 * hands it via the link on the live-session page (app/sessions/[id]/live),
 * not a login of its own. See docs/ARCHITECTURE.md's Auth section for why
 * device-facing surfaces stay open.
 */
export default async function SimulatePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { scenarioId?: string; operatorId?: string };
}) {
  const { scenarioId, operatorId } = searchParams;

  if (!scenarioId || !operatorId) {
    return (
      <main className="container">
        <h1>Operator simulator</h1>
        <div className="panel">
          <p>
            This page needs a scenario and operator to simulate — open it from the{" "}
            <Link href={`/sessions/${params.id}/live`}>live session page</Link>'s "Open operator
            simulator" link instead of visiting it directly.
          </p>
        </div>
      </main>
    );
  }

  const [scenario, targetDefinitions] = await Promise.all([
    api.getScenario(scenarioId),
    api.listTargetDefinitions(),
  ]);

  return (
    <main className="container">
      <h1>Operator simulator — {scenario.name}</h1>
      <p className="text-dim">
        Stands in for the phone-on-gun app. Fire simulated shots below; they flow through the
        same live relay and get scored/stored exactly like a real device would.
      </p>
      <OperatorSimulator
        sessionId={params.id}
        operatorId={operatorId}
        scenario={scenario}
        targetDefinitions={targetDefinitions}
      />
    </main>
  );
}
