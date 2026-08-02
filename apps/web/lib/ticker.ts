/** Derives a short, terminal-style ticker code from a species name, e.g. "FOMO Monkey" -> "FOMO". */
export function tickerFor(name: string): string {
  const first = name.split(" ")[0]!.toUpperCase().replace(/[^A-Z]/g, "");
  if (first.length <= 5) return first;
  const consonants = first[0] + first.slice(1).replace(/[AEIOU]/g, "");
  return consonants.slice(0, 5);
}

export const TIER_LABEL: Record<string, string> = {
  common: "Micro Cap",
  uncommon: "Small Cap",
  rare: "Mid Cap",
  epic: "Large Cap",
  legendary: "Mega Cap",
};

export function powerIndex(abilities: { power: number }[]): number {
  if (abilities.length === 0) return 0;
  const total = abilities.reduce((sum, a) => sum + a.power, 0);
  return Math.round(total / abilities.length);
}
