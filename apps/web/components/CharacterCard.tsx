import type { CharacterStage } from "@nova/types";
import { totalXpForLevel } from "@nova/nova-dex";
import styles from "./CharacterCard.module.css";
import { CharacterPortrait } from "./CharacterPortrait";
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
  /** 1-based position within the family, used for the card's dex chip (e.g. "003-2"). */
  dexNumber?: number;
  /** When provided (an owned, leveling instance) shows a level/XP row instead of the static unlock line. */
  level?: number;
  xp?: number;
}

export function CharacterCard({ stage, dexNumber, level, xp }: CharacterCardProps) {
  const tierVar = `var(--tier-${stage.rarity})`;
  const topAbility = stage.abilities[0];
  const dexChip = dexNumber !== undefined ? `${String(dexNumber).padStart(3, "0")}-${stage.stageIndex + 1}` : undefined;
  const unlockLabel = stage.stageIndex === 0 ? "Starting form" : `Lv. ${stage.unlock.level}`;

  return (
    <div className={styles.card} style={{ ["--tier-color" as string]: tierVar }}>
      <div className={styles.body}>
        <div className={styles.top}>
          <div>
            <div className={styles.name}>{stage.name}</div>
            <div className={styles.title}>{stage.title}</div>
          </div>
          <span className={styles.hpBadge}>
            <span>PWR</span>
            <span>{powerIndex(stage.abilities)}</span>
          </span>
        </div>

        <div className={styles.subhead}>
          <span className={styles.tierPill}>
            <span className={styles.tierDot} />
            {TIER_LABEL[stage.rarity]}
          </span>
          <span className={styles.tickerCode}>${tickerFor(stage.name)}</span>
        </div>

        <div className={styles.portraitWindow}>
          <CharacterPortrait stageId={stage.id} name={stage.name} />
          {dexChip ? <span className={styles.dexChip}>{dexChip}</span> : null}
        </div>

        <span className={styles.sectorTag}>
          {stage.archetype} · {unlockLabel}
        </span>

        {level !== undefined && xp !== undefined ? <LevelProgress level={level} xp={xp} /> : null}

        {topAbility ? (
          <div className={styles.abilityBox}>
            <div className={styles.abilityLine}>
              <span className={styles.energyIcon} />
              <span className={styles.abilityName}>{topAbility.name}</span>
              <span className={styles.abilityPwr}>{topAbility.power}</span>
            </div>
            <div className={styles.abilityDesc}>{topAbility.description}</div>
          </div>
        ) : null}

        <div className={styles.statChart}>
          <div className={styles.statChartTitle}>Trading DNA</div>
          <div className={styles.statGrid}>
            {STAT_FIELDS.map(([key, label]) => (
              <div className={styles.statRow} key={key}>
                <span className={styles.statRowHead}>
                  <span>{label}</span>
                  <span className={styles.statVal}>{stage.stats[key]}</span>
                </span>
                <span className={styles.statTrack}>
                  <span className={styles.statFill} style={{ width: `${stage.stats[key]}%` }} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.edgeRow}>
          <div className={styles.edgeCol}>
            <span className={styles.edgeLabel}>Strengths</span>
            <ModifierChips list={stage.strengths} kind="gain" />
          </div>
          <div className={styles.edgeCol}>
            <span className={styles.edgeLabel}>Weaknesses</span>
            <ModifierChips list={stage.weaknesses} kind="loss" />
          </div>
        </div>

        <div className={styles.flavorBox}>
          <p className={styles.flavorText}>{stage.flavorText}</p>
          {dexChip ? (
            <div className={styles.cardFooter}>
              <span>No. {dexChip}</span>
              <span>Illus. Nova AI</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ModifierChips({ list, kind }: { list: { label: string; xpModifierPct: number }[]; kind: "gain" | "loss" }) {
  if (list.length === 0) {
    return (
      <span className={`${styles.modifierChip} ${styles[kind]}`} style={{ opacity: 0.4 }}>
        None yet
      </span>
    );
  }
  return (
    <div className={styles.modifierRow}>
      {list.map((m) => (
        <span className={`${styles.modifierChip} ${styles[kind]}`} key={m.label}>
          {kind === "gain" ? "+" : ""}
          {m.xpModifierPct}% {m.label}
        </span>
      ))}
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
