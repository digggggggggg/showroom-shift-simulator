# 1. Pure simulation on a fixed real-time timestep

## Status

Accepted

## Context

The original advances the game once per `requestAnimationFrame`, assuming 60 frames per second. On a 120 Hz display the shift runs twice as fast, and on a backgrounded tab it stalls or jumps. Game logic, drawing, audio and DOM updates are interleaved in one script, so nothing can be tested without a browser.

## Decision

- The game lives in `src/game/` as a pure module: `step(state, rng) -> state` advances one fixed step of 1/60 s, and action functions (`serveAdvice`, `processMix`, `startShift`) return a new state plus a list of events (chime, whoosh, walkout, hum start/stop, dialogue). No DOM, no audio, no `Math.random`.
- Randomness comes from an injected seeded RNG so a whole shift can be replayed in a test.
- All tuning numbers (shift length, spawn interval, patience, drain multiplier, tin values, hub threshold, speeds) live in one config module and keep the original's values.
- The browser loop accumulates real elapsed time and runs as many fixed steps as fit. Each frame's elapsed time is capped at 250 ms, and the loop does not advance while `document.hidden`, so the game never fast-forwards.
- The canvas renderer, the audio engine and React only read sim state or consume its events.
- Gameplay quirks of the original are preserved (leaving customers count toward the queue cap; patience drains while walking in). Only real defects are fixed.

## Consequences

- Game speed is independent of display refresh rate.
- The sim is covered by unit tests, including a seeded full-shift replay.
- Rendering and audio stay thin and are verified by screenshot and e2e tests.
