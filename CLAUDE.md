# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                          # install all workspace deps

pnpm dev                              # turbo: run web (:3000) + api (:4000) together
pnpm --filter @nova/api dev           # api only (tsx watch)
pnpm --filter @nova/web dev           # web only (next dev)

pnpm build                            # turbo: build all packages/apps
pnpm typecheck                        # turbo: tsc --noEmit everywhere
pnpm lint                             # turbo: next lint for web; no-op elsewhere (no lint configured yet)
pnpm format                           # prettier --write across the repo

pnpm --filter @nova/api test          # run all api tests (tsx --test src/**/*.test.ts)
tsx --test apps/api/src/behavior/scoring.test.ts   # run a single test file (from apps/api, or with full path)
```

Database (`packages/db`, Prisma + Postgres):

```bash
cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.local.example apps/web/.env.local
# then set DATABASE_URL / ACCESS_TOKEN_SECRET / ENCRYPTION_KEY etc. per apps/api/src/env.ts

cd packages/db
pnpm db:migrate     # applies schema.prisma + generates the Prisma client
pnpm db:generate     # regenerate client only (after pulling schema changes)
pnpm db:studio       # Prisma Studio GUI
```

Rithmic sidecar (`services/rithmic-sidecar`, Python/FastAPI — only needed for Rithmic broker testing):

```bash
cd services/rithmic-sidecar
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export RITHMIC_APP_NAME=... RITHMIC_APP_VERSION=...
uvicorn main:app --port 8100
```

There is no test suite for `apps/web`, `packages/db`, `packages/types`, or `packages/nova-dex` yet — `apps/api` is the only package with `*.test.ts` files (run via Node's built-in test runner through `tsx`, not Jest/Vitest).

## Architecture

Turborepo + pnpm workspaces (`apps/*`, `packages/*`). Tasks are wired in `turbo.json`: `build`/`typecheck`/`lint` depend on the same task in dependencies (`^build` etc.), so packages build before the apps that import them.

| Package | Owns |
| --- | --- |
| `apps/web` | Next.js 14 (App Router). Pre-launch landing page + waitlist, public NovaDex browser, and a real login/register/dashboard behind email/password auth. |
| `apps/api` | Fastify service. Auth, trades, characters/XP, quests, custom rules, broker connections, waitlist. The only source of truth other clients (web, future mobile) call into. |
| `packages/types` | Shared domain types with zero runtime code — `User`, `BehavioralCharacter`/`CharacterStage`, `MarketplaceListing`, `ReputationScore`, `LeagueStanding`, `SubscriptionTier`, etc. Split across `user.ts`/`character.ts`/`economy.ts`/`reputation.ts`, re-exported from `index.ts`. |
| `packages/nova-dex` | Static species/evolution-line data for the Behavioral Character system (`characters.ts`) plus leveling math (`leveling.ts`). No database — this is compiled-in content. |
| `packages/db` | Prisma schema (`prisma/schema.prisma`) and generated client — the single source of truth for persisted data (Postgres). |
| `packages/config` | Shared `tsconfig.*.json` bases (no lint config yet despite the filename pattern). |
| `services/rithmic-sidecar` | Standalone Python/FastAPI service wrapping the `async_rithmic` library, since Rithmic's real wire protocol (protobuf over WebSocket) has no Node client. Internal-only, called by `apps/api` over plain HTTP. |

Full architectural detail — including what's independently verified vs. still assumed for each broker — lives in `docs/ARCHITECTURE.md`. Read it before touching anything under `apps/api/src/brokers/` or `apps/api/src/behavior/`; the summary below is not a substitute.

### apps/api

Fastify app assembled in `src/main.ts`: one route module per domain (`src/routes/*.ts`), registered there. Cross-cutting logic lives outside `routes/`:

- `src/auth/` — bcrypt password hashing, JWT access tokens (15 min, HS256) + rotating opaque refresh tokens (hashed at rest). `src/plugins/authenticate.ts` is the Fastify decorator routes use to require a Bearer token.
- `src/brokers/` — one adapter per provider (`tradovate.ts`, `projectx.ts`, `rithmic.ts`) behind the shared `BrokerAdapter` interface in `types.ts`. Each `parseFill`-style function validates strictly and throws with the raw payload on mismatch rather than silently coercing unknown broker response shapes — do not "fix" this into a permissive parser.
- `src/trades/matching.ts` — turns a symbol's raw `BrokerFill` rows into closed round-trip `MatchedTrade`s via FIFO matching (handles scale-in/scale-out/flip-through-flat). `src/trades/service.ts` is the shared "load fills → group by symbol → match" step reused by both `GET /me/trades` and the behavior/XP pipeline — don't duplicate that logic in a new route.
- `src/behavior/scoring.ts` — behavior-driven character XP from `MatchedTrade` timestamps/P&L only (revenge-trade penalty, cooldown bonus). `POST /me/characters/sync-xp` **recomputes and sets** (not increments) XP every call, so it's idempotent without a cursor.
- `src/behavior/rules.ts` — user-defined, mechanically-checkable trading rules (`MAX_TRADES_PER_DAY`, `MIN_COOLDOWN_AFTER_LOSS_MINUTES`, `MAX_POSITION_SIZE`, `MAX_DAILY_LOSS_POINTS`, `TRADING_HOURS_WINDOW_UTC`). Checking a rule upserts a `BehaviorEvent` keyed on `(userId, signal, tradeRef, ruleId)` — re-checking never duplicates.
- `src/behavior/unlocks.ts` / `quests.ts` — the two ways to gain characters beyond the initial starter claim; both driven through `POST /me/progression/sync`.
- `src/security/encryption.ts` — encrypts broker tokens/API keys at rest; every `BrokerConnection` credential goes through this, never plaintext.
- `src/env.ts` — Zod-validated env (`z.object(...).parse(process.env)`); the app fails fast at boot if a required var is missing/malformed. Check this file first when adding any new env var.

Only points, not dollars: `realizedPointsPnl` and `MAX_DAILY_LOSS_POINTS` are in contract points, since there's no per-contract tick-value table yet. Don't silently convert to dollars without adding that table.

Trades are computed on read from stored `BrokerFill` rows, not persisted to their own table.

### apps/web

Next.js App Router under `app/`; shared client code in `lib/` and `components/`.

- `lib/auth-context.tsx` — session state, holds tokens in `localStorage`, validates against `GET /me` on load. Its `apiFetch` wrapper transparently retries once through `/auth/refresh` on a 401. Route guarding is client-side (redirect-if-no-session), not Next.js middleware.
- `components/TradingLog.tsx` — the dashboard panel for logging fills manually, managing rules, and triggering the sync-xp/rules-check/progression-sync pipeline. This is the primary way to exercise the behavior system without a live broker connection.
- `app/novadex/page.tsx` + `components/NovaDexBrowser.tsx` — public, unauthenticated NovaDex roster browser.
- **Monorepo gotcha**: `packages/*` use `.js`-suffixed import specifiers pointing at `.ts` source (standard NodeNext ESM). Webpack (Next's dev/build) doesn't resolve that by default, so `next.config.mjs` sets `config.resolve.extensionAlias` — if imports from `@nova/nova-dex`/`@nova/types` start 500ing with "Module not found" in the browser only, look there first.

### Data model conventions (packages/db)

- Every model that should never appear in a third-party export gates on `User.dataSharingConsent` (opt-in, defaults `false`). No code path currently reads this flag to export anything — treat it as a hard gate the day that code is written, not a formality.
- `BrokerFill` (raw execution) is deliberately not the same thing as a trade; `MatchedTrade` is derived, not stored.
- Prisma schema comments (`///`) carry real design decisions (consent gating, why `MANUAL` is a `BrokerProvider`, etc.) — read them, don't just read field names.

### The NovaDex is never "done"

`packages/nova-dex` currently holds 51 evolution lines (154 stages: 38 animal + 13 mythical-creature families). Never hardcode that count anywhere in `apps/web`, `apps/api`, or tests — always derive it (`characterStages.length`, etc.). New families append at the next `dexNumber`; new archetypes append to `CharacterArchetype` in `packages/types`. Every family starts as a bad habit/instinct and evolves toward a mastered version of that same trait — evolution is earned via level + a real behavioral condition, never purchased (this is the mechanism enforcing "never sell trading advantages" from the economy pillars below).

### Freemium boundary

The free/Pro split lives at the API/type boundary (`SubscriptionTier` in `packages/types`), not in the character/quest content itself. Free users get the full NovaDex, XP system, and quests — Pro unlocks capacity (unlimited AI coaching, replay storage, multi-account) and depth (advanced analytics, private leagues), never access to the core loop. Check every new feature against this before gating it behind `tier`.

## NOVA ECONOMY — The Trading Creator Ecosystem

Nova is free to join.

Anyone should be able to create an account, connect a broker, begin tracking trades, collect Behavioral Characters, complete quests, and improve as a trader without paying.

The goal is to build the world's largest trading community before maximizing monetization.

Every monetization decision should increase value for the community rather than creating paywalls that slow adoption.

### FREEMIUM MODEL

**Nova Free**

Every free user receives:

- Unlimited account
- Trade importing
- Behavioral Character System
- Character evolutions
- NovaDex
- XP progression
- Quests
- Achievements
- Leaderboards
- Daily AI coaching
- Community access
- Replay Mode
- Basic Trading DNA
- Basic Analytics
- Character collection
- Seasonal events

Nova should already feel incredible without paying. The free version should outperform most paid competitors.

**Nova Pro**

Premium unlocks:

- Unlimited AI Coaching
- Advanced Trading DNA
- Advanced behavioral analytics
- Unlimited replay storage
- Voice AI Assistant
- Advanced Research AI
- Market Memory
- Institutional analytics
- Professional dashboards
- Multi-account support
- Advanced statistics
- Priority AI processing
- Early feature access
- Custom AI Agents
- Private leagues
- Elite character skins
- Exclusive boss battles
- Premium quests
- Advanced psychology reports

### ENTERPRISE

Create a separate platform for:

- Prop Firms
- Brokerages
- Trading Educators
- Trading Teams
- Family Offices
- Hedge Funds
- Institutional Risk Managers

Provide:

- Behavior dashboards
- Trader rankings
- Psychology analytics
- Risk monitoring
- Performance tracking
- Coach dashboards
- Behavior prediction
- Enterprise reporting
- Administrative controls
- API integrations

### CREATOR ECONOMY

Every user has a creator profile.

Creators earn money by helping other traders improve—not by showing unrealistic profits.

Creators can publish:

- Educational videos
- Trade replays
- Market analysis
- Trading lessons
- Psychology lessons
- AI prompts
- Indicators
- Templates
- Playbooks
- Courses
- Behavior guides

Nova rewards creators based on:

- Educational quality
- Community engagement
- Accuracy
- Trust
- Consistency
- Verified contributions

Creators receive a share of platform revenue based on engagement.

### MARKETPLACE

Create a marketplace where users can buy and sell:

- AI Agents
- Indicators
- Trading Templates
- Replay Libraries
- Trading Journals
- Psychology Programs
- Voice Packs
- Dashboard Themes
- Character Skins
- Educational Courses
- Risk Models
- Backtesting Systems
- Behavior Packs

Nova earns a marketplace transaction fee.

### VERIFIED STRATEGY LIBRARY

Users can publish trading strategies.

Nova AI independently analyzes:

- Historical expectancy
- Risk profile
- Drawdown
- Consistency
- Market suitability
- Win rate
- Trade frequency
- Complexity

Strategies that pass quality standards receive:

- Nova Verified
- Community rating
- Behavior compatibility
- Performance analytics

Creators earn recurring royalties from subscribers.

### COACHING PLATFORM

Experienced traders can become Verified Nova Coaches.

Nova provides:

- Scheduling
- Video sessions
- AI-generated lesson plans
- Homework
- Student analytics
- Progress tracking
- Coach dashboards

Nova earns a commission from bookings.

### AI AGENT STORE

Allow developers to build AI agents for Nova.

Examples:

- ICT Coach
- Scalping Coach
- Swing Trading Coach
- Risk Manager
- Psychology Coach
- News Analyst
- Macro Analyst
- Order Flow Coach
- Volume Profile Expert
- Broker Assistant

Users subscribe to these agents. Developers earn recurring revenue.

### COSMETIC STORE

Never sell trading advantages. Only sell personalization.

Examples:

- Character skins
- Evolution animations
- Dashboard themes
- Profile banners
- Voice packs
- Avatar frames
- Particle effects
- Seasonal collections
- Guild emblems
- Victory animations

All cosmetics should be optional.

### NOVA LEAGUES

Rank traders based on behavior—not profit.

League progression:

- Rookie
- Bronze
- Silver
- Gold
- Platinum
- Diamond
- Master
- Grandmaster
- Legend

Ranking factors:

- Discipline
- Consistency
- Risk management
- Rule adherence
- Learning
- Community contribution
- Psychology
- Patience
- Execution quality
- Helping others

Winning money alone should never determine rank.

### REPUTATION SYSTEM

Every user receives a Reputation Score.

Built from:

- Community trust
- Educational quality
- Verified contributions
- Behavior score
- Account age
- Helping beginners
- Honesty
- Rule adherence

Reputation unlocks:

- Creator monetization
- Marketplace access
- Coaching
- Exclusive events
- Community leadership

### TOURNAMENTS

- Weekly events
- Monthly championships
- Seasonal leagues
- Psychology challenges
- Execution competitions
- Replay contests
- Education competitions
- Boss raids
- Guild wars

Reward:

- Cash prizes
- Marketplace credits
- Exclusive cosmetics
- Rare characters
- Legendary evolutions
- Sponsored rewards

### SPONSORSHIPS

Brands can sponsor:

- Trading Gyms
- Seasonal Events
- League Championships
- Boss Battles
- Educational Challenges
- Character Releases

Sponsored content must clearly be labeled and should only come from reputable companies. Avoid promoting unrealistic profit expectations or misleading financial claims.

### ADVERTISING

Ads should feel useful.

Potential advertisers:

- Brokers
- Trading hardware
- Tax software
- Market data providers
- Educational institutions
- Financial news

No deceptive "get rich quick" advertisements. Advertising should be contextual and minimally intrusive.

### CONTRIBUTION REWARDS

Reward users who improve Nova.

Examples:

- Reporting bugs
- Improving AI
- Creating tutorials
- Helping beginners
- Answering questions
- Testing features
- Providing labeled behavioral data
- Contributing open-source plugins

Rewards:

- XP
- Marketplace credits
- Cash
- Exclusive cosmetics
- Founder badges
- Early access
- Revenue sharing opportunities

### THE ULTIMATE GOAL

Nova should become:

- The YouTube of trading education.
- The GitHub of trading tools.
- The Steam Marketplace of trading software.
- The Discord of trading communities.
- The LinkedIn of trader reputation.
- The Pokémon of behavioral psychology.
- The Duolingo of trading discipline.
- The operating system every serious trader opens before placing a trade.

Every design decision should encourage better decision-making, healthier trading habits, and a sustainable ecosystem where traders, educators, developers, and institutions all benefit from contributing value.
