import Link from "next/link";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { LiveConsole } from "./LiveConsole";

export default async function LiveSessionPage({ params }: { params: { id: string } }) {
  const { token } = await requireSession();
  const session = await api.getSession(token, params.id);
  const scenario = await api.getScenario(session.scenarioId);
  const targetDefinitions = await api.listTargetDefinitions();

  return (
    <main className="container">
      <h1>Live session — {scenario.name}</h1>
      <p className="text-dim">
        No phone yet?{" "}
        <Link
          href={`/sessions/${session.id}/simulate?scenarioId=${scenario.id}&operatorId=${session.operatorId}`}
          target="_blank"
        >
          Open the operator simulator
        </Link>{" "}
        in another tab — it stands in for the real device so you can try the full loop right now.
      </p>
      <LiveConsole sessionId={session.id} scenario={scenario} targetDefinitions={targetDefinitions} />
    </main>
  );
}
