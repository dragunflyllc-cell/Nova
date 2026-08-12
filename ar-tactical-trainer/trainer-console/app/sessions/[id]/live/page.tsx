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
      <LiveConsole sessionId={session.id} scenario={scenario} targetDefinitions={targetDefinitions} />
    </main>
  );
}
