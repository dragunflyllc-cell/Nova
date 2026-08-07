import Link from "next/link";
import { LESSON_CATEGORIES, type LessonSection } from "../../lib/lessons";
import {
  FairValueGapDiagram,
  JudasSwingDiagram,
  KillzonesDiagram,
  LiquidityGrabDiagram,
  LongVsShortDiagram,
  MarginLeverageDiagram,
  MarketStructureDiagram,
  OrderBlockDiagram,
  PowerOfThreeDiagram,
  PremiumDiscountDiagram,
  SilverBulletDiagram,
  TurtleSoupDiagram,
} from "../../components/learn/diagrams";
import styles from "./page.module.css";

const DIAGRAM_BY_LESSON: Record<string, React.ComponentType> = {
  "long-vs-short": LongVsShortDiagram,
  "contract-specs": MarginLeverageDiagram,
  "market-structure": MarketStructureDiagram,
  liquidity: LiquidityGrabDiagram,
  "order-blocks": OrderBlockDiagram,
  "fair-value-gaps": FairValueGapDiagram,
  "premium-discount": PremiumDiscountDiagram,
  killzones: KillzonesDiagram,
  "power-of-three": PowerOfThreeDiagram,
  "judas-swing": JudasSwingDiagram,
  "silver-bullet": SilverBulletDiagram,
  "turtle-soup": TurtleSoupDiagram,
};

function LessonBlock({ lesson, num }: { lesson: LessonSection; num: string }) {
  const Diagram = DIAGRAM_BY_LESSON[lesson.id];
  return (
    <section id={lesson.id} className={styles.lesson}>
      <div className={styles.lessonHead}>
        <span className={styles.lessonNum}>{num}</span>
        <div>
          <h3 className={styles.lessonTitle}>{lesson.title}</h3>
          <p className={styles.lessonSummary}>{lesson.summary}</p>
        </div>
      </div>

      {lesson.paragraphs.map((p, j) => (
        <p className={styles.lessonBody} key={j}>
          {p}
        </p>
      ))}

      {Diagram ? <Diagram /> : null}

      {lesson.contractTable ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Contract</th>
                <th>Tick size</th>
                <th>Tick value</th>
              </tr>
            </thead>
            <tbody>
              {lesson.contractTable.map((c) => (
                <tr key={c.symbol}>
                  <td className={styles.tableSymbol}>{c.symbol}</td>
                  <td>{c.name}</td>
                  <td>{c.tickSize}</td>
                  <td>{c.tickValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {lesson.bullets ? (
        <ul className={styles.bulletList}>
          {lesson.bullets.map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

const CATEGORY_ACCENT: Record<string, string> = {
  fundamentals: "var(--accent)",
  ict: "var(--accent-2)",
};

export default function LearnPage() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.wordmark}>
          NOVA<span>DEX</span>
        </div>
        <Link href="/" className={styles.backLink}>
          ← Back home
        </Link>
      </div>

      <p className={styles.eyebrow}>Nova Academy</p>
      <h1 className={styles.title}>The basics of futures trading</h1>
      <p className={styles.tagline}>
        Free, always — the same principle as the rest of Nova. Built for futures, and specifically for prop-firm
        evaluations, not generic stock-market content.
      </p>

      <nav className={styles.toc} aria-label="Lesson contents">
        {LESSON_CATEGORIES.map((category) => (
          <div key={category.id} className={styles.tocCategory}>
            <p className={styles.tocCategoryTitle} style={{ color: CATEGORY_ACCENT[category.id] }}>
              {category.title}
            </p>
            <div className={styles.tocCategoryLinks}>
              {category.lessons.map((lesson, i) => (
                <a key={lesson.id} href={`#${lesson.id}`} className={styles.tocLink}>
                  <span className={styles.tocNum} style={{ color: CATEGORY_ACCENT[category.id] }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {lesson.title}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {LESSON_CATEGORIES.map((category) => (
        <div
          key={category.id}
          className={styles.category}
          style={{ ["--category-accent" as string]: CATEGORY_ACCENT[category.id] }}
        >
          <div className={styles.categoryHead}>
            <h2 className={styles.categoryTitle}>{category.title}</h2>
            <p className={styles.categoryDescription}>{category.description}</p>
          </div>
          <div className={styles.lessons}>
            {category.lessons.map((lesson, i) => (
              <LessonBlock key={lesson.id} lesson={lesson} num={String(i + 1).padStart(2, "0")} />
            ))}
          </div>
        </div>
      ))}

      <footer className={styles.footer}>
        <p>
          Want to test the read before you risk real money on it? Try <Link href="/practice">Chart Scenarios</Link> —
          a quiz on realistic setups: would you buy or sell, and where's your entry, stop, and target.
        </p>
        <p>
          Ready to put this into practice on your own trading? <Link href="/register">Create a free account</Link>{" "}
          and set your own trading rules in the Trading Log — Nova checks them against your real fills, not your
          intentions.
        </p>
      </footer>
    </main>
  );
}
