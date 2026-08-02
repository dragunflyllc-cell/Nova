import Link from "next/link";
import { characterFamilies, characterStageById } from "@nova/nova-dex";
import { CharacterCard } from "../../components/CharacterCard";
import styles from "./page.module.css";

export default function NovaDexPage() {
  const families = [...characterFamilies].sort((a, b) => a.dexNumber - b.dexNumber);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.wordmark}>
          NOVA<span>DEX</span>
        </div>
        <Link href="/" className={styles.backLink}>
          ← Back home
        </Link>
      </div>
      <p className={styles.tagline}>
        {families.length} evolution lines. A live index of trading behavior — every listing starts as a habit and
        evolves as the trader&rsquo;s process improves.
      </p>

      {families.map((family) => (
        <section className={styles.familyRow} key={family.id}>
          <div className={styles.familyHead}>
            <span className={styles.dexNo}>N°{String(family.dexNumber).padStart(2, "0")}</span>
            <span className={styles.familyName}>{family.name}</span>
            <span className={styles.familyTheme}>{family.theme}</span>
          </div>
          <div className={styles.chain}>
            {family.stageIds.map((stageId) => {
              const stage = characterStageById[stageId];
              return stage ? <CharacterCard key={stageId} stage={stage} /> : null;
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
