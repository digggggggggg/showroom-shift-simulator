# Plan: port the shift simulator to React

## Goal

Turn `original/showroom-shift-simulator.html` into a reliable, tested React app with the same gameplay, numbers, copy and pixel-art look, running at the same speed on every display.

## In scope

- Vite + React 19 + strict TypeScript, managed with bun; `bun run gates` chains lint, typecheck, tests and build. Dev server on port 3000.
- A pure, seeded, fixed-timestep simulation (see [ADR 1](adr/0001-pure-sim-fixed-timestep.md)).
- Canvas renderer, React HUD and controls, round modals, WebAudio sound with persisted mute.
- Accessibility fixes and the original-as-design rules in [ADR 2](adr/0002-original-is-the-design.md).
- Unit tests (Vitest, Testing Library), Playwright e2e with a fast-forwarded clock, axe, screenshots.

## Out of scope

- New gameplay, rebalancing, new content or a new visual style.
- A dark theme.
- Deployment configuration; the Vercel project is already linked and the owner deploys.

## Build order

1. `scaffold` - toolchain, gates, tokens and palette files, local font, reference screenshots of the original.
2. `sim-core` - the pure simulation with full unit coverage.
3. `canvas-render` - pixel-art renderer and the real-time loop.
4. `hud-controls` - frame, status bar, dialogue, action buttons, KPIs, keyboard.
5. `round-modal` - briefing, bottleneck report, comparison report, replay.
6. `sound` - audio engine and mute (can run alongside `round-modal`).
7. `e2e-a11y` - end-to-end play-through, axe, final screenshots.

The tickets themselves are in `.forger/backlog.json`; vocabulary in `GLOSSARY.md`.

## Open questions

None for this goal.
