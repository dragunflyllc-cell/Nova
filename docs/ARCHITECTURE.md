# Architecture

This is a v1 skeleton. It exists to give every future feature a consistent place
to live, mapped directly to the pillars in [`CLAUDE.md`](../CLAUDE.md).

## Monorepo layout

Turborepo + pnpm workspaces. Shared code lives in `packages/`, deployable
surfaces live in `apps/`.

| Package | Owns |
| --- | --- |
| `apps/web` | The primary Nova surface (Next.js). Currently a pre-launch landing page + waitlist and the public NovaDex browser; dashboard/journal/marketplace/leagues UI comes once there's a reason for someone to log in (real broker data). |
| `apps/api` | Trades, XP/quests, characters, marketplace, reputation — the Fastify service the web app and future mobile clients call. |
| `packages/types` | Shared domain types: `User`, `BehavioralCharacter`, `CharacterStage`, `MarketplaceListing`, `ReputationScore`, `LeagueStanding`, etc. |
| `packages/nova-dex` | Static species/evolution-line content for the Behavioral Character system. |
| `packages/db` | Prisma schema and client — the source of truth for persisted data (Postgres). |
| `packages/config` | Shared `tsconfig` bases and (future) lint config. |

## How this maps to the Nova Economy

- **Freemium gate** lives at the API boundary (`packages/types#SubscriptionTier`),
  not in the character/quest content itself — free users get the same NovaDex,
  XP system, and quests as paid users, per `CLAUDE.md`'s "Nova Free should
  already feel incredible" principle. Pro unlocks capacity (unlimited AI
  coaching, replay storage, multi-account) and depth (advanced analytics,
  private leagues), not access to the core loop.
- **Behavioral Character System** (`packages/nova-dex`) is the collection/
  evolution game described under Nova Free. Each family starts as a bad habit
  or raw instinct and evolves toward a mastered version of that trait —
  evolution is earned through level *and* a behavioral condition, never
  purchased. This is also the enforcement mechanism for "never sell trading
  advantages, only sell personalization": cosmetic skins are a separate
  concern from the species/stat data.
  - **The NovaDex is never "done."** Treat the current family/stage count as a
    snapshot, not a ceiling — new species drops (seasonal, tournament reward,
    contribution reward) are a core retention lever per `CLAUDE.md`'s Seasonal
    Events, Tournaments, and Contribution Rewards sections. Nothing in `apps/web`,
    `apps/api`, or the data itself may hardcode the roster size — always derive
    counts (`characterStages.length`, etc.) from `packages/nova-dex`, never a
    literal number. New families append at the next `dexNumber`; new archetype
    values append to `CharacterArchetype` in `packages/types`. There should
    always be a next character a player hasn't unlocked yet.
- **Reputation & Leagues** (`ReputationScore`, `LeagueStanding` types) rank
  behavior, not P&L, matching the Nova Leagues and Reputation System sections.
- **Creator economy & marketplace** (`CreatorProfile`, `MarketplaceListing`,
  `VerifiedStrategy` types) are modeled as first-class domain types from the
  start, even though no UI exists yet — so revenue-share and verification
  logic has one canonical shape to build against.

## Auth

`apps/api` owns authentication; `apps/web` and any future mobile client are
callers, not the source of truth. Email/password only for now.

- Passwords: bcrypt (12 rounds), never logged or returned.
- Access tokens: short-lived (15 min) JWTs, `HS256`, signed with
  `ACCESS_TOKEN_SECRET`.
- Refresh tokens: opaque random strings, stored server-side only as a SHA-256
  hash (`packages/db`'s `RefreshToken` model), rotated on every use, and
  revoked immediately once rotated — reusing an old refresh token fails.
- Routes: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
  `POST /auth/logout`, `GET /me` (Bearer token).
- Known v1 simplification: both tokens are returned in the JSON body, which
  is fine for now (mobile clients need this shape anyway) but a browser
  client should eventually get the refresh token via an `httpOnly` cookie
  instead of storing it in JS-reachable memory/storage — that's a follow-up
  hardening pass, not done yet.

No email verification or password reset flow yet — first thing to add before
this is user-facing.

## Broker integrations

Nova is futures-focused, predominantly prop-firm traders. Rather than one
broker-specific integration, `apps/api/src/brokers/types.ts` defines a
`BrokerAdapter` interface every provider implements — Tradovate is the first,
Rithmic and NinjaTrader are the natural next adapters behind the same
interface (see chat history / commit log for the comparison across
Tradovate, Rithmic, ProjectX/TopstepX, NinjaTrader, and TradingView that led
to Tradovate going first: it's the only one of these with a public
OAuth-based cloud REST API built for third parties, with no vendor-approval
process or per-user fee).

**Data model**: `BrokerConnection` (one user's OAuth link to one provider,
tokens encrypted at rest via `apps/api/src/security/encryption.ts`) and
`BrokerFill` (a single raw execution, stored close to the source shape).
`BrokerFill` is deliberately *not* the same thing as a "trade".

**Trade matching** (`apps/api/src/trades/matching.ts`): turns a contract's
fills into closed, round-trip trades with realized P&L, using FIFO matching
— the convention most futures broker statements use. Handles scaling in
(multiple entries before an exit), scaling out (multiple exits before fully
flat), and a single fill flipping straight through flat into the opposite
direction (closes the current trade, opens a new one from the leftover
quantity). Fully covered by tests and also verified against real seeded
database rows end to end (`GET /me/trades` groups a user's stored fills by
symbol and matches each group) — this part doesn't depend on Tradovate
credentials to validate, only the shape of a fill, which is fixed
internally regardless of broker.

Two things it deliberately does NOT do yet:
- **Dollar P&L.** `realizedPointsPnl` is in points, not dollars — converting
  requires each contract's tick value/multiplier (ES is $50/point, MES is
  $5/point, etc.), and there's no contract reference table yet.
- **Persistence.** Trades are computed on read from stored fills, not written
  to their own table — reasonable until the Tradovate fill data itself is
  validated against a real account (see below); no point locking in a Trade
  schema against assumed data.

**What's verified vs. assumed** (`apps/api/src/brokers/tradovate.ts` has the
full detail) — Tradovate's own docs (api.tradovate.com, partner.tradovate.com)
block automated fetches, so this was built from their public example repos
and community forum instead:
- Verified: the OAuth authorize URL, the token-exchange endpoint and its
  request shape, the REST base URLs (demo/live), and the `fill/list` path.
- Not verified: the exact field names on a `fill/list` response item, and
  whether the token-exchange response includes a usable refresh token.
  `parseFill` validates strictly and throws with the raw payload attached on
  any mismatch instead of silently coercing bad data — that thrown error,
  the first time this runs against a real account, is the signal to come
  back and correct the field mapping. `refreshTokens` throws unconditionally
  until this is confirmed, rather than guessing.
- Nothing here has been exercised against Tradovate's real API — that
  requires Tradovate Partner API credentials (`TRADOVATE_CLIENT_ID` /
  `TRADOVATE_CLIENT_SECRET`), which means applying to their partner program.
  That's a business step, not something available in this environment. What
  *is* verified locally (see `apps/api/src/brokers/tradovate.test.ts` and
  `apps/api/src/routes/brokers.ts` tested via curl): auth gating, the
  authorize-URL construction, OAuth state-token CSRF protection, and the
  fill-parsing validation logic against representative fixtures.

## Web app

`apps/web` is a Next.js app, currently scoped to what's actually usable
pre-launch:

- **Landing page + waitlist** (`app/page.tsx`) — a real, working signup backed
  by `WaitlistSignup` in Postgres (`POST /waitlist`, idempotent on repeat
  emails so resubmitting never errors; `GET /waitlist/count` for the live
  count shown on the page). Not a placeholder form — verified end to end with
  a real browser session against the real API and database. Has an optional
  "prop firm code" field (free text, not validated against a partner table —
  there are no partners yet) so Nova can see which firms are actually
  driving signups before any real partner program exists to design around
  that data.
- **Public NovaDex browser** (`app/novadex/page.tsx` + `components/NovaDexBrowser.tsx`)
  — every family and stage from `packages/nova-dex`, with the same
  search-by-name/ticker and rarity/sector filter chips as the original
  NovaDex artifact (ported into a real client component this time, not left
  behind as artifact-only). Non-matching cards dim rather than disappear, so
  a family's evolution chain stays visually intact while filtered. No auth
  required; this is meant to be shared.
- **Design tokens** (`app/globals.css`) moved off the original amber/violet
  duo to gold (`--accent`) + teal (`--accent-2`) as the primary pair, with
  indigo/magenta reserved for rare/epic rarity tiers specifically — a
  deliberate change from the first pass, not the default. `CharacterCard`
  now has real hover motion (lift + tier-colored glow) instead of being
  static, and a ticker-tape marquee (`components/TickerTape.tsx`) — built
  for the original artifact but never wired into the actual app until now —
  runs across the landing page header.
- **Login / register / dashboard** (`app/login`, `app/register`,
  `app/dashboard`) — a real session, not a mock. `lib/auth-context.tsx` holds
  tokens in `localStorage`, validates the session against `GET /me` on load,
  and its `apiFetch` helper transparently retries once via `/auth/refresh` on
  a 401 before giving up and logging out. The dashboard route-guards itself
  client-side (redirects to `/login` if there's no session) rather than via
  Next.js middleware — acceptable for now, revisit if this needs to resist a
  user just disabling JS.
  - **First-run flow**: a new user with zero owned characters sees a starter
    picker (4 curated families — impulsive, patient, resilient, fearful — so
    the choice says something about how you see yourself as a trader) instead
    of the full 38-family NovaDex. This is the "start with one, unlock the
    rest through real behavior" design agreed on earlier — the unlock-via-
    trade-detection half of that isn't built yet (no trade data to detect
    behavior from), so today `POST /me/characters/claim` is the only way in.
  - Verified end to end with Playwright, not just typechecked: register →
    redirected to dashboard → claim a starter → it appears in the crew with
    correct level/XP → log out → direct navigation to `/dashboard` correctly
    redirects to `/login` → log back in → the claimed character persists
    (real Postgres round-trip, not local state).

**One monorepo gotcha worth knowing**: packages here use Node/NodeNext-style
`.js` import specifiers that point at `.ts` source files (standard for TS
ESM). Webpack — what Next.js's dev/build pipeline uses — doesn't resolve
that mapping by default, so `apps/web/next.config.mjs` sets
`config.resolve.extensionAlias` to teach it to also try `.ts`/`.tsx`. Without
that, any import from `@nova/nova-dex` or `@nova/types` 500s in the browser
with a confusing "Module not found: Can't resolve './characters.js'" even
though `tsc` and `tsx` (used by `apps/api` and the test suites) resolve the
same import just fine.

## Local development database

Postgres, via Prisma (`packages/db`). Copy `.env.example` to `.env` in both
`apps/api` and `packages/db`, point `DATABASE_URL` at a local Postgres, then:

```bash
cd packages/db
pnpm db:migrate   # applies schema.prisma, generates the Prisma client
```

## Next steps

No deployed environment exists yet — everything above has only been run and
verified locally in this workspace. Deploying anywhere (even a staging
environment) is a separate decision to make explicitly, not an assumed next
step.
