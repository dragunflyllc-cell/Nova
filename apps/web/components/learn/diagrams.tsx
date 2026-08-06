import styles from "./Diagram.module.css";

function Figure({
  caption,
  ariaLabel,
  viewBox,
  children,
}: {
  caption: string;
  ariaLabel: string;
  viewBox: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={styles.figure}>
      <svg className={styles.svg} viewBox={viewBox} role="img" aria-label={ariaLabel}>
        {children}
      </svg>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

function ArrowDefs({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill={color} />
      </marker>
    </defs>
  );
}

export function LongVsShortDiagram() {
  const ink = "var(--ink-dim)";
  const gain = "var(--gain)";
  const accent = "var(--accent)";
  return (
    <Figure
      viewBox="0 0 460 200"
      ariaLabel="Long profits when price rises from entry to exit; short profits when price falls from entry to exit."
      caption="Long: buy low, sell high. Short: sell high, buy low. Futures make both directions equally direct."
    >
      <ArrowDefs id="lvs-arrow" color={accent} />
      <text x="115" y="20" textAnchor="middle" fill={accent} className={styles.labelStrong}>
        LONG
      </text>
      <text x="345" y="20" textAnchor="middle" fill={accent} className={styles.labelStrong}>
        SHORT
      </text>
      <line x1="230" y1="15" x2="230" y2="185" stroke="var(--border)" strokeWidth="1" />

      {/* Long: rising line */}
      <polyline
        points="30,150 90,120 150,90 200,55"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        markerEnd="url(#lvs-arrow)"
      />
      <circle cx="30" cy="150" r="3.5" fill={ink} />
      <line x1="20" y1="150" x2="210" y2="150" stroke={ink} strokeDasharray="3 3" strokeWidth="1" />
      <line x1="20" y1="55" x2="210" y2="55" stroke={ink} strokeDasharray="3 3" strokeWidth="1" />
      <text x="20" y="165" fill={ink} className={styles.label}>
        Entry (buy)
      </text>
      <text x="150" y="45" fill={ink} className={styles.label}>
        Exit (sell)
      </text>
      <line x1="215" y1="150" x2="215" y2="55" stroke={gain} strokeWidth="1.5" />
      <text x="220" y="105" fill={gain} className={styles.labelStrong}>
        +P&amp;L
      </text>

      {/* Short: falling line */}
      <polyline
        points="260,60 320,90 380,120 430,155"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        markerEnd="url(#lvs-arrow)"
      />
      <circle cx="260" cy="60" r="3.5" fill={ink} />
      <line x1="250" y1="60" x2="440" y2="60" stroke={ink} strokeDasharray="3 3" strokeWidth="1" />
      <line x1="250" y1="155" x2="440" y2="155" stroke={ink} strokeDasharray="3 3" strokeWidth="1" />
      <text x="250" y="52" fill={ink} className={styles.label}>
        Entry (sell)
      </text>
      <text x="380" y="175" fill={ink} className={styles.label}>
        Exit (buy)
      </text>
      <line x1="245" y1="60" x2="245" y2="155" stroke={gain} strokeWidth="1.5" />
      <text x="205" y="105" fill={gain} className={styles.labelStrong} textAnchor="end">
        +P&amp;L
      </text>
    </Figure>
  );
}

export function MarginLeverageDiagram() {
  const ink = "var(--ink-dim)";
  return (
    <Figure
      viewBox="0 0 460 140"
      ariaLabel="A margin deposit is a small fraction of the full contract value it lets you control."
      caption="Margin is a deposit, not the price of the contract — the gap between the two bars is your leverage."
    >
      <text x="20" y="18" fill={ink} className={styles.label}>
        Full contract value (what you control)
      </text>
      <rect x="20" y="26" width="420" height="30" fill="var(--panel-2)" stroke="var(--border)" />

      <text x="20" y="88" fill="var(--accent)" className={styles.labelStrong}>
        Margin required (what you post)
      </text>
      <rect x="20" y="96" width="65" height="30" fill="var(--accent)" />

      <line x1="85" y1="26" x2="85" y2="126" stroke={ink} strokeDasharray="3 3" strokeWidth="1" />
    </Figure>
  );
}

export function MarketStructureDiagram() {
  const ink = "var(--ink-dim)";
  const gain = "var(--gain)";
  const loss = "var(--loss)";
  return (
    <Figure
      viewBox="0 0 480 220"
      ariaLabel="Price makes higher highs and higher lows in an uptrend (bullish structure); the first break below the most recent higher low signals a change of character."
      caption="BOS confirms the trend continuing; CHoCH is the first break the other way — an early reversal signal."
    >
      <polyline
        points="20,180 80,100 130,130 190,60 250,110"
        fill="none"
        stroke={gain}
        strokeWidth="2"
      />
      <polyline points="250,110 310,50 370,160 420,140" fill="none" stroke={loss} strokeWidth="2" />

      {[
        { x: 20, y: 180, label: "" },
        { x: 80, y: 100, label: "HH" },
        { x: 130, y: 130, label: "HL" },
        { x: 190, y: 60, label: "HH" },
        { x: 250, y: 110, label: "HL" },
        { x: 310, y: 50, label: "HH" },
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={ink} />
          {p.label ? (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fill={ink} className={styles.label}>
              {p.label}
            </text>
          ) : null}
        </g>
      ))}

      <text x="190" y="26" textAnchor="middle" fill={gain} className={styles.labelStrong}>
        BOS
      </text>

      <line x1="250" y1="110" x2="370" y2="110" stroke={loss} strokeDasharray="3 3" strokeWidth="1" />
      <circle cx="370" cy="160" r="3.5" fill={loss} />
      <text x="376" y="150" fill={loss} className={styles.labelStrong}>
        CHoCH
      </text>
      <text x="470" y="112" textAnchor="end" fill={ink} className={styles.label}>
        breaks the last HL
      </text>
    </Figure>
  );
}

export function LiquidityGrabDiagram() {
  const ink = "var(--ink-dim)";
  const accent = "var(--accent)";
  const loss = "var(--loss)";
  return (
    <Figure
      viewBox="0 0 460 200"
      ariaLabel="Price wicks above a prior high where buy-side liquidity rests, then closes back below it and reverses sharply lower."
      caption="A liquidity grab: price sweeps the resting stops above an old high, then reverses — read as a setup, not a breakout to chase."
    >
      <line x1="30" y1="60" x2="430" y2="60" stroke={accent} strokeDasharray="4 3" strokeWidth="1.5" />
      <text x="30" y="50" fill={accent} className={styles.labelStrong}>
        Buy-side liquidity
      </text>

      {[
        { x: 60, top: 130, bot: 150 },
        { x: 100, top: 115, bot: 135 },
        { x: 140, top: 100, bot: 120 },
        { x: 180, top: 85, bot: 105 },
        { x: 220, top: 75, bot: 95 },
      ].map((c, i) => (
        <g key={i}>
          <line x1={c.x} x2={c.x} y1={c.top - 8} y2={c.bot + 8} stroke={ink} strokeWidth="1" />
          <rect x={c.x - 6} width="12" y={c.top} height={c.bot - c.top} fill="var(--panel-2)" stroke={ink} />
        </g>
      ))}

      {/* sweep candle: wick pokes above the line, body closes back under */}
      <line x1="260" y1="40" x2="260" y2="95" stroke={loss} strokeWidth="1.5" />
      <rect x="254" y="65" width="12" height="30" fill={loss} />
      <text x="272" y="45" fill={loss} className={styles.labelStrong}>
        Liquidity grab
      </text>

      <polyline points="260,95 320,130 380,155 430,175" fill="none" stroke={loss} strokeWidth="2" />
      <text x="340" y="190" fill={ink} className={styles.label}>
        Reversal
      </text>
    </Figure>
  );
}

export function OrderBlockDiagram() {
  const ink = "var(--ink-dim)";
  const gain = "var(--gain)";
  const accent2 = "var(--accent-2)";
  return (
    <Figure
      viewBox="0 0 460 200"
      ariaLabel="The last down candle before a strong rally is marked as an order block; price later returns to that zone before continuing higher."
      caption="An order block: the last opposing candle before a strong move, watched as support or resistance on a retest."
    >
      <rect x="65" y="40" width="230" height="90" fill={accent2} opacity="0.16" />
      <text x="70" y="35" fill={accent2} className={styles.labelStrong}>
        Order block zone
      </text>

      {/* the down candle itself */}
      <line x1="80" y1="95" x2="80" y2="130" stroke={ink} strokeWidth="1.5" />
      <rect x="74" y="100" width="12" height="20" fill="var(--loss)" />

      {/* rally away */}
      <polyline points="86,110 140,90 190,70 250,45" fill="none" stroke={gain} strokeWidth="2" />

      {/* pull back into the zone and continue */}
      <polyline points="250,45 300,110 350,80 420,50" fill="none" stroke={gain} strokeWidth="2" strokeDasharray="0" />
      <text x="300" y="145" fill={ink} className={styles.label}>
        Retest
      </text>
      <line x1="300" y1="130" x2="300" y2="112" stroke={ink} strokeDasharray="2 2" strokeWidth="1" />
    </Figure>
  );
}

export function FairValueGapDiagram() {
  const ink = "var(--ink-dim)";
  const gain = "var(--gain)";
  const accent2 = "var(--accent-2)";
  return (
    <Figure
      viewBox="0 0 460 200"
      ariaLabel="Three candles where the first candle's high and the third candle's low don't overlap, leaving a gap the middle displacement candle moved through."
      caption="A fair value gap: candle 1's high and candle 3's low never trade — only candle 2's fast move passes through."
    >
      <rect x="95" y="55" width="210" height="40" fill={accent2} opacity="0.18" />
      <text x="100" y="48" fill={accent2} className={styles.labelStrong}>
        FVG (imbalance)
      </text>

      <line x1="140" y1="95" x2="140" y2="155" stroke={ink} strokeWidth="1.5" />
      <rect x="134" y="110" width="12" height="35" fill="var(--panel-2)" stroke={ink} />
      <text x="140" y="172" textAnchor="middle" fill={ink} className={styles.label}>
        1
      </text>

      <line x1="200" y1="30" x2="200" y2="105" stroke={gain} strokeWidth="1.5" />
      <rect x="194" y="40" width="12" height="60" fill={gain} />
      <text x="200" y="172" textAnchor="middle" fill={ink} className={styles.label}>
        2
      </text>

      <line x1="260" y1="15" x2="260" y2="55" stroke={ink} strokeWidth="1.5" />
      <rect x="254" y="20" width="12" height="30" fill="var(--panel-2)" stroke={ink} />
      <text x="260" y="172" textAnchor="middle" fill={ink} className={styles.label}>
        3
      </text>

      <line x1="380" y1="180" x2="380" y2="96" stroke={ink} strokeDasharray="3 3" strokeWidth="1" markerEnd="url(#fvg-arrow)" />
      <ArrowDefs id="fvg-arrow" color={ink} />
      <text x="380" y="195" textAnchor="middle" fill={ink} className={styles.label}>
        Often revisited later
      </text>
    </Figure>
  );
}

export function PremiumDiscountDiagram() {
  const ink = "var(--ink-dim)";
  const accent = "var(--accent)";
  const accent2 = "var(--accent-2)";
  return (
    <Figure
      viewBox="0 0 340 230"
      ariaLabel="A recent price range split in half: the upper half is premium, the lower half is discount, with an optimal-trade-entry zone inside the deeper part of discount."
      caption="Premium vs. discount splits the recent range in half; OTE narrows the discount zone further to the 61.8%–79% pocket."
    >
      <rect x="40" y="20" width="100" height="180" fill="none" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="40" y1="110" x2="140" y2="110" stroke={ink} strokeDasharray="3 3" strokeWidth="1" />

      <text x="150" y="55" fill={accent} className={styles.labelStrong}>
        Premium
      </text>
      <text x="150" y="70" fill={ink} className={styles.label}>
        look for shorts
      </text>

      <text x="150" y="124" fill={accent2} className={styles.labelStrong}>
        Discount
      </text>

      <rect x="40" y="131" width="100" height="31" fill={accent2} opacity="0.35" />
      <text x="150" y="142" fill={accent2} className={styles.label}>
        OTE zone
      </text>
      <text x="150" y="155" fill={ink} className={styles.label}>
        (61.8%–79%)
      </text>

      <text x="150" y="185" fill={ink} className={styles.label}>
        look for longs
      </text>

      <line x1="255" y1="210" x2="144" y2="147" stroke={ink} strokeWidth="1.5" markerEnd="url(#pd-arrow)" />
      <ArrowDefs id="pd-arrow" color={ink} />
      <text x="255" y="222" textAnchor="middle" fill={ink} className={styles.label}>
        Entry (long)
      </text>
    </Figure>
  );
}

export function KillzonesDiagram() {
  const ink = "var(--ink-faint)";
  const zones = [
    { x: 30, w: 90, color: "var(--tier-common)", label: "Asian range" },
    { x: 150, w: 60, color: "var(--accent)", label: "London open" },
    { x: 240, w: 90, color: "var(--accent-2)", label: "New York AM" },
    { x: 360, w: 70, color: "#ec4899", label: "London close" },
  ];
  return (
    <Figure
      viewBox="0 0 480 150"
      ariaLabel="Four labeled windows along a 24-hour timeline: the Asian range, the London open, the New York AM session, and the London close."
      caption="Killzones are specific windows of the day, not the whole session — times are approximate and shift with daylight saving."
    >
      <line x1="20" y1="100" x2="460" y2="100" stroke={ink} strokeWidth="1.5" />
      {zones.map((z) => (
        <g key={z.label}>
          <rect x={z.x} y="80" width={z.w} height="20" fill={z.color} opacity="0.75" />
          <text x={z.x + z.w / 2} y="70" textAnchor="middle" fill="var(--ink-dim)" className={styles.label}>
            {z.label}
          </text>
        </g>
      ))}
    </Figure>
  );
}
