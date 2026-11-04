# Backlog - Showroom Shift Simulator React port

Plan: [docs/plan-react-port.md](../docs/plan-react-port.md). Source of truth: `backlog.json`.

## P0

- `scaffold` (small) - toolchain, gates, tokens and palette files, local font, reference screenshots of the original.
- `sim-core` (medium, after scaffold) - pure seeded fixed-step simulation and button-label logic, fully unit tested.

## P1

- `canvas-render` (medium, after sim-core) - pixel-art renderer and real-time loop independent of refresh rate.
- `hud-controls` (medium, after canvas-render) - frame, status bar, dialogue, action buttons, KPIs, keyboard.
- `round-modal` (small, after hud-controls) - briefing, bottleneck and comparison reports as an accessible dialog.

## P2

- `sound` (small, after hud-controls) - WebAudio effects, persisted mute, hum stops reliably.
- `e2e-a11y` (small, after round-modal and sound) - keyboard play-through, axe, regenerated screenshots.
