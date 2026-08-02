"use client";

import { useMemo, useState } from "react";
import type { CharacterFamily, CharacterStage } from "@nova/types";
import { CharacterCard } from "./CharacterCard";
import { tickerFor } from "../lib/ticker";
import styles from "./NovaDexBrowser.module.css";

const TIER_ORDER = ["legendary", "epic", "rare", "uncommon", "common"] as const;
const TIER_LABEL: Record<string, string> = {
  common: "Micro Cap",
  uncommon: "Small Cap",
  rare: "Mid Cap",
  epic: "Large Cap",
  legendary: "Mega Cap",
};

interface NovaDexBrowserProps {
  families: CharacterFamily[];
  stageById: Record<string, CharacterStage>;
}

export function NovaDexBrowser({ families, stageById }: NovaDexBrowserProps) {
  const [search, setSearch] = useState("");
  const [rarities, setRarities] = useState<Set<string>>(new Set());
  const [archetypes, setArchetypes] = useState<Set<string>>(new Set());

  const allStages = useMemo(() => Object.values(stageById), [stageById]);

  const rarityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allStages) counts.set(s.rarity, (counts.get(s.rarity) ?? 0) + 1);
    return counts;
  }, [allStages]);

  const archetypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allStages) counts.set(s.archetype, (counts.get(s.archetype) ?? 0) + 1);
    return counts;
  }, [allStages]);

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSet(next);
  }

  function matches(stage: CharacterStage): boolean {
    const q = search.trim().toLowerCase();
    const text = `${stage.name} ${stage.title} ${tickerFor(stage.name)}`.toLowerCase();
    const matchesSearch = !q || text.includes(q);
    const matchesRarity = rarities.size === 0 || rarities.has(stage.rarity);
    const matchesArchetype = archetypes.size === 0 || archetypes.has(stage.archetype);
    return matchesSearch && matchesRarity && matchesArchetype;
  }

  const visibleFamilies = families.filter((family) => family.stageIds.some((id) => matches(stageById[id]!)));

  return (
    <>
      <div className={styles.controls}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search species, ticker, or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search NovaDex"
        />
        <div className={styles.chipGroup} aria-label="Filter by market cap tier">
          {TIER_ORDER.filter((t) => rarityCounts.has(t)).map((tier) => (
            <button
              key={tier}
              type="button"
              className={`${styles.chip} ${rarities.has(tier) ? styles.chipActive : ""}`}
              aria-pressed={rarities.has(tier)}
              onClick={() => toggle(rarities, setRarities, tier)}
            >
              {TIER_LABEL[tier]} <span className={styles.chipCount}>{rarityCounts.get(tier)}</span>
            </button>
          ))}
        </div>
        <div className={styles.chipGroup} aria-label="Filter by sector">
          {[...archetypeCounts.keys()].sort().map((archetype) => (
            <button
              key={archetype}
              type="button"
              className={`${styles.chip} ${archetypes.has(archetype) ? styles.chipActive : ""}`}
              aria-pressed={archetypes.has(archetype)}
              onClick={() => toggle(archetypes, setArchetypes, archetype)}
            >
              {archetype} <span className={styles.chipCount}>{archetypeCounts.get(archetype)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => {
            setSearch("");
            setRarities(new Set());
            setArchetypes(new Set());
          }}
        >
          Reset
        </button>
      </div>

      {visibleFamilies.length === 0 ? (
        <p className={styles.emptyState}>No listings match the current filters.</p>
      ) : null}

      {families.map((family) => {
        const stages = family.stageIds.map((id) => stageById[id]!);
        const anyMatch = stages.some(matches);
        return (
          <section className={styles.familyRow} key={family.id} data-hidden={!anyMatch}>
            <div className={styles.familyHead}>
              <span className={styles.dexNo}>N°{String(family.dexNumber).padStart(2, "0")}</span>
              <span className={styles.familyName}>{family.name}</span>
              <span className={styles.familyTheme}>{family.theme}</span>
            </div>
            <div className={styles.chain}>
              {stages.map((stage) => (
                <div key={stage.id} className={styles.chainCard} data-dimmed={!matches(stage)}>
                  <CharacterCard stage={stage} dexNumber={family.dexNumber} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
