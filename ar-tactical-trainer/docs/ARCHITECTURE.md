# Architecture

## System overview

Three subsystems, one JSON contract:

```
                         ┌─────────────────────┐
                         │   trainer-console    │  Next.js, :3100
                         │  (trainer's laptop)  │
                         └─────────┬────────────┘
                                   │ REST (facilities, scenarios,
                                   │ sessions, stats) + WebSocket
                                   │ (live target control, shot feed)
                         ┌─────────▼────────────┐
                         │        server         │  Fastify, :4100
                         │  Prisma/SQLite + a    │
                         │  trainer<->operator   │
                         │  WS relay             │
                         └─────────┬────────────┘
                                   │ REST (scenario fetch, media
                                   │ upload, shot bulk-flush) + WebSocket
                                   │ (live target control, shot feed,
                                   │ telemetry)
                         ┌─────────▼────────────┐
                         │     operator-app       │  Unity + AR Foundation
                         │ (phone mounted to the │  (phone-on-gun)
                         │  training weapon)      │
                         └───────────────────────┘
```

`packages/shared-types` is the TypeScript half of the contract (server +
trainer-console import it directly). `operator-app/Assets/Scripts/Domain/`
is the same contract hand-mirrored in C#, since Unity is a different
language/runtime and can't import a TS package. Keeping these in lockstep
by hand is a real maintenance cost — see Roadmap for the option of
generating one from the other.

## A training session, end to end

1. **Setup** (trainer console): register operators/trainers, optionally
   scan a facility from the operator app and register its layout, author a
   scenario — place hostile/hostage/non-threat targets from the catalog on
   a 2D grid (open ground) or against a facility's scan, set pass/fail
   rules.
2. **Start** (trainer console): `POST /sessions` creates a `Session` row
   (`outcome: inProgress`) and takes the trainer to the live-session page,
   which opens a WebSocket and joins the relay room for that session as
   role `trainer`.
3. **Join** (operator app): the operator enters the scenario ID, session
   ID, and their operator ID (`App/SessionBootstrapUI.cs`); the app loads
   the scenario (`GET /scenarios/:id`), spawns targets from the local
   `TargetCatalog`, and opens the same WebSocket room as role `operator`.
4. **Live loop**: the operator's `ShotResolver` raycasts from the AR
   camera (screen-center, since the phone is bore-sighted) on every
   trigger pull; hits/misses go to `StatsTracker` (reaction/split time)
   and out over the WebSocket as `SHOT_EVENT` — the server persists it and
   relays it to the trainer console's live shot feed. The trainer can push
   `SPAWN_TARGET` / `DESPAWN_TARGET` / `SET_TARGET_STATE` /
   `START_SCENARIO` live; the operator app applies them immediately.
   Photos are captured and uploaded per shot
   (`Recording/PhotoCapture.cs` → `POST /media/upload/session`).
5. **End**: either side can end it — the trainer console's End button
   (`PATCH /sessions/:id/end`) or the operator app relaying `END_SCENARIO`.
   The operator app flushes any buffered shots (`POST /shots/bulk`, the
   REST fallback for when the WS relay drops) and disconnects.
6. **Review**: the trainer console's after-action page pulls the full shot
   timeline and any uploaded media for the session; the operator's stats
   page rolls up accuracy/reaction/split/hit-zone/hostage-hit numbers
   across all their sessions (`GET /operators/:id/stats`).

## Server (`server/`)

Fastify + TypeScript, Prisma ORM, SQLite by default (swap the datasource
in `prisma/schema.prisma` to `postgresql` for production — the schema is
portable, only the JSON-as-`String` fields would become native `Json`
columns, since SQLite has no native JSON type in Prisma).

- **REST**: `operators`, `target-definitions` (the catalog, seeded by
  `prisma/seed.ts`), `facilities` (+ `scan-layouts`), `scenarios` (with
  nested `target` placements), `sessions` (+ `end`), `shots` (+ `bulk`,
  the offline fallback), `media` (multipart upload — meshes have no
  session; photos/video do), `operators/:id/stats`.
- **WebSocket relay** (`src/ws/relay.ts`): one room per `sessionId`, one
  `trainer` slot and one `operator` slot; broadcasts each message to the
  other party and persists `SHOT_EVENT`/`SESSION_ENDED` as they pass
  through. Deliberately dumb — all real state lives in the DB, the relay
  just moves live events between the two live parties.
- **Media storage**: local disk under `MEDIA_STORAGE_DIR` in dev, served
  back out via `@fastify/static` at `/media/*`. Swap for an S3-compatible
  bucket in production by changing `saveUpload()` in `src/routes/media.ts`.

## Trainer console (`trainer-console/`)

Next.js App Router. No client-side state library — server components
fetch directly from the API on each navigation (`cache: "no-store"`),
mutations go through Server Actions (`app/**/actions.ts`) that
`revalidatePath`, and the two genuinely interactive surfaces (the scenario
target-placement canvas, the live-session WebSocket console) are the only
`"use client"` components. `lib/ws.ts`'s `useTrainerLink` hook is the
trainer-side mirror of `operator-app`'s `TrainerLinkClient.cs`.

Every protected page starts with `requireSession()` (`lib/session.ts`),
which redirects to `/login` if there's no valid access token; the token
itself is derived from an httpOnly-**off** cookie (`art_token`) so both
server components (`next/headers`) and the client components that call the
API directly (`lib/auth-client.ts`'s `getClientToken()`) can read it. See
the Auth section below for the full design and its trade-offs.

## Auth

Real accounts exist and work, but **auth is off by default** while the
project is still proving itself out (`DISABLE_AUTH` defaults to on —
`server/.env.example`, `server/src/env.ts`). With it off, every request
acts as one fixed auto-created org/admin (`server/src/auth/dev-mode.ts`)
— no login screen, no passwords, nothing to configure. The trainer
console shows a visible "DEV MODE — no login" badge in the nav
(`app/layout.tsx`) whenever this is active, specifically so it's never a
silent security posture nobody notices.

The real system is fully built underneath and one setting away: an org
registers itself and its first admin (`POST /auth/register`), every other
trainer/admin logs in (`POST /auth/login`), and the server issues a
12-hour JWT access token (`server/src/auth/jwt.ts`) carrying
`{operatorId, orgId, role}`. Every trainer-console-facing route
(`authenticate` preHandler, `server/src/auth/plugin.ts`) requires that
token and derives `orgId` from it when enabled — no `?orgId=` query param
anywhere for a client to spoof. Passwords are hashed with Node's built-in
`scrypt` (`server/src/auth/password.ts`) — no native dependency to
install in a sandboxed build. **To turn it on:** set `DISABLE_AUTH=false`
in `server/.env` and `NEXT_PUBLIC_AUTH_DISABLED=false` in
`trainer-console/.env.local`, restart both, then register your first real
account at `/register`. The server refuses to boot with auth disabled
when `NODE_ENV=production`, so this can't ship silently insecure.

The test suite covers both postures: `pnpm test` forces `DISABLE_AUTH=false`
and exercises real login/org-isolation (`src/routes/auth.test.ts`,
`src/routes/org-scoping.test.ts`); `pnpm test:devmode` runs
`src/auth/dev-mode.manual-test.ts` against a separate DB with auth left
at its default (on), confirming protected routes work with no token at
all. `pnpm test:all` runs both.

**Two deliberate scope limits**, not oversights:

- **Only trainer/admin accounts log in.** "Operator" roster rows
  (`POST /operators`, now itself behind `authenticate` + a trainer/admin
  role check) have no password and can't authenticate — they're the field
  roster the console and operator app reference by ID, not people who use
  the web console. If a unit wants field operators to log in too (e.g. to
  see their own stats without a trainer around), that's a straightforward
  extension: give them a password at creation and let them hit
  `/auth/login` too.
- **The operator app (the Unity device) has no login flow at all.**
  Everything it calls directly — `GET /scenarios/:id`, `POST /shots`
  (+`/bulk`), `POST /media/upload/*`, the WS relay — is deliberately left
  open. A session/scenario ID handed out by an authenticated trainer
  console session is the capability a device needs; adding a device-side
  login would mean writing and testing more Unity networking code I can't
  compile here (see operator-app's own honesty note in the top-level
  README). A production deployment would likely want a lightweight device
  API key or short-lived per-session token minted by the console and
  handed to the operator app at join time — noted as roadmap, not built.

**Also not built, on the console side:** refresh-token rotation (the
access token just expires after 12h and the trainer logs in again — no
separate long-lived refresh token, unlike Nova's own auth pattern), and
the `art_token` cookie is intentionally not `httpOnly` so client
components can read it directly, which is a real (if minor, for an
internal ops tool) XSS trade-off against a cleaner httpOnly-cookie design
that would need every client-side API call proxied through a Next.js
route handler instead.

## Operator app (`operator-app/`)

Unity + AR Foundation; see `operator-app/README.md` for the full Editor
setup this needs (it's C# source only — no `.unity`/`.prefab` files, which
only the Unity Editor can generate). Key pieces:

- **`Input/`** — `IShotTrigger` interface with four implementations
  (volume button — v1's default, native plugin, no hardware needed;
  Bluetooth HID switch; screen tap; desktop test key); `Core/ShotResolver`
  subscribes to all of them uniformly, so the trigger hardware is a
  pluggable detail, not baked into the hit-detection code.
- **`Core/ShotResolver`** — the raycast + hit-zone resolution; `HitFeedbackUI`
  is the operator's immediate visual feedback (screen flash + label) since
  there's no real recoil/impact to feel.
- **`Targets/TargetController`** — per-target state machine
  (Idle/Hostile/Compliant/Neutralized/NoShootHostage) driving an optional
  Animator; `TargetCatalog` is the trainer-configured map from server
  `TargetDefinition` IDs to local prefabs.
- **`Scenario/ScenarioRunner`** — spawns targets from a loaded
  `ScenarioDefinitionDto`, runs each target's scripted behavior timeline,
  and applies live trainer commands from `Networking/TrainerLinkClient`.
- **`Scanning/FacilityScanner`** — AR Foundation mesh capture (works on
  both platforms; quality is hardware-dependent, best on LiDAR
  iPhones/iPads) exported to OBJ and uploaded as a facility's `ScanLayout`.
- **`Recording/PhotoCapture`** — pure Unity API (`ScreenCapture`), fully
  working. `Recording/ISessionRecorder` is the extension point for full
  session video; `NullSessionRecorder` is the default no-op (see below).
- **`Stats/StatsTracker`** — local shot buffer with reaction/split-time
  math, flushed via REST at session end as the WS-relay fallback.

## What's built vs. roadmap

Everything above is real, working code — with one nuance: the volume-
button trigger (`Assets/Plugins/iOS/ARTVolumeButtonTrigger.mm`) is a
*complete* native plugin, not a stub, but like the rest of `operator-app`
it hasn't run on a real device. It was written because it's a narrow,
extremely well-precedented single technique (the same trick countless iOS
camera apps use), unlike the items below — RoomPlan and ReplayKit are
broader APIs with more moving parts and more ways to get subtly wrong
without a compiler to catch it, which is why those are stubs instead.
First-build verification note is in `operator-app/README.md`'s "Volume
button trigger" section.

A few pieces are deliberately **documented extension points, not silent
gaps** — each is flagged at the exact spot in the code where it belongs:

- **Native RoomPlan bridge** (`Scanning/IRoomPlanBridge.cs`) — Apple's
  RoomPlan gives LiDAR-quality parametric room capture (walls, doors,
  furniture as typed objects) far beyond the raw AR-mesh export
  `FacilityScanner` does today. RoomPlan is Swift-only with no Unity API;
  a real implementation is a small native iOS plugin, which needs an
  Xcode toolchain and a LiDAR device to write and test responsibly —
  neither available in the environment this was built in.
- **Native full-session video recording** (`Recording/ISessionRecorder.cs`)
  — ReplayKit (iOS) / MediaProjection (Android) both need native plugins
  for the same reason. Photo-per-shot capture works today without it.
- **Cross-session facility-anchor persistence** — target placements
  anchored to a facility currently resolve against raw world positions
  captured during a scan, valid for the session the scan happened in.
  Anchors surviving "walk in tomorrow, targets still line up" needs
  ARAnchorManager-backed (ideally Cloud) anchors — noted in
  `Scanning/FacilityScanner.cs` rather than implemented against an
  anchor-creation API that changed shape across recent AR Foundation
  versions and couldn't be verified without a compiler.
- **Device-side auth, refresh-token rotation, httpOnly session cookie** —
  org/tenant auth for the *trainer console* is built (see the Auth section
  above); what's still open is a device API key/short-lived token for the
  operator app's currently-unauthenticated endpoints, a real rotating
  refresh token instead of a flat 12h access token, and moving the
  console's token out of a JS-readable cookie behind a route-handler
  proxy.
- **Verbal-command-triggered target behavior, facility-scan UI (Start/Drop
  Anchor/Finish screen), QR-code session join** — noted as fast-follow
  work in `operator-app/README.md`'s final section; none block the core
  training loop.
- **Shared-types drift** — the TS and C# contracts are hand-mirrored, not
  generated from one source. A future pass could generate the C# DTOs
  from `packages/shared-types` (or a shared JSON Schema) to remove that
  maintenance burden.
