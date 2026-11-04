import { STEPS_PER_SECOND } from './config';

export const STEP_MS = 1000 / STEPS_PER_SECOND;
/** Longest real gap a single frame may contribute, so a stall never fast-forwards the game. */
export const MAX_FRAME_MS = 250;

export interface LoopDriver {
  /** Feed one frame's timestamp (ms); returns how many fixed sim steps to run now. */
  frame(nowMs: number, hidden: boolean): number;
}

/**
 * Fixed-timestep accumulator (docs/adr/0001). While hidden it advances nothing and
 * forgets the gap, so returning to the tab resumes rather than catching up.
 */
export function createLoopDriver(): LoopDriver {
  let last: number | null = null;
  let acc = 0;
  return {
    frame(nowMs, hidden) {
      if (hidden) {
        last = null;
        return 0;
      }
      if (last === null) {
        last = nowMs;
        return 0;
      }
      acc += Math.min(Math.max(0, nowMs - last), MAX_FRAME_MS);
      last = nowMs;
      // Epsilon absorbs float drift so 60 Hz and 120 Hz agree on whole steps.
      const steps = Math.floor(acc / STEP_MS + 1e-9);
      acc -= steps * STEP_MS;
      return steps;
    },
  };
}
