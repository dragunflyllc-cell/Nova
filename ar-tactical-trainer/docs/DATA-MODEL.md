# Data model & wire protocol reference

Source of truth: `packages/shared-types/src/*.ts` (TS) and
`operator-app/Assets/Scripts/Domain/*.cs` (hand-mirrored C#). This is a
human-readable index, not a third copy to keep in sync — when in doubt,
read the source files linked below.

## Entities

| Entity | Where | Notes |
|---|---|---|
| `Org` | `server/prisma/schema.prisma` | A unit/department/agency. Created once via `POST /auth/register` alongside its first admin; not in `shared-types` since only the server and its Prisma client touch it directly. |
| `Operator` | `server/prisma/schema.prisma`, `trainer-console/lib/api.ts` | `role`: `operator` \| `trainer` \| `admin`. Only trainer/admin rows carry a `passwordHash` and can log in — see `docs/ARCHITECTURE.md`'s Auth section for the full boundary. Every API response strips `passwordHash`. |
| `Facility` | `shared-types/src/facility.ts` | A physical building/site. Optional — scenarios can be open-ground instead. |
| `ScanLayout` | `shared-types/src/facility.ts` | One AR scan of a `Facility`: a mesh asset URL + named `anchors` (id, label, world position) that `TargetPlacement`s can reference. |
| `TargetDefinition` | `shared-types/src/target.ts` | Catalog entry (seeded by `server/prisma/seed.ts`): `kind` (`hostile`/`hostage`/`nonThreat`), model ref, default appearance. |
| `ScenarioDefinition` | `shared-types/src/scenario.ts` | A named, ordered set of `TargetPlacement`s + `PassFailRule`s, optionally tied to a `Facility`. |
| `TargetPlacement` | `shared-types/src/target.ts` | One target instance in a scenario: which `TargetDefinition`, an `anchor` (`SpatialAnchor`), an optional appearance override, and a `behaviorScript` (timed state transitions). |
| `SpatialAnchor` | `shared-types/src/geometry.ts` | Discriminated union: `{kind:"world", position, rotationYDeg}` for open-ground, or `{kind:"facilityAnchor", anchorId, offset, rotationYDeg}` to anchor relative to a `ScanLayout` anchor. |
| `Session` | `shared-types/src/session.ts` | One training run: scenario + operator + trainer, `outcome` (`pass`/`fail`/`aborted`/`inProgress`). |
| `ShotEvent` | `shared-types/src/session.ts` | One trigger pull: hit/miss, `hitZone` (`head`/`chest`/`limb`), `reactionTimeMs` (since the target's last transition into `hostile`), `splitTimeMs` (since the operator's previous shot this session), absolute-epoch-ms `timestampMs`. |
| `MediaAsset` | `shared-types/src/session.ts` | A photo or video tied to a session, same epoch-ms `timestampMs` scale as `ShotEvent` so after-action review can line footage and shots up on one timeline. |
| `OperatorStatsSummary` | `shared-types/src/session.ts` | Server-computed rollup (`server/src/stats/rollup.ts`): accuracy%, avg reaction/split time, hits by zone, hostage-hit count, across all of an operator's sessions. |

## REST endpoints (`server/src/routes/`)

🔒 = goes through the `authenticate` preHandler (`server/src/auth/plugin.ts`)
and is scoped to the caller's org. **Today, with `DISABLE_AUTH` at its
default (on), 🔒 routes still work with no token at all** — they're
scoped to one fixed auto-created org instead. Set `DISABLE_AUTH=false` to
require a real `Authorization: Bearer <accessToken>` on them, same as the
old behavior. Unmarked routes are open regardless — either public (the
catalog) or device-facing (called directly by the operator app, which has
no login of its own; see `docs/ARCHITECTURE.md`'s Auth section).

| Method & path | Purpose |
|---|---|
| `POST /auth/register` | Create an org + its first admin account |
| `POST /auth/login` | Get an access token |
| `GET /auth/me` 🔒 | Current operator's identity |
| `GET /operators` 🔒, `POST /operators` 🔒 (trainer/admin only) | List / add roster members |
| `GET /target-definitions` | The target catalog |
| `GET /facilities` 🔒, `POST /facilities` 🔒 | List / add facilities |
| `GET /facilities/:id` 🔒 | Facility + its scan layouts |
| `POST /facilities/:id/scan-layouts` | Register a completed AR scan (device) |
| `GET /scenarios` 🔒, `POST /scenarios` 🔒 | List / author scenarios |
| `GET /scenarios/:id` | Fetch a scenario (device) |
| `GET /sessions` 🔒, `POST /sessions` 🔒, `GET /sessions/:id` 🔒, `PATCH /sessions/:id/end` 🔒 | Session lifecycle |
| `POST /shots`, `POST /shots/bulk` | REST fallback for logging shots (device; primary path is the WS relay) |
| `POST /media/upload/mesh` | Upload a scan mesh (device, no session) |
| `POST /media/upload/session` | Upload a session photo/video (device; creates the `MediaAsset` row) |
| `GET /operators/:id/stats` 🔒 | Rolled-up operator stats |

## WebSocket relay protocol (`shared-types/src/ws-protocol.ts`, `server/src/ws/relay.ts`)

One room per `sessionId`; each side sends `{type:"JOIN", sessionId, role}`
first (`role`: `"trainer"` or `"operator"`), then envelopes of
`{type, sessionId, ts, payload}`.

**Trainer → operator:**

| type | payload |
|---|---|
| `SPAWN_TARGET` | `{targetPlacementId}` |
| `DESPAWN_TARGET` | `{targetPlacementId}` |
| `SET_TARGET_STATE` | `{targetPlacementId, state}` |
| `START_SCENARIO` | `{scenarioId}` |
| `END_SCENARIO` | `{}` |

**Operator → trainer** (server persists `SHOT_EVENT` and `SESSION_ENDED`):

| type | payload |
|---|---|
| `TELEMETRY` | `{operatorPosition: Vec3, headingYDeg}` |
| `SHOT_EVENT` | a full `ShotEvent` |
| `TARGET_STATE_CHANGED` | `{targetPlacementId, state}` |
| `SESSION_STARTED` | `{operatorId, scenarioId}` |
| `SESSION_ENDED` | `{outcome: "pass"\|"fail"\|"aborted"}` |

Client implementations: `trainer-console/lib/ws.ts` (`useTrainerLink`),
`operator-app/Assets/Scripts/Networking/TrainerLinkClient.cs`.
