import type { SimEvent, SimState } from './types';

export interface GameStore {
  getState(): SimState;
  setState(next: SimState): void;
  /** Shaped for React's useSyncExternalStore. */
  subscribe(listener: () => void): () => void;
  /** Publishes events a sim call produced so side-effect consumers (sound) can react. */
  emit(events: readonly SimEvent[]): void;
  subscribeEvents(listener: (events: readonly SimEvent[]) => void): () => void;
}

export function createGameStore(initial: SimState): GameStore {
  let state = initial;
  const listeners = new Set<() => void>();
  const eventListeners = new Set<(events: readonly SimEvent[]) => void>();
  return {
    getState: () => state,
    setState(next) {
      if (next === state) return;
      state = next;
      listeners.forEach((l) => l());
    },
    emit(events) {
      if (events.length === 0) return;
      eventListeners.forEach((l) => l(events));
    },
    subscribeEvents(listener) {
      eventListeners.add(listener);
      return () => {
        eventListeners.delete(listener);
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
