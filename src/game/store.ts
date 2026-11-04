import type { SimState } from './types';

export interface GameStore {
  getState(): SimState;
  setState(next: SimState): void;
  /** Shaped for React's useSyncExternalStore. */
  subscribe(listener: () => void): () => void;
}

export function createGameStore(initial: SimState): GameStore {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState(next) {
      if (next === state) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
