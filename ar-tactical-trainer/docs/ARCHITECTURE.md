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

v1 has no auth/multi-tenant UI — every page scopes to a single hardcoded
demo org (`lib/org.ts`). See Roadmap.

## Operator app (`operator-app/`)

Unity + AR Foundation; see `operator-app/README.md` for the full Editor
setup this needs (it's C# source only — no `.unity`/`.prefab` files, which
only the Unity Editor can generate). Key pieces:

- **`Input/`** — `IShotTrigger` interface with three implementations
  (Bluetooth HID switch, screen tap, desktop test key); `Core/ShotResolver`
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

Everything above is real, working code. A few pieces are deliberately
**documented extension points, not silent gaps** — each is flagged at the
exact spot in the code where it belongs:

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
- **Org/tenant auth** — the server has no auth middleware and the console
  hardcodes one demo org (`trainer-console/lib/org.ts`). Real deployment
  across multiple units/agencies needs real accounts and org scoping —
  same shape as Nova's own auth (email/password + JWT), not built here.
- **Verbal-command-triggered target behavior, facility-scan UI (Start/Drop
  Anchor/Finish screen), QR-code session join** — noted as fast-follow
  work in `operator-app/README.md`'s final section; none block the core
  training loop.
- **Shared-types drift** — the TS and C# contracts are hand-mirrored, not
  generated from one source. A future pass could generate the C# DTOs
  from `packages/shared-types` (or a shared JSON Schema) to remove that
  maintenance burden.
