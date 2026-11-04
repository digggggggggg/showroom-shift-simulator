import { useEffect, useRef } from 'react';
import { createLoopDriver, createRng, step, type GameStore, type Rng } from '../game';

export interface GameLoopOptions {
  /** Called once per animation frame after the sim has advanced. */
  readonly onFrame: () => void;
  /** Resolves before the first frame (the font must be ready before any text draws). */
  readonly ready?: Promise<unknown>;
  readonly rng?: Rng;
}

export function useGameLoop(store: GameStore, options: GameLoopOptions): void {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const driver = createLoopDriver();
    const rng = optionsRef.current.rng ?? createRng(Date.now());
    let handle = 0;
    let stopped = false;

    const tick = (now: number): void => {
      const steps = driver.frame(now, document.hidden);
      let state = store.getState();
      for (let i = 0; i < steps; i++) state = step(state, rng).state;
      store.setState(state);
      optionsRef.current.onFrame();
      handle = requestAnimationFrame(tick);
    };

    const ready = optionsRef.current.ready ?? Promise.resolve();
    void ready.then(() => {
      if (!stopped) handle = requestAnimationFrame(tick);
    });

    return () => {
      stopped = true;
      cancelAnimationFrame(handle);
    };
  }, [store]);
}
