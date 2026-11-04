import { useSyncExternalStore } from 'react';
import type { GameStore, SimState } from '../game';

export function useGameState(store: GameStore): SimState {
  return useSyncExternalStore(store.subscribe, store.getState);
}
