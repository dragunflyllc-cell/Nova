# Nova

Nova is the AI trading operating system — free to join, built around a behavioral
character collection game, a creator economy, and a marketplace. See
[`CLAUDE.md`](./CLAUDE.md) for the full product and monetization philosophy that
every feature in this repo is checked against.

## Structure

This is a [Turborepo](https://turborepo.dev) + [pnpm](https://pnpm.io) monorepo.

```
apps/
  web/          Next.js app — the primary Nova surface
  api/          Fastify API — trades, characters, quests, marketplace, etc.
packages/
  types/        Shared TypeScript domain types (User, BehavioralCharacter, ...)
  nova-dex/     The NovaDex — species/evolution-line data for Behavioral Characters
  db/           Prisma schema + client (Postgres) — the persistence layer
  config/       Shared tsconfig / lint config
docs/
  ARCHITECTURE.md        How the system maps to the Nova Economy pillars, plus auth/DB details
  novadex-preview.html   Static preview of the NovaDex character index
```

## Getting started

```bash
pnpm install

# one-time: point apps/api and packages/db at a local Postgres
cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env
# edit DATABASE_URL / ACCESS_TOKEN_SECRET in both if your local setup differs

cd packages/db && pnpm db:migrate && cd ../..

pnpm dev          # runs web (:3000) and api (:4000) together
pnpm typecheck     # typecheck all packages
pnpm build
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for how auth (email/password,
JWT access + rotating refresh tokens) is wired up.

## The NovaDex

`packages/nova-dex` holds the roster of Behavioral Characters: 38 evolution
lines (115 stages total), each modeling a real trading habit — good or bad — that
evolves as a trader's actual behavior improves. See `docs/novadex-preview.html`
for a browsable index, or import `@nova/nova-dex` for the typed data.

Every family starts as an instinct (FOMO, greed, revenge trading, panic selling,
overconfidence, ...) and evolves toward a mastered version of that same trait —
evolution is earned by level and, for later stages, a real behavioral condition,
never purchased.
