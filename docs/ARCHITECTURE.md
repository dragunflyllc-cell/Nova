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
