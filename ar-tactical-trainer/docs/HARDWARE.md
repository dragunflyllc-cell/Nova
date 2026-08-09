# Hardware assumptions

## Phone mount

The app assumes the phone is rigidly mounted to the training weapon,
**bore-sighted** — camera forward = barrel forward. The physical mount is
out of scope for this project. Everything downstream depends on this:
`Core/ShotResolver.cs` always raycasts from the AR camera's position along
its forward vector, regardless of where a screen tap lands, because the
reticle is fixed at screen center by construction of the mount, not by
anything the software tracks.

If your mount introduces a known fixed offset/parallax between the lens
and the actual bore line, that's a one-time calibration correction to
apply to the raycast origin/direction in `ShotResolver` — not currently
parameterized, since it depends on mount hardware this project doesn't
define.

## Trigger input

Three interchangeable `IShotTrigger` implementations
(`operator-app/Assets/Scripts/Input/`), any combination of which can be
enabled at once — whichever fires resolves a shot:

### Bluetooth switch (primary)

`Input/BluetoothHidTrigger.cs`. Two hardware classes behave very
differently here:

- **HID-profile switches** (repurposed AV presenter clickers, some
  commercial trigger-switch products) pair at the OS level and then
  enumerate to Unity's Input System as a generic button — no custom code
  needed beyond binding an Input Action to the right control path (see
  `operator-app/README.md`'s "Bluetooth trigger switch" section for the
  Input Debugger workflow). This is what `BluetoothHidTrigger` is built
  for.
- **Custom BLE GATT switches** (a bespoke PCB speaking a custom
  Bluetooth Low Energy service, not a HID profile) need a native
  CoreBluetooth (iOS) / Android BLE plugin to discover the device,
  connect, and subscribe to the button-press characteristic. That's
  real, hardware-specific work — not guessed at here. If you're building
  custom trigger hardware, plan on writing a second `IShotTrigger`
  implementation once you have a physical unit to pair against and a
  defined GATT service/characteristic UUID scheme.

### Screen tap (secondary)

`Input/ScreenTapTrigger.cs`. Any tap anywhere on screen fires — useful
before a trigger switch is wired up, or as a fallback/demo mode.

### Desktop key (testing only)

`Input/DesktopTestTrigger.cs`. Space bar or left mouse button, for
iterating on scenario/target logic in the Unity Editor without a phone or
any trigger hardware attached.

## AR scanning hardware

Facility scan quality (`Scanning/FacilityScanner.cs`) depends heavily on
the device:

- **LiDAR iPhones/iPads** (Pro models, 2020+): real-time, detailed
  environment mesh via ARKit's scene reconstruction. Best baseline
  quality this project produces today; Apple's RoomPlan (see
  `docs/ARCHITECTURE.md` roadmap) would be a further upgrade on this
  same hardware class.
- **Non-LiDAR iOS / most Android (ARCore)**: AR Foundation's mesh support
  is coarser and device-dependent. Usable for rough target placement,
  not for a precise architectural layout.

## Network

The operator app and trainer console both need to reach the server over
the network the range/facility actually has — `localhost` only works
in same-machine dev. Point `Networking/NetworkConfig.cs` (operator app)
and `trainer-console/.env.local` at the server's real reachable address
(LAN IP, or a proper hostname/TLS termination for anything beyond a single
local network). No offline/mesh-network mode is built — the live WebSocket
relay needs a path between all three parties; shots buffer locally and can
flush after the fact (`POST /shots/bulk`) if that connection drops
mid-session, but scenario load and live target control both need it up
front.
