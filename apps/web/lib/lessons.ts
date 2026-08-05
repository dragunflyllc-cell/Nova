/**
 * Static educational content for /learn. Hardcoded like packages/nova-dex's
 * roster — no CMS needed for a fixed set of foundational lessons, but
 * structured as data (not JSX) so new lessons can be appended without
 * touching the page component, the same "never hardcode a ceiling" pattern
 * used for the character roster.
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

export const LESSONS: LessonSection[] = [
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
];
