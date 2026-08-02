import { characterFamilies, characterStageById } from "@nova/nova-dex";

export default function NovaDexPage() {
  return (
    <main>
      <h1>NovaDex</h1>
      <p>{characterFamilies.length} families collected so far.</p>
      <ul>
        {characterFamilies.map((family) => (
          <li key={family.id}>
            #{family.dexNumber} {family.name} — {family.theme}
            <ul>
              {family.stageIds.map((stageId) => {
                const stage = characterStageById[stageId];
                if (!stage) return null;
                return (
                  <li key={stageId}>
                    {stage.name} (Lv. {stage.unlock.level}) — {stage.title}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
