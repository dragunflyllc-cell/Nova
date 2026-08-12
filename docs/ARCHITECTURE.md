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
`BrokerAdapter` interface every provider implements.

**Tradovate**: originally assumed to require Tradovate's Partner API
approval — a business-development process with no SLA, which stalled
without a response. That assumption was wrong. Tradovate's own community
forum and official `tradovate/example-api-oauth` repo confirm a genuinely
self-serve path that doesn't touch the partner program at all: in any
live, funded (>$1000) Tradovate account, Application Settings → API Access
tab → "OAuth Registration" — complete the self-attestation, sign the
digital usage agreement, register an app (title + redirect URI), and
Tradovate hands back a real `client_id`/`client_secret` immediately. Apps
built this way (TradersPost, PickMyTrade, TradeSyncer are documented
examples) don't require their end users to buy the API Access add-on
themselves — only the one account used to register the OAuth app needs it.
This is unverified against a real registration (no account has gone
through the flow yet), so treat it as "very likely correct, confirm on
first real attempt," not gospel — see `apps/api/src/brokers/tradovate.ts`'s
header for exactly what's sourced from where. Once real
`TRADOVATE_CLIENT_ID`/`TRADOVATE_CLIENT_SECRET`/`TRADOVATE_REDIRECT_URI`
exist, the adapter needs no code changes — `TOKEN_URL`/`AUTHORIZE_URL`
already match the official example app. Token renewal
(`POST /auth/renewaccesstoken`) is now implemented too: Tradovate's OAuth
exchange never issues a `refresh_token`, renewal instead reuses the
current, still-unexpired access token as Bearer auth, called
opportunistically on every `/me/brokers/tradovate/sync` — access tokens
only live ~90 minutes, so a connection that isn't synced within that
window requires a full reconnect.

**ProjectX (TopstepX's broker API) was built as a second, parallel
integration because it's self-serve in an even more direct way**: a trader
buys the "ProjectX API" add-on directly in their own account settings
(~$14.50–29/month) and gets a username + API key immediately — no OAuth
registration step, no digital agreement, no waiting on anyone. Nova itself
needs no ProjectX-issued app-level credentials at all — each user brings
their own key. Note: ProjectX went fully exclusive to Topstep at the end
of February 2026 — every other prop firm that used to white-label it
(Bulenox, Alpha Futures, TickTick, Tradeify, Lucid, Phidias, TradeDay)
shut their ProjectX offerings down within weeks of that. Topstep is the
only door to this platform now, which matters for anyone who can't get a
Topstep account for any reason — Rithmic (below) is the fallback in that
case, since it isn't tied to any single company.

- `apps/api/src/brokers/projectx.ts` — login (`POST /Auth/loginKey`),
  account listing (`POST /Account/search`), and trade history
  (`GET /trades/search`) against `https://api.topstepx.com/api`. Verified
  against the real request/response shapes used by the open-source
  `project-x-py` SDK (its source was read directly — ProjectX's own docs
  site 403s automated fetches the same way Tradovate's did). Not yet run
  against a live ProjectX API key — see the file header for exactly what's
  verified vs. assumed.
- `apps/api/src/routes/projectx.ts` — `POST /me/brokers/projectx/connect`
  (takes `{ username, apiKey, accountName? }` directly in the request body,
  not an OAuth redirect — there's no authorization screen to redirect to)
  and `POST /me/brokers/projectx/sync` (re-authenticates on every call
  rather than caching/refreshing a token, since sync is infrequent and this
  avoids stale-token edge cases; fetches trades and stores new ones as
  `BrokerFill` rows, same dedupe-by-`externalFillId` pattern as Tradovate).
- `BrokerConnection` gained two nullable columns to support this:
  `externalAccountId` (which ProjectX account fills are queried against)
  and `externalUsername` (needed alongside the encrypted API key to
  re-authenticate). Generic enough for a future Rithmic adapter too.
- A "Connect ProjectX / TopstepX" form lives in the dashboard's Trading Log
  panel (`apps/web/components/TradingLog.tsx`) — paste username + API key,
  connect, then sync fetches trades on demand.

**Rithmic** reaches the many brokers/prop firms running on Rithmic
infrastructure (AMP Futures, Ironbeam, EdgeClear, Bulenox, Alpha Futures,
Earn2Trade, and many more) — not tied to any single company's account
policies, unlike Tradovate (funding requirement) or ProjectX (Topstep
exclusivity). It isn't self-serve the way ProjectX is: getting real
credentials requires contacting Rithmic directly for their developer
dev-kit (an `app_name`/`app_version` they issue, plus a login for their
free Test/paper-trading system — no funded account needed for that part),
and going to production later needs a Rithmic-cleared broker relationship,
a conformance review, and ~$125/month. Architecturally different from the
other two adapters: Rithmic's real protocol (R|Protocol API) is Google
Protocol Buffers over WebSocket, and the message schema is only available
through that dev-kit — there's no working Node.js/TypeScript client for it
anywhere, and hand-rolling a protobuf implementation without the real
schema would mean fabricating a wire protocol, not something to guess at.

- `services/rithmic-sidecar/` — a small internal FastAPI service wrapping
  the real, MIT-licensed, actively-maintained
  [`async_rithmic`](https://github.com/rundef/async_rithmic) Python
  library, which does speak the real protocol correctly. Not public-facing
  — only `apps/api` calls it. See its own README for how to get real
  credentials and run it locally.
- `apps/api/src/brokers/rithmic.ts` — talks to the sidecar over plain
  internal HTTP. The sidecar converts whatever Rithmic actually returns
  via protobuf reflection (`MessageToDict`) rather than guessed field
  names, so `parseFill`/`extractAccountId` here are written defensively —
  same "try several plausible field names, throw loudly with the raw
  payload on total mismatch" discipline as `tradovate.ts`'s `parseFill`,
  since the exact shape is genuinely unknown until this runs against a
  real login.
- `apps/api/src/routes/rithmic.ts` — direct-credential connect/sync like
  ProjectX (a Rithmic username/password is a durable broker-issued login,
  not an OAuth grant). `RITHMIC_SYSTEM_NAME`/`RITHMIC_GATEWAY_URL` are
  Nova-wide deployment config (which Rithmic system Nova connects
  through); each end user still brings only their own username/password.
- A "Connect Rithmic" form lives in the Trading Log panel alongside the
  other two.

NinjaTrader is a further, architecturally different option worth
revisiting: instead of Nova's server calling a broker's cloud API, a
NinjaScript AddOn running inside a trader's own NinjaTrader install would
push fills to Nova directly. Since NinjaTrader is broker-agnostic on the
front end (it connects to Rithmic-cleared firms, Tradovate accounts, CQG,
and is an approved platform at most prop firms), this would reach traders
regardless of which broker or prop firm sits behind their account — at
the cost of needing an installed, running desktop plugin rather than a
pure background cloud sync. Not started — noted here as the next
candidate if broader reach is needed beyond what Rithmic alone covers.

**Testing with real trade history today, without Tradovate approval**:
`apps/api/src/routes/fills.ts` adds a `MANUAL` `BrokerProvider` — not a real
broker, just a trader typing in their own fills (`POST /me/fills/manual`).
It reuses the existing `BrokerConnection`/`BrokerFill` tables (accessToken
is a meaningless placeholder for this provider) specifically so every
downstream route that reads fills through a user's connections — trade
matching, `sync-xp`, `/me/rules/check`, `/me/progression/sync` — picks up
manually-entered fills with zero changes. This is the answer to "how do I
test this with my own trading right now": log fills by hand (or from a
broker statement) via the dashboard's Trading Log panel before a real
broker connection (Tradovate or ProjectX) is wired up.

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
internally regardless of broker. `apps/api/src/trades/service.ts` holds the
shared "load this user's fills, group by symbol, match" step so both
`GET /me/trades` and the behavior-XP sync below use the same logic.

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
  the exact `renewaccesstoken` response shape (sourced from community-forum
  descriptions, not primary docs). `parseFill` validates strictly and
  throws with the raw payload attached on any mismatch instead of silently
  coercing bad data — that thrown error, the first time this runs against a
  real account, is the signal to come back and correct the field mapping.
- Nothing here has been exercised against Tradovate's real API yet — that
  requires a real `TRADOVATE_CLIENT_ID`/`TRADOVATE_CLIENT_SECRET`, obtained
  via the self-serve OAuth Registration flow described above (no partner
  program needed — see the file header in
  `apps/api/src/brokers/tradovate.ts` for the exact steps and sourcing).
  That's still a real-world account action someone has to do, not something
  available in this environment. What *is* verified locally (see
  `apps/api/src/brokers/tradovate.test.ts` and `apps/api/src/routes/brokers.ts`
  tested via curl): auth gating, the authorize-URL construction, OAuth
  state-token CSRF protection, and the fill-parsing validation logic
  against representative fixtures.

## Behavior-driven XP

`apps/api/src/behavior/scoring.ts` is the first real implementation of "your
character levels up from how you actually trade" — replacing the old
`POST /me/characters/:id/award-xp` endpoint (deleted; it just let XP be
granted arbitrarily for testing before any real signal existed).

Scoped deliberately to what's honestly detectable from `MatchedTrade` data
(timestamps and realized P&L) — not an attempt to parse things like "used a
pre-written plan" that the data can't actually show:
- Every closed trade earns base XP, +bonus if it was a win.
- **Revenge trading**: re-entering a new position within 5 minutes of a
  loss closing halves that trade's XP. Named directly after the behavior
  several NovaDex families call out (FOMO Monkey's "Revenge Trade", Revenge
  Rhino's "Charge").
- **A deliberate cooldown**: waiting 30+ minutes after a loss before
  re-entering earns a bonus, mirroring Ape Apprentice's "Cooldown" ability.
- Everything else — most trades — earns base ± win bonus with no signal.
  That's expected, not a gap.

`POST /me/characters/sync-xp` (`apps/api/src/routes/characters.ts`) pulls a
user's matched trades via `trades/service.ts`, scores them, and **sets**
(not increments) every owned character's `xp` to the recomputed total. That
makes it idempotent without a "last synced trade" cursor — calling it twice
in a row, or after fills sync again with nothing new, is a no-op. The
tradeoff: every owned character currently gets the same XP from behavior:
there's no per-archetype attribution yet (a revenge trade should probably
hit an "impulsive" character harder than a "patient" one it doesn't). That's
a real v1 simplification, tracked here rather than silently shipped.

Verified against real seeded fills end to end (Postgres, not just unit
tests): registered a user, claimed a starter, seeded a loss followed by a
same-symbol re-entry one minute later, called `sync-xp`, and confirmed both
the revenge-trade penalty and idempotency on a second call.

## Custom trading rules & accountability

`apps/api/src/behavior/rules.ts` lets a trader define their own rules and
have Nova check them against real trades — "an AI assistant that holds you
accountable," scoped to what's actually mechanically checkable today. Five
rule types, each verifiable purely from `MatchedTrade` data:
`MAX_TRADES_PER_DAY`, `MIN_COOLDOWN_AFTER_LOSS_MINUTES`, `MAX_POSITION_SIZE`,
`MAX_DAILY_LOSS_POINTS` (in points, same points-not-dollars boundary as
trade matching), and `TRADING_HOURS_WINDOW_UTC`.

Deliberately does **not** support freeform rules like "always wait for a
confirmed candle close" or "journal every trade" — nothing in `MatchedTrade`
can verify those, and pretending to would be exactly the kind of dishonest
signal this codebase has avoided elsewhere (see the points-vs-dollars and
Tradovate verified/assumed sections above). A freeform rule + AI-narrated
coaching layer is a real, separate future feature, but it needs an actual
LLM call (an Anthropic API key, which isn't configured in this environment)
to do honestly — it is not built yet, and nothing here fakes it.

**Routes** (`apps/api/src/routes/rules.ts`): `GET/POST /me/rules`,
`DELETE /me/rules/:id` (soft-delete via `active`), and
`POST /me/rules/check`, which re-evaluates every active rule against the
user's current trades and upserts one `BehaviorEvent` row per
(rule, trade) — `RULE_ADHERENCE` or `RULE_VIOLATION`. Safe to call
repeatedly: the upsert key is `(userId, signal, tradeRef, ruleId)`, so
re-checking the same trade against the same rule overwrites rather than
duplicates. `POST /me/characters/sync-xp` persists `BehaviorEvent` rows the
same way for the core `REVENGE_TRADE`/`COOLDOWN_AFTER_LOSS` signals.

**Why a persisted event log, not just the ephemeral XP total**: `sync-xp`
only ever returns a recomputed number — there's no record of *which* trades
tripped *which* signal once the response is gone. `BehaviorEvent` exists so
that history survives: an auditable, per-trade log of every signal ever
detected, independent of whatever reads it later (a personal dashboard, an
export, a future report). Recording this data is not the same decision as
sharing it — see below.

### Behavior data & consent

The user asked for this system to be structured so behavior data could
eventually be sold or reported to prop firms or other interested parties
(per `CLAUDE.md`'s Enterprise section: prop firm behavior dashboards, risk
monitoring, trader rankings). Two things had to be decided before writing
a line of this code:

- **Consent is opt-in, off by default.** `User.dataSharingConsent`
  (`schema.prisma`) defaults to `false`. `PUT /me/data-sharing-consent`
  lets a user explicitly turn it on (and records when). No other code path
  in this codebase flips it, and no code path here reads it to actually
  export or transmit anything — that layer doesn't exist yet. Whoever
  builds it must treat this flag as a hard gate, not a formality: a user
  who hasn't opted in must never appear in an export, aggregated or not.
- **Recording ≠ selling.** `BehaviorEvent` rows are written for every user
  regardless of their consent flag, because the log itself is just Nova's
  own accountability feature working (the same way `GET /me/trades` doesn't
  ask permission to compute — it's the product). What consent gates is
  whether that data can ever leave this system toward a third party.

What's explicitly **not** built, and is a separate business + legal step
before any of this could actually generate revenue: an aggregation/export
pipeline, anonymization design, a prop-firm-facing API or dashboard, and
the actual commercial agreements with any firm. Standing up a real data
product also deserves its own privacy-policy and terms-of-service language
before it ships — not something to improvise inside a schema comment.

Verified end to end against real seeded Postgres data: created two rules
(`MAX_TRADES_PER_DAY: 1`, `MAX_POSITION_SIZE: 1`), seeded three same-day
trades, confirmed the 2nd and 3rd were correctly flagged as violations,
confirmed a repeat `POST /me/rules/check` call didn't duplicate
`BehaviorEvent` rows, and confirmed the consent endpoint defaults to `false`
and only flips on explicit request.

## Collecting more than a starter: behavior-revealed & quest unlocks

Previously, `POST /me/characters/claim` was the only way into the NovaDex —
a new user picked one of 4 starters and had no path to a second character.
`apps/api/src/behavior/unlocks.ts` and `apps/api/src/behavior/quests.ts`
are that path, and `POST /me/progression/sync`
(`apps/api/src/routes/progression.ts`) is what checks and grants them.
There's no separate "catch" UI — a family just gets auto-claimed the moment
a trader's real trading (or quest progress) crosses its threshold, the same
way `sync-xp` and `/me/rules/check` already auto-apply their results.

Two unlock mechanisms:
- **Behavior-revealed** (`unlocks.ts`): a small, explicit mapping from
  accumulated `BehaviorEvent` signal counts to a specific family, picked so
  the family's own archetype matches the signal that reveals it —
  `REVENGE_TRADE` ×3 unlocks Revenge Rhino (archetype: reckless),
  `COOLDOWN_AFTER_LOSS` ×3 unlocks Cautious Turtle (archetype: disciplined),
  `RULE_ADHERENCE` ×5 unlocks Rookie Elephant (archetype: consistent). This
  list is meant to grow as more signals get built (see `scoring.ts` and
  `rules.ts`), not to stay this short — it only covers signals that
  actually exist today, same "the NovaDex is never done" principle as the
  roster itself.
- **Quest-based** (`quests.ts`): three fixed quests, each checkable from
  data Nova already has — closing a first trade, creating a first rule, and
  a "Clean Streak" (5 consecutive rule checks with zero violations) that
  additionally unlocks a specific family. Quest XP is **additive** and
  lands on `User.xp`/`User.level` (previously unused fields) rather than
  `UserCharacter.xp` — that separation matters because `sync-xp`
  deterministically *recomputes and sets* character XP from trade data on
  every call; stacking an additive quest bonus onto the same field would
  get silently erased the next time `sync-xp` runs. Account-level
  progression (quests) and character-level progression (behavior) are
  deliberately two different numbers.

Idempotency: `QuestCompletion` rows gate quest rewards so they're granted
exactly once; behavior unlocks re-check against already-owned families on
every call. Verified end to end against real seeded Postgres data — seeded
12 trades engineered to cross all three behavior thresholds at once (3
revenge-trade patterns, 3 deliberate-cooldown patterns), created one
generous rule so every trade passed it (12 `RULE_ADHERENCE` events),
called `sync`, and confirmed all 4 families unlocked, all 3 quests
completed, account leveled up, and a second `sync` call granted nothing
new.

## Prop firm: no-capital evaluation model

Nova can run its own funded-trader program without ever putting real
trading capital behind a trader's account — the "evaluation" model used by
firms like FTMO: a trader pays a fee to attempt a challenge against
rule-based risk limits on a **simulated** account; if they pass and stay
within the funded stage's limits, they get paid a share of the (still
simulated) profit out of the pool of fees collected from every attempt, not
out of real trading gains. This is a new revenue line, distinct from the
Enterprise section's "prop firms as customers of Nova's dashboards" —
here, Nova itself is the firm, and the infrastructure it's built on is
exactly the trade-matching and rules engine already in this repo
(`trades/matching.ts`, `behavior/rules.ts`).

**`apps/api/src/propfirm/tiers.ts`** — a fixed list of challenge tiers
(fee, virtual starting balance, profit target %, max daily loss %, max
overall drawdown %, minimum trading days, profit split %), same "content in
code" pattern as `behavior/quests.ts`'s `QUESTS`. Figures are Nova's own
illustrative numbers, not copied from any specific real firm's schedule.

**`apps/api/src/propfirm/evaluation.ts`** — `evaluateAttempt`, a pure
function scoring one attempt's current live stage (`ACTIVE` or
`FUNDED_ACTIVE`) against real `MatchedTrade[]` data, same honesty boundary
and testing style as `checkRule` in `behavior/rules.ts`. Two scope
decisions flagged directly in its header rather than silently assumed:
**static (not trailing) drawdown**, measured from the tier's fixed starting
balance rather than a trailing high-water mark; and an **equity curve built
from closed trades only** — there's no intra-trade unrealized P&L in
`MatchedTrade`, so equity only moves at each trade's close. `calculatePayout`
is the second pure function: a funded trader's payable amount is their
profit split of whatever raw profit hasn't already been accounted for by a
prior payout, tracked via `EvaluationAttempt.paidProfitCents` so the same
gain is never paid out twice. Both are covered by unit tests
(`evaluation.test.ts`) — profit-target pass, daily-loss breach,
overall-drawdown breach (across several days each individually under the
daily limit), the min-trading-days gate holding even when the profit target
is hit early, funded-stage breach naming (`FUNDED_BREACHED`, not `FAILED`),
and the double-payment-prevention math in `calculatePayout`.

**The dollars-per-point boundary**: same limitation as trade matching
itself (`realizedPointsPnl` is in points, not dollars — see "Broker
integrations" above) — `EvaluationAttempt.pointValueUsd` is trader-declared
at attempt-start time, not verified against broker data or a contract
reference table. A trader who mis-declares it gets a wrong equity
calculation; that's a real v1 simplification, not hidden.

**Routes** (`apps/api/src/routes/propfirm.ts`):
`GET /propfirm/tiers` (public); `POST /me/propfirm/attempts` (blocks a
second attempt while one is `ACTIVE`, `PASSED`, or `FUNDED_ACTIVE`);
`GET /me/propfirm/attempts`; `POST /me/propfirm/attempts/:id/sync`
(recomputes the live stage and persists any status transition — idempotent,
a no-op on a terminal or awaiting-claim attempt, same pattern as `sync-xp`
and `/me/rules/check`); `POST /me/propfirm/attempts/:id/claim-funded`
(only from `PASSED`; resets `startedAt` to the claim time so the funded
stage gets its own fresh window rather than inheriting the evaluation
stage's); `POST /me/propfirm/attempts/:id/payout-request` (re-syncs first
so a payout can't be requested against a breach that just happened, reserves
the payable profit against `paidProfitCents` immediately at request time —
not at approval — so a second request right after can't double-claim the
same gain); `GET /me/propfirm/payouts`; `GET /propfirm/ledger` (firm-level
economics: fee revenue implied by every attempt started, versus payouts
requested/paid — the empirical shape of the "no capital" claim: fees fund
payouts, not the other way around).

**What's honestly not built yet**, flagged the same way the rest of this
doc flags gaps rather than papering over them:
- **No real payment processor.** `POST /me/propfirm/attempts` records a
  tier's `feeCents` for the ledger but never actually collects it (response
  includes `feeCollected: false`); nothing here is Stripe-integrated.
- **No admin/back-office role.** `PayoutRequest` rows are created `PENDING`
  and there is no API path to move one to `PAID` — see `schema.prisma`'s
  doc comment on `PayoutRequest`. `GET /propfirm/ledger`'s
  `payoutsPaidCents` will read `0` until that role exists and someone builds
  the approval flow (or flips a row directly in the database).
- **Trusts fill timestamps not to be future-dated across a stage
  boundary.** The funded stage's window is "trades opened at or after
  `fundedAt`" with no upper bound at the current wall-clock time. Real
  broker syncs can't produce a future-dated fill, but a manually-entered
  fill (`POST /me/fills/manual`, no validation against future dates) placed
  intentionally in the future could leak into whichever stage's window
  happens to start before it — a real, narrow integrity gap worth closing
  (reject future `filledAt` in `fills.ts`, or cap the window's upper bound)
  before this could handle real money, not something to fix silently as a
  side effect of this feature.
- **No web UI.** Everything here is API-only, same v1 shape as the rules
  engine before `TradingLog.tsx` existed.

**Verified end to end against real seeded Postgres data**, not just unit
tests: registered users, logged fills via `POST /me/fills/manual`, and
confirmed live: a daily-loss breach correctly moves `ACTIVE` -> `FAILED`
with the right worst-loss/limit figures; a profit-target-reached attempt
correctly stays `ACTIVE` until `minTradingDays` is also met, then transitions
to `PASSED`; `claim-funded` correctly rejects a non-`PASSED` attempt (409)
and resets the window on success; a `payout-request` before any funded-stage
profit correctly rejects (400); a second `payout-request` after further
funded-stage profit correctly excludes the profit already accounted for by
the first (the double-payment-prevention math, confirmed against hand
calculation); re-`sync`ing a terminal attempt is a true no-op; and
`GET /propfirm/ledger` correctly aggregates fee revenue across multiple
attempts and tracks pending vs. paid payout liability.

## Tournaments

Nova-funded prize-pool events (CLAUDE.md's Tournaments section), scoped
deliberately to skip the "is this a real-money liability" question the
prop-firm payout system has to carry: a tournament's `prizePoolCents` is
Nova's own money (sponsorship/marketing spend, per CLAUDE.md), never
trader-funded, and CLAUDE.md is explicit that "winning money alone should
never determine rank" — none of the three metrics is P&L.

**`apps/api/src/tournaments/scoring.ts`** — `computeScore` (pure, one of
three metrics: `ACCOUNT_XP_GAINED`, `CHARACTER_XP_GAINED` for a named
NovaDex family, `BEHAVIOR_NET_ADHERENCE`) and `rankEntries` (pure,
descending by score, ties broken by earlier `joinedAt` so every entry gets
a distinct rank rather than needing to split a place's prize across ties,
and only the top 3 ranks are paid via a fixed `PRIZE_DISTRIBUTION`
50/30/20 split). Both covered by unit tests.

**The anti-cheese property**: `TournamentEntry.startXp` snapshots the
relevant XP counter at join time, so a metric always measures progress
made *during* the tournament — an early leveler who joins late doesn't win
on lifetime total. Verified directly: a user who'd already completed
quests before joining a second tournament correctly scored `0` (no *new*
XP since joining), while a fresh join followed by real quest completions
correctly scored the XP gained.

**Routes** (`apps/api/src/routes/tournaments.ts`): `POST /tournaments`
(create — no admin role exists yet, same gap as `PayoutRequest` approval,
so any authenticated user can create one in this v1, flagged rather than
hidden); `GET /tournaments`; `GET /tournaments/:id` (live-computed
leaderboard pre-finalization, stored ranks after); `POST
/tournaments/:id/join` (blocks joining after `endAt`, blocks a duplicate
entry); `POST /tournaments/:id/sync` (recomputes live scores; once `endAt`
has passed, finalizes — assigns `rank`/`prizeCents`/`finalScore` to every
entry and stamps `finalizedAt`; idempotent, a no-op on an already-finalized
tournament); `GET /me/tournaments`.

**Verified end to end against real seeded Postgres data**: created a
tournament, had two real users join, drove one of them through real quest
completions (`POST /me/progression/sync`) to gain account XP, confirmed
the live leaderboard reflected the correct score and ordering before the
tournament ended, confirmed `sync` before `endAt` does not finalize,
waited for a short-window tournament to actually end, confirmed `sync`
after `endAt` finalizes with the correct 50/30/20 prize split (including a
tie broken by join order), confirmed a repeat `sync` call is a true no-op,
and confirmed `GET /me/tournaments` reflects both a finalized and a
still-active entry correctly.

**What's not built**: no admin/back-office role (same gap as payouts — see
above), and no web UI. A future admin surface should also let a real
back-office cancel or edit a tournament before it starts; neither exists
yet.

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
    of the full 51-family NovaDex. This is the "start with one, unlock the
    rest through real behavior" design agreed on earlier — the unlock half
    is now built (see "Collecting more than a starter" above), so
    `POST /me/characters/claim` is the entry point but no longer the only
    way in.
  - **Trading Log panel** (`components/TradingLog.tsx`, rendered on the
    dashboard once a starter is claimed): the user-facing surface for
    everything under "Custom trading rules & accountability" and
    "Collecting more than a starter" above — log a fill (backed by
    `POST /me/fills/manual`), create/remove rules, see quest progress, and a
    "Sync my trading behavior" button that calls `sync-xp`,
    `/me/rules/check`, and `/me/progression/sync` in sequence and renders
    the result (XP gained, quests completed, new characters unlocked). This
    is the concrete answer to "how do I test this with my own trading right
    now" — no Tradovate approval needed, log fills by hand.
  - Verified end to end with Playwright, not just typechecked: register →
    redirected to dashboard → claim a starter → it appears in the crew with
    correct level/XP → log out → direct navigation to `/dashboard` correctly
    redirects to `/login` → log back in → the claimed character persists
    (real Postgres round-trip, not local state). Separately, the Trading Log
    panel was verified through the real UI (not curl): added a rule, logged
    a loss fill followed by a same-symbol revenge re-entry, clicked sync,
    and confirmed the on-screen result matched the expected math (15 XP:
    base 8 for the loss + a revenge-halved 7 for the re-entry) and that the
    "First Close"/"Rule Setter" quests flipped to Done.

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
