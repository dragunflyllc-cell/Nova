import Link from "next/link";
import { characterFamilies, characterStageById } from "@nova/nova-dex";
import { NovaDexBrowser } from "../../components/NovaDexBrowser";
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

      <NovaDexBrowser families={families} stageById={characterStageById} />
    </main>
  );
}
