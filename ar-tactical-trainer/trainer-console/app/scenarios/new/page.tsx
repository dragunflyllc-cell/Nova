import { api } from "@/lib/api";
import { DEMO_ORG_ID } from "@/lib/org";
import { ScenarioBuilder } from "./ScenarioBuilder";

export default async function NewScenarioPage() {
  const [facilities, operators, targetDefinitions] = await Promise.all([
    api.listFacilities(DEMO_ORG_ID),
    api.listOperators(DEMO_ORG_ID),
    api.listTargetDefinitions(),
  ]);
  const trainers = operators.filter((o) => o.role === "trainer" || o.role === "admin");

  return (
    <main className="container">
      <h1>New scenario</h1>
      <ScenarioBuilder facilities={facilities} trainers={trainers} targetDefinitions={targetDefinitions} />
    </main>
  );
}
