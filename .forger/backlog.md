# Backlog - Showroom Shift Simulator React port

Plan: [docs/plan-react-port.md](../docs/plan-react-port.md). Source of truth: GitHub issues labelled `ready-for-agent`.

## P0

- `scaffold` (small, done #1) - toolchain, gates, tokens and palette files, local font, reference screenshots of the original.
- `sim-core` (medium, done #2) - pure seeded fixed-step simulation and button-label logic, fully unit tested.

## P1

- #3 `canvas-render` (medium, after sim-core) - pixel-art renderer and real-time loop independent of refresh rate.
- #4 `hud-controls` (medium, after canvas-render) - frame, status bar, dialogue, action buttons, KPIs, keyboard.
- #5 `round-modal` (small, after hud-controls) - briefing, bottleneck and comparison reports as an accessible dialog.

## P2

- #6 `sound` (small, after hud-controls) - WebAudio effects, persisted mute, hum stops reliably.
- #7 `e2e-a11y` (small, after round-modal and sound) - keyboard play-through, axe, regenerated screenshots.
