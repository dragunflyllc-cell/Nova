import type { CharacterStage } from "@nova/types";
import { totalXpForLevel } from "@nova/nova-dex";
import styles from "./CharacterCard.module.css";
import { TIER_LABEL, powerIndex, tickerFor } from "../lib/ticker";

const STAT_FIELDS: [key: keyof CharacterStage["stats"], label: string][] = [
  ["impulsivity", "Impulse"],
  ["patience", "Patience"],
  ["discipline", "Discipline"],
  ["riskManagement", "Risk Mgmt"],
  ["consistency", "Consist."],
  ["emotionalControl", "Emo. Ctrl"],
];

export interface CharacterCardProps {
  stage: CharacterStage;
  /** When provided (an owned, leveling instance) shows a level/XP row instead of the static unlock line. */
  level?: number;
  xp?: number;
}

export function CharacterCard({ stage, level, xp }: CharacterCardProps) {
  const tierVar = `var(--tier-${stage.rarity})`;
  const topAbility = stage.abilities[0];

  return (
    <div className={styles.card} style={{ ["--tier-color" as string]: tierVar }}>
      <div className={styles.top}>
        <span className={styles.tierPill}>
          <span className={styles.tierDot} />
          {TIER_LABEL[stage.rarity]}
        </span>
        <span className={styles.powerBadge}>PWR {powerIndex(stage.abilities)}</span>
      </div>

      <div className={styles.tickerCode}>${tickerFor(stage.name)}</div>

      <div>
        <div className={styles.name}>{stage.name}</div>
        <div className={styles.title}>{stage.title}</div>
      </div>

      <span className={styles.sectorTag}>{stage.archetype}</span>

      {level !== undefined && xp !== undefined ? (
        <LevelProgress level={level} xp={xp} />
      ) : (
        <div className={styles.levelRow}>
          <span>{stage.stageIndex === 0 ? "Starting form" : `Lv. ${stage.unlock.level}`}</span>
        </div>
      )}

      <div className={styles.statRows}>
        {STAT_FIELDS.map(([key, label]) => (
          <div className={styles.statRow} key={key}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statTrack}>
              <span className={styles.statFill} style={{ width: `${stage.stats[key]}%` }} />
            </span>
            <span className={styles.statVal}>{stage.stats[key]}</span>
          </div>
        ))}
      </div>

      {topAbility ? (
        <div className={styles.flavorText} style={{ borderTop: "none", paddingTop: 0, fontStyle: "normal", color: "var(--ink-dim)" }}>
          <strong style={{ color: "var(--ink)" }}>{topAbility.name}</strong> — {topAbility.description}
        </div>
      ) : null}

      <div className={styles.flavorText}>{stage.flavorText}</div>
    </div>
  );
}

function LevelProgress({ level, xp }: { level: number; xp: number }) {
  const currentFloor = totalXpForLevel(level);
  const nextFloor = totalXpForLevel(level + 1);
  const span = nextFloor - currentFloor;
  const progressPct = span > 0 ? Math.min(100, Math.max(0, ((xp - currentFloor) / span) * 100)) : 100;

  return (
    <div>
      <div className={styles.levelRow}>
        <span>Lv. {level}</span>
        <span>{xp.toLocaleString()} XP</span>
      </div>
      <div className={styles.xpTrack}>
        <span className={styles.xpFill} style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}
