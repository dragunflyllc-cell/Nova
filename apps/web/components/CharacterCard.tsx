import type { CharacterStage } from "@nova/types";
import { totalXpForLevel } from "@nova/nova-dex";
import styles from "./CharacterCard.module.css";
import { CharacterPortrait } from "./CharacterPortrait";
import { TIER_LABEL, tickerFor } from "../lib/ticker";

const STAT_FIELDS: [key: keyof CharacterStage["stats"], label: string, color: string][] = [
  ["impulsivity", "Impulse", "#4fd1ff"],
  ["patience", "Patience", "#7c6ef6"],
  ["discipline", "Discipline", "#a855f7"],
  ["riskManagement", "Risk Mgmt", "#6366f1"],
  ["consistency", "Consist.", "#3b82f6"],
  ["emotionalControl", "Emo. Ctrl", "#818cf8"],
];

const HOLO_TIERS = new Set(["rare", "epic", "legendary"]);

export interface CharacterCardProps {
  stage: CharacterStage;
  /** 1-based position within the family, used for the card's dex chip (e.g. "003-2"). */
  dexNumber?: number;
  /** When provided (an owned, leveling instance) shows a level/XP row instead of the static dex chip. */
  level?: number;
  xp?: number;
}

export function CharacterCard({ stage, dexNumber, level, xp }: CharacterCardProps) {
  const tierVar = `var(--tier-${stage.rarity})`;
  const topAbility = stage.abilities[0];
  const dexChip = dexNumber !== undefined ? `${String(dexNumber).padStart(3, "0")}-${stage.stageIndex + 1}` : undefined;
  const topStrength = stage.strengths[0];
  const topWeakness = stage.weaknesses[0];
  const isOwned = level !== undefined && xp !== undefined;
  const holo = HOLO_TIERS.has(stage.rarity);

  return (
    <div
      className={styles.card}
      data-holo={holo || undefined}
      style={{ ["--tier-color" as string]: tierVar }}
      title={stage.flavorText}
    >
      <div className={styles.frame}>
        <div className={styles.artLayer}>
          <CharacterPortrait stageId={stage.id} name={stage.name} />
        </div>
        <div className={styles.scrimTop} />
        <div className={styles.scrimBottom} />
        {holo ? <div className={styles.holoLayer} /> : null}
        <span className={styles.gemBadge} />

        <div className={styles.content}>
          <div className={styles.headerRow}>
            {isOwned ? (
              <span className={styles.levelTag}>Lv. {level}</span>
            ) : dexChip ? (
              <span className={styles.dexNo}>No. {dexChip}</span>
            ) : (
              <span />
            )}
            <div className={styles.tagStack}>
              <span className={styles.archetypeTag}>{stage.archetype}</span>
              <span className={styles.rarityTag}>{TIER_LABEL[stage.rarity]}</span>
            </div>
          </div>

          <div className={styles.spacer} />

          {isOwned ? (
            <div className={styles.xpTrack}>
              <span className={styles.xpFill} style={{ width: `${xpProgressPct(level, xp)}%` }} />
            </div>
          ) : null}

          <div className={styles.footerBlock}>
            <div className={styles.nameRow}>
              <div>
                <div className={styles.name}>{stage.name}</div>
                <div className={styles.titleLine}>{stage.title}</div>
              </div>
              <span className={styles.tickerCode}>${tickerFor(stage.name)}</span>
            </div>

            {topAbility ? (
              <div className={styles.abilityCallout}>
                <span className={styles.abilityLabel}>Signature Ability</span>
                <div className={styles.abilityLine}>
                  <span className={styles.abilityName}>{topAbility.name}</span>
                  <span className={styles.abilityPwr}>{topAbility.power}</span>
                </div>
              </div>
            ) : null}

            <div className={styles.statDots}>
              {STAT_FIELDS.map(([key, label, color]) => (
                <div className={styles.statCell} key={key}>
                  <span className={styles.statDot} style={{ background: color }} />
                  <span className={styles.statLabel}>{label}</span>
                  <span className={styles.statVal}>{stage.stats[key]}</span>
                </div>
              ))}
            </div>

            {topStrength || topWeakness ? (
              <div className={styles.edgeLine}>
                {topStrength ? <span className={styles.edgeGain}>▲ {topStrength.label}</span> : <span />}
                {topWeakness ? <span className={styles.edgeLoss}>▼ {topWeakness.label}</span> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function xpProgressPct(level: number, xp: number): number {
  const currentFloor = totalXpForLevel(level);
  const nextFloor = totalXpForLevel(level + 1);
  const span = nextFloor - currentFloor;
  return span > 0 ? Math.min(100, Math.max(0, ((xp - currentFloor) / span) * 100)) : 100;
}
