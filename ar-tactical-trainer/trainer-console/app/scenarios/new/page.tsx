import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { ScenarioBuilder } from "./ScenarioBuilder";

export default async function NewScenarioPage() {
  const { token } = await requireSession();
  const [facilities, targetDefinitions] = await Promise.all([
    api.listFacilities(token),
    api.listTargetDefinitions(),
  ]);

  return (
    <main className="container">
      <h1>New scenario</h1>
      <ScenarioBuilder facilities={facilities} targetDefinitions={targetDefinitions} />
    </main>
  );
}
