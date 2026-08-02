export type CharacterRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type CharacterArchetype =
  | "impulsive"
  | "disciplined"
  | "fearful"
  | "greedy"
  | "patient"
  | "analytical"
  | "reckless"
  | "consistent"
  | "overconfident"
  | "anxious"
  | "adaptive"
  | "resilient";

/** 0-100 scale, mirrors the stat bars shown on a character's card. */
export interface CharacterStatBlock {
  impulsivity: number;
  patience: number;
  discipline: number;
  riskManagement: number;
  consistency: number;
  emotionalControl: number;
}

export interface CharacterAbility {
  name: string;
  power: number;
  description: string;
}

/** A real trading behavior mapped to an XP modifier, shown as a Strength or Weakness on the card. */
export interface BehaviorModifier {
  label: string;
  xpModifierPct: number;
}

export interface EvolutionRequirement {
  level: number;
  /** Optional behavioral gate beyond level, e.g. "10 trades with a followed stop-loss". */
  condition?: string;
}

/** One stage in a character's evolution line (e.g. "FOMO Monkey" is stage 0 of the Monkey family). */
export interface CharacterStage {
  id: string;
  familyId: string;
  stageIndex: number;
  name: string;
  title: string;
  archetype: CharacterArchetype;
  rarity: CharacterRarity;
  unlock: EvolutionRequirement;
  stats: CharacterStatBlock;
  abilities: CharacterAbility[];
  strengths: BehaviorModifier[];
  weaknesses: BehaviorModifier[];
  flavorText: string;
}

/** An evolution line, e.g. Monkey -> Ape Apprentice -> Gorillic Trader -> Market Master. */
export interface CharacterFamily {
  id: string;
  name: string;
  theme: string;
  dexNumber: number;
  stageIds: string[];
}

/** A user's captured, leveling instance of a species — distinct from the static species definition above. */
export interface BehavioralCharacter {
  id: string;
  userId: string;
  stageId: string;
  level: number;
  xp: number;
  powerScore: number;
  capturedAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  isPremium: boolean;
}
