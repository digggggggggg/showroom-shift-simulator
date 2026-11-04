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

## End-to-end tests

```sh
bunx playwright install chromium   # once
bun run e2e                        # Playwright against its own Vite server (port 4173, override with E2E_PORT)
```

## Reference screenshots

`bun run screenshots:original` serves the original and writes phone and desktop captures to `docs/screenshots/original/`. UI work is accepted when the port matches them.

## Colours

CSS colours live in `src/styles/tokens.css` and canvas colours in `src/game/palette.ts`. No other file under `src/` holds a raw colour literal.
