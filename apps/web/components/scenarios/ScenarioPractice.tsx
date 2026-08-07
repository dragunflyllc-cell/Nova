"use client";

import { useMemo, useState } from "react";
import { SCENARIOS, scoreAttempt, type Direction, type Scenario, type ScenarioScore } from "../../lib/scenarios";
import { ScenarioChart, type ChartLine } from "./ScenarioChart";
import styles from "./ScenarioPractice.module.css";

type Step = "direction" | "entry" | "stop" | "target" | "ready" | "submitted";

const STEP_PROMPTS: Record<Step, string> = {
  direction: "Would you go long, short, or skip this one?",
  entry: "Click the chart to set your entry price.",
  stop: "Now click to set your stop-loss.",
  target: "Now click to set your take-profit target.",
  ready: "Levels set. Submit when you're ready.",
  submitted: "",
};

function emptyLevels() {
  return { entry: null as number | null, stop: null as number | null, target: null as number | null };
}

export function ScenarioPractice() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [direction, setDirection] = useState<Direction | null>(null);
  const [step, setStep] = useState<Step>("direction");
  const [levels, setLevels] = useState(emptyLevels());
  const [score, setScore] = useState<ScenarioScore | null>(null);

  const scenario: Scenario = SCENARIOS[scenarioIndex] ?? SCENARIOS[0]!;
  const allCandles = useMemo(() => [...scenario.setup, ...scenario.outcome], [scenario]);
  const revealed = step === "submitted";
  const visibleCount = revealed ? allCandles.length : scenario.setup.length;

  function pickDirection(d: Direction) {
    setDirection(d);
    if (d === "skip") {
      const result = scoreAttempt(scenario, { direction: "skip", entry: 0, stop: 0, target: 0 });
      setScore(result);
      setStep("submitted");
      return;
    }
    setStep("entry");
  }

  function handleChartClick(price: number) {
    if (step === "entry") {
      setLevels((prev) => ({ ...prev, entry: price }));
      setStep("stop");
    } else if (step === "stop") {
      setLevels((prev) => ({ ...prev, stop: price }));
      setStep("target");
    } else if (step === "target") {
      setLevels((prev) => ({ ...prev, target: price }));
      setStep("ready");
    }
  }

  function submit() {
    if (!direction || direction === "skip" || levels.entry === null || levels.stop === null || levels.target === null) return;
    const result = scoreAttempt(scenario, {
      direction,
      entry: levels.entry,
      stop: levels.stop,
      target: levels.target,
    });
    setScore(result);
    setStep("submitted");
  }

  function startOver() {
    setDirection(null);
    setStep("direction");
    setLevels(emptyLevels());
    setScore(null);
  }

  function nextScenario() {
    setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
    startOver();
  }

  const lines: ChartLine[] = [];
  if (direction && direction !== "skip") {
    const entryIndex = scenario.setup.length - 1;
    if (levels.entry !== null) lines.push({ price: levels.entry, color: "var(--accent)", label: "Entry", fromIndex: entryIndex });
    if (levels.stop !== null) lines.push({ price: levels.stop, color: "var(--loss)", label: "Stop", fromIndex: entryIndex });
    if (levels.target !== null) lines.push({ price: levels.target, color: "var(--gain)", label: "Target", fromIndex: entryIndex });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <p className={styles.concept}>{scenario.concept}</p>
          <h2 className={styles.title}>{scenario.title}</h2>
        </div>
        <span className={styles.counter}>
          {scenarioIndex + 1} / {SCENARIOS.length}
        </span>
      </div>

      <p className={styles.briefing}>{scenario.briefing}</p>

      <ScenarioChart
        allCandles={allCandles}
        visibleCount={visibleCount}
        lines={revealed ? lines : lines}
        onPriceClick={step === "entry" || step === "stop" || step === "target" ? handleChartClick : undefined}
        armedLabel={step !== "submitted" ? STEP_PROMPTS[step] : undefined}
      />

      {step === "direction" ? (
        <div className={styles.directionRow}>
          <button className={`${styles.dirButton} ${styles.long}`} onClick={() => pickDirection("long")}>
            Long
          </button>
          <button className={`${styles.dirButton} ${styles.short}`} onClick={() => pickDirection("short")}>
            Short
          </button>
          <button className={`${styles.dirButton} ${styles.skip}`} onClick={() => pickDirection("skip")}>
            Skip
          </button>
        </div>
      ) : null}

      {step === "entry" || step === "stop" || step === "target" || step === "ready" ? (
        <div className={styles.levelsRow}>
          <div className={styles.levelChips}>
            <span className={styles.chip}>Direction: {direction}</span>
            <span className={styles.chip}>Entry: {levels.entry ?? "—"}</span>
            <span className={styles.chip}>Stop: {levels.stop ?? "—"}</span>
            <span className={styles.chip}>Target: {levels.target ?? "—"}</span>
          </div>
          <div className={styles.actions}>
            <button className={styles.secondary} onClick={startOver}>
              Start over
            </button>
            {step === "ready" ? (
              <button className={styles.primary} onClick={submit}>
                Submit
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "submitted" && score ? (
        <div className={styles.result}>
          <div className={styles.scoreRow}>
            <span className={styles.scoreValue}>{score.points}</span>
            <span className={styles.scoreOf}>/ 100</span>
          </div>
          <ul className={styles.feedbackList}>
            {score.feedback.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <p className={styles.rationale}>{scenario.rationale}</p>
          <div className={styles.actions}>
            <button className={styles.secondary} onClick={startOver}>
              Retry this scenario
            </button>
            <button className={styles.primary} onClick={nextScenario}>
              Next scenario
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
