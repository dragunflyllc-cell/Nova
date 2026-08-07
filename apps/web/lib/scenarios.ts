/**
 * Chart Scenarios: hand-authored practice setups for the "would you buy or
 * sell" quiz. These are synthetic candles built to model a specific,
 * mechanism-accurate pattern (a liquidity grab, an order block rejection,
 * etc.) — not a replay of an actual historical chart. That distinction
 * matters and should stay visible in the UI copy, not just in this comment.
 */

export interface ScenarioCandle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface Scenario {
  id: string;
  title: string;
  concept: string;
  briefing: string;
  /** Candles shown before the user has to decide. */
  setup: ScenarioCandle[];
  /** Candles revealed after the user submits, continuing on from `setup`. */
  outcome: ScenarioCandle[];
  correctDirection: "long" | "short";
  rationale: string;
}

export type Direction = "long" | "short" | "skip";

export interface ScenarioAttempt {
  direction: Direction;
  entry: number;
  stop: number;
  target: number;
}

export type PriceOutcome = "target_hit" | "stopped_out" | "no_hit" | "invalid" | "n/a";

export interface ScenarioScore {
  directionCorrect: boolean;
  riskRewardRatio: number | null;
  priceOutcome: PriceOutcome;
  points: number;
  feedback: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "liquidity-grab-reversal",
    title: "Scenario 1: The range breaks down",
    concept: "Liquidity grab + reversal",
    briefing:
      "Price has been grinding lower into a support area and just went quiet — a tight little range sitting right on an old low. The next candle wicks hard below it, then closes back inside. What do you do on the close of that candle?",
    setup: [
      { o: 100, h: 101, l: 98, c: 98.5 },
      { o: 98.5, h: 99, l: 96.5, c: 97 },
      { o: 97, h: 97.5, l: 95, c: 95.5 },
      { o: 95.5, h: 96, l: 93.5, c: 94 },
      { o: 94, h: 94.5, l: 92, c: 92.5 },
      { o: 92.5, h: 93, l: 90.5, c: 91 },
      { o: 91, h: 91.5, l: 89, c: 89.5 },
      { o: 89.5, h: 90, l: 87.5, c: 88 },
      { o: 88, h: 88.5, l: 86, c: 86.5 },
      { o: 86.5, h: 87, l: 85.5, c: 86 },
      { o: 86, h: 86.8, l: 85.2, c: 85.8 },
      { o: 85.8, h: 86.2, l: 84.9, c: 85.5 },
      { o: 85.5, h: 85.8, l: 82.5, c: 84.8 },
      { o: 84.8, h: 88, l: 84.5, c: 87.5 },
    ],
    outcome: [
      { o: 87.5, h: 90, l: 87, c: 89.5 },
      { o: 89.5, h: 92, l: 89, c: 91.5 },
      { o: 91.5, h: 93.5, l: 91, c: 93 },
      { o: 93, h: 95, l: 92.5, c: 94.5 },
      { o: 94.5, h: 97, l: 94, c: 96.5 },
      { o: 96.5, h: 99, l: 96, c: 98.5 },
      { o: 98.5, h: 101, l: 98, c: 100.5 },
      { o: 100.5, h: 103, l: 100, c: 102.5 },
    ],
    correctDirection: "long",
    rationale:
      "The tight range sitting right on the old low was accumulation, not support that would just hold on its own. The sharp wick through it swept the stops resting below (a liquidity grab) before closing right back inside — the manipulation phase of Power of Three. The strong bullish close is the distribution phase starting: that's the long. A reasonable stop sits just under the sweep low, and the first real target is the old high the range broke down from — that's where the next pocket of resting liquidity is.",
  },
  {
    id: "order-block-rejection",
    title: "Scenario 2: Rally into resistance",
    concept: "Order block + liquidity grab",
    briefing:
      "Price has rallied hard into an old high and starts chopping right at it — a small order-block-looking range near the highs. Then it wicks above the range on a new local high, and closes back down near the open. What do you do on the close of that candle?",
    setup: [
      { o: 80, h: 81, l: 79, c: 80.5 },
      { o: 80.5, h: 82, l: 80, c: 81.5 },
      { o: 81.5, h: 83.5, l: 81, c: 83 },
      { o: 83, h: 85, l: 82.5, c: 84.5 },
      { o: 84.5, h: 86.5, l: 84, c: 86 },
      { o: 86, h: 88, l: 85.5, c: 87.5 },
      { o: 87.5, h: 89.5, l: 87, c: 89 },
      { o: 89, h: 91, l: 88.5, c: 90.5 },
      { o: 90.5, h: 92.5, l: 90, c: 92 },
      { o: 92, h: 93, l: 91.5, c: 92.5 },
      { o: 92.5, h: 93.2, l: 92, c: 92.8 },
      { o: 92.8, h: 93.5, l: 92.3, c: 93 },
      { o: 93, h: 95.5, l: 92.5, c: 93.2 },
      { o: 93.2, h: 93.5, l: 89, c: 89.5 },
    ],
    outcome: [
      { o: 89.5, h: 90, l: 87, c: 87.5 },
      { o: 87.5, h: 88, l: 85, c: 85.5 },
      { o: 85.5, h: 86, l: 83, c: 83.5 },
      { o: 83.5, h: 84, l: 81, c: 81.5 },
      { o: 81.5, h: 82, l: 79, c: 79.5 },
      { o: 79.5, h: 80, l: 77, c: 77.5 },
      { o: 77.5, h: 78, l: 75, c: 75.5 },
      { o: 75.5, h: 76, l: 73, c: 73.5 },
    ],
    correctDirection: "short",
    rationale:
      "The chop right at the highs was a bearish order block forming, not fresh strength. The wick above it grabbed the buy-side liquidity resting above the range — traders who bought the new high — before closing back down through the whole range, which is the change of character. A reasonable stop sits just above the sweep high, and the target is the next pocket of resting liquidity down at the prior swing low.",
  },
  {
    id: "fvg-fill-rejection",
    title: "Scenario 3: A gap gets tested",
    concept: "Fair value gap fill",
    briefing:
      "Price dropped fast a little while ago, leaving a gap behind. It's now drifted back up into that gap and just wicked into the top of it before closing back down. What do you do on the close of that candle?",
    setup: [
      { o: 95, h: 96, l: 93.5, c: 94 },
      { o: 94, h: 94.2, l: 86, c: 86.5 },
      { o: 86.5, h: 89, l: 86, c: 88.5 },
      { o: 88.5, h: 89, l: 85, c: 85.5 },
      { o: 85.5, h: 86, l: 82, c: 82.5 },
      { o: 82.5, h: 83, l: 80, c: 80.5 },
      { o: 80.5, h: 83, l: 80, c: 82.5 },
      { o: 82.5, h: 85, l: 82, c: 84.5 },
      { o: 84.5, h: 87, l: 84, c: 86.5 },
      { o: 86.5, h: 89.5, l: 86, c: 88.8 },
      { o: 88.8, h: 91.5, l: 88.5, c: 91 },
      { o: 91, h: 92.5, l: 90.5, c: 92 },
      { o: 92, h: 93.2, l: 90.8, c: 91.2 },
    ],
    outcome: [
      { o: 91.2, h: 91.5, l: 88, c: 88.5 },
      { o: 88.5, h: 89, l: 85.5, c: 86 },
      { o: 86, h: 86.5, l: 83, c: 83.5 },
      { o: 83.5, h: 84, l: 80, c: 80.5 },
      { o: 80.5, h: 81, l: 77, c: 77.5 },
      { o: 77.5, h: 78, l: 74, c: 74.5 },
      { o: 74.5, h: 75, l: 71, c: 71.5 },
      { o: 71.5, h: 72, l: 68, c: 68.5 },
    ],
    correctDirection: "short",
    rationale:
      "The fast drop a few candles back left a fair value gap between roughly 89 and 93.5. Price drifted back up to fill it — completely normal, gaps get revisited — but the wick into the top of the gap and the close back down is the tell: the gap got filled and rejected, not broken through. That rejection is the short, with a stop just above the top of the gap and a target back toward the prior swing low the drop originally came from.",
  },
  {
    id: "ote-discount-bounce",
    title: "Scenario 4: A pullback into the deep discount",
    concept: "Premium/discount + optimal trade entry",
    briefing:
      "Price rallied off a low, then pulled back hard — deep enough that it's now sitting in the OTE pocket (61.8%–79% of that up-swing) and just wicked into it before closing back up. What do you do on the close of that candle?",
    setup: [
      { o: 50, h: 52, l: 49, c: 51.5 },
      { o: 51.5, h: 55, l: 51, c: 54.5 },
      { o: 54.5, h: 59, l: 54, c: 58.5 },
      { o: 58.5, h: 63, l: 58, c: 62.5 },
      { o: 62.5, h: 67, l: 62, c: 66.5 },
      { o: 66.5, h: 71, l: 66, c: 70.5 },
      { o: 70.5, h: 75, l: 70, c: 74.5 },
      { o: 74.5, h: 80, l: 74, c: 79 },
      { o: 79, h: 79.5, l: 75, c: 75.5 },
      { o: 75.5, h: 76, l: 71, c: 71.5 },
      { o: 71.5, h: 72, l: 67, c: 67.5 },
      { o: 67.5, h: 68, l: 63, c: 63.5 },
      { o: 63.5, h: 64, l: 59.5, c: 60.5 },
      { o: 60.5, h: 61.5, l: 57.5, c: 60 },
    ],
    outcome: [
      { o: 60, h: 63, l: 59.5, c: 62.5 },
      { o: 62.5, h: 66, l: 62, c: 65.5 },
      { o: 65.5, h: 69, l: 65, c: 68.5 },
      { o: 68.5, h: 72, l: 68, c: 71.5 },
      { o: 71.5, h: 75, l: 71, c: 74.5 },
      { o: 74.5, h: 78, l: 74, c: 77.5 },
      { o: 77.5, h: 82, l: 77, c: 81.5 },
      { o: 81.5, h: 85, l: 81, c: 84.5 },
    ],
    correctDirection: "long",
    rationale:
      "The swing from 50 to 80 defines the range. A pullback into premium (the upper half) would be expensive; this one went all the way into deep discount — into the 61.8%–79% OTE pocket, roughly 56 to 62. The wick into that pocket and the close back up is the reaction ICT traders wait for. A stop belongs just below the pocket, and the target is back toward the old high and beyond — the range is expected to expand, not just refill.",
  },
  {
    id: "judas-swing-fade",
    title: "Scenario 5: The open makes a fast move",
    concept: "Judas Swing",
    briefing:
      "Right after the session open, price pushes up fast — three strong candles in a row. Then the next candle wicks a little higher but closes back down hard. What do you do on the close of that candle?",
    setup: [
      { o: 40, h: 40.5, l: 39.5, c: 40.2 },
      { o: 40.2, h: 40.6, l: 39.8, c: 40.3 },
      { o: 40.3, h: 40.7, l: 39.9, c: 40.4 },
      { o: 40.4, h: 42, l: 40.2, c: 41.8 },
      { o: 41.8, h: 43.5, l: 41.5, c: 43.2 },
      { o: 43.2, h: 45, l: 43, c: 44.8 },
      { o: 44.8, h: 46.5, l: 44.5, c: 46 },
      { o: 46, h: 46.8, l: 44.5, c: 45 },
    ],
    outcome: [
      { o: 45, h: 45.2, l: 43, c: 43.5 },
      { o: 43.5, h: 44, l: 41, c: 41.5 },
      { o: 41.5, h: 42, l: 39, c: 39.5 },
      { o: 39.5, h: 40, l: 37, c: 37.5 },
      { o: 37.5, h: 38, l: 35, c: 35.5 },
      { o: 35.5, h: 36, l: 33, c: 33.5 },
      { o: 33.5, h: 34, l: 31, c: 31.5 },
      { o: 31.5, h: 32, l: 29, c: 29.5 },
    ],
    correctDirection: "short",
    rationale:
      "Three strong candles right after the open looked like the day's direction — that's exactly the trap the Judas Swing describes. The stall and hard close back down is the tell that the initial move was the lie, not the truth. A stop belongs just above that stall high, and the target is the real move that follows for the rest of the session.",
  },
  {
    id: "turtle-soup-long",
    title: "Scenario 6: A dip below yesterday's low",
    concept: "Turtle Soup",
    briefing:
      "Price dipped just below yesterday's low — triggering the stops resting there — then snapped right back above it on a strong close. What do you do on the close of that candle?",
    setup: [
      { o: 70, h: 71, l: 68, c: 69 },
      { o: 69, h: 70, l: 67.5, c: 68.5 },
      { o: 68.5, h: 69, l: 67, c: 68 },
      { o: 68, h: 69.5, l: 67.5, c: 69 },
      { o: 69, h: 69.5, l: 68, c: 68.5 },
      { o: 68.5, h: 69, l: 67.5, c: 68 },
      { o: 68, h: 68.5, l: 66.8, c: 67.5 },
      { o: 67.5, h: 68, l: 64.5, c: 67.2 },
      { o: 67.2, h: 69.5, l: 67, c: 69.2 },
    ],
    outcome: [
      { o: 69.2, h: 71, l: 69, c: 70.5 },
      { o: 70.5, h: 73, l: 70, c: 72.5 },
      { o: 72.5, h: 75, l: 72, c: 74.5 },
      { o: 74.5, h: 77, l: 74, c: 76.5 },
      { o: 76.5, h: 79, l: 76, c: 78.5 },
      { o: 78.5, h: 81, l: 78, c: 80.5 },
      { o: 80.5, h: 83, l: 80, c: 82.5 },
      { o: 82.5, h: 85, l: 82, c: 84.5 },
    ],
    correctDirection: "long",
    rationale:
      "Yesterday's low sat around 67. The wick down to 64.5 triggered the stops and breakout sells resting below it — a classic false breakdown. The strong close back above the old low is the confirmation that the breakdown was false. A stop belongs just under the sweep low, and the target is the upside room the failed breakdown usually opens up.",
  },
];

export function scoreAttempt(scenario: Scenario, attempt: ScenarioAttempt): ScenarioScore {
  const feedback: string[] = [];
  const directionCorrect = attempt.direction !== "skip" && attempt.direction === scenario.correctDirection;

  if (attempt.direction === "skip") {
    const wasClean = true; // every scenario in this set is a clean, gradeable setup
    feedback.push(
      wasClean
        ? `You skipped it — but this was a clean ${scenario.correctDirection} setup. No penalty for sitting out, just no reward either.`
        : "You skipped it, and that was a fair read."
    );
    return { directionCorrect: false, riskRewardRatio: null, priceOutcome: "n/a", points: 20, feedback };
  }

  const { entry, stop, target } = attempt;
  const orderedRight = attempt.direction === "long" ? stop < entry && entry < target : target < entry && entry < stop;

  if (!orderedRight) {
    feedback.push(
      `For a ${attempt.direction}, your stop, entry, and target need to sit in the right order (stop on the risk side of entry, target on the reward side). Yours didn't — that's a real placement mistake, not a technicality.`
    );
    return { directionCorrect, riskRewardRatio: null, priceOutcome: "invalid", points: directionCorrect ? 15 : 0, feedback };
  }

  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  const riskRewardRatio = reward / risk;

  let priceOutcome: PriceOutcome = "no_hit";
  for (const candle of scenario.outcome) {
    const hitStop = attempt.direction === "long" ? candle.l <= stop : candle.h >= stop;
    const hitTarget = attempt.direction === "long" ? candle.h >= target : candle.l <= target;
    if (hitStop) {
      priceOutcome = "stopped_out";
      break;
    }
    if (hitTarget) {
      priceOutcome = "target_hit";
      break;
    }
  }

  let points = 0;
  if (directionCorrect) {
    points += 40;
    feedback.push(`Right call — this was a ${scenario.correctDirection}.`);
  } else {
    feedback.push(`This was actually a ${scenario.correctDirection} setup, not a ${attempt.direction}.`);
  }

  if (priceOutcome === "target_hit") {
    points += 35;
    feedback.push("Your target would have been hit before your stop.");
  } else if (priceOutcome === "stopped_out") {
    feedback.push(
      directionCorrect
        ? "Direction was right, but your stop got run before the target — a placement or patience issue, not a read issue."
        : "Your stop got hit, on top of being the wrong direction."
    );
  } else {
    feedback.push("Neither your stop nor your target was reached in this window — the trade would still be open.");
  }

  if (riskRewardRatio >= 2) {
    points += 25;
    feedback.push(`Solid risk:reward — ${riskRewardRatio.toFixed(1)}:1.`);
  } else if (riskRewardRatio >= 1) {
    points += 10;
    feedback.push(`Risk:reward was ${riskRewardRatio.toFixed(1)}:1 — workable, but tighter than ideal.`);
  } else {
    feedback.push(`Risk:reward was only ${riskRewardRatio.toFixed(1)}:1 — you were risking more than you stood to gain.`);
  }

  return { directionCorrect, riskRewardRatio, priceOutcome, points: Math.min(points, 100), feedback };
}
