import type { CharacterFamily, CharacterStage } from "@nova/types";

/**
 * NovaDex — 51 families, 154 evolutionary stages.
 *
 * Design rule: every family starts as a *bad habit* (or, for a few, a raw
 * instinct) and evolves toward a mastered version of that same trait as the
 * trader's real behavior improves. Evolution is earned by level (XP from
 * good trading behavior) and, for later stages, a behavioral condition —
 * not just time-in-app.
 *
 * Families 1-7 (Monkey, Panda, Hippo, Goblin, Fox, Otter, Rhino) are fully
 * detailed to match the original character-card and dashboard mockups.
 * Families 8-38 are animals, at lighter detail — one signature ability
 * instead of several. Families 39-51 branch out of the animal kingdom into
 * mythical creatures (Dragon, Unicorn, Griffin, Kraken, Sphinx, Hydra,
 * Basilisk, Centaur, Siren, Leviathan, Wendigo, Ouroboros, Manticore),
 * generally skewed to rarer tiers (rare/epic/legendary) than the animal
 * roster — they're meant to feel like a step up, not a reskin. All of it is
 * meant to be filled out with art and full stat/ability balancing in a
 * follow-up pass. Add new families here; keep dexNumber sequential and
 * archetype values in sync with packages/types/src/character.ts#CharacterArchetype.
 */
export const characterStages: CharacterStage[] = [
  // ── 1. MONKEY LINE — Impulsivity / FOMO ─────────────────────────────
  {
    id: "fomo-monkey",
    familyId: "monkey-line",
    stageIndex: 0,
    name: "FOMO Monkey",
    title: "The Impulsive Trader",
    archetype: "impulsive",
    rarity: "legendary",
    unlock: { level: 1 },
    stats: { impulsivity: 95, patience: 10, discipline: 15, riskManagement: 20, consistency: 25, emotionalControl: 10 },
    abilities: [
      { name: "Market Order", power: 95, description: "Enters immediately without analysis. High damage, low accuracy." },
      { name: "Chase", power: 80, description: "Chases price after a move has already happened." },
      { name: "Revenge Trade", power: 90, description: "Strikes back recklessly after taking a loss." },
      { name: "Hopium", power: 70, description: "Holds a loser, believing \"it will go back up.\"" },
    ],
    strengths: [
      { label: "Follows Plan", xpModifierPct: 15 },
      { label: "Stops After Win", xpModifierPct: 10 },
      { label: "Manages Risk", xpModifierPct: 20 },
    ],
    weaknesses: [
      { label: "FOMO Entry", xpModifierPct: -20 },
      { label: "Revenge Trading", xpModifierPct: -25 },
      { label: "Breaks Rules", xpModifierPct: -30 },
    ],
    flavorText: "Naturally drawn to shiny green candles. Evolves after repeated losses and deep reflection (or a full account blow-up).",
  },
  {
    id: "ape-apprentice",
    familyId: "monkey-line",
    stageIndex: 1,
    name: "Ape Apprentice",
    title: "The Recovering Trader",
    archetype: "impulsive",
    rarity: "legendary",
    unlock: { level: 16, condition: "10 trades taken with a pre-written plan" },
    stats: { impulsivity: 70, patience: 30, discipline: 35, riskManagement: 35, consistency: 40, emotionalControl: 30 },
    abilities: [
      { name: "Sized Entry", power: 60, description: "Enters with a defined position size instead of guessing." },
      { name: "Cooldown", power: 50, description: "Steps away from the screen after a loss instead of chasing." },
    ],
    strengths: [{ label: "Sizes Positions", xpModifierPct: 20 }, { label: "Uses Stop Loss", xpModifierPct: 20 }],
    weaknesses: [{ label: "Still Chases News", xpModifierPct: -15 }, { label: "Impatient Exits", xpModifierPct: -10 }],
    flavorText: "Starting to notice the pattern. Still slips back into old habits under pressure.",
  },
  {
    id: "gorillic-trader",
    familyId: "monkey-line",
    stageIndex: 2,
    name: "Gorillic Trader",
    title: "The Grinder",
    archetype: "disciplined",
    rarity: "legendary",
    unlock: { level: 36, condition: "20-trade streak with rules followed" },
    stats: { impulsivity: 40, patience: 55, discipline: 65, riskManagement: 60, consistency: 65, emotionalControl: 55 },
    abilities: [
      { name: "Confirmed Entry", power: 70, description: "Waits for confluence before pulling the trigger." },
      { name: "Risk Cap", power: 65, description: "Never risks more than the plan allows." },
    ],
    strengths: [{ label: "Consistent Sizing", xpModifierPct: 25 }, { label: "Journaled Every Trade", xpModifierPct: 20 }],
    weaknesses: [{ label: "Occasional Overtrading", xpModifierPct: -10 }],
    flavorText: "Built real habits through repetition. Losses no longer trigger a spiral.",
  },
  {
    id: "market-master",
    familyId: "monkey-line",
    stageIndex: 3,
    name: "Market Master",
    title: "The Composed Professional",
    archetype: "disciplined",
    rarity: "legendary",
    unlock: { level: 60, condition: "50-trade streak, zero rule violations" },
    stats: { impulsivity: 15, patience: 85, discipline: 90, riskManagement: 88, consistency: 85, emotionalControl: 85 },
    abilities: [
      { name: "Process Over Outcome", power: 90, description: "Grades the trade by process, win or lose." },
      { name: "Unshaken", power: 85, description: "Immune to FOMO and revenge-trade triggers." },
    ],
    strengths: [{ label: "Full Rule Adherence", xpModifierPct: 30 }, { label: "Mentors Others", xpModifierPct: 20 }],
    weaknesses: [],
    flavorText: "The final form of the trader who used to buy every green candle. Proof the arc is real.",
  },

  // ── 2. PANDA LINE — Patience / Discipline ───────────────────────────
  {
    id: "patient-panda",
    familyId: "panda-line",
    stageIndex: 0,
    name: "Patient Panda",
    title: "The Disciplined Investor",
    archetype: "patient",
    rarity: "rare",
    unlock: { level: 1 },
    stats: { impulsivity: 15, patience: 80, discipline: 70, riskManagement: 60, consistency: 65, emotionalControl: 60 },
    abilities: [
      { name: "Wait It Out", power: 60, description: "Sits on hands until the setup is fully confirmed." },
      { name: "Slow Bleed Guard", power: 55, description: "Cuts small losses before they compound." },
    ],
    strengths: [{ label: "Waits for Confirmation", xpModifierPct: 20 }, { label: "Rarely Overtrades", xpModifierPct: 15 }],
    weaknesses: [{ label: "Sometimes Too Slow to Act", xpModifierPct: -10 }],
    flavorText: "Already ahead of most traders. Evolves by turning patience into precision.",
  },
  {
    id: "zen-panda",
    familyId: "panda-line",
    stageIndex: 1,
    name: "Zen Panda",
    title: "The Grounded Trader",
    archetype: "patient",
    rarity: "rare",
    unlock: { level: 16 },
    stats: { impulsivity: 10, patience: 88, discipline: 80, riskManagement: 72, consistency: 78, emotionalControl: 75 },
    abilities: [{ name: "Stillness", power: 70, description: "Untouched by market noise or social media hype." }],
    strengths: [{ label: "Emotionally Steady", xpModifierPct: 25 }],
    weaknesses: [{ label: "Occasionally Misses Momentum", xpModifierPct: -8 }],
    flavorText: "Trades like the market owes it nothing.",
  },
  {
    id: "sage-panda",
    familyId: "panda-line",
    stageIndex: 2,
    name: "Sage Panda",
    title: "The Mentor",
    archetype: "disciplined",
    rarity: "epic",
    unlock: { level: 36 },
    stats: { impulsivity: 5, patience: 92, discipline: 90, riskManagement: 85, consistency: 88, emotionalControl: 88 },
    abilities: [{ name: "Teach the Way", power: 80, description: "Boosts XP for nearby traders it mentors." }],
    strengths: [{ label: "Helps Beginners", xpModifierPct: 25 }],
    weaknesses: [],
    flavorText: "Sought after in the community for calm, precise guidance.",
  },
  {
    id: "grandmaster-panda",
    familyId: "panda-line",
    stageIndex: 3,
    name: "Grandmaster Panda",
    title: "The Institution",
    archetype: "disciplined",
    rarity: "legendary",
    unlock: { level: 60, condition: "Reputation Score in top 1%" },
    stats: { impulsivity: 5, patience: 95, discipline: 95, riskManagement: 92, consistency: 93, emotionalControl: 92 },
    abilities: [{ name: "Unmovable", power: 95, description: "Statistically immune to tilt." }],
    strengths: [{ label: "Elite Consistency", xpModifierPct: 30 }],
    weaknesses: [],
    flavorText: "The trader other traders study.",
  },

  // ── 3. HIPPO LINE — Diamond Hands / Conviction ──────────────────────
  {
    id: "hodl-hippo",
    familyId: "hippo-line",
    stageIndex: 0,
    name: "HODL Hippo",
    title: "The Diamond Hands",
    archetype: "resilient",
    rarity: "rare",
    unlock: { level: 1 },
    stats: { impulsivity: 20, patience: 90, discipline: 55, riskManagement: 40, consistency: 60, emotionalControl: 65 },
    abilities: [{ name: "Just HODL", power: 75, description: "Refuses to sell, for better or worse." }],
    strengths: [{ label: "Rides Winners", xpModifierPct: 20 }],
    weaknesses: [{ label: "No Exit Plan", xpModifierPct: -20 }, { label: "Ignores Stop Loss", xpModifierPct: -15 }],
    flavorText: "Conviction without a plan is just hope with extra steps.",
  },
  {
    id: "vault-hippo",
    familyId: "hippo-line",
    stageIndex: 1,
    name: "Vault Hippo",
    title: "The Position Sizer",
    archetype: "resilient",
    rarity: "rare",
    unlock: { level: 20, condition: "Every open position has a stop loss set" },
    stats: { impulsivity: 15, patience: 88, discipline: 70, riskManagement: 65, consistency: 70, emotionalControl: 72 },
    abilities: [{ name: "Defined Exit", power: 70, description: "Holds with conviction, but always with a stop." }],
    strengths: [{ label: "Always Uses Stops", xpModifierPct: 25 }],
    weaknesses: [{ label: "Slow to Take Profit", xpModifierPct: -10 }],
    flavorText: "Learned that conviction and risk management aren't opposites.",
  },
  {
    id: "fortress-hippo",
    familyId: "hippo-line",
    stageIndex: 2,
    name: "Fortress Hippo",
    title: "The Long-Term Compounder",
    archetype: "resilient",
    rarity: "epic",
    unlock: { level: 45 },
    stats: { impulsivity: 10, patience: 92, discipline: 85, riskManagement: 82, consistency: 85, emotionalControl: 85 },
    abilities: [{ name: "Compound Wall", power: 88, description: "Portfolio built to survive any single bad trade." }],
    strengths: [{ label: "Portfolio Diversified", xpModifierPct: 25 }],
    weaknesses: [],
    flavorText: "Nothing gets through. Nothing needs to.",
  },

  // ── 4. GOBLIN LINE — Greed ───────────────────────────────────────────
  {
    id: "greedy-goblin",
    familyId: "goblin-line",
    stageIndex: 0,
    name: "Greedy Goblin",
    title: "The Profit Chaser",
    archetype: "greedy",
    rarity: "uncommon",
    unlock: { level: 1 },
    stats: { impulsivity: 65, patience: 20, discipline: 25, riskManagement: 25, consistency: 30, emotionalControl: 20 },
    abilities: [{ name: "Never Enough", power: 80, description: "Holds past the target, hoping for more." }],
    strengths: [{ label: "High Risk Appetite", xpModifierPct: 10 }],
    weaknesses: [{ label: "No Take-Profit Discipline", xpModifierPct: -25 }, { label: "Overleverages", xpModifierPct: -20 }],
    flavorText: "Turns winners into losers by refusing to take the win.",
  },
  {
    id: "hoarder-goblin",
    familyId: "goblin-line",
    stageIndex: 1,
    name: "Hoarder Goblin",
    title: "The Partial Profiteer",
    archetype: "greedy",
    rarity: "uncommon",
    unlock: { level: 18, condition: "Scales out of 10 winning trades" },
    stats: { impulsivity: 45, patience: 40, discipline: 45, riskManagement: 45, consistency: 50, emotionalControl: 40 },
    abilities: [{ name: "Scale Out", power: 65, description: "Banks partial profit instead of holding for everything." }],
    strengths: [{ label: "Takes Partial Profit", xpModifierPct: 20 }],
    weaknesses: [{ label: "Still Greedy on Runners", xpModifierPct: -10 }],
    flavorText: "Learning that a booked profit beats a hoped-for one.",
  },
  {
    id: "tycoon-troll",
    familyId: "goblin-line",
    stageIndex: 2,
    name: "Tycoon Troll",
    title: "The Profit Taker",
    archetype: "disciplined",
    rarity: "rare",
    unlock: { level: 40 },
    stats: { impulsivity: 25, patience: 65, discipline: 75, riskManagement: 72, consistency: 75, emotionalControl: 65 },
    abilities: [{ name: "Target Lock", power: 80, description: "Executes the exit plan exactly as written." }],
    strengths: [{ label: "Disciplined Take-Profit", xpModifierPct: 25 }],
    weaknesses: [],
    flavorText: "Greed, redirected into a system instead of a feeling.",
  },

  // ── 5. FOX LINE — Fear / Early Exits ─────────────────────────────────
  {
    id: "fearful-fox",
    familyId: "fox-line",
    stageIndex: 0,
    name: "Fearful Fox",
    title: "The Early Exiter",
    archetype: "fearful",
    rarity: "uncommon",
    unlock: { level: 1 },
    stats: { impulsivity: 40, patience: 25, discipline: 40, riskManagement: 50, consistency: 30, emotionalControl: 25 },
    abilities: [{ name: "Panic Sell", power: 60, description: "Exits at the first sign of red." }],
    strengths: [{ label: "Cuts Losses Fast", xpModifierPct: 15 }],
    weaknesses: [{ label: "Exits Winners Too Early", xpModifierPct: -20 }, { label: "Skips Valid Setups", xpModifierPct: -15 }],
    flavorText: "So afraid of losing that it never lets a winner run.",
  },
  {
    id: "cautious-fox",
    familyId: "fox-line",
    stageIndex: 1,
    name: "Cautious Fox",
    title: "The Measured Exiter",
    archetype: "fearful",
    rarity: "uncommon",
    unlock: { level: 18, condition: "Holds 10 winners to their target" },
    stats: { impulsivity: 30, patience: 45, discipline: 55, riskManagement: 60, consistency: 50, emotionalControl: 45 },
    abilities: [{ name: "Trust the Plan", power: 65, description: "Lets the target play out instead of flinching." }],
    strengths: [{ label: "Holds to Target", xpModifierPct: 20 }],
    weaknesses: [{ label: "Still Hesitates on Entry", xpModifierPct: -10 }],
    flavorText: "Fear is quieter now. The plan speaks louder.",
  },
  {
    id: "composed-fox",
    familyId: "fox-line",
    stageIndex: 2,
    name: "Composed Fox",
    title: "The Calculated Trader",
    archetype: "disciplined",
    rarity: "rare",
    unlock: { level: 40 },
    stats: { impulsivity: 20, patience: 70, discipline: 75, riskManagement: 78, consistency: 72, emotionalControl: 75 },
    abilities: [{ name: "Clear Eyes", power: 78, description: "Reads price without fear distorting the picture." }],
    strengths: [{ label: "Full-Target Exits", xpModifierPct: 25 }],
    weaknesses: [],
    flavorText: "Fear became a signal to check the plan, not abandon it.",
  },

  // ── 6. OTTER LINE — Overtrading ──────────────────────────────────────
  {
    id: "overtrade-otter",
    familyId: "otter-line",
    stageIndex: 0,
    name: "Overtrade Otter",
    title: "The Hyperactive Scalper",
    archetype: "reckless",
    rarity: "uncommon",
    unlock: { level: 1 },
    stats: { impulsivity: 80, patience: 15, discipline: 20, riskManagement: 30, consistency: 20, emotionalControl: 20 },
    abilities: [{ name: "Click Frenzy", power: 70, description: "Takes trades out of boredom, not opportunity." }],
    strengths: [{ label: "Fast Reactions", xpModifierPct: 10 }],
    weaknesses: [{ label: "Excessive Trade Frequency", xpModifierPct: -25 }, { label: "Ignores Setup Quality", xpModifierPct: -15 }],
    flavorText: "Confuses activity with progress.",
  },
  {
    id: "restless-otter",
    familyId: "otter-line",
    stageIndex: 1,
    name: "Restless Otter",
    title: "The Selective Scalper",
    archetype: "reckless",
    rarity: "uncommon",
    unlock: { level: 18, condition: "Stays under a daily trade-count limit for 2 weeks" },
    stats: { impulsivity: 55, patience: 35, discipline: 45, riskManagement: 45, consistency: 45, emotionalControl: 40 },
    abilities: [{ name: "Trade Limit", power: 60, description: "Stops for the day once a cap is hit." }],
    strengths: [{ label: "Respects Daily Limit", xpModifierPct: 20 }],
    weaknesses: [{ label: "Still Trades When Bored", xpModifierPct: -10 }],
    flavorText: "Fewer trades, better trades.",
  },
  {
    id: "focused-otter",
    familyId: "otter-line",
    stageIndex: 2,
    name: "Focused Otter",
    title: "The Precision Scalper",
    archetype: "disciplined",
    rarity: "rare",
    unlock: { level: 40 },
    stats: { impulsivity: 30, patience: 55, discipline: 70, riskManagement: 68, consistency: 70, emotionalControl: 65 },
    abilities: [{ name: "Sniper Entry", power: 82, description: "Only pulls the trigger on A+ setups." }],
    strengths: [{ label: "High Setup Quality", xpModifierPct: 25 }],
    weaknesses: [],
    flavorText: "Quality replaced quantity, and results followed.",
  },

  // ── 7. RHINO LINE — Revenge Trading ──────────────────────────────────
  {
    id: "revenge-rhino",
    familyId: "rhino-line",
    stageIndex: 0,
    name: "Revenge Rhino",
    title: "The Angry Trader",
    archetype: "reckless",
    rarity: "uncommon",
    unlock: { level: 1 },
    stats: { impulsivity: 85, patience: 10, discipline: 20, riskManagement: 20, consistency: 25, emotionalControl: 10 },
    abilities: [{ name: "Charge", power: 90, description: "Doubles down immediately after a loss." }],
    strengths: [{ label: "High Conviction", xpModifierPct: 10 }],
    weaknesses: [{ label: "Revenge Trading", xpModifierPct: -30 }, { label: "Breaks Daily Loss Limit", xpModifierPct: -25 }],
    flavorText: "Trades the market to get even, not to win.",
  },
  {
    id: "simmer-rhino",
    familyId: "rhino-line",
    stageIndex: 1,
    name: "Simmer Rhino",
    title: "The Cooling Trader",
    archetype: "reckless",
    rarity: "uncommon",
    unlock: { level: 18, condition: "Walks away after a loss 10 times instead of re-entering" },
    stats: { impulsivity: 55, patience: 35, discipline: 45, riskManagement: 45, consistency: 45, emotionalControl: 40 },
    abilities: [{ name: "Step Back", power: 60, description: "Takes a mandatory cooldown after a loss." }],
    strengths: [{ label: "Uses Cooldown Timer", xpModifierPct: 20 }],
    weaknesses: [{ label: "Still Tilts Occasionally", xpModifierPct: -12 }],
    flavorText: "Anger still shows up. It just doesn't drive anymore.",
  },
  {
    id: "iron-rhino",
    familyId: "rhino-line",
    stageIndex: 2,
    name: "Iron Rhino",
    title: "The Unshaken Trader",
    archetype: "disciplined",
    rarity: "rare",
    unlock: { level: 40 },
    stats: { impulsivity: 20, patience: 68, discipline: 78, riskManagement: 75, consistency: 75, emotionalControl: 78 },
    abilities: [{ name: "Loss Limit Lock", power: 85, description: "Hard-stops trading once the daily loss cap is hit." }],
    strengths: [{ label: "Honors Loss Limits", xpModifierPct: 28 }],
    weaknesses: [],
    flavorText: "A loss is just data now.",
  },

  // ── 8. OWL LINE — Overanalysis / Paralysis ───────────────────────────
  {
    id: "overthink-owl",
    familyId: "owl-line",
    stageIndex: 0,
    name: "Overthink Owl",
    title: "The Paralyzed Analyst",
    archetype: "analytical",
    rarity: "uncommon",
    unlock: { level: 1 },
    stats: { impulsivity: 15, patience: 60, discipline: 40, riskManagement: 50, consistency: 30, emotionalControl: 35 },
    abilities: [{ name: "Analysis Loop", power: 55, description: "Adds indicator after indicator until the entry is gone." }],
    strengths: [{ label: "Thorough Research", xpModifierPct: 15 }],
    weaknesses: [{ label: "Misses Entries", xpModifierPct: -20 }],
    flavorText: "Knows everything about the setup except when to take it.",
  },
  {
    id: "study-owl",
    familyId: "owl-line",
    stageIndex: 1,
    name: "Study Owl",
    title: "The Efficient Analyst",
    archetype: "analytical",
    rarity: "uncommon",
    unlock: { level: 18 },
    stats: { impulsivity: 15, patience: 65, discipline: 55, riskManagement: 60, consistency: 55, emotionalControl: 55 },
    abilities: [{ name: "Checklist", power: 65, description: "A fixed, short checklist replaces endless analysis." }],
    strengths: [{ label: "Fast, Confident Entries", xpModifierPct: 18 }],
    weaknesses: [{ label: "Occasional Second-Guessing", xpModifierPct: -8 }],
    flavorText: "Traded certainty for a system that's good enough.",
  },
  {
    id: "insight-owl",
    familyId: "owl-line",
    stageIndex: 2,
    name: "Insight Owl",
    title: "The Sharp Analyst",
    archetype: "analytical",
    rarity: "rare",
    unlock: { level: 40 },
    stats: { impulsivity: 10, patience: 75, discipline: 78, riskManagement: 80, consistency: 78, emotionalControl: 75 },
    abilities: [{ name: "Signal Clarity", power: 85, description: "Sees the setup and acts without hesitation." }],
    strengths: [{ label: "Decisive Execution", xpModifierPct: 25 }],
    weaknesses: [],
    flavorText: "Analysis in seconds, not hours.",
  },

  // ── 9. HARE LINE — Anxiety / Panic Selling ───────────────────────────
  { id: "anxious-hare", familyId: "hare-line", stageIndex: 0, name: "Anxious Hare", title: "The Nervous Trader", archetype: "anxious", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 55, patience: 20, discipline: 30, riskManagement: 35, consistency: 25, emotionalControl: 15 }, abilities: [{ name: "Bolt", power: 60, description: "Flees a trade at the first flicker of volatility." }], strengths: [{ label: "Quick to Cut Risk", xpModifierPct: 12 }], weaknesses: [{ label: "Panic Sells Winners", xpModifierPct: -20 }], flavorText: "Every candle wick feels like a threat." },
  { id: "steady-hare", familyId: "hare-line", stageIndex: 1, name: "Steady Hare", title: "The Settling Trader", archetype: "anxious", rarity: "common", unlock: { level: 18 }, stats: { impulsivity: 35, patience: 45, discipline: 50, riskManagement: 55, consistency: 50, emotionalControl: 45 }, abilities: [{ name: "Deep Breath", power: 60, description: "Rides normal volatility without flinching." }], strengths: [{ label: "Tolerates Drawdown", xpModifierPct: 18 }], weaknesses: [{ label: "Still Checks Price Too Often", xpModifierPct: -8 }], flavorText: "Learning that volatility isn't danger." },
  { id: "calm-hare", familyId: "hare-line", stageIndex: 2, name: "Calm Hare", title: "The Composed Trader", archetype: "disciplined", rarity: "uncommon", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 70, discipline: 72, riskManagement: 75, consistency: 72, emotionalControl: 75 }, abilities: [{ name: "Quiet Mind", power: 78, description: "Unbothered by short-term noise." }], strengths: [{ label: "Emotionally Regulated", xpModifierPct: 22 }], weaknesses: [], flavorText: "Fast on its feet, calm in its head." },

  // ── 10. LION LINE — Overconfidence ───────────────────────────────────
  { id: "cocky-cub", familyId: "lion-line", stageIndex: 0, name: "Cocky Cub", title: "The Overconfident Trader", archetype: "overconfident", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 60, patience: 25, discipline: 30, riskManagement: 25, consistency: 35, emotionalControl: 30 }, abilities: [{ name: "Oversize", power: 75, description: "Bets big after a winning streak, no adjustment to risk." }], strengths: [{ label: "Confident Execution", xpModifierPct: 12 }], weaknesses: [{ label: "Oversizes After Wins", xpModifierPct: -22 }], flavorText: "Three wins in a row and the rules stop applying — or so it thinks." },
  { id: "bold-lion", familyId: "lion-line", stageIndex: 1, name: "Bold Lion", title: "The Measured Risk-Taker", archetype: "overconfident", rarity: "common", unlock: { level: 18 }, stats: { impulsivity: 40, patience: 45, discipline: 50, riskManagement: 50, consistency: 55, emotionalControl: 50 }, abilities: [{ name: "Fixed Sizing", power: 65, description: "Keeps position size constant regardless of streak." }], strengths: [{ label: "Consistent Position Size", xpModifierPct: 20 }], weaknesses: [{ label: "Still Skips Some Checks", xpModifierPct: -8 }], flavorText: "Confidence, now backed by a process." },
  { id: "humble-king", familyId: "lion-line", stageIndex: 2, name: "Humble King", title: "The Respected Trader", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 70, discipline: 80, riskManagement: 78, consistency: 78, emotionalControl: 75 }, abilities: [{ name: "Steady Reign", power: 85, description: "Treats every trade with the same discipline, win or lose." }], strengths: [{ label: "Streak-Proof Discipline", xpModifierPct: 26 }], weaknesses: [], flavorText: "Confidence earned the hard way doesn't need to prove itself." },

  // ── 11. WOLF LINE — Leverage / Gambling ──────────────────────────────
  { id: "reckless-pup", familyId: "wolf-line", stageIndex: 0, name: "Reckless Pup", title: "The Leverage Junkie", archetype: "reckless", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 90, patience: 10, discipline: 15, riskManagement: 10, consistency: 20, emotionalControl: 15 }, abilities: [{ name: "Max Leverage", power: 95, description: "Goes all-in on borrowed size. Huge upside, bigger downside." }], strengths: [{ label: "High Risk Tolerance", xpModifierPct: 8 }], weaknesses: [{ label: "Overleverages Every Trade", xpModifierPct: -30 }], flavorText: "Treats the market like a slot machine." },
  { id: "lone-wolf", familyId: "wolf-line", stageIndex: 1, name: "Lone Wolf", title: "The Calculated Risk-Taker", archetype: "reckless", rarity: "uncommon", unlock: { level: 18, condition: "Caps leverage for 15 consecutive trades" }, stats: { impulsivity: 55, patience: 35, discipline: 45, riskManagement: 45, consistency: 45, emotionalControl: 40 }, abilities: [{ name: "Leverage Cap", power: 65, description: "Never exceeds a fixed leverage limit." }], strengths: [{ label: "Enforces Leverage Cap", xpModifierPct: 22 }], weaknesses: [{ label: "Still Tempted on Big Setups", xpModifierPct: -10 }], flavorText: "Risk as a tool, not a thrill." },
  { id: "alpha-wolf", familyId: "wolf-line", stageIndex: 2, name: "Alpha Wolf", title: "The Risk Manager", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 65, discipline: 75, riskManagement: 82, consistency: 72, emotionalControl: 70 }, abilities: [{ name: "Portfolio Guard", power: 85, description: "Sizes every trade against total account risk." }], strengths: [{ label: "Account-Level Risk Control", xpModifierPct: 28 }], weaknesses: [], flavorText: "Leads with control, not adrenaline." },

  // ── 12. TURTLE LINE — Risk Management Mastery ────────────────────────
  { id: "cautious-turtle", familyId: "turtle-line", stageIndex: 0, name: "Cautious Turtle", title: "The Careful Beginner", archetype: "disciplined", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 20, patience: 60, discipline: 55, riskManagement: 65, consistency: 45, emotionalControl: 50 }, abilities: [{ name: "Small Steps", power: 50, description: "Trades tiny size while learning the ropes." }], strengths: [{ label: "Conservative Sizing", xpModifierPct: 15 }], weaknesses: [{ label: "Underuses Good Setups", xpModifierPct: -8 }], flavorText: "Slow and steady, still finding its pace." },
  { id: "armored-turtle", familyId: "turtle-line", stageIndex: 1, name: "Armored Turtle", title: "The Risk Guardian", archetype: "disciplined", rarity: "common", unlock: { level: 18 }, stats: { impulsivity: 15, patience: 70, discipline: 70, riskManagement: 78, consistency: 68, emotionalControl: 65 }, abilities: [{ name: "Hard Stop", power: 70, description: "Every trade has a stop before it has an entry." }], strengths: [{ label: "100% Stop-Loss Usage", xpModifierPct: 25 }], weaknesses: [], flavorText: "Nothing gets through without a plan first." },
  { id: "titan-tortoise", familyId: "turtle-line", stageIndex: 2, name: "Titan Tortoise", title: "The Capital Preserver", archetype: "disciplined", rarity: "epic", unlock: { level: 40 }, stats: { impulsivity: 10, patience: 85, discipline: 88, riskManagement: 92, consistency: 85, emotionalControl: 82 }, abilities: [{ name: "Fortress Portfolio", power: 90, description: "Structured so no single trade can do real damage." }], strengths: [{ label: "Elite Drawdown Control", xpModifierPct: 30 }], weaknesses: [], flavorText: "Outlasts everyone by never blowing up." },

  // ── 13. HOUND LINE — Headline / News Chasing ─────────────────────────
  { id: "headline-hound", familyId: "hound-line", stageIndex: 0, name: "Headline Hound", title: "The News Chaser", archetype: "impulsive", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 75, patience: 20, discipline: 25, riskManagement: 30, consistency: 25, emotionalControl: 25 }, abilities: [{ name: "Breaking News Sprint", power: 70, description: "Trades the headline, not the chart." }], strengths: [{ label: "Fast Information Pickup", xpModifierPct: 10 }], weaknesses: [{ label: "Trades on Rumors", xpModifierPct: -20 }], flavorText: "First to the headline, last to the plan." },
  { id: "signal-hound", familyId: "hound-line", stageIndex: 1, name: "Signal Hound", title: "The Confirmed Reactor", archetype: "impulsive", rarity: "common", unlock: { level: 18 }, stats: { impulsivity: 50, patience: 40, discipline: 45, riskManagement: 48, consistency: 45, emotionalControl: 45 }, abilities: [{ name: "Confirm First", power: 62, description: "Waits for price to confirm the headline before acting." }], strengths: [{ label: "Confirms Before Entry", xpModifierPct: 18 }], weaknesses: [{ label: "Still Reacts to Noise", xpModifierPct: -8 }], flavorText: "Learned that the headline and the trade aren't the same thing." },
  { id: "tracker-hound", familyId: "hound-line", stageIndex: 2, name: "Tracker Hound", title: "The Macro Reader", archetype: "analytical", rarity: "uncommon", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 65, discipline: 70, riskManagement: 68, consistency: 70, emotionalControl: 65 }, abilities: [{ name: "Context Read", power: 80, description: "Places news inside the broader market structure." }], strengths: [{ label: "Contextualizes Catalysts", xpModifierPct: 24 }], weaknesses: [], flavorText: "News is now an input, not a trigger." },

  // ── 14. BULL LINE — Averaging Down / Stubbornness ────────────────────
  { id: "stubborn-calf", familyId: "bull-line", stageIndex: 0, name: "Stubborn Calf", title: "The Averager", archetype: "reckless", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 50, patience: 40, discipline: 25, riskManagement: 20, consistency: 30, emotionalControl: 25 }, abilities: [{ name: "Double Down", power: 75, description: "Adds to a losing position to lower the average, no plan attached." }], strengths: [{ label: "Strong Conviction", xpModifierPct: 8 }], weaknesses: [{ label: "Averages Down Without a Thesis", xpModifierPct: -25 }], flavorText: "Believes being early and being wrong are the same thing." },
  { id: "bracing-bull", familyId: "bull-line", stageIndex: 1, name: "Bracing Bull", title: "The Thesis-Checker", archetype: "reckless", rarity: "common", unlock: { level: 18 }, stats: { impulsivity: 35, patience: 50, discipline: 45, riskManagement: 45, consistency: 48, emotionalControl: 45 }, abilities: [{ name: "Re-Check Thesis", power: 65, description: "Only adds to a position if the original thesis still holds." }], strengths: [{ label: "Reassesses Before Adding", xpModifierPct: 18 }], weaknesses: [{ label: "Occasionally Adds Too Early", xpModifierPct: -8 }], flavorText: "Conviction, now paired with a checkpoint." },
  { id: "unshakable-bull", familyId: "bull-line", stageIndex: 2, name: "Unshakable Bull", title: "The Position Builder", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 68, discipline: 75, riskManagement: 72, consistency: 74, emotionalControl: 70 }, abilities: [{ name: "Scaled Entry", power: 82, description: "Builds a position deliberately, at pre-planned levels." }], strengths: [{ label: "Pre-Planned Scaling", xpModifierPct: 26 }], weaknesses: [], flavorText: "Adds size like a professional, not a gambler chasing a loss back." },

  // ── 15. ELEPHANT LINE — Consistency / Journaling ─────────────────────
  { id: "rookie-elephant", familyId: "elephant-line", stageIndex: 0, name: "Rookie Elephant", title: "The Forgetful Trader", archetype: "consistent", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 40, patience: 45, discipline: 35, riskManagement: 40, consistency: 20, emotionalControl: 40 }, abilities: [{ name: "Foggy Memory", power: 45, description: "Repeats the same mistake without noticing the pattern." }], strengths: [{ label: "Willing to Learn", xpModifierPct: 10 }], weaknesses: [{ label: "Doesn't Journal Trades", xpModifierPct: -18 }], flavorText: "Hasn't started connecting the dots yet." },
  { id: "diligent-elephant", familyId: "elephant-line", stageIndex: 1, name: "Diligent Elephant", title: "The Journaling Trader", archetype: "consistent", rarity: "common", unlock: { level: 18, condition: "Journals 20 trades in a row" }, stats: { impulsivity: 30, patience: 55, discipline: 55, riskManagement: 55, consistency: 55, emotionalControl: 55 }, abilities: [{ name: "Never Forgets", power: 68, description: "Logs every trade, win or lose." }], strengths: [{ label: "100% Journaling Rate", xpModifierPct: 22 }], weaknesses: [], flavorText: "Every trade becomes data instead of a memory." },
  { id: "elder-elephant", familyId: "elephant-line", stageIndex: 2, name: "Elder Elephant", title: "The Pattern Reader", archetype: "consistent", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 15, patience: 75, discipline: 78, riskManagement: 75, consistency: 88, emotionalControl: 78 }, abilities: [{ name: "Total Recall", power: 88, description: "Spots and corrects its own recurring mistakes instantly." }], strengths: [{ label: "Self-Correcting", xpModifierPct: 28 }], weaknesses: [], flavorText: "A living record of every lesson the market ever taught it." },

  // ── 16. CHAMELEON LINE — Adaptability ─────────────────────────────────
  { id: "erratic-chameleon", familyId: "chameleon-line", stageIndex: 0, name: "Erratic Chameleon", title: "The Strategy Hopper", archetype: "adaptive", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 60, patience: 30, discipline: 25, riskManagement: 35, consistency: 15, emotionalControl: 30 }, abilities: [{ name: "Strategy Swap", power: 55, description: "Abandons a strategy after one bad trade to try another." }], strengths: [{ label: "Open-Minded", xpModifierPct: 10 }], weaknesses: [{ label: "Abandons Strategies Too Soon", xpModifierPct: -20 }], flavorText: "Never gives a system long enough to actually work." },
  { id: "adaptive-chameleon", familyId: "chameleon-line", stageIndex: 1, name: "Adaptive Chameleon", title: "The Regime Reader", archetype: "adaptive", rarity: "common", unlock: { level: 18 }, stats: { impulsivity: 40, patience: 50, discipline: 50, riskManagement: 52, consistency: 45, emotionalControl: 48 }, abilities: [{ name: "Read the Room", power: 68, description: "Switches approach based on market regime, not mood." }], strengths: [{ label: "Matches Strategy to Conditions", xpModifierPct: 20 }], weaknesses: [{ label: "Sometimes Switches Too Fast", xpModifierPct: -8 }], flavorText: "Flexibility, now guided by evidence instead of frustration." },
  { id: "master-chameleon", familyId: "chameleon-line", stageIndex: 2, name: "Master Chameleon", title: "The All-Terrain Trader", archetype: "adaptive", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 68, discipline: 72, riskManagement: 74, consistency: 70, emotionalControl: 72 }, abilities: [{ name: "Full Spectrum", power: 85, description: "Trades trend, range, and volatility regimes with equal skill." }], strengths: [{ label: "Multi-Regime Competence", xpModifierPct: 26 }], weaknesses: [], flavorText: "Comfortable in every market the same way water is comfortable in any container." },

  // ── 17. BEAVER LINE — System-Building / Backtesting ───────────────────
  { id: "busy-beaver", familyId: "beaver-line", stageIndex: 0, name: "Busy Beaver", title: "The Backtest Addict", archetype: "analytical", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 20, patience: 55, discipline: 40, riskManagement: 45, consistency: 35, emotionalControl: 40 }, abilities: [{ name: "Endless Backtest", power: 50, description: "Tests strategy after strategy but never trades live." }], strengths: [{ label: "Strong Research Habit", xpModifierPct: 15 }], weaknesses: [{ label: "Never Executes Live", xpModifierPct: -15 }], flavorText: "Has a spreadsheet for everything except a live track record." },
  { id: "architect-beaver", familyId: "beaver-line", stageIndex: 1, name: "Architect Beaver", title: "The System Builder", archetype: "analytical", rarity: "common", unlock: { level: 18, condition: "Takes 15 live trades from a backtested system" }, stats: { impulsivity: 20, patience: 62, discipline: 60, riskManagement: 62, consistency: 58, emotionalControl: 55 }, abilities: [{ name: "Live Fire", power: 68, description: "Puts backtested edge to work with real size." }], strengths: [{ label: "Executes Tested Systems", xpModifierPct: 22 }], weaknesses: [], flavorText: "Research finally meets execution." },
  { id: "engineer-beaver", familyId: "beaver-line", stageIndex: 2, name: "Engineer Beaver", title: "The Strategist", archetype: "analytical", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 15, patience: 75, discipline: 80, riskManagement: 78, consistency: 78, emotionalControl: 72 }, abilities: [{ name: "Edge Refinement", power: 86, description: "Continuously improves a live, working system." }], strengths: [{ label: "Publishes Verified Strategies", xpModifierPct: 28 }], weaknesses: [], flavorText: "The trader other creators license strategies from." },

  // ── 18. PHOENIX LINE — Redemption / Comeback (mythic, 2-stage) ────────
  { id: "ash-phoenix", familyId: "phoenix-line", stageIndex: 0, name: "Ash Phoenix", title: "The Blown Account", archetype: "resilient", rarity: "epic", unlock: { level: 1, condition: "Account drawdown of 90%+ followed by a fresh start" }, stats: { impulsivity: 50, patience: 40, discipline: 40, riskManagement: 30, consistency: 30, emotionalControl: 40 }, abilities: [{ name: "From the Ashes", power: 60, description: "Starts over small, carrying hard-won lessons." }], strengths: [{ label: "Rebuilding with a Plan", xpModifierPct: 20 }], weaknesses: [{ label: "Scar Tissue Hesitation", xpModifierPct: -10 }], flavorText: "Only obtainable through a real comeback. Wears the loss as proof, not shame." },
  { id: "rising-phoenix", familyId: "phoenix-line", stageIndex: 1, name: "Rising Phoenix", title: "The Redeemed Trader", archetype: "resilient", rarity: "legendary", unlock: { level: 50, condition: "New account reaches its prior all-time high, with rules followed" }, stats: { impulsivity: 15, patience: 85, discipline: 88, riskManagement: 85, consistency: 85, emotionalControl: 85 }, abilities: [{ name: "Second Flight", power: 95, description: "Trades with the discipline only a real loss can teach." }], strengths: [{ label: "Unbreakable Process", xpModifierPct: 30 }], weaknesses: [], flavorText: "The rarest kind of mastery: the kind that survived losing everything first." },

  // ── 19. BEAR LINE — Pessimism / Doom Bias ────────────────────────────
  { id: "gloom-bear", familyId: "bear-line", stageIndex: 0, name: "Gloom Bear", title: "The Perma-Bear", archetype: "pessimistic", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 45, patience: 40, discipline: 30, riskManagement: 35, consistency: 30, emotionalControl: 30 }, abilities: [{ name: "Doom Call", power: 55, description: "Predicts a crash on every green candle, right or wrong." }], strengths: [{ label: "Spots Real Risk Early", xpModifierPct: 12 }], weaknesses: [{ label: "Misses Every Rally", xpModifierPct: -22 }], flavorText: "Has correctly predicted 9 of the last 2 crashes." },
  { id: "wary-bear", familyId: "bear-line", stageIndex: 1, name: "Wary Bear", title: "The Hedged Skeptic", archetype: "pessimistic", rarity: "common", unlock: { level: 18 }, stats: { impulsivity: 35, patience: 50, discipline: 48, riskManagement: 52, consistency: 48, emotionalControl: 45 }, abilities: [{ name: "Hedge First", power: 62, description: "Stays skeptical but keeps a foot in the trade." }], strengths: [{ label: "Trades Both Directions", xpModifierPct: 18 }], weaknesses: [{ label: "Still Undersized on Longs", xpModifierPct: -8 }], flavorText: "Learning that being right about risk and being profitable aren't the same thing." },
  { id: "macro-bear", familyId: "bear-line", stageIndex: 2, name: "Macro Bear", title: "The Balanced Macro Reader", archetype: "analytical", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 68, discipline: 74, riskManagement: 76, consistency: 70, emotionalControl: 68 }, abilities: [{ name: "Full Cycle Read", power: 82, description: "Trades both bull and bear legs with equal conviction." }], strengths: [{ label: "Direction-Agnostic Edge", xpModifierPct: 25 }], weaknesses: [], flavorText: "Skepticism became a filter, not an identity." },

  // ── 20. SLOTH LINE — Hesitation / Procrastination ────────────────────
  { id: "idle-sloth", familyId: "sloth-line", stageIndex: 0, name: "Idle Sloth", title: "The Chronic Hesitator", archetype: "hesitant", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 10, patience: 50, discipline: 30, riskManagement: 40, consistency: 20, emotionalControl: 35 }, abilities: [{ name: "One More Minute", power: 40, description: "Has the setup ready and still doesn't click." }], strengths: [{ label: "Never Forces a Trade", xpModifierPct: 10 }], weaknesses: [{ label: "Misses Fully Confirmed Setups", xpModifierPct: -20 }], flavorText: "Did the homework. Still hasn't turned it in." },
  { id: "moving-sloth", familyId: "sloth-line", stageIndex: 1, name: "Moving Sloth", title: "The Deadline Trader", archetype: "hesitant", rarity: "common", unlock: { level: 18, condition: "Sets and honors an entry deadline on 15 trades" }, stats: { impulsivity: 25, patience: 55, discipline: 50, riskManagement: 52, consistency: 48, emotionalControl: 48 }, abilities: [{ name: "Entry Deadline", power: 60, description: "Forces a decision once the setup criteria are met." }], strengths: [{ label: "Acts Within a Deadline", xpModifierPct: 18 }], weaknesses: [{ label: "Occasionally Rushes the Deadline", xpModifierPct: -8 }], flavorText: "Still slow. No longer late." },
  { id: "decisive-sloth", familyId: "sloth-line", stageIndex: 2, name: "Decisive Sloth", title: "The Prepared Executor", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 70, discipline: 78, riskManagement: 76, consistency: 74, emotionalControl: 72 }, abilities: [{ name: "Ready and Willing", power: 80, description: "Preparation and execution finally happen on the same day." }], strengths: [{ label: "Converts Setups to Trades", xpModifierPct: 24 }], weaknesses: [], flavorText: "All that patience, finally pointed at a trigger." },

  // ── 21. PEACOCK LINE — Vanity / Social Clout Trading ─────────────────
  { id: "flashy-peacock", familyId: "peacock-line", stageIndex: 0, name: "Flashy Peacock", title: "The Screenshot Trader", archetype: "vain", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 60, patience: 25, discipline: 30, riskManagement: 25, consistency: 30, emotionalControl: 30 }, abilities: [{ name: "Flex Post", power: 55, description: "Sizes up for a screenshot, not for the setup." }], strengths: [{ label: "Genuinely Loves the Game", xpModifierPct: 10 }], weaknesses: [{ label: "Trades for Clout, Not Edge", xpModifierPct: -22 }], flavorText: "Posts every win. Deletes every loss." },
  { id: "honest-peacock", familyId: "peacock-line", stageIndex: 1, name: "Honest Peacock", title: "The Full Track Record", archetype: "vain", rarity: "common", unlock: { level: 18, condition: "Publishes 20 trades in a row, wins and losses" }, stats: { impulsivity: 40, patience: 45, discipline: 50, riskManagement: 48, consistency: 52, emotionalControl: 48 }, abilities: [{ name: "Full Ledger", power: 62, description: "Shares wins and losses in equal measure." }], strengths: [{ label: "Publishes Losses Too", xpModifierPct: 20 }], weaknesses: [{ label: "Still Sizes Up for an Audience", xpModifierPct: -8 }], flavorText: "The record is finally more honest than the highlight reel." },
  { id: "verified-peacock", familyId: "peacock-line", stageIndex: 2, name: "Verified Peacock", title: "The Trusted Creator", archetype: "disciplined", rarity: "rare", unlock: { level: 40, condition: "Reaches Nova Verified creator status" }, stats: { impulsivity: 20, patience: 68, discipline: 75, riskManagement: 72, consistency: 76, emotionalControl: 70 }, abilities: [{ name: "Nova Verified", power: 84, description: "A track record that earns trust because it's complete." }], strengths: [{ label: "Builds Real Reputation", xpModifierPct: 26 }], weaknesses: [], flavorText: "Turns out the real flex was consistency the whole time." },

  // ── 22. SQUIRREL LINE — Over-Diversification / Hoarding ──────────────
  { id: "scatter-squirrel", familyId: "squirrel-line", stageIndex: 0, name: "Scatter Squirrel", title: "The Everything Buyer", archetype: "scattered", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 50, patience: 35, discipline: 30, riskManagement: 30, consistency: 25, emotionalControl: 35 }, abilities: [{ name: "Bury a Nut", power: 50, description: "Opens a tiny position in everything, tracks none of it." }], strengths: [{ label: "Naturally Diversified", xpModifierPct: 10 }], weaknesses: [{ label: "Too Many Untracked Positions", xpModifierPct: -20 }], flavorText: "Has a position open somewhere and genuinely can't remember why." },
  { id: "sorting-squirrel", familyId: "squirrel-line", stageIndex: 1, name: "Sorting Squirrel", title: "The Curator", archetype: "scattered", rarity: "common", unlock: { level: 18, condition: "Trims the watchlist to under 10 tracked positions" }, stats: { impulsivity: 35, patience: 48, discipline: 50, riskManagement: 50, consistency: 48, emotionalControl: 48 }, abilities: [{ name: "Prune the Stash", power: 62, description: "Cuts the tail positions and keeps the ones with a thesis." }], strengths: [{ label: "Every Position Has a Thesis", xpModifierPct: 20 }], weaknesses: [{ label: "Still Opens New Ones Too Easily", xpModifierPct: -8 }], flavorText: "Fewer nuts. Better hiding spots." },
  { id: "portfolio-squirrel", familyId: "squirrel-line", stageIndex: 2, name: "Portfolio Squirrel", title: "The Focused Allocator", archetype: "consistent", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 68, discipline: 74, riskManagement: 75, consistency: 78, emotionalControl: 70 }, abilities: [{ name: "Deliberate Allocation", power: 82, description: "Every position sized and tracked on purpose." }], strengths: [{ label: "Concentrated, Intentional Portfolio", xpModifierPct: 25 }], weaknesses: [], flavorText: "Knows exactly what it owns and why." },

  // ── 23. CAT LINE — Copycat / Signal-Following ─────────────────────────
  { id: "copycat-kitten", familyId: "cat-line", stageIndex: 0, name: "Copycat Kitten", title: "The Signal Follower", archetype: "imitative", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 55, patience: 30, discipline: 25, riskManagement: 30, consistency: 30, emotionalControl: 30 }, abilities: [{ name: "Copy Trade", power: 55, description: "Enters the instant a guru posts, no independent check." }], strengths: [{ label: "Exposed to Good Ideas", xpModifierPct: 10 }], weaknesses: [{ label: "No Independent Verification", xpModifierPct: -20 }], flavorText: "Doesn't know why it's in the trade. Someone else did." },
  { id: "curious-cat", familyId: "cat-line", stageIndex: 1, name: "Curious Cat", title: "The Fact-Checker", archetype: "imitative", rarity: "common", unlock: { level: 18, condition: "Verifies 15 signals against its own analysis before entering" }, stats: { impulsivity: 40, patience: 48, discipline: 48, riskManagement: 50, consistency: 48, emotionalControl: 46 }, abilities: [{ name: "Second Opinion", power: 62, description: "Checks a signal against its own read before acting." }], strengths: [{ label: "Verifies Before Entry", xpModifierPct: 20 }], weaknesses: [{ label: "Still Anchors to the Original Call", xpModifierPct: -8 }], flavorText: "Trusts, but checks the chart itself now." },
  { id: "independent-cat", familyId: "cat-line", stageIndex: 2, name: "Independent Cat", title: "The Original Thinker", archetype: "analytical", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 68, discipline: 74, riskManagement: 72, consistency: 74, emotionalControl: 70 }, abilities: [{ name: "Own Thesis", power: 82, description: "Can explain every trade without naming a source." }], strengths: [{ label: "Fully Independent Analysis", xpModifierPct: 25 }], weaknesses: [], flavorText: "Reads what everyone reads. Trades what it decides." },

  // ── 24. OSTRICH LINE — Denial / Avoidance ─────────────────────────────
  { id: "buried-ostrich", familyId: "ostrich-line", stageIndex: 0, name: "Buried Ostrich", title: "The Avoider", archetype: "avoidant", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 30, patience: 40, discipline: 25, riskManagement: 20, consistency: 25, emotionalControl: 25 }, abilities: [{ name: "Look Away", power: 45, description: "Stops checking a position the moment it turns red." }], strengths: [{ label: "Doesn't Panic-Sell", xpModifierPct: 10 }], weaknesses: [{ label: "Ignores Growing Losses", xpModifierPct: -25 }], flavorText: "The loss doesn't stop growing just because the app is closed." },
  { id: "watching-ostrich", familyId: "ostrich-line", stageIndex: 1, name: "Watching Ostrich", title: "The Reluctant Checker", archetype: "avoidant", rarity: "common", unlock: { level: 18, condition: "Reviews every open position at least once a day for 3 weeks" }, stats: { impulsivity: 25, patience: 48, discipline: 48, riskManagement: 46, consistency: 48, emotionalControl: 45 }, abilities: [{ name: "Daily Check-In", power: 60, description: "Faces the account, red or green, once a day." }], strengths: [{ label: "Reviews Losses Honestly", xpModifierPct: 18 }], weaknesses: [{ label: "Still Delays Cutting Losers", xpModifierPct: -8 }], flavorText: "Looking is the hard part. It's looking now." },
  { id: "clear-eyed-ostrich", familyId: "ostrich-line", stageIndex: 2, name: "Clear-Eyed Ostrich", title: "The Honest Accountant", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 65, discipline: 76, riskManagement: 74, consistency: 75, emotionalControl: 72 }, abilities: [{ name: "Numbers Don't Lie", power: 82, description: "Faces every position exactly as it is." }], strengths: [{ label: "Cuts Losers on Schedule", xpModifierPct: 26 }], weaknesses: [], flavorText: "Nothing left buried. Nothing left to fear." },

  // ── 25. CRAB LINE — Choppy-Market Overtrading ─────────────────────────
  { id: "chopped-crab", familyId: "crab-line", stageIndex: 0, name: "Chopped Crab", title: "The Range Victim", archetype: "reckless", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 65, patience: 20, discipline: 25, riskManagement: 30, consistency: 20, emotionalControl: 25 }, abilities: [{ name: "Breakout Fakeout", power: 60, description: "Buys every breakout in a range. Sells every breakdown too." }], strengths: [{ label: "Reads Support and Resistance", xpModifierPct: 10 }], weaknesses: [{ label: "Trades Every False Breakout", xpModifierPct: -22 }], flavorText: "Sideways markets are where this one goes to lose money slowly." },
  { id: "sidestep-crab", familyId: "crab-line", stageIndex: 1, name: "Sidestep Crab", title: "The Range Reader", archetype: "reckless", rarity: "common", unlock: { level: 18, condition: "Waits for a confirmed close outside the range 10 times" }, stats: { impulsivity: 45, patience: 45, discipline: 48, riskManagement: 50, consistency: 45, emotionalControl: 45 }, abilities: [{ name: "Confirmed Break", power: 62, description: "Waits for a close, not a wick, before treating it as real." }], strengths: [{ label: "Filters Fake Breakouts", xpModifierPct: 20 }], weaknesses: [{ label: "Still Trades Every Range", xpModifierPct: -8 }], flavorText: "Learning that most ranges aren't worth trading at all." },
  { id: "range-master-crab", familyId: "crab-line", stageIndex: 2, name: "Range Master Crab", title: "The Sideways Specialist", archetype: "adaptive", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 70, discipline: 74, riskManagement: 72, consistency: 74, emotionalControl: 70 }, abilities: [{ name: "Edge of the Box", power: 84, description: "Buys the bottom of the range, sells the top, skips the middle." }], strengths: [{ label: "Profits From Chop", xpModifierPct: 26 }], weaknesses: [], flavorText: "The only one at the table who's happy the market's going nowhere." },

  // ── 26. JELLYFISH LINE — Driftless / No Strategy ──────────────────────
  { id: "drifting-jellyfish", familyId: "jellyfish-line", stageIndex: 0, name: "Drifting Jellyfish", title: "The Planless Trader", archetype: "aimless", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 50, patience: 30, discipline: 15, riskManagement: 25, consistency: 15, emotionalControl: 30 }, abilities: [{ name: "Go With It", power: 45, description: "Takes whatever trade the timeline is talking about." }], strengths: [{ label: "Open to Any Market", xpModifierPct: 8 }], weaknesses: [{ label: "No Written Plan, Ever", xpModifierPct: -25 }], flavorText: "Has never once written down what it's trying to do." },
  { id: "current-jellyfish", familyId: "jellyfish-line", stageIndex: 1, name: "Current Jellyfish", title: "The Loose Planner", archetype: "aimless", rarity: "common", unlock: { level: 18, condition: "Writes a one-line plan before 20 trades in a row" }, stats: { impulsivity: 35, patience: 45, discipline: 45, riskManagement: 45, consistency: 42, emotionalControl: 45 }, abilities: [{ name: "One-Line Plan", power: 58, description: "Writes down entry, stop, and target before clicking." }], strengths: [{ label: "Trades With a Written Plan", xpModifierPct: 18 }], weaknesses: [{ label: "Plan Is Often Vague", xpModifierPct: -8 }], flavorText: "Still drifting. At least there's a map now." },
  { id: "anchored-jellyfish", familyId: "jellyfish-line", stageIndex: 2, name: "Anchored Jellyfish", title: "The Structured Trader", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 65, discipline: 74, riskManagement: 72, consistency: 72, emotionalControl: 70 }, abilities: [{ name: "Full Trade Plan", power: 80, description: "Every trade has a written thesis, invalidation, and target." }], strengths: [{ label: "100% Planned Entries", xpModifierPct: 24 }], weaknesses: [], flavorText: "Still soft-bodied. No longer shapeless." },

  // ── 27. RACCOON LINE — Poor Routine / Fatigue Trading ─────────────────
  { id: "night-raccoon", familyId: "raccoon-line", stageIndex: 0, name: "Night Raccoon", title: "The 3 A.M. Trader", archetype: "reckless", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 60, patience: 25, discipline: 25, riskManagement: 25, consistency: 20, emotionalControl: 20 }, abilities: [{ name: "Sleepless Entry", power: 55, description: "Trades exhausted, at the worst possible hour." }], strengths: [{ label: "Genuinely Dedicated", xpModifierPct: 8 }], weaknesses: [{ label: "Trades While Exhausted", xpModifierPct: -22 }], flavorText: "The market's open. That doesn't mean it should be trading it." },
  { id: "routine-raccoon", familyId: "raccoon-line", stageIndex: 1, name: "Routine Raccoon", title: "The Scheduled Trader", archetype: "reckless", rarity: "common", unlock: { level: 18, condition: "Trades only inside a fixed daily window for 3 weeks" }, stats: { impulsivity: 40, patience: 45, discipline: 48, riskManagement: 46, consistency: 50, emotionalControl: 45 }, abilities: [{ name: "Fixed Window", power: 62, description: "Trades only inside a set, well-rested window." }], strengths: [{ label: "Sets a Trading Schedule", xpModifierPct: 20 }], weaknesses: [{ label: "Occasionally Breaks the Window", xpModifierPct: -8 }], flavorText: "Same hours, same rest, noticeably better trades." },
  { id: "sharp-raccoon", familyId: "raccoon-line", stageIndex: 2, name: "Sharp Raccoon", title: "The Well-Rested Professional", archetype: "consistent", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 68, discipline: 76, riskManagement: 72, consistency: 78, emotionalControl: 74 }, abilities: [{ name: "Peak Hours Only", power: 82, description: "Trades only when rested and alert." }], strengths: [{ label: "Consistent Trading Hours", xpModifierPct: 26 }], weaknesses: [], flavorText: "Turns out sleep was an edge the whole time." },

  // ── 28. CHEETAH LINE — Speed Obsession / Overleveraged Scalping ───────
  { id: "sprint-cheetah", familyId: "cheetah-line", stageIndex: 0, name: "Sprint Cheetah", title: "The Speed Addict", archetype: "restless", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 80, patience: 10, discipline: 25, riskManagement: 25, consistency: 25, emotionalControl: 25 }, abilities: [{ name: "Fastest Finger", power: 78, description: "Needs to be first into every move, sized too big to be right." }], strengths: [{ label: "Elite Reaction Speed", xpModifierPct: 12 }], weaknesses: [{ label: "Oversized for the Timeframe", xpModifierPct: -22 }], flavorText: "Being fast and being right are not the same skill." },
  { id: "paced-cheetah", familyId: "cheetah-line", stageIndex: 1, name: "Paced Cheetah", title: "The Controlled Sprinter", archetype: "restless", rarity: "uncommon", unlock: { level: 18, condition: "Caps scalp size to a fixed percent of account for 15 trades" }, stats: { impulsivity: 55, patience: 35, discipline: 48, riskManagement: 48, consistency: 48, emotionalControl: 45 }, abilities: [{ name: "Sized Sprint", power: 65, description: "Still fast, now sized like every other trade." }], strengths: [{ label: "Fixed Size Regardless of Speed", xpModifierPct: 20 }], weaknesses: [{ label: "Still Trades More Than Needed", xpModifierPct: -8 }], flavorText: "All the speed. Finally with a leash." },
  { id: "precision-cheetah", familyId: "cheetah-line", stageIndex: 2, name: "Precision Cheetah", title: "The Elite Scalper", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 35, patience: 60, discipline: 74, riskManagement: 72, consistency: 72, emotionalControl: 68 }, abilities: [{ name: "Controlled Burst", power: 88, description: "Speed used as a tool, deployed only on A+ setups." }], strengths: [{ label: "High Win Rate at High Speed", xpModifierPct: 26 }], weaknesses: [], flavorText: "Still the fastest in the room. Now also the most accurate." },

  // ── 29. CAMEL LINE — Enduring Dead Markets ────────────────────────────
  { id: "restless-camel", familyId: "camel-line", stageIndex: 0, name: "Restless Camel", title: "The Drought Forcer", archetype: "restless", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 55, patience: 25, discipline: 30, riskManagement: 30, consistency: 30, emotionalControl: 30 }, abilities: [{ name: "Manufacture a Setup", power: 55, description: "Invents a reason to trade when there genuinely isn't one." }], strengths: [{ label: "Always Ready to Trade", xpModifierPct: 8 }], weaknesses: [{ label: "Forces Trades in Dead Markets", xpModifierPct: -20 }], flavorText: "A quiet week feels like a threat instead of a rest." },
  { id: "enduring-camel", familyId: "camel-line", stageIndex: 1, name: "Enduring Camel", title: "The Patient Waiter", archetype: "restless", rarity: "common", unlock: { level: 18, condition: "Goes 10 sessions without a low-quality setup and doesn't trade" }, stats: { impulsivity: 35, patience: 55, discipline: 52, riskManagement: 50, consistency: 52, emotionalControl: 50 }, abilities: [{ name: "Sit It Out", power: 62, description: "Lets a dead week be dead instead of forcing size." }], strengths: [{ label: "Skips Low-Quality Weeks", xpModifierPct: 20 }], weaknesses: [{ label: "Gets Restless by Day 10", xpModifierPct: -8 }], flavorText: "Learning that no trade is a trade too." },
  { id: "desert-camel", familyId: "camel-line", stageIndex: 2, name: "Desert Camel", title: "The Drought Specialist", archetype: "patient", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 15, patience: 82, discipline: 76, riskManagement: 74, consistency: 76, emotionalControl: 75 }, abilities: [{ name: "Unbothered by Silence", power: 84, description: "Can go weeks without a trade and feel nothing but calm." }], strengths: [{ label: "Zero Forced Trades", xpModifierPct: 28 }], weaknesses: [], flavorText: "Built to cross the quiet stretches other traders can't survive." },

  // ── 30. MAGPIE LINE — Shiny-Object / Hype Chasing ─────────────────────
  { id: "shiny-magpie", familyId: "magpie-line", stageIndex: 0, name: "Shiny Magpie", title: "The Hype Chaser", archetype: "impulsive", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 75, patience: 15, discipline: 20, riskManagement: 25, consistency: 15, emotionalControl: 25 }, abilities: [{ name: "New Shiny Thing", power: 60, description: "Abandons the current watchlist for whatever's trending today." }], strengths: [{ label: "Finds Movers Early", xpModifierPct: 10 }], weaknesses: [{ label: "Never Finishes a Thesis", xpModifierPct: -22 }], flavorText: "Has a hundred half-finished ideas and zero completed trades." },
  { id: "curated-magpie", familyId: "magpie-line", stageIndex: 1, name: "Curated Magpie", title: "The Watchlist Keeper", archetype: "impulsive", rarity: "common", unlock: { level: 18, condition: "Keeps a fixed watchlist under 10 names for a month" }, stats: { impulsivity: 50, patience: 45, discipline: 48, riskManagement: 48, consistency: 46, emotionalControl: 46 }, abilities: [{ name: "Fixed Watchlist", power: 62, description: "New ideas go on a list for later, not into a trade today." }], strengths: [{ label: "Sticks to a Core Watchlist", xpModifierPct: 20 }], weaknesses: [{ label: "Still Peeks at Trending Tickers", xpModifierPct: -8 }], flavorText: "Still notices every shiny thing. Doesn't chase most of them anymore." },
  { id: "focused-magpie", familyId: "magpie-line", stageIndex: 2, name: "Focused Magpie", title: "The Disciplined Selector", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 68, discipline: 75, riskManagement: 72, consistency: 74, emotionalControl: 70 }, abilities: [{ name: "Earned Entry", power: 82, description: "A name only earns a trade after weeks on the watchlist." }], strengths: [{ label: "Deep, Not Wide", xpModifierPct: 25 }], weaknesses: [], flavorText: "Chases nothing. Everything it trades, it already knew." },

  // ── 31. MULE LINE — Stubborn Refusal to Exit ──────────────────────────
  { id: "stubborn-mule", familyId: "mule-line", stageIndex: 0, name: "Stubborn Mule", title: "The Refuser", archetype: "stubborn", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 30, patience: 60, discipline: 25, riskManagement: 20, consistency: 30, emotionalControl: 25 }, abilities: [{ name: "Dig In", power: 50, description: "Refuses to exit a losing position out of pure pride." }], strengths: [{ label: "Strong Conviction", xpModifierPct: 10 }], weaknesses: [{ label: "Won't Admit a Trade Is Wrong", xpModifierPct: -25 }], flavorText: "It's not a hedge. It's not a plan. It's just ego." },
  { id: "reasoning-mule", familyId: "mule-line", stageIndex: 1, name: "Reasoning Mule", title: "The Checkpoint Keeper", archetype: "stubborn", rarity: "common", unlock: { level: 18, condition: "Exits on a pre-set invalidation level 15 times" }, stats: { impulsivity: 25, patience: 55, discipline: 50, riskManagement: 50, consistency: 50, emotionalControl: 48 }, abilities: [{ name: "Invalidation Level", power: 62, description: "Has a line in the sand and actually respects it." }], strengths: [{ label: "Honors Invalidation Levels", xpModifierPct: 20 }], weaknesses: [{ label: "Still Argues With the Chart First", xpModifierPct: -8 }], flavorText: "Still stubborn. Just not about the wrong things anymore." },
  { id: "graceful-mule", familyId: "mule-line", stageIndex: 2, name: "Graceful Mule", title: "The Ego-Free Trader", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 70, discipline: 78, riskManagement: 76, consistency: 75, emotionalControl: 74 }, abilities: [{ name: "No Hard Feelings", power: 84, description: "Exits wrong trades as easily as it takes right ones." }], strengths: [{ label: "Separates Ego From P&L", xpModifierPct: 28 }], weaknesses: [], flavorText: "Stubborn about the process now. About nothing else." },

  // ── 32. VULTURE LINE — Opportunistic Distress Buying ──────────────────
  { id: "circling-vulture", familyId: "vulture-line", stageIndex: 0, name: "Circling Vulture", title: "The Reckless Bargain Hunter", archetype: "opportunistic", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 60, patience: 35, discipline: 30, riskManagement: 25, consistency: 30, emotionalControl: 30 }, abilities: [{ name: "Dive on Red", power: 65, description: "Buys anything down big, no check on why it's down." }], strengths: [{ label: "Comfortable Buying Fear", xpModifierPct: 12 }], weaknesses: [{ label: "Buys Falling Knives Indiscriminately", xpModifierPct: -22 }], flavorText: "Not every crash is a discount. Some things are down for a reason." },
  { id: "assessing-vulture", familyId: "vulture-line", stageIndex: 1, name: "Assessing Vulture", title: "The Distress Analyst", archetype: "opportunistic", rarity: "uncommon", unlock: { level: 18, condition: "Checks the fundamental reason behind 15 distressed buys" }, stats: { impulsivity: 40, patience: 50, discipline: 52, riskManagement: 50, consistency: 50, emotionalControl: 48 }, abilities: [{ name: "Cause Check", power: 65, description: "Verifies the drop is fear, not a broken thesis, before buying." }], strengths: [{ label: "Separates Panic From Bad News", xpModifierPct: 20 }], weaknesses: [{ label: "Still Sizes Up Too Fast", xpModifierPct: -8 }], flavorText: "Circles longer now. Lands more accurately." },
  { id: "value-vulture", familyId: "vulture-line", stageIndex: 2, name: "Value Vulture", title: "The Distressed-Asset Specialist", archetype: "analytical", rarity: "epic", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 72, discipline: 78, riskManagement: 76, consistency: 76, emotionalControl: 74 }, abilities: [{ name: "True Discount", power: 88, description: "Finds real value in other traders' panic, sized responsibly." }], strengths: [{ label: "Buys Fear, Not Damage", xpModifierPct: 28 }], weaknesses: [], flavorText: "Everyone else's worst day is this one's best research." },

  // ── 33. HYENA LINE — Herd Mentality ────────────────────────────────────
  { id: "pack-hyena", familyId: "hyena-line", stageIndex: 0, name: "Pack Hyena", title: "The Herd Follower", archetype: "herd", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 55, patience: 30, discipline: 25, riskManagement: 30, consistency: 30, emotionalControl: 30 }, abilities: [{ name: "Follow the Pack", power: 55, description: "Only takes a trade once the crowd is already loud about it." }], strengths: [{ label: "Rarely Trades Alone", xpModifierPct: 8 }], weaknesses: [{ label: "Enters Late, After the Crowd", xpModifierPct: -20 }], flavorText: "By the time it hears about the trade, so has everyone else." },
  { id: "watchful-hyena", familyId: "hyena-line", stageIndex: 1, name: "Watchful Hyena", title: "The Independent Checker", archetype: "herd", rarity: "common", unlock: { level: 18, condition: "Takes 15 trades before the crowd is talking about them" }, stats: { impulsivity: 40, patience: 45, discipline: 48, riskManagement: 48, consistency: 48, emotionalControl: 46 }, abilities: [{ name: "Early Look", power: 62, description: "Forms its own opinion before checking what others think." }], strengths: [{ label: "Forms Opinions Independently", xpModifierPct: 20 }], weaknesses: [{ label: "Still Seeks Confirmation From the Crowd", xpModifierPct: -8 }], flavorText: "Checks the timeline after the trade now, not before." },
  { id: "lone-hyena", familyId: "hyena-line", stageIndex: 2, name: "Lone Hyena", title: "The Contrarian", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 68, discipline: 74, riskManagement: 72, consistency: 74, emotionalControl: 72 }, abilities: [{ name: "Own the Call", power: 82, description: "Comfortable being early and alone if the setup is real." }], strengths: [{ label: "Trades Independent of Sentiment", xpModifierPct: 26 }], weaknesses: [], flavorText: "Doesn't need the pack to make the kill anymore." },

  // ── 34. OCTOPUS LINE — Tool & Indicator Overload ──────────────────────
  { id: "tangled-octopus", familyId: "octopus-line", stageIndex: 0, name: "Tangled Octopus", title: "The Indicator Hoarder", archetype: "scattered", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 30, patience: 55, discipline: 35, riskManagement: 40, consistency: 25, emotionalControl: 40 }, abilities: [{ name: "Eight Screens", power: 50, description: "Runs fifteen indicators that all say something different." }], strengths: [{ label: "Deep Tool Knowledge", xpModifierPct: 12 }], weaknesses: [{ label: "Conflicting Signals Cause Paralysis", xpModifierPct: -18 }], flavorText: "Every arm holding a different indicator, none of them agreeing." },
  { id: "streamlining-octopus", familyId: "octopus-line", stageIndex: 1, name: "Streamlining Octopus", title: "The Toolkit Editor", archetype: "scattered", rarity: "common", unlock: { level: 18, condition: "Trades off 3 or fewer indicators for a month" }, stats: { impulsivity: 25, patience: 60, discipline: 55, riskManagement: 58, consistency: 50, emotionalControl: 52 }, abilities: [{ name: "Cut the Noise", power: 64, description: "Drops indicators that don't change the decision." }], strengths: [{ label: "Trades Off a Short Checklist", xpModifierPct: 20 }], weaknesses: [{ label: "Occasionally Adds a Tool Back", xpModifierPct: -8 }], flavorText: "Fewer arms doing the actual gripping. Same octopus." },
  { id: "clarity-octopus", familyId: "octopus-line", stageIndex: 2, name: "Clarity Octopus", title: "The Minimalist Analyst", archetype: "analytical", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 70, discipline: 76, riskManagement: 76, consistency: 72, emotionalControl: 72 }, abilities: [{ name: "One Clean Signal", power: 84, description: "A single, well-understood system replaces the tangle." }], strengths: [{ label: "Decisive With Minimal Tools", xpModifierPct: 26 }], weaknesses: [], flavorText: "Turns out it never needed eight arms. Two worked fine." },

  // ── 35. KOALA LINE — Complacency & Risk Neglect ────────────────────────
  { id: "drowsy-koala", familyId: "koala-line", stageIndex: 0, name: "Drowsy Koala", title: "The Complacent Holder", archetype: "complacent", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 20, patience: 60, discipline: 25, riskManagement: 15, consistency: 30, emotionalControl: 45 }, abilities: [{ name: "It'll Be Fine", power: 40, description: "Leaves positions unmonitored, assumes nothing will go wrong." }], strengths: [{ label: "Genuinely Unbothered by Noise", xpModifierPct: 10 }], weaknesses: [{ label: "No Risk Monitoring at All", xpModifierPct: -25 }], flavorText: "Calm isn't the same thing as careful." },
  { id: "alert-koala", familyId: "koala-line", stageIndex: 1, name: "Alert Koala", title: "The Awake Observer", archetype: "complacent", rarity: "common", unlock: { level: 18, condition: "Sets an alert or stop on every open position for a month" }, stats: { impulsivity: 20, patience: 62, discipline: 48, riskManagement: 48, consistency: 48, emotionalControl: 55 }, abilities: [{ name: "Set and Check", power: 60, description: "Puts an alert or stop on every position, then relaxes." }], strengths: [{ label: "Every Position Has a Guardrail", xpModifierPct: 20 }], weaknesses: [{ label: "Still Skips Weekly Reviews", xpModifierPct: -8 }], flavorText: "Still calm. Now the calm is earned, not accidental." },
  { id: "guardian-koala", familyId: "koala-line", stageIndex: 2, name: "Guardian Koala", title: "The Engaged Risk Monitor", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 15, patience: 75, discipline: 76, riskManagement: 78, consistency: 74, emotionalControl: 78 }, abilities: [{ name: "Calm and Watching", power: 84, description: "Relaxed on the surface, fully monitored underneath." }], strengths: [{ label: "Systematic Risk Review", xpModifierPct: 26 }], weaknesses: [], flavorText: "The only trader in the room who's both asleep and in control." },

  // ── 36. MEERKAT LINE — Compulsive Price-Checking ──────────────────────
  { id: "jittery-meerkat", familyId: "meerkat-line", stageIndex: 0, name: "Jittery Meerkat", title: "The Compulsive Checker", archetype: "anxious", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 45, patience: 20, discipline: 30, riskManagement: 35, consistency: 25, emotionalControl: 15 }, abilities: [{ name: "Check Again", power: 45, description: "Refreshes the price every few minutes, all day, every day." }], strengths: [{ label: "Never Misses a Move", xpModifierPct: 10 }], weaknesses: [{ label: "Checks Price Dozens of Times a Day", xpModifierPct: -18 }], flavorText: "Up on the hind legs, scanning the horizon, for a stock that hasn't moved in an hour." },
  { id: "scheduled-meerkat", familyId: "meerkat-line", stageIndex: 1, name: "Scheduled Meerkat", title: "The Timed Watcher", archetype: "anxious", rarity: "common", unlock: { level: 18, condition: "Checks positions only at set times for 3 weeks" }, stats: { impulsivity: 35, patience: 45, discipline: 50, riskManagement: 50, consistency: 52, emotionalControl: 45 }, abilities: [{ name: "Three Check-Ins", power: 60, description: "Looks at the market at set times, not constantly." }], strengths: [{ label: "Fixed Check-In Times", xpModifierPct: 20 }], weaknesses: [{ label: "Still Anxious Between Checks", xpModifierPct: -8 }], flavorText: "Still on watch. No longer on alert every second." },
  { id: "composed-meerkat", familyId: "meerkat-line", stageIndex: 2, name: "Composed Meerkat", title: "The Trusting Monitor", archetype: "consistent", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 68, discipline: 74, riskManagement: 72, consistency: 78, emotionalControl: 70 }, abilities: [{ name: "Alerts, Not Anxiety", power: 82, description: "Trusts the stop-loss to do the watching instead." }], strengths: [{ label: "Lets Alerts Do the Work", xpModifierPct: 25 }], weaknesses: [], flavorText: "Finally trusts the plan enough to stop staring at it." },

  // ── 37. PUFFERFISH LINE — Fear-Driven Oversizing ──────────────────────
  { id: "spiked-pufferfish", familyId: "pufferfish-line", stageIndex: 0, name: "Spiked Pufferfish", title: "The Fear Inflator", archetype: "fearful", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 55, patience: 25, discipline: 25, riskManagement: 15, consistency: 25, emotionalControl: 15 }, abilities: [{ name: "Puff Up", power: 60, description: "Adds size when scared, trying to force the fear away." }], strengths: [{ label: "Reacts Fast to Threats", xpModifierPct: 10 }], weaknesses: [{ label: "Oversizes When Afraid", xpModifierPct: -25 }], flavorText: "Gets bigger exactly when it should be getting smaller." },
  { id: "cautious-pufferfish", familyId: "pufferfish-line", stageIndex: 1, name: "Cautious Pufferfish", title: "The Size-Checker", archetype: "fearful", rarity: "uncommon", unlock: { level: 18, condition: "Reduces size instead of adding on 15 fear-driven trades" }, stats: { impulsivity: 40, patience: 45, discipline: 48, riskManagement: 48, consistency: 46, emotionalControl: 45 }, abilities: [{ name: "Shrink Instead", power: 62, description: "Sizes down when scared instead of puffing up." }], strengths: [{ label: "Reduces Size Under Stress", xpModifierPct: 20 }], weaknesses: [{ label: "Still Reacts Emotionally First", xpModifierPct: -8 }], flavorText: "The instinct to inflate is still there. The hand doesn't follow it anymore." },
  { id: "steady-pufferfish", familyId: "pufferfish-line", stageIndex: 2, name: "Steady Pufferfish", title: "The Even-Keeled Sizer", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 68, discipline: 76, riskManagement: 78, consistency: 74, emotionalControl: 72 }, abilities: [{ name: "Fixed Regardless of Fear", power: 84, description: "Position size stays the same whether calm or scared." }], strengths: [{ label: "Size Independent of Emotion", xpModifierPct: 28 }], weaknesses: [], flavorText: "Fear shows up. The position size doesn't move." },

  // ── 38. SWAN LINE — Tail-Risk Blindness ────────────────────────────────
  { id: "naive-swan", familyId: "swan-line", stageIndex: 0, name: "Naive Swan", title: "The Unhedged Trader", archetype: "complacent", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 35, patience: 55, discipline: 40, riskManagement: 20, consistency: 45, emotionalControl: 40 }, abilities: [{ name: "Assume Calm", power: 50, description: "Runs full size with no hedge, assuming nothing rare happens." }], strengths: [{ label: "Performs Well in Calm Markets", xpModifierPct: 12 }], weaknesses: [{ label: "Zero Protection Against Tail Risk", xpModifierPct: -25 }], flavorText: "Every calm market feels permanent right up until it isn't." },
  { id: "hedging-swan", familyId: "swan-line", stageIndex: 1, name: "Hedging Swan", title: "The Cautious Insurer", archetype: "complacent", rarity: "uncommon", unlock: { level: 18, condition: "Carries a hedge or reduced size through 10 high-risk events" }, stats: { impulsivity: 25, patience: 60, discipline: 55, riskManagement: 55, consistency: 55, emotionalControl: 52 }, abilities: [{ name: "Small Hedge", power: 64, description: "Carries a small, cheap hedge through known risk events." }], strengths: [{ label: "Hedges Known Catalysts", xpModifierPct: 20 }], weaknesses: [{ label: "Under-Hedges the Truly Unknown", xpModifierPct: -8 }], flavorText: "Can't predict the black swan. Can afford to survive one now." },
  { id: "sentinel-swan", familyId: "swan-line", stageIndex: 2, name: "Sentinel Swan", title: "The Tail-Risk Guardian", archetype: "resilient", rarity: "epic", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 74, discipline: 78, riskManagement: 85, consistency: 76, emotionalControl: 76 }, abilities: [{ name: "Always Hedged", power: 88, description: "Structured so a single rare event can't end the account." }], strengths: [{ label: "Portfolio Survives Any Single Shock", xpModifierPct: 30 }], weaknesses: [], flavorText: "Plans for the black swan every day it doesn't show up." },

  // ── 39. DRAGON LINE — Hoarding Gains, Never Taking Profit (mythical) ──
  { id: "hoarding-dragon", familyId: "dragon-line", stageIndex: 0, name: "Hoarding Dragon", title: "The Profit Refuser", archetype: "greedy", rarity: "rare", unlock: { level: 1 }, stats: { impulsivity: 30, patience: 70, discipline: 30, riskManagement: 25, consistency: 40, emotionalControl: 35 }, abilities: [{ name: "Guard the Hoard", power: 70, description: "Refuses to sell a winner, no matter how extended." }], strengths: [{ label: "Lets Winners Run", xpModifierPct: 15 }], weaknesses: [{ label: "Never Takes Profit", xpModifierPct: -25 }, { label: "No Exit Plan on Winners", xpModifierPct: -15 }], flavorText: "The position is up 400%. It will not be sold. It will simply be admired." },
  { id: "ember-dragon", familyId: "dragon-line", stageIndex: 1, name: "Ember Dragon", title: "The Reluctant Seller", archetype: "greedy", rarity: "rare", unlock: { level: 18, condition: "Scales out of 10 extended winners" }, stats: { impulsivity: 25, patience: 75, discipline: 50, riskManagement: 50, consistency: 55, emotionalControl: 50 }, abilities: [{ name: "Partial Hoard", power: 65, description: "Learns to bank some treasure without giving up the rest." }], strengths: [{ label: "Scales Out on Strength", xpModifierPct: 20 }], weaknesses: [{ label: "Still Reluctant to Sell the Core", xpModifierPct: -8 }], flavorText: "Starting to understand that treasure banked is treasure kept." },
  { id: "sovereign-dragon", familyId: "dragon-line", stageIndex: 2, name: "Sovereign Dragon", title: "The Disciplined Profiteer", archetype: "disciplined", rarity: "epic", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 80, discipline: 78, riskManagement: 76, consistency: 78, emotionalControl: 75 }, abilities: [{ name: "Target Discipline", power: 85, description: "Exits exactly at the plan, no matter how good it feels to hold." }], strengths: [{ label: "Disciplined Profit-Taking", xpModifierPct: 28 }], weaknesses: [], flavorText: "Guards nothing anymore except the process itself." },

  // ── 40. UNICORN LINE — Holy Grail Syndrome (mythical) ─────────────────
  { id: "grail-seeking-unicorn", familyId: "unicorn-line", stageIndex: 0, name: "Grail-Seeking Unicorn", title: "The System Hopper", archetype: "idealistic", rarity: "rare", unlock: { level: 1 }, stats: { impulsivity: 45, patience: 30, discipline: 25, riskManagement: 30, consistency: 15, emotionalControl: 35 }, abilities: [{ name: "Abandon Ship", power: 55, description: "Drops a working system the moment it has a losing week, convinced a better one exists." }], strengths: [{ label: "Always Learning", xpModifierPct: 10 }], weaknesses: [{ label: "Never Sticks With a System", xpModifierPct: -25 }], flavorText: "Certain the perfect, loss-free strategy is one more course away." },
  { id: "questing-unicorn", familyId: "unicorn-line", stageIndex: 1, name: "Questing Unicorn", title: "The Fair Evaluator", archetype: "idealistic", rarity: "rare", unlock: { level: 18, condition: "Runs a system for 30 trades before judging it" }, stats: { impulsivity: 30, patience: 50, discipline: 48, riskManagement: 48, consistency: 45, emotionalControl: 45 }, abilities: [{ name: "Sample Size", power: 62, description: "Gives a system a real sample of trades before judging it." }], strengths: [{ label: "Evaluates Systems Fairly", xpModifierPct: 20 }], weaknesses: [{ label: "Still Tempted by the Next Shiny System", xpModifierPct: -8 }], flavorText: "Learning that a system's losing week isn't proof it's broken." },
  { id: "true-unicorn", familyId: "unicorn-line", stageIndex: 2, name: "True Unicorn", title: "The Edge Keeper", archetype: "analytical", rarity: "epic", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 70, discipline: 75, riskManagement: 72, consistency: 76, emotionalControl: 72 }, abilities: [{ name: "The Real Edge", power: 86, description: "Found an edge that isn't perfect and stuck with it anyway." }], strengths: [{ label: "System Loyalty Through Drawdown", xpModifierPct: 26 }], weaknesses: [], flavorText: "Realized the grail was never a perfect system. It was consistency with an imperfect one." },

  // ── 41. GRIFFIN LINE — Overprotective Stops (mythical) ────────────────
  { id: "twitchy-griffin", familyId: "griffin-line", stageIndex: 0, name: "Twitchy Griffin", title: "The Stop Strangler", archetype: "anxious", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 40, patience: 25, discipline: 35, riskManagement: 45, consistency: 25, emotionalControl: 20 }, abilities: [{ name: "Snatch Away", power: 55, description: "Pulls the stop in tighter the moment the trade breathes, guaranteeing a stop-out." }], strengths: [{ label: "Fiercely Protects Capital", xpModifierPct: 12 }], weaknesses: [{ label: "Stops Placed Too Tight", xpModifierPct: -22 }], flavorText: "So determined to protect the nest that nothing is ever allowed to grow in it." },
  { id: "steady-griffin", familyId: "griffin-line", stageIndex: 1, name: "Steady Griffin", title: "The Fair Guardian", archetype: "anxious", rarity: "common", unlock: { level: 18, condition: "Leaves the original stop untouched on 15 trades" }, stats: { impulsivity: 28, patience: 48, discipline: 52, riskManagement: 55, consistency: 48, emotionalControl: 45 }, abilities: [{ name: "Room to Breathe", power: 64, description: "Sets the stop at the plan's level and leaves it there." }], strengths: [{ label: "Respects Original Stop Placement", xpModifierPct: 20 }], weaknesses: [{ label: "Occasionally Tightens Under Stress", xpModifierPct: -8 }], flavorText: "Learning that protection and strangulation aren't the same thing." },
  { id: "sentinel-griffin", familyId: "griffin-line", stageIndex: 2, name: "Sentinel Griffin", title: "The Patient Guardian", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 18, patience: 68, discipline: 75, riskManagement: 78, consistency: 72, emotionalControl: 70 }, abilities: [{ name: "Guardian's Patience", power: 84, description: "Protects the account without suffocating the trade." }], strengths: [{ label: "Stops Placed by Plan, Not Fear", xpModifierPct: 26 }], weaknesses: [], flavorText: "Fierce where it counts. Patient everywhere else." },

  // ── 42. KRAKEN LINE — Concentration Risk (mythical) ───────────────────
  { id: "surfacing-kraken", familyId: "kraken-line", stageIndex: 0, name: "Surfacing Kraken", title: "The All-In Trader", archetype: "concentrated", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 55, patience: 35, discipline: 25, riskManagement: 15, consistency: 30, emotionalControl: 30 }, abilities: [{ name: "Full Surface", power: 70, description: "Puts the entire account into a single position." }], strengths: [{ label: "Massive Conviction", xpModifierPct: 10 }], weaknesses: [{ label: "No Position Limits", xpModifierPct: -28 }], flavorText: "Calm on the surface. One trade holds the whole account underneath." },
  { id: "circling-kraken", familyId: "kraken-line", stageIndex: 1, name: "Circling Kraken", title: "The Spreading Arms", archetype: "concentrated", rarity: "uncommon", unlock: { level: 18, condition: "Caps any single position to a fixed % of account for 15 trades" }, stats: { impulsivity: 40, patience: 48, discipline: 48, riskManagement: 48, consistency: 48, emotionalControl: 45 }, abilities: [{ name: "Spread the Arms", power: 62, description: "Splits size across a few uncorrelated positions instead of one." }], strengths: [{ label: "Caps Single-Position Risk", xpModifierPct: 20 }], weaknesses: [{ label: "Still Concentrates in Favorite Setups", xpModifierPct: -8 }], flavorText: "Learning that eight arms can hold eight different things." },
  { id: "depths-kraken", familyId: "kraken-line", stageIndex: 2, name: "Depths Kraken", title: "The Portfolio Master", archetype: "consistent", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 25, patience: 68, discipline: 74, riskManagement: 80, consistency: 74, emotionalControl: 70 }, abilities: [{ name: "Portfolio Awareness", power: 85, description: "Never lets one position threaten the whole account." }], strengths: [{ label: "Enforces Position-Size Limits", xpModifierPct: 28 }], weaknesses: [], flavorText: "Immense power, finally distributed instead of concentrated." },

  // ── 43. SPHINX LINE — Seeing Patterns That Aren't There (mythical) ────
  { id: "riddling-sphinx", familyId: "sphinx-line", stageIndex: 0, name: "Riddling Sphinx", title: "The Pattern Hallucinator", archetype: "illusory", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 35, patience: 45, discipline: 30, riskManagement: 30, consistency: 25, emotionalControl: 35 }, abilities: [{ name: "Hidden Meaning", power: 55, description: "Sees a secret pattern in random noise and trades it like a certainty." }], strengths: [{ label: "Creative Pattern Recognition", xpModifierPct: 10 }], weaknesses: [{ label: "Trades Patterns That Aren't Statistically Real", xpModifierPct: -22 }], flavorText: "Finds a face in every cloud. Trades every face." },
  { id: "questioning-sphinx", familyId: "sphinx-line", stageIndex: 1, name: "Questioning Sphinx", title: "The Fact-Checker", archetype: "illusory", rarity: "uncommon", unlock: { level: 18, condition: "Backtests 10 patterns before trading them live" }, stats: { impulsivity: 25, patience: 55, discipline: 50, riskManagement: 50, consistency: 48, emotionalControl: 48 }, abilities: [{ name: "Prove It First", power: 64, description: "Backtests a pattern before trusting it live." }], strengths: [{ label: "Verifies Patterns With Data", xpModifierPct: 20 }], weaknesses: [{ label: "Still Drawn to Elegant-Looking Setups", xpModifierPct: -8 }], flavorText: "Asks the riddle a second time before betting on the answer." },
  { id: "oracle-sphinx", familyId: "sphinx-line", stageIndex: 2, name: "Oracle Sphinx", title: "The Statistical Trader", archetype: "analytical", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 15, patience: 72, discipline: 76, riskManagement: 74, consistency: 76, emotionalControl: 72 }, abilities: [{ name: "Real Signal", power: 86, description: "Trades only patterns with real, tested statistical edge." }], strengths: [{ label: "Statistically Validated Setups Only", xpModifierPct: 27 }], weaknesses: [], flavorText: "Stopped looking for meaning. Started looking for evidence." },

  // ── 44. HYDRA LINE — Multiplying Instead of Fixing (mythical) ─────────
  { id: "multiplying-hydra", familyId: "hydra-line", stageIndex: 0, name: "Multiplying Hydra", title: "The Fresh Start Addict", archetype: "evasive", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 50, patience: 30, discipline: 20, riskManagement: 30, consistency: 15, emotionalControl: 30 }, abilities: [{ name: "Grow Another Head", power: 55, description: "Opens a new account or strategy every time one fails, instead of asking why it failed." }], strengths: [{ label: "Resilient, Keeps Trying", xpModifierPct: 10 }], weaknesses: [{ label: "Never Diagnoses the Real Problem", xpModifierPct: -25 }], flavorText: "Five accounts, five failed strategies, zero postmortems." },
  { id: "healing-hydra", familyId: "hydra-line", stageIndex: 1, name: "Healing Hydra", title: "The Postmortem Runner", archetype: "evasive", rarity: "uncommon", unlock: { level: 18, condition: "Writes a real postmortem on 5 losing streaks" }, stats: { impulsivity: 35, patience: 48, discipline: 48, riskManagement: 46, consistency: 46, emotionalControl: 46 }, abilities: [{ name: "One Head at a Time", power: 62, description: "Reviews why a strategy failed before starting a new one." }], strengths: [{ label: "Runs a Real Postmortem on Losses", xpModifierPct: 20 }], weaknesses: [{ label: "Still Tempted to Just Start Over", xpModifierPct: -8 }], flavorText: "Learning that cutting the real problem off takes more than starting fresh." },
  { id: "singular-hydra", familyId: "hydra-line", stageIndex: 2, name: "Singular Hydra", title: "The Root-Cause Trader", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 70, discipline: 76, riskManagement: 72, consistency: 74, emotionalControl: 70 }, abilities: [{ name: "One True Head", power: 84, description: "Fixes the actual problem instead of running from it." }], strengths: [{ label: "Root-Causes Every Losing Streak", xpModifierPct: 26 }], weaknesses: [], flavorText: "Down to one head. The one that learned." },

  // ── 45. BASILISK LINE — In-Trade Freeze (mythical) ────────────────────
  { id: "petrifying-basilisk", familyId: "basilisk-line", stageIndex: 0, name: "Petrifying Basilisk", title: "The Frozen Manager", archetype: "anxious", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 30, patience: 40, discipline: 30, riskManagement: 35, consistency: 25, emotionalControl: 15 }, abilities: [{ name: "Frozen Stare", power: 50, description: "Locks up the moment a live trade moves against it, unable to act." }], strengths: [{ label: "Calm Before the Trade", xpModifierPct: 10 }], weaknesses: [{ label: "Can't Manage a Position Once It's Live", xpModifierPct: -24 }], flavorText: "Fine right up until the trade is real. Then nothing moves, including the mouse." },
  { id: "blinking-basilisk", familyId: "basilisk-line", stageIndex: 1, name: "Blinking Basilisk", title: "The Pre-Decided Manager", archetype: "anxious", rarity: "common", unlock: { level: 18, condition: "Follows a pre-decided in-trade rule 15 times" }, stats: { impulsivity: 22, patience: 50, discipline: 50, riskManagement: 50, consistency: 48, emotionalControl: 42 }, abilities: [{ name: "One Rule, Live", power: 62, description: "Has a single, pre-decided rule for what to do when a trade moves — and follows it." }], strengths: [{ label: "Executes the Plan Under Pressure", xpModifierPct: 20 }], weaknesses: [{ label: "Still Hesitates on the First Adjustment", xpModifierPct: -8 }], flavorText: "The freeze is shorter now. The plan thaws it faster." },
  { id: "watchful-basilisk", familyId: "basilisk-line", stageIndex: 2, name: "Watchful Basilisk", title: "The Composed Manager", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 15, patience: 70, discipline: 76, riskManagement: 75, consistency: 74, emotionalControl: 76 }, abilities: [{ name: "Steady Gaze", power: 84, description: "Manages a live trade exactly as calmly as it planned to." }], strengths: [{ label: "Composed Position Management", xpModifierPct: 27 }], weaknesses: [], flavorText: "The stare that used to freeze it now just watches, clear-eyed." },

  // ── 46. CENTAUR LINE — Overriding a Good System (mythical) ────────────
  { id: "restless-centaur", familyId: "centaur-line", stageIndex: 0, name: "Restless Centaur", title: "The System Overrider", archetype: "conflicted", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 55, patience: 35, discipline: 35, riskManagement: 35, consistency: 25, emotionalControl: 35 }, abilities: [{ name: "Override", power: 60, description: "Has a working rules-based system and ignores it on a hunch." }], strengths: [{ label: "Good Instincts, Sometimes", xpModifierPct: 12 }], weaknesses: [{ label: "Constantly Overrides Its Own System", xpModifierPct: -22 }], flavorText: "Built a system it trusts less than its own gut, on a bad day." },
  { id: "aligning-centaur", familyId: "centaur-line", stageIndex: 1, name: "Aligning Centaur", title: "The Override Tracker", archetype: "conflicted", rarity: "uncommon", unlock: { level: 18, condition: "Logs every discretionary override for a month" }, stats: { impulsivity: 40, patience: 50, discipline: 52, riskManagement: 50, consistency: 50, emotionalControl: 48 }, abilities: [{ name: "Log the Override", power: 64, description: "Writes down every time it overrides the system, and why." }], strengths: [{ label: "Tracks Its Own Discretionary Calls", xpModifierPct: 20 }], weaknesses: [{ label: "Still Overrides More Than It Should", xpModifierPct: -8 }], flavorText: "Half man, half machine, finally keeping score of which half wins." },
  { id: "unified-centaur", familyId: "centaur-line", stageIndex: 2, name: "Unified Centaur", title: "The Aligned Trader", archetype: "consistent", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 22, patience: 70, discipline: 76, riskManagement: 74, consistency: 78, emotionalControl: 72 }, abilities: [{ name: "One Will", power: 85, description: "Trusts the system it built, discretion and rules finally pointed the same direction." }], strengths: [{ label: "System and Instinct Are Aligned", xpModifierPct: 27 }], weaknesses: [], flavorText: "Stopped fighting itself. Started riding in one direction." },

  // ── 47. SIREN LINE — Falling for the Guaranteed-Return Pitch (mythical) ─
  { id: "listening-siren", familyId: "siren-line", stageIndex: 0, name: "Listening Siren", title: "The Guarantee Chaser", archetype: "naive", rarity: "common", unlock: { level: 1 }, stats: { impulsivity: 50, patience: 30, discipline: 25, riskManagement: 20, consistency: 30, emotionalControl: 30 }, abilities: [{ name: "Follow the Song", power: 55, description: "Joins the paid signal group promising guaranteed returns." }], strengths: [{ label: "Open to New Ideas", xpModifierPct: 8 }], weaknesses: [{ label: "Falls for Guaranteed-Return Pitches", xpModifierPct: -25 }], flavorText: "The song always promises the same thing. It is always wrong." },
  { id: "wary-siren", familyId: "siren-line", stageIndex: 1, name: "Wary Siren", title: "The Claim Checker", archetype: "naive", rarity: "common", unlock: { level: 18, condition: "Verifies 10 service claims before paying for any" }, stats: { impulsivity: 35, patience: 48, discipline: 48, riskManagement: 46, consistency: 48, emotionalControl: 46 }, abilities: [{ name: "Check the Track Record", power: 62, description: "Verifies a service's claims before paying for it." }], strengths: [{ label: "Verifies Claims Before Trusting Them", xpModifierPct: 20 }], weaknesses: [{ label: "Still Curious About the Next Pitch", xpModifierPct: -8 }], flavorText: "Still hears the song. Doesn't follow it off the rocks anymore." },
  { id: "silent-siren", familyId: "siren-line", stageIndex: 2, name: "Silent Siren", title: "The Unmoved Trader", archetype: "disciplined", rarity: "uncommon", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 68, discipline: 74, riskManagement: 72, consistency: 74, emotionalControl: 70 }, abilities: [{ name: "Unmoved", power: 82, description: "No pitch, guarantee, or promise moves it without real evidence." }], strengths: [{ label: "Immune to Guaranteed-Return Claims", xpModifierPct: 26 }], weaknesses: [], flavorText: "Knows exactly what a guarantee in trading is worth." },

  // ── 48. LEVIATHAN LINE — Chasing the Whales (mythical) ────────────────
  { id: "surfacing-leviathan", familyId: "leviathan-line", stageIndex: 0, name: "Surfacing Leviathan", title: "The Whale Chaser", archetype: "imitative", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 50, patience: 35, discipline: 30, riskManagement: 35, consistency: 25, emotionalControl: 35 }, abilities: [{ name: "Follow the Wake", power: 58, description: "Trades on unconfirmed rumors of what 'smart money' is doing." }], strengths: [{ label: "Attuned to Big Moves", xpModifierPct: 10 }], weaknesses: [{ label: "Trades Unverifiable Whale Rumors", xpModifierPct: -22 }], flavorText: "Certain something huge is moving beneath the surface. Usually just current." },
  { id: "tracking-leviathan", familyId: "leviathan-line", stageIndex: 1, name: "Tracking Leviathan", title: "The Flow Confirmer", archetype: "imitative", rarity: "uncommon", unlock: { level: 18, condition: "Waits for price confirmation on 10 whale rumors" }, stats: { impulsivity: 36, patience: 50, discipline: 50, riskManagement: 50, consistency: 46, emotionalControl: 46 }, abilities: [{ name: "Confirm the Wake", power: 64, description: "Waits for price to actually confirm large-player activity." }], strengths: [{ label: "Trades Confirmed Flow, Not Rumor", xpModifierPct: 20 }], weaknesses: [{ label: "Still Checks Whale-Watching Accounts Daily", xpModifierPct: -8 }], flavorText: "Still watches the depths. Trades what surfaces, not what's whispered." },
  { id: "abyssal-leviathan", familyId: "leviathan-line", stageIndex: 2, name: "Abyssal Leviathan", title: "The Structure Reader", archetype: "analytical", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 70, discipline: 75, riskManagement: 74, consistency: 74, emotionalControl: 72 }, abilities: [{ name: "Read the Depths", power: 85, description: "Reads real order flow and structure, not mythology." }], strengths: [{ label: "Trades Structure, Not Speculation", xpModifierPct: 27 }], weaknesses: [], flavorText: "Doesn't chase the whale anymore. Reads the water itself." },

  // ── 49. WENDIGO LINE — Compulsive, Addictive Trading (mythical) ───────
  { id: "starving-wendigo", familyId: "wendigo-line", stageIndex: 0, name: "Starving Wendigo", title: "The Compulsive Clicker", archetype: "compulsive", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 70, patience: 15, discipline: 20, riskManagement: 25, consistency: 20, emotionalControl: 15 }, abilities: [{ name: "Insatiable", power: 65, description: "Trades for the rush, not the setup. Can't stop clicking." }], strengths: [{ label: "Endless Energy for the Market", xpModifierPct: 8 }], weaknesses: [{ label: "Trades Compulsively, Can't Stop", xpModifierPct: -26 }], flavorText: "Never full. Every trade just makes room for the next one." },
  { id: "fasting-wendigo", familyId: "wendigo-line", stageIndex: 1, name: "Fasting Wendigo", title: "The Scheduled Breaker", archetype: "compulsive", rarity: "uncommon", unlock: { level: 18, condition: "Takes a scheduled break from trading for 3 weeks straight" }, stats: { impulsivity: 50, patience: 40, discipline: 46, riskManagement: 46, consistency: 44, emotionalControl: 40 }, abilities: [{ name: "Enforced Break", power: 62, description: "Steps away from the screen on a timer, whether it wants to or not." }], strengths: [{ label: "Takes Scheduled Breaks From Trading", xpModifierPct: 20 }], weaknesses: [{ label: "Still Feels the Pull Constantly", xpModifierPct: -10 }], flavorText: "The hunger is still there. It's learning to sit with it instead of feeding it." },
  { id: "tempered-wendigo", familyId: "wendigo-line", stageIndex: 2, name: "Tempered Wendigo", title: "The Fed Trader", archetype: "disciplined", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 28, patience: 65, discipline: 74, riskManagement: 72, consistency: 72, emotionalControl: 68 }, abilities: [{ name: "Fed, Not Starving", power: 84, description: "Trades from a plan, not a craving." }], strengths: [{ label: "Trading No Longer Feels Compulsive", xpModifierPct: 26 }], weaknesses: [], flavorText: "Learned the difference between wanting to trade and needing to." },

  // ── 50. OUROBOROS LINE — Breaking the Repeating Cycle (mythical) ──────
  { id: "consuming-ouroboros", familyId: "ouroboros-line", stageIndex: 0, name: "Consuming Ouroboros", title: "The Repeating Mistake", archetype: "cyclical", rarity: "epic", unlock: { level: 1, condition: "Has journaled the same mistake 3+ times" }, stats: { impulsivity: 45, patience: 40, discipline: 35, riskManagement: 35, consistency: 20, emotionalControl: 35 }, abilities: [{ name: "The Loop", power: 60, description: "Makes the exact same mistake again, having clearly identified it before." }], strengths: [{ label: "Self-Aware Enough to Name the Pattern", xpModifierPct: 12 }], weaknesses: [{ label: "Insight Never Becomes Behavior Change", xpModifierPct: -25 }], flavorText: "Knows exactly what it's about to do wrong. Does it anyway." },
  { id: "turning-ouroboros", familyId: "ouroboros-line", stageIndex: 1, name: "Turning Ouroboros", title: "The Interrupted Loop", archetype: "cyclical", rarity: "epic", unlock: { level: 18, condition: "Breaks the identified pattern 10 times in a row" }, stats: { impulsivity: 32, patience: 55, discipline: 52, riskManagement: 52, consistency: 48, emotionalControl: 50 }, abilities: [{ name: "Break One Link", power: 66, description: "Interrupts the loop at one specific, chosen point." }], strengths: [{ label: "Successfully Breaks One Habit Loop", xpModifierPct: 22 }], weaknesses: [{ label: "Other Loops Still Run Unchecked", xpModifierPct: -8 }], flavorText: "The circle finally has a gap in it." },
  { id: "broken-ouroboros", familyId: "ouroboros-line", stageIndex: 2, name: "Broken Ouroboros", title: "The Pattern That Ended", archetype: "resilient", rarity: "legendary", unlock: { level: 40, condition: "60 days with zero recurrence of the original pattern" }, stats: { impulsivity: 18, patience: 78, discipline: 82, riskManagement: 78, consistency: 82, emotionalControl: 80 }, abilities: [{ name: "Uncoiled", power: 90, description: "The cycle that used to repeat is simply gone." }], strengths: [{ label: "Permanently Broke a Behavioral Pattern", xpModifierPct: 30 }], weaknesses: [], flavorText: "The tail let go of the mouth. The loop became a line, moving forward." },

  // ── 51. MANTICORE LINE — The Hidden Sting of Costs (mythical) ─────────
  { id: "venomous-manticore", familyId: "manticore-line", stageIndex: 0, name: "Venomous Manticore", title: "The Unseen Bleeder", archetype: "complacent", rarity: "uncommon", unlock: { level: 1 }, stats: { impulsivity: 40, patience: 40, discipline: 30, riskManagement: 30, consistency: 30, emotionalControl: 35 }, abilities: [{ name: "Unseen Sting", power: 55, description: "Bleeds the account through commissions and slippage it never tracks." }], strengths: [{ label: "Trades Frequently, Stays Active", xpModifierPct: 8 }], weaknesses: [{ label: "Never Tracks Real Trading Costs", xpModifierPct: -22 }], flavorText: "Every trade takes a little bite. It has never once counted the bites." },
  { id: "watchful-manticore", familyId: "manticore-line", stageIndex: 1, name: "Watchful Manticore", title: "The Cost Counter", archetype: "complacent", rarity: "uncommon", unlock: { level: 18, condition: "Tracks commissions and slippage against gross P&L for a month" }, stats: { impulsivity: 32, patience: 52, discipline: 50, riskManagement: 48, consistency: 50, emotionalControl: 46 }, abilities: [{ name: "Count the Stings", power: 62, description: "Tracks commissions and slippage against gross P&L." }], strengths: [{ label: "Tracks Total Trading Costs", xpModifierPct: 20 }], weaknesses: [{ label: "Still Surprised By the Total Sometimes", xpModifierPct: -8 }], flavorText: "Started counting the bites. Didn't like the number." },
  { id: "disciplined-manticore", familyId: "manticore-line", stageIndex: 2, name: "Disciplined Manticore", title: "The Cost-Aware Trader", archetype: "analytical", rarity: "rare", unlock: { level: 40 }, stats: { impulsivity: 20, patience: 70, discipline: 75, riskManagement: 72, consistency: 74, emotionalControl: 70 }, abilities: [{ name: "No Waste", power: 84, description: "Trades sized and timed to make costs irrelevant to the edge." }], strengths: [{ label: "Cost-Aware Position Sizing", xpModifierPct: 26 }], weaknesses: [], flavorText: "The sting is still there. It just doesn't matter anymore." },
];

export const characterFamilies: CharacterFamily[] = [
  { id: "monkey-line", name: "Monkey Line", theme: "Impulsivity & FOMO", dexNumber: 1, stageIds: ["fomo-monkey", "ape-apprentice", "gorillic-trader", "market-master"] },
  { id: "panda-line", name: "Panda Line", theme: "Patience & Discipline", dexNumber: 2, stageIds: ["patient-panda", "zen-panda", "sage-panda", "grandmaster-panda"] },
  { id: "hippo-line", name: "Hippo Line", theme: "Conviction & Diamond Hands", dexNumber: 3, stageIds: ["hodl-hippo", "vault-hippo", "fortress-hippo"] },
  { id: "goblin-line", name: "Goblin Line", theme: "Greed", dexNumber: 4, stageIds: ["greedy-goblin", "hoarder-goblin", "tycoon-troll"] },
  { id: "fox-line", name: "Fox Line", theme: "Fear & Early Exits", dexNumber: 5, stageIds: ["fearful-fox", "cautious-fox", "composed-fox"] },
  { id: "otter-line", name: "Otter Line", theme: "Overtrading", dexNumber: 6, stageIds: ["overtrade-otter", "restless-otter", "focused-otter"] },
  { id: "rhino-line", name: "Rhino Line", theme: "Revenge Trading", dexNumber: 7, stageIds: ["revenge-rhino", "simmer-rhino", "iron-rhino"] },
  { id: "owl-line", name: "Owl Line", theme: "Overanalysis & Paralysis", dexNumber: 8, stageIds: ["overthink-owl", "study-owl", "insight-owl"] },
  { id: "hare-line", name: "Hare Line", theme: "Anxiety & Panic Selling", dexNumber: 9, stageIds: ["anxious-hare", "steady-hare", "calm-hare"] },
  { id: "lion-line", name: "Lion Line", theme: "Overconfidence", dexNumber: 10, stageIds: ["cocky-cub", "bold-lion", "humble-king"] },
  { id: "wolf-line", name: "Wolf Line", theme: "Leverage & Gambling", dexNumber: 11, stageIds: ["reckless-pup", "lone-wolf", "alpha-wolf"] },
  { id: "turtle-line", name: "Turtle Line", theme: "Risk Management Mastery", dexNumber: 12, stageIds: ["cautious-turtle", "armored-turtle", "titan-tortoise"] },
  { id: "hound-line", name: "Hound Line", theme: "News & Headline Chasing", dexNumber: 13, stageIds: ["headline-hound", "signal-hound", "tracker-hound"] },
  { id: "bull-line", name: "Bull Line", theme: "Averaging Down & Stubbornness", dexNumber: 14, stageIds: ["stubborn-calf", "bracing-bull", "unshakable-bull"] },
  { id: "elephant-line", name: "Elephant Line", theme: "Consistency & Journaling", dexNumber: 15, stageIds: ["rookie-elephant", "diligent-elephant", "elder-elephant"] },
  { id: "chameleon-line", name: "Chameleon Line", theme: "Adaptability", dexNumber: 16, stageIds: ["erratic-chameleon", "adaptive-chameleon", "master-chameleon"] },
  { id: "beaver-line", name: "Beaver Line", theme: "System-Building & Backtesting", dexNumber: 17, stageIds: ["busy-beaver", "architect-beaver", "engineer-beaver"] },
  { id: "phoenix-line", name: "Phoenix Line", theme: "Redemption & Comeback", dexNumber: 18, stageIds: ["ash-phoenix", "rising-phoenix"] },
  { id: "bear-line", name: "Bear Line", theme: "Pessimism & Doom Bias", dexNumber: 19, stageIds: ["gloom-bear", "wary-bear", "macro-bear"] },
  { id: "sloth-line", name: "Sloth Line", theme: "Hesitation & Procrastination", dexNumber: 20, stageIds: ["idle-sloth", "moving-sloth", "decisive-sloth"] },
  { id: "peacock-line", name: "Peacock Line", theme: "Vanity & Social Clout Trading", dexNumber: 21, stageIds: ["flashy-peacock", "honest-peacock", "verified-peacock"] },
  { id: "squirrel-line", name: "Squirrel Line", theme: "Over-Diversification & Hoarding", dexNumber: 22, stageIds: ["scatter-squirrel", "sorting-squirrel", "portfolio-squirrel"] },
  { id: "cat-line", name: "Cat Line", theme: "Copycat & Signal-Following", dexNumber: 23, stageIds: ["copycat-kitten", "curious-cat", "independent-cat"] },
  { id: "ostrich-line", name: "Ostrich Line", theme: "Denial & Avoidance", dexNumber: 24, stageIds: ["buried-ostrich", "watching-ostrich", "clear-eyed-ostrich"] },
  { id: "crab-line", name: "Crab Line", theme: "Choppy-Market Overtrading", dexNumber: 25, stageIds: ["chopped-crab", "sidestep-crab", "range-master-crab"] },
  { id: "jellyfish-line", name: "Jellyfish Line", theme: "Driftless / No Strategy", dexNumber: 26, stageIds: ["drifting-jellyfish", "current-jellyfish", "anchored-jellyfish"] },
  { id: "raccoon-line", name: "Raccoon Line", theme: "Poor Routine & Fatigue Trading", dexNumber: 27, stageIds: ["night-raccoon", "routine-raccoon", "sharp-raccoon"] },
  { id: "cheetah-line", name: "Cheetah Line", theme: "Speed Obsession & Overleveraged Scalping", dexNumber: 28, stageIds: ["sprint-cheetah", "paced-cheetah", "precision-cheetah"] },
  { id: "camel-line", name: "Camel Line", theme: "Enduring Dead Markets Without Forcing Trades", dexNumber: 29, stageIds: ["restless-camel", "enduring-camel", "desert-camel"] },
  { id: "magpie-line", name: "Magpie Line", theme: "Shiny-Object & Hype Chasing", dexNumber: 30, stageIds: ["shiny-magpie", "curated-magpie", "focused-magpie"] },
  { id: "mule-line", name: "Mule Line", theme: "Stubborn Refusal to Exit", dexNumber: 31, stageIds: ["stubborn-mule", "reasoning-mule", "graceful-mule"] },
  { id: "vulture-line", name: "Vulture Line", theme: "Opportunistic Distress Buying", dexNumber: 32, stageIds: ["circling-vulture", "assessing-vulture", "value-vulture"] },
  { id: "hyena-line", name: "Hyena Line", theme: "Herd Mentality", dexNumber: 33, stageIds: ["pack-hyena", "watchful-hyena", "lone-hyena"] },
  { id: "octopus-line", name: "Octopus Line", theme: "Tool & Indicator Overload", dexNumber: 34, stageIds: ["tangled-octopus", "streamlining-octopus", "clarity-octopus"] },
  { id: "koala-line", name: "Koala Line", theme: "Complacency & Risk Neglect", dexNumber: 35, stageIds: ["drowsy-koala", "alert-koala", "guardian-koala"] },
  { id: "meerkat-line", name: "Meerkat Line", theme: "Compulsive Price-Checking", dexNumber: 36, stageIds: ["jittery-meerkat", "scheduled-meerkat", "composed-meerkat"] },
  { id: "pufferfish-line", name: "Pufferfish Line", theme: "Fear-Driven Oversizing", dexNumber: 37, stageIds: ["spiked-pufferfish", "cautious-pufferfish", "steady-pufferfish"] },
  { id: "swan-line", name: "Swan Line", theme: "Tail-Risk Blindness", dexNumber: 38, stageIds: ["naive-swan", "hedging-swan", "sentinel-swan"] },
  { id: "dragon-line", name: "Dragon Line", theme: "Hoarding Gains, Never Taking Profit", dexNumber: 39, stageIds: ["hoarding-dragon", "ember-dragon", "sovereign-dragon"] },
  { id: "unicorn-line", name: "Unicorn Line", theme: "Holy Grail Syndrome", dexNumber: 40, stageIds: ["grail-seeking-unicorn", "questing-unicorn", "true-unicorn"] },
  { id: "griffin-line", name: "Griffin Line", theme: "Overprotective Stops", dexNumber: 41, stageIds: ["twitchy-griffin", "steady-griffin", "sentinel-griffin"] },
  { id: "kraken-line", name: "Kraken Line", theme: "Concentration Risk", dexNumber: 42, stageIds: ["surfacing-kraken", "circling-kraken", "depths-kraken"] },
  { id: "sphinx-line", name: "Sphinx Line", theme: "Seeing Patterns That Aren't There", dexNumber: 43, stageIds: ["riddling-sphinx", "questioning-sphinx", "oracle-sphinx"] },
  { id: "hydra-line", name: "Hydra Line", theme: "Multiplying Instead of Fixing", dexNumber: 44, stageIds: ["multiplying-hydra", "healing-hydra", "singular-hydra"] },
  { id: "basilisk-line", name: "Basilisk Line", theme: "In-Trade Freeze", dexNumber: 45, stageIds: ["petrifying-basilisk", "blinking-basilisk", "watchful-basilisk"] },
  { id: "centaur-line", name: "Centaur Line", theme: "Overriding a Good System", dexNumber: 46, stageIds: ["restless-centaur", "aligning-centaur", "unified-centaur"] },
  { id: "siren-line", name: "Siren Line", theme: "Falling for the Guaranteed-Return Pitch", dexNumber: 47, stageIds: ["listening-siren", "wary-siren", "silent-siren"] },
  { id: "leviathan-line", name: "Leviathan Line", theme: "Chasing the Whales", dexNumber: 48, stageIds: ["surfacing-leviathan", "tracking-leviathan", "abyssal-leviathan"] },
  { id: "wendigo-line", name: "Wendigo Line", theme: "Compulsive, Addictive Trading", dexNumber: 49, stageIds: ["starving-wendigo", "fasting-wendigo", "tempered-wendigo"] },
  { id: "ouroboros-line", name: "Ouroboros Line", theme: "Breaking the Repeating Cycle", dexNumber: 50, stageIds: ["consuming-ouroboros", "turning-ouroboros", "broken-ouroboros"] },
  { id: "manticore-line", name: "Manticore Line", theme: "The Hidden Sting of Costs", dexNumber: 51, stageIds: ["venomous-manticore", "watchful-manticore", "disciplined-manticore"] },
];

export const characterStageById: Record<string, CharacterStage> = Object.fromEntries(
  characterStages.map((stage) => [stage.id, stage]),
);
