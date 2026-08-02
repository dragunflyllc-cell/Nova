import { characterStages } from "@nova/nova-dex";
import { powerIndex, tickerFor } from "../lib/ticker";
import styles from "./TickerTape.module.css";

export function TickerTape() {
  const items = characterStages.map((s) => (
    <span className={styles.item} key={s.id}>
      <span className={styles.dot} style={{ background: `var(--tier-${s.rarity})` }} />${tickerFor(s.name)} {powerIndex(s.abilities)}
    </span>
  ));

  return (
    <div className={styles.tape} aria-hidden="true">
      <div className={styles.track}>
        {items}
        {items}
      </div>
    </div>
  );
}
