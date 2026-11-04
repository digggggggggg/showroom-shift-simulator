import { render } from '@testing-library/react';
import { createGameStore, createInitialState } from '../game';
import { GameCanvas } from './GameCanvas';

describe('GameCanvas', () => {
  afterEach(() => vi.restoreAllMocks());

  it('cancels the pending animation frame on unmount and schedules no more', async () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      callbacks.set(++id, cb);
      return id;
    });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((h) => {
      callbacks.delete(h);
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const { unmount } = render(<GameCanvas store={createGameStore(createInitialState())} />);
    await vi.waitFor(() => expect(callbacks.size).toBe(1));
    const pending = id;
    const first = callbacks.get(pending);
    callbacks.delete(pending);
    first?.(0);
    expect(id).toBe(pending + 1);

    unmount();
    expect(cancel).toHaveBeenLastCalledWith(pending + 1);
    expect(callbacks.size).toBe(0);
  });
});
