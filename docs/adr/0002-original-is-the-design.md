# 2. The original file is the approved design

## Status

Accepted

## Context

The ui pack asks for a grey-box wireframe, approved by the owner, before any screen is built. This project is a faithful port of an existing, finished screen: `original/showroom-shift-simulator.html`.

## Decision

- The original is the approved design. No wireframes are drawn and no build ticket waits on wireframe approval.
- The scaffold ticket captures reference screenshots of the original under `docs/screenshots/original/`; UI tickets are accepted when the port matches them.
- The game has one fixed look, so `.forger/ui.json` lists only the `light` theme.
- Canvas colours live in `src/game/palette.ts`, CSS colours in `src/styles/tokens.css`; both are listed as token files in `.forger/ui.json`, so `check ui` (ui.tokens) passes without waivers.
- The Press Start 2P font is bundled locally, and the canvas waits for it before drawing text.
- Accessibility is improved where the original falls short: pinch-zoom allowed, the modal is a focus-trapped dialog, the dialogue line is a live region, everything is keyboard-operable. axe serious and critical violations must be zero.

## Consequences

- Visual changes to the game are out of scope unless they fix accessibility.
- `original/` stays in the repo as reference; it is not served or built.
