# operator-app

The phone-on-gun app. AR camera passthrough, a fixed bore-sighted reticle,
target spawning/behavior driven by a scenario authored in the trainer
console, hit detection via **either physical volume button** (v1's
default — see below, no extra hardware needed), photo capture on every
shot, live telemetry back to the trainer console, and local stats
logging. A Bluetooth trigger switch and screen-tap are also wired up as
drop-in alternatives once the core loop is proven out.

**v1 targets iPhone only.** The ARCore (Android) package stays in
`Packages/manifest.json` for later, but every instruction below assumes
iOS — an iPhone with LiDAR (Pro models) gives the best facility-scan
quality if you get that far, but any iPhone that supports ARKit works for
the core shoot loop.

**This is source code, not a buildable project as committed.** Unity
project files (`.meta` files, scenes, prefabs, the Library cache) don't
exist yet — they're only created by the Unity Editor itself, and this was
written in a headless environment with no Unity install to generate them
from. Everything below is exact, idiomatic C# against real AR Foundation /
Input System / Newtonsoft APIs, self-reviewed carefully since it couldn't
be compiled here — but budget time for the Editor-side wiring (scenes,
prefabs, Inspector references) described in this doc, and expect to fix
the odd compile error a real Editor surfaces that a from-memory review
can't catch.

## Prerequisites

- A **Mac** with **Xcode 15+** — required for any iOS build, no way around it
- Unity **2022.3 LTS** (see `ProjectSettings/ProjectVersion.txt`) via Unity Hub,
  with **iOS Build Support** added
- A physical iPhone — AR Foundation does not run in the Editor Game view,
  and the volume-button trigger only exists on a real device; use
  [XR Simulation](https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@5.1/manual/xr-simulation/xr-simulation-overview.html)
  for basic in-Editor iteration of everything else
- The `server` app running somewhere the phone can reach (its LAN IP, not
  `localhost`, once you're off a simulator)

## First open

1. Unity Hub → Add → select this `operator-app` folder. Let Unity resolve
   packages from `Packages/manifest.json` on first open (may take a few
   minutes).
2. `Edit > Project Settings > XR Plug-in Management` → enable **Apple
   ARKit** under the iOS tab.
3. `Edit > Project Settings > Player > Other Settings` → confirm **Api
   Compatibility Level** is **.NET Standard 2.1** (the 2022.3 default) —
   `Networking/TrainerLinkClient.cs` and `Recording/MediaUploader.cs` use
   `System.Net.WebSockets.ClientWebSocket` and `File.ReadAllBytesAsync`,
   both of which need it.
4. `Edit > Project Settings > Player > iOS`: set Camera Usage Description
   ("Used for AR training scenarios"), Target minimum iOS version 13.0+,
   Architecture ARM64. No extra permission needed for the volume-button
   trigger (`Assets/Plugins/iOS/ARTVolumeButtonTrigger.mm`) — it only uses
   the audio session, not the microphone.

## Scene setup

Create one scene (e.g. `Assets/Scenes/Training.unity`):

1. **AR session objects** — `GameObject > XR > AR Session` and
   `GameObject > XR > XR Origin (AR)`. This gives you the AR Camera with
   `ARCameraManager`/`ARCameraBackground` already wired.
2. On the XR Origin, add **AR Mesh Manager**, **AR Raycast Manager**, **AR
   Anchor Manager** components (needed for `Scanning/FacilityScanner.cs`).
3. **Reticle** — a small UI or world-space crosshair fixed at screen
   center, purely visual (`ShotResolver` always fires from camera-forward
   regardless of what's drawn).
4. **Bootstrap GameObject** (e.g. `_App`) holding, as separate components:
   - `Networking/NetworkConfig.cs` — set `apiBaseUrl`/`wsUrl` to your
     server's reachable address (e.g. `http://192.168.1.20:4100`,
     `ws://192.168.1.20:4100/ws`).
   - `Networking/TrainerLinkClient.cs`
   - `Stats/StatsTracker.cs`
   - `Core/ShotResolver.cs` — assign **Ar Camera** to the XR Origin's AR
     Camera; create a `Targets` Physics layer, assign every target
     prefab's hit-zone colliders to it, and set **Target Layer Mask** to
     just that layer; add trigger components (below) to **Trigger
     Sources**.
   - `Input/VolumeButtonTrigger.cs` — v1's default; nothing to configure,
     just add the component (see "Volume button trigger" below for how it
     works and its one real-device caveat to check first).
     `Input/BluetoothHidTrigger.cs`, `Input/ScreenTapTrigger.cs`,
     `Input/DesktopTestTrigger.cs` are also available and can coexist with
     it — any of them firing resolves a shot.
   - `Recording/PhotoCapture.cs` — assign the `ShotResolver`.
   - `Recording/NullSessionRecorder.cs` (or your own `ISessionRecorder` —
     see that interface's doc comment for the native-plugin path) +
     `Recording/SessionRecorderController.cs` referencing it.
   - `Scenario/ScenarioRunner.cs` — assign the `TargetCatalog` asset
     (below), `ShotResolver`, `TrainerLinkClient`, `StatsTracker`, a
     `targetsParent` Transform (empty GameObject to parent spawned
     targets under), and `operatorTransform` = the AR Camera's Transform.
   - `App/SessionBootstrapUI.cs` — wire to a simple Canvas with three
     `InputField`s (scenario ID / session ID / operator ID — the trainer
     console shows these), a Join `Button`, and a status `Text`.
5. **Hit feedback** — a full-screen `Canvas > Image` (for the flash) and a
   `Text` for the HIT/MISS label; add `Core/HitFeedbackUI.cs` referencing
   both plus the `ShotResolver`.

### Volume button trigger (v1 default)

Either physical volume button on the iPhone fires a shot — the same
"volume button as shutter" trick countless iOS camera apps use, so no
trigger hardware is needed to start testing the core loop. Implementation:
`Assets/Plugins/iOS/ARTVolumeButtonTrigger.mm` (native — observes
`AVAudioSession.outputVolume` via KVO, using a hidden `MPVolumeView` to
both suppress the system volume HUD and reset the level after each press
so there's always room to detect the next one) plus
`Input/VolumeButtonTrigger.cs` (thin P/Invoke wrapper). Nothing to
configure — add the component and it works.

This is a well-known, narrow technique, but — like everything native in
this project — it hasn't run on a real device yet. The one thing worth
testing deliberately on first build: press a volume button once right
after the scene loads and confirm it *doesn't* fire (the plugin ignores
KVO callbacks for ~0.5s after starting, specifically to swallow the
spurious one that registering the observer itself triggers); if you get a
phantom trigger on load, widen that window in the `.mm` file.

### Bluetooth trigger switch (later upgrade, not required to start)

Once the volume-button loop is working end to end and you want a more
realistic in-hand trigger, pair a switch at the OS level first (iOS
Bluetooth settings). If it's a standard HID button device, create an
Input Actions asset (`Assets > Create > Input Actions`), add an action,
and use `Window > Analysis > Input Debugger` while the switch is paired
to find its exact binding path (often shows up as a generic HID device or
gamepad button). Assign that Input Action to `BluetoothHidTrigger`'s
`Trigger Action` field. A switch that speaks custom BLE GATT instead of a
HID profile needs a small native plugin — not included here; see the
class doc comment in `Input/BluetoothHidTrigger.cs`.

### Target Catalog

`Assets > Create > AR Tactical Trainer > Target Catalog`. `GET
/target-definitions` from a running server for the seeded catalog IDs
(`server/prisma/seed.ts`), then add one entry per row with a matching
`targetDefinitionId`, `kind`, and a prefab that has a `Targets/TargetController.cs`
on its root plus child colliders (on the `Targets` layer) each carrying a
`Targets/TargetHitZone.cs` set to `Head`/`Chest`/`Limb`. An `Animator`
with an integer parameter named `State` (values 0–4, matching the
`TargetRuntimeState` enum order: Idle, Hostile, Compliant, Neutralized,
NoShootHostage) is optional but is what `TargetController.SetState`
drives if present.

### Facility scanning (optional)

Add `Scanning/FacilityScanner.cs` to the bootstrap object, assign the AR
Mesh/Raycast/Anchor managers. Call `StartScan()`, walk the space (mesh
quality depends heavily on the device — real-time and detailed on LiDAR
iPhones/iPads via ARKit, coarser on ARCore), call `TryDropAnchor(label)`
at points you want scenarios able to reference, then
`StopScanAndUploadAsync(facilityId, operatorId)` to export + upload. This
is a UI you'll want to build (a "scan mode" screen with Start/Drop
Anchor/Finish buttons) — no such screen is included yet.

## Running it

1. Build & Run to a device (`File > Build Settings`).
2. In the trainer console, register operators, author a scenario, and hit
   **Start session** — note the scenario ID (from the scenario page URL)
   and the session ID it gives you (from the live-session page URL).
3. On the device, enter those two IDs plus the operator's ID (from the
   Operators page) into the join screen and tap Join.
4. Targets spawn per the scenario; press either volume button (or
   whatever other trigger you've enabled) to fire. Hits/misses show
   instantly via `HitFeedbackUI`, get logged to `StatsTracker`, streamed
   live to the trainer console, and a photo is captured and uploaded per
   shot.
5. End the session from either side — the trainer console's End button, or
   a trainer-side `END_SCENARIO` command — flushes any buffered shots and
   disconnects.

## What's intentionally not implemented here

Flagged in code comments at the exact extension point, not silently
missing:

- **Native RoomPlan bridge** (`Scanning/IRoomPlanBridge.cs`) — LiDAR-quality
  parametric room capture on iOS. The baseline `FacilityScanner` (AR
  Foundation mesh export) works today; RoomPlan is a richer upgrade that
  needs a Swift native plugin.
- **Native full-session video recording** (`Recording/ISessionRecorder.cs`)
  — ReplayKit (iOS) / MediaProjection (Android) both need small native
  plugins. `NullSessionRecorder` is the default no-op; photo capture
  (`Recording/PhotoCapture.cs`) works today without it.
- **Facility scan UI** (Start/Drop Anchor/Finish screen) — `FacilityScanner`'s
  API is ready; no Canvas/buttons wire it up yet.
- **QR-code session join** — `SessionBootstrapUI` is a manual ID-entry form;
  swapping in a QR scan of the trainer console's session-start screen is a
  natural fast-follow.
