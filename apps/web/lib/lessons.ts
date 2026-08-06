/**
 * Static educational content for /learn. Hardcoded like packages/nova-dex's
 * roster — no CMS needed for a fixed set of foundational lessons, but
 * structured as data (not JSX) so new lessons/categories can be appended
 * without touching the page component, the same "never hardcode a ceiling"
 * pattern used for the character roster.
 */

export interface ContractSpec {
  symbol: string;
  name: string;
  tickSize: string;
  tickValue: string;
}

export interface LessonSection {
  id: string;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
  contractTable?: ContractSpec[];
}

export interface LessonCategory {
  id: string;
  title: string;
  description: string;
  lessons: LessonSection[];
}

export const CONTRACT_SPECS: ContractSpec[] = [
  { symbol: "ES", name: "E-mini S&P 500", tickSize: "0.25", tickValue: "$12.50" },
  { symbol: "MES", name: "Micro E-mini S&P 500", tickSize: "0.25", tickValue: "$1.25" },
  { symbol: "NQ", name: "E-mini Nasdaq-100", tickSize: "0.25", tickValue: "$5.00" },
  { symbol: "MNQ", name: "Micro E-mini Nasdaq-100", tickSize: "0.25", tickValue: "$0.50" },
  { symbol: "CL", name: "Crude Oil", tickSize: "0.01", tickValue: "$10.00" },
  { symbol: "MCL", name: "Micro Crude Oil", tickSize: "0.01", tickValue: "$1.00" },
  { symbol: "GC", name: "Gold", tickSize: "0.10", tickValue: "$10.00" },
  { symbol: "MGC", name: "Micro Gold", tickSize: "0.10", tickValue: "$1.00" },
];

export const LESSON_CATEGORIES: LessonCategory[] = [
  {
    id: "fundamentals",
    title: "Futures Fundamentals",
    description: "The mechanics underneath every trade — contracts, leverage, orders, and risk.",
    lessons: [
      {
        id: "what-is-a-future",
        title: "What is a futures contract?",
        summary: "A standardized agreement, not ownership.",
        paragraphs: [
          "A futures contract is a standardized agreement to buy or sell a specific asset — a stock index, a commodity like oil or gold, a currency — at a predetermined price on a future date. Unlike buying a stock, you're not purchasing ownership of anything. You're taking on a position tied to where the price of that asset goes.",
          "Almost no retail futures trader ever takes physical delivery of the underlying asset. In practice, you open a position and close it before expiration, and your account is credited or debited the difference in price — that's the entire mechanism most trading is built around.",
        ],
      },
      {
        id: "long-vs-short",
        title: "Long vs. short",
        summary: "Futures make both directions equally natural.",
        paragraphs: [
          "Going long means buying first — you profit if the price rises. Going short means selling first, without ever owning the underlying asset, and you profit if the price falls.",
          "This is one of the biggest differences from stock trading: shorting a stock usually requires borrowing shares from a broker, with extra rules and costs. In futures, going short is just as direct as going long — you're simply entering a contract in the other direction.",
        ],
      },
      {
        id: "contract-specs",
        title: "Contract specs: tick size, tick value, and margin",
        summary: "The numbers that turn a price move into real dollars.",
        paragraphs: [
          "Every futures contract has a minimum price increment it can move by — the tick size — and a fixed dollar amount that one tick is worth, the tick value. A 4-point move in the S&P 500 futures isn't worth the same amount in every contract; it depends entirely on which one you're trading.",
          "Margin is the amount of capital your broker (or prop firm) requires you to hold a position — a fraction of the contract's full notional value. That gap between margin and full contract value is leverage: it's what lets a relatively small account control a much larger position, and it's exactly why risk management (see below) isn't optional in futures the way it might feel optional trading shares outright.",
        ],
        contractTable: CONTRACT_SPECS,
      },
      {
        id: "order-types",
        title: "Order types",
        summary: "How you tell the market what you want.",
        paragraphs: [],
        bullets: [
          "Market order — fills immediately at the best available price. Guarantees you get in or out; doesn't guarantee the price.",
          "Limit order — fills only at your specified price or better. Guarantees price; doesn't guarantee you get filled at all.",
          "Stop order — sits inactive until a trigger price is touched, then becomes a market order. The standard way to place a stop-loss.",
          "Stop-limit order — like a stop order, but becomes a limit order (not a market order) once triggered. More price control, with the real risk of not filling at all in a fast-moving market.",
        ],
      },
      {
        id: "risk-management",
        title: "Risk management basics",
        summary: "The part that actually determines whether you survive.",
        paragraphs: [
          "Position sizing means deciding how many contracts to trade based on your account size and a defined risk tolerance — not a gut feeling in the moment. A common starting rule of thumb is risking a small, fixed percentage of account equity on any single trade (many traders use 1% or less).",
          "Define your stop-loss before you enter a trade, not after you're already in it and losing. A plan made in advance is a rule; a decision made mid-trade while watching red numbers is usually just emotion.",
        ],
        bullets: [
          "Nova's Trading Log can enforce this automatically, not just suggest it — a MAX_POSITION_SIZE rule and a MAX_DAILY_LOSS_POINTS rule get checked against your real fills, not your intentions.",
        ],
      },
      {
        id: "prop-firm-evaluations",
        title: "Prop firm evaluations, explained",
        summary: "What you're actually being tested on.",
        paragraphs: [
          "A prop firm evaluation (sometimes called a \"combine\" or \"challenge\") is a simulated account where you have to hit a profit target while staying inside a set of risk rules. Pass, and the firm funds you with real capital — you keep a share of the profits without risking your own money on the funded account.",
          "The rules vary firm to firm, but the common ones are: a profit target, a max daily loss, a max total drawdown (sometimes trailing, sometimes static once you hit a certain profit level), a consistency rule (no single day can account for too large a share of your total profit), and often a minimum number of trading days.",
          "The single biggest reason evaluations fail isn't a bad strategy — it's discipline: revenge trading after a loss, oversizing a position to \"catch up,\" or ignoring a daily loss limit that was one bad trade away from a breach. That's precisely the behavior Nova's rules engine and behavioral characters are built to catch, before it costs you a real evaluation.",
        ],
      },
      {
        id: "trading-psychology",
        title: "Trading psychology basics",
        summary: "Why this is the whole premise of Nova.",
        paragraphs: [
          "FOMO (chasing a move after it's already happened), revenge trading (re-entering immediately after a loss to \"get it back\"), cutting winners short while letting losers run, and abandoning a plan mid-trade are the handful of behaviors responsible for more blown accounts than any indicator or strategy ever will be.",
          "None of these are a knowledge problem — most traders can describe the correct behavior perfectly and still not do it under pressure. That's the gap Nova's Behavioral Character system exists to close: not by teaching you something new, but by turning your own real trade history into a mirror you can't argue with.",
        ],
      },
    ],
  },
  {
    id: "ict",
    title: "ICT Concepts",
    description:
      "Terminology and ideas from the \"Inner Circle Trader\" methodology, widely followed among futures and prop-firm traders.",
    lessons: [
      {
        id: "what-is-ict",
        title: "What is ICT?",
        summary: "A popular price-action framework, not a guaranteed system.",
        paragraphs: [
          "ICT (\"Inner Circle Trader\") is a trading methodology popularized by Michael J. Huddleston, built around the idea that price action reflects deliberate, identifiable footprints of institutional order flow — where large players are likely to have entered, where they're likely to draw price toward next, and where retail stop-losses tend to cluster.",
          "This section defines the vocabulary because it's genuinely widespread in the futures and prop-firm trading community — you'll see these terms constantly. It's presented here as terminology, not as a promise: ICT concepts are a lens for reading charts, not a mechanically verified edge, and no lesson on this page should be read as \"this is proven to work.\" Treat it the way you'd treat any discretionary framework — something to test and validate against your own results, not take on faith.",
        ],
      },
      {
        id: "market-structure",
        title: "Market structure",
        summary: "Reading the trend from highs and lows.",
        paragraphs: [
          "Bullish structure is a sequence of higher highs and higher lows; bearish structure is lower highs and lower lows. A break of structure (BOS) is price closing beyond the most recent swing high or low in the direction of the existing trend — read as confirmation that trend is continuing.",
          "A change of character (CHoCH) is the opposite: the first break in the other direction, which ICT traders treat as an early signal that the trend may be reversing rather than continuing.",
        ],
      },
      {
        id: "liquidity",
        title: "Liquidity and liquidity grabs",
        summary: "Where the stops are is where price tends to go.",
        paragraphs: [
          "In ICT terms, \"liquidity\" refers to clusters of resting orders — mainly stop-losses and breakout entries — that build up above old highs (buy-side liquidity) and below old lows (sell-side liquidity). The core idea is that price is drawn toward these pools because there's enough opposing order flow there to fill large institutional positions.",
          "A liquidity grab (or \"stop hunt\") is a sharp move that pushes through one of these levels — triggering the resting orders — before reversing back the other way. ICT traders often treat a liquidity grab as a setup signal rather than a breakout to follow.",
        ],
      },
      {
        id: "order-blocks",
        title: "Order blocks",
        summary: "The last candle before a big move.",
        paragraphs: [
          "An order block is typically defined as the last opposing candle before a strong, fast directional move (a bearish candle right before a sharp rally, for example). It's treated as a zone where institutional orders were placed, and price returning to that zone later is watched as a potential area of support or resistance.",
        ],
      },
      {
        id: "fair-value-gaps",
        title: "Fair value gaps (imbalances)",
        summary: "A three-candle footprint of a fast move.",
        paragraphs: [
          "A fair value gap (FVG), or imbalance, is identified across three candles: when the wick of the first candle and the wick of the third candle don't overlap, the empty space between them is the gap. It's read as a sign that price moved so fast in one direction that it left behind an inefficiency.",
          "ICT traders often expect price to eventually return and \"fill\" part or all of that gap before continuing — similar in spirit to how gaps are discussed in other technical-analysis traditions, just defined more precisely.",
        ],
      },
      {
        id: "premium-discount",
        title: "Premium, discount, and optimal trade entry",
        summary: "Buy low in the range, sell high in the range.",
        paragraphs: [
          "ICT divides a recent price range in half: the upper half is \"premium\" (considered relatively expensive) and the lower half is \"discount\" (relatively cheap). The general framework is to look for longs in discount and shorts in premium, rather than chasing price wherever it currently is.",
          "\"Optimal trade entry\" (OTE) narrows this further using Fibonacci retracement — commonly the 61.8%–79% zone of a recent swing — as the preferred entry area within that discount or premium zone.",
        ],
      },
      {
        id: "killzones",
        title: "Killzones",
        summary: "Specific windows of the trading day, not the whole session.",
        paragraphs: [
          "Killzones are specific time windows — the London Open, the New York AM session, the London Close, and the Asian range are the most commonly referenced — during which ICT theory expects the highest-probability institutional moves to happen. Traders following this framework often narrow their focus to these windows rather than watching the chart all day.",
          "Time windows are always in the trader's chosen time zone and shift with daylight saving changes, so treat the exact clock times as approximate, not fixed universal truths.",
        ],
      },
      {
        id: "ict-models",
        title: "ICT models",
        summary: "Named setups that combine the concepts above into one playbook.",
        paragraphs: [
          "The concepts covered so far — structure, liquidity, order blocks, fair value gaps, premium/discount, killzones — are the building blocks. A \"model\" is a specific, named recipe that combines several of them into one repeatable setup with its own entry logic, so a trader isn't starting from a blank chart every session.",
          "The four below are among the most commonly referenced in the ICT community. Like everything else on this page, they're presented as terminology and mechanism to understand, not as a guaranteed edge — the same validate-it-yourself caveat from the intro lesson applies here even more, since a named model can feel more authoritative than it actually is.",
        ],
      },
      {
        id: "power-of-three",
        title: "Power of Three (AMD)",
        summary: "Accumulation, Manipulation, Distribution.",
        paragraphs: [
          "The Power of Three model describes a full session (or a smaller time window) as three phases. Accumulation is a tight consolidation range where price chops sideways, building up resting orders on both sides. Manipulation is a sharp, brief push outside that range — a liquidity grab — that traps traders who entered on the breakout. Distribution is the real, sustained move that follows, in the opposite direction of the manipulation wick.",
          "The practical read: don't trade the accumulation range itself, and don't chase the manipulation wick as a breakout — it's framed as the trap, not the trend. The distribution phase, after the grab, is the part the model is built to catch.",
        ],
      },
      {
        id: "judas-swing",
        title: "Judas Swing",
        summary: "A session-open fakeout named for the betrayal.",
        paragraphs: [
          "The Judas Swing is a specific case of the manipulation phase, anchored to a session open — commonly the London or New York open. Price makes an initial move in one direction right after the open, drawing in traders who assume that's the day's direction, then reverses sharply and runs the other way for the rest of the session.",
          "It's named for the betrayal: the initial move \"lies\" about the day's real direction. ICT traders watch the first swing after a session open with more suspicion than confirmation for exactly this reason.",
        ],
      },
      {
        id: "silver-bullet",
        title: "Silver Bullet",
        summary: "A narrow one-hour window looking for one specific setup.",
        paragraphs: [
          "The Silver Bullet narrows the killzone concept down further: a specific one-hour window (commonly 10–11am New York time, with other variants for London and the PM session) during which traders using this model look for exactly one setup — a liquidity sweep immediately followed by a fair value gap forming in the reversal direction, used as the entry.",
          "The appeal of the model is its narrowness: instead of watching the whole session, a trader following it only engages during that one window, and only takes the trade if both pieces — the sweep and the resulting FVG — actually show up.",
        ],
      },
      {
        id: "turtle-soup",
        title: "Turtle Soup",
        summary: "A false breakout of a prior day's or week's high or low.",
        paragraphs: [
          "Turtle Soup is a liquidity grab applied specifically to a prior significant level — the previous day's or week's high or low — rather than an intraday swing point. Price briefly breaks that level, triggering the stops and breakout entries resting there, then reverses sharply back inside the prior range.",
          "The name is a deliberate jab at turtle-trading-style breakout systems: where a breakout trader buys the new high, Turtle Soup is the bet that the breakout is false and fades it back the other way. It's the same false-breakout mechanism as a liquidity grab, just applied to a higher-timeframe reference level instead of the last few candles.",
        ],
      },
    ],
  },
];

/** Flat list of every lesson across every category, kept for callers that don't care about grouping. */
export const LESSONS: LessonSection[] = LESSON_CATEGORIES.flatMap((c) => c.lessons);
