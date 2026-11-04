import { createInitialState } from './sim';
import { createGameStore } from './store';

describe('game store', () => {
  it('notifies subscribers on change, not on identical state, and stops after unsubscribe', () => {
    const initial = createInitialState();
    const store = createGameStore(initial);
    const seen: number[] = [];
    const off = store.subscribe(() => seen.push(store.getState().framesLeft));

    store.setState(initial);
    expect(seen).toEqual([]);
    store.setState({ ...initial, framesLeft: 5 });
    expect(seen).toEqual([5]);
    off();
    store.setState({ ...initial, framesLeft: 6 });
    expect(seen).toEqual([5]);
  });
});
