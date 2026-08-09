# AR Tactical Trainer

An augmented-reality training system for law-enforcement/military tactical
units (SWAT, special forces). An operator mounts a phone to a training
weapon (bore-sighted; the mount itself is out of scope of this software).
Through the phone's AR camera feed, a trainer places and customizes
hostile/hostage/non-threat targets — on open ground or inside a
previously AR-scanned building — the operator engages them with a real
trigger pull (a Bluetooth switch on the weapon, primarily; screen-tap and
desktop-key are secondary/testing paths), and the system scores hits with
**no live ammunition or projectile of any kind involved**. Every session
records video/photos and per-operator statistics for after-action review.

This is a standalone project — not part of the Nova trading platform this
repo otherwise contains. Nothing under `apps/`, `packages/`, or `services/`
at the repo root (all Nova) is touched by anything here.

## Structure

```
operator-app/       Unity (AR Foundation) project — the phone-on-gun app.
                     Complete C# source; scenes/prefabs need Editor setup
                     (see operator-app/README.md) since this was written
                     without a Unity install to generate project files from.
server/              Fastify + TypeScript + Prisma API — facilities,
                     scenarios, sessions, shots, media, stats, and the
                     trainer<->operator WebSocket relay. Installs, migrates,
                     and runs as committed.
trainer-console/     Next.js web app — the trainer's UI: register
                     operators, scan-backed facilities, author scenarios
                     (place/customize targets on a map), run a live
                     session with target control, after-action review,
                     and per-operator stat dashboards. Builds and runs
                     against the server as committed.
packages/shared-types/  The TS wire contract (scenario/session/shot/media
                     shapes, WebSocket protocol) — server and
                     trainer-console import it directly; operator-app's
                     C# DTOs (Assets/Scripts/Domain/) mirror it by hand
                     since Unity is a different language/runtime.
docs/
  ARCHITECTURE.md    Full system design, what's built vs. roadmap
  HARDWARE.md         Bluetooth trigger integration, phone-mount assumptions
  DATA-MODEL.md       Entities + WebSocket protocol reference
```

## Getting started

```bash
pnpm install

# server
cp server/.env.example server/.env
cd server && pnpm db:migrate && pnpm db:seed && cd ..

# trainer-console
cp trainer-console/.env.local.example trainer-console/.env.local

pnpm dev   # runs server (:4100) and trainer-console (:3100) together
```

Visit `localhost:3100` for the trainer console — it drops you straight
onto the dashboard, no login (there's a "DEV MODE — no login" badge in
the nav so that's never a silent surprise; see `docs/ARCHITECTURE.md`'s
Auth section for how to turn real accounts on when you're ready). Add an
operator to the roster on the Operators page, author a scenario, and
start a session — the live-session page gives you a session ID the
operator app joins (see `operator-app/README.md` for the Unity-side
setup, which needs the Unity Editor and isn't runnable in this
environment).

`cd server && pnpm test:all` runs the automated suite (28 tests:
password/JWT unit tests, integration tests against a real throwaway
SQLite DB — `app.inject()` for REST/auth/org-scoping, `app.injectWS()`
for the trainer↔operator relay, the stats rollup math against real shot
events — plus a separate dev-mode suite confirming protected routes work
with zero token when auth is off) — provisions and seeds its own test
database, no manual setup needed. `pnpm typecheck` / `pnpm build` cover `server` and
`trainer-console`; both have also been installed, migrated, built, and
exercised end-to-end by hand (REST + WebSocket relay + a full facility →
scenario → session → shots → stats → media flow, and the full
register/login/author/session/review/logout loop through a real headless
browser) during development. `operator-app` is C# source reviewed for
correctness against the real AR Foundation/Input System/Newtonsoft APIs,
but not compiled — no Unity Editor is available in
this environment. Budget Editor time per `operator-app/README.md`.

## Platform choice

**Unity + AR Foundation** for the operator app: the only realistic option
covering iOS *and* Android from one codebase (procurement for this kind of
unit is rarely iOS-only), with physics-based raycast hit detection and
animated 3D targets "for free" from the engine, and one abstraction
(AR Foundation) over both ARKit (LiDAR mesh, richer on Apple hardware) and
ARCore for the facility-scanning requirement.

**Next.js web app** for the trainer console rather than a second native
app: trainers need it on whatever laptop/tablet is at the range, and a
browser is the lowest-friction delivery.

**SQLite via Prisma** for the server's default datasource: zero-config —
`pnpm db:migrate` just works with nothing external to stand up. Swap the
`server/prisma/schema.prisma` datasource to `postgresql` for a real
multi-unit deployment; the schema is portable (see the comment there).

Trainer-console auth is real: an org registers itself and its first admin
(`/register`), everyone else logs in (`/login`), and every
trainer-console-facing server route requires that session and scopes to
the caller's org — see `docs/ARCHITECTURE.md`'s Auth section for exactly
what that does and doesn't cover (the operator app's device-facing
endpoints are deliberately still open; see there for why).

See `docs/ARCHITECTURE.md` for the full design and an honest accounting of
what's implemented versus flagged as follow-up work (native RoomPlan
bridge, native full-session video recording, Cloud Anchor facility
persistence, device-side auth).
