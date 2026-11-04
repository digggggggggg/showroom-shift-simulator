# London Paint Showroom: Shift Simulator

A small pixel-art browser game about a paint showroom's till. One clerk serves a queue of trade and retail customers; in Round 1 every order is mixed in store, in Round 2 large orders go to the London Hub. The shift ends with a report comparing the two models.

This repo ports `original/showroom-shift-simulator.html` (the reference implementation and approved design) to React + TypeScript. `original/` is reference only; it is not built or served. The plan is in `docs/plan-react-port.md`, decisions in `docs/adr/`, vocabulary in `GLOSSARY.md`.

## Run

Requires [bun](https://bun.sh).

```sh
bun install
bun run dev        # http://localhost:3000
```

## Gates

```sh
bun run gates      # lint, typecheck, unit tests, production build
```

Individual steps: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.

CI (`.github/workflows/ci.yml`) runs `bun run gates` and the Playwright e2e suite on every pull request and on pushes to `main`.

## End-to-end tests

```sh
bunx playwright install chromium   # once
bun run e2e                        # Playwright against its own Vite server (port 4173, override with E2E_PORT)
```

The suite plays both rounds by keyboard on a faked clock (`page.clock`), reaches the comparison report, replays, and runs axe (`@axe-core/playwright`) on the briefing, mid-shift, bottleneck report and comparison report at phone and desktop widths, failing on serious or critical violations. It needs a browser, so it is not part of `bun run gates`; run it in CI where one is available.

For the app-wide accessibility sweep and the PR screenshots, use forger's commands with the dev server's port free:

```sh
bun /home/diego/work/forger/plugins/forger/bin/work.ts screenshot   # regenerates docs/screenshots/index-*.png
bun /home/diego/work/forger/plugins/forger/bin/work.ts check a11y   # axe on every route and viewport
```

## Reference screenshots

`bun run screenshots:original` serves the original and writes phone and desktop captures to `docs/screenshots/original/`. UI work is accepted when the port matches them.

`bun run dev` in one terminal and `bun scripts/capture-modals.ts` in another writes the briefing, bottleneck report and comparison report modal states to `docs/screenshots/`.

## Game logic

`src/game/` is the pure simulation (`docs/adr/0001-pure-sim-fixed-timestep.md`): `startShift`, `step`, `serveAdvice`, `processMix` and `continueFromModal` take a state and return the next state plus events for audio and dialogue; `deriveActionButtons` gives the till buttons' labels. Tuning numbers are in `src/game/config.ts`; randomness comes from the seeded RNG in `src/game/rng.ts`, so a shift replays exactly in tests.

## Colours

`src/game/render.ts` draws a frame as a function of `(ctx, state, view)`, and `src/game/loop.ts` is the fixed-timestep accumulator (frame gaps capped, no advance while the tab is hidden). The browser wiring lives outside the pure module: `src/hooks/useGameLoop.ts` runs `requestAnimationFrame`, `src/hooks/useGameState.ts` reads the store (`src/game/store.ts`) through `useSyncExternalStore`, and `src/components/GameCanvas.tsx` owns the canvas.

CSS colours live in `src/styles/tokens.css` and canvas colours in `src/game/palette.ts`. No other file under `src/` holds a raw colour literal.
