import type { CharacterStage } from "@nova/types";
import { characterFamilies, characterStageById } from "./characters.js";

const XP_PER_LEVEL_STEP = 50;

/** Cumulative XP required to have fully reached `level` (level 1 = 0 XP). Triangular growth — each level costs more than the last. */
export function totalXpForLevel(level: number): number {
  return (XP_PER_LEVEL_STEP * (level - 1) * level) / 2;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

/**
 * The stage a character instance should currently display, given its level.
 *
 * This only checks the level gate. Later stages' behavioral `unlock.condition`s
 * (e.g. "20-trade streak with rules followed") aren't enforced yet — there's
 * no trade-tracking data to evaluate them against. For now a character
 * evolves on level alone; revisit once real trade behavior can be checked.
 */
export function currentStageForFamily(familyId: string, level: number): CharacterStage {
  const family = characterFamilies.find((f) => f.id === familyId);
  if (!family) {
    throw new Error(`Unknown character family: ${familyId}`);
  }
  const stages = family.stageIds.map((id) => {
    const stage = characterStageById[id];
    if (!stage) {
      throw new Error(`Family ${familyId} references unknown stage: ${id}`);
    }
    return stage;
  });
  let current = stages[0]!;
  for (const stage of stages) {
    if (stage.unlock.level <= level) {
      current = stage;
    }
  }
  return current;
}
