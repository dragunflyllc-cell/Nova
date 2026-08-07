import Link from "next/link";
import { ScenarioPractice } from "../../components/scenarios/ScenarioPractice";
import styles from "./page.module.css";

export default function PracticePage() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.wordmark}>
          NOVA<span>DEX</span>
        </div>
        <Link href="/learn" className={styles.backLink}>
          ← Back to Academy
        </Link>
      </div>

      <p className={styles.eyebrow}>Nova Academy</p>
      <h1 className={styles.title}>Chart scenarios</h1>
      <p className={styles.tagline}>
        Read a setup, decide long or short, place your entry, stop, and target — then see what actually happened.
        These are hand-built practice charts modeling real ICT mechanics (not a replay of an actual historical
        session), designed to drill the read, not memorize a specific trade.
      </p>

      <ScenarioPractice />

      <footer className={styles.footer}>
        <p>
          Want the vocabulary behind these setups? Head back to the <Link href="/learn#ict">ICT Concepts</Link>{" "}
          section of the Academy.
        </p>
      </footer>
    </main>
  );
}
