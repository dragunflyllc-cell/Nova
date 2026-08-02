import Link from "next/link";
import { characterStageById } from "@nova/nova-dex";
import { AuthNav } from "../components/AuthNav";
import { CharacterCard } from "../components/CharacterCard";
import { TickerTape } from "../components/TickerTape";
import { WaitlistForm } from "../components/WaitlistForm";
import { getWaitlistCount } from "../lib/api";
import styles from "./page.module.css";

const FEATURED_STAGE_IDS = ["fomo-monkey", "patient-panda", "revenge-rhino", "hodl-hippo", "sentinel-swan", "market-master"];

export default async function HomePage() {
  const count = await getWaitlistCount();

  return (
    <main>
      <div className={styles.headerBar}>
        <header className={styles.header}>
          <div className={styles.wordmark}>
            NOVA<span>DEX</span>
          </div>
          <AuthNav />
        </header>
      </div>

      <TickerTape />

      <div className={styles.content}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Futures trading, for prop-firm traders</p>
          <h1 className={styles.headline}>Your trading habits, turned into a game you can actually win.</h1>
          <p className={styles.subhead}>
            Nova tracks your real trades and turns your behavior — FOMO, discipline, revenge trading, patience —
            into a roster of characters that level up and evolve as you actually improve. Free to join. No
            pay-to-win.
          </p>
          <div className={styles.waitlistWrap}>
            <WaitlistForm />
            <p className={styles.countLine}>
              <strong>{count.toLocaleString()}</strong> trader{count === 1 ? "" : "s"} already on the list
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Meet your trading crew</h2>
            <p className={styles.sectionSub}>
              A preview from the NovaDex — 51 evolution lines, 154 stages, each modeling a real trading habit that
              evolves as your behavior improves.
            </p>
          </div>
          <div className={styles.crewGrid}>
            {FEATURED_STAGE_IDS.map((id) => {
              const stage = characterStageById[id];
              return stage ? <CharacterCard key={id} stage={stage} /> : null;
            })}
          </div>
        </section>

        <footer className={styles.footer}>
          <span>Nova — free to join, built around better trading behavior.</span>
          <Link href="/novadex">See the full NovaDex →</Link>
        </footer>
      </div>
    </main>
  );
}
