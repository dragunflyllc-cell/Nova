# Architecture

This is a v1 skeleton. It exists to give every future feature a consistent place
to live, mapped directly to the pillars in [`CLAUDE.md`](../CLAUDE.md).

## Monorepo layout

Turborepo + pnpm workspaces. Shared code lives in `packages/`, deployable
surfaces live in `apps/`.

| Package | Owns |
| --- | --- |
| `apps/web` | The primary Nova surface (Next.js). Dashboard, journal, NovaDex, marketplace, leagues. |
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
`BrokerFill` is deliberately *not* the same thing as a "trade" — matching
fills into closed, P&L-bearing round-trip positions (FIFO/LIFO, partials)
is real accounting logic that hasn't been built yet. That's the next piece
once real fill data exists to build it against.

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
