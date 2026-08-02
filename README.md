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
  config/       Shared tsconfig / lint config
docs/
  ARCHITECTURE.md        How the system maps to the Nova Economy pillars
  novadex-preview.html   Static preview of the NovaDex character index
```

## Getting started

```bash
pnpm install
pnpm dev          # runs web (:3000) and api (:4000) together
pnpm typecheck     # typecheck all packages
pnpm build
```

## The NovaDex

`packages/nova-dex` holds the roster of Behavioral Characters: 38 evolution
lines (115 stages total), each modeling a real trading habit — good or bad — that
evolves as a trader's actual behavior improves. See `docs/novadex-preview.html`
for a browsable index, or import `@nova/nova-dex` for the typed data.

Every family starts as an instinct (FOMO, greed, revenge trading, panic selling,
overconfidence, ...) and evolves toward a mastered version of that same trait —
evolution is earned by level and, for later stages, a real behavioral condition,
never purchased.
