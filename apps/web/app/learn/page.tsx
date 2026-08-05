import Link from "next/link";
import { LESSON_CATEGORIES, type LessonSection } from "../../lib/lessons";
import styles from "./page.module.css";

function LessonBlock({ lesson, num }: { lesson: LessonSection; num: string }) {
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
            <p className={styles.tocCategoryTitle}>{category.title}</p>
            <div className={styles.tocCategoryLinks}>
              {category.lessons.map((lesson, i) => (
                <a key={lesson.id} href={`#${lesson.id}`} className={styles.tocLink}>
                  <span className={styles.tocNum}>{String(i + 1).padStart(2, "0")}</span>
                  {lesson.title}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {LESSON_CATEGORIES.map((category) => (
        <div key={category.id} className={styles.category}>
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
          Ready to put this into practice? <Link href="/register">Create a free account</Link> and set your own
          trading rules in the Trading Log — Nova checks them against your real fills, not your intentions.
        </p>
      </footer>
    </main>
  );
}
