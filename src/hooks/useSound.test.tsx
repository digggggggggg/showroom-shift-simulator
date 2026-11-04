import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandBar } from '../components/BrandBar';
import { createGameStore, createInitialState } from '../game';
import { MUTE_STORAGE_KEY } from '../audio/mutePreference';
import type { AudioContextLike } from '../audio/sfx';
import { useSound } from './useSound';

function factoryWithLog() {
  const oscs: { stopped: number }[] = [];
  const ctx: AudioContextLike = {
    currentTime: 0,
    state: 'running',
    destination: {},
    resume: vi.fn(),
    createGain: () => ({ gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
    createOscillator: () => {
      const rec = { stopped: 0 };
      oscs.push(rec);
      return {
        type: '',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: () => void rec.stopped++,
      };
    },
  };
  return { factory: vi.fn(() => ctx), oscs };
}

const roundEnded = { type: 'roundEnded', round: 1, stats: createInitialState().stats, round1Stats: null } as const;

describe('useSound', () => {
  beforeEach(() => localStorage.clear());

  it('stops the hum on roundEnded and on unmount, and builds no context before a gesture', () => {
    const store = createGameStore(createInitialState());
    const { factory, oscs } = factoryWithLog();
    const { unmount } = renderHook(() => useSound(store, factory));
    act(() => store.emit([{ type: 'humStart' }]));
    expect(factory).not.toHaveBeenCalled();

    act(() => void window.dispatchEvent(new Event('pointerdown')));
    act(() => store.emit([{ type: 'humStart' }]));
    expect(oscs).toHaveLength(1);
    act(() => store.emit([roundEnded]));
    expect(oscs[0]?.stopped).toBe(1);

    act(() => store.emit([{ type: 'humStart' }]));
    unmount();
    expect(oscs[1]?.stopped).toBe(1);
  });

  it('persists the mute toggle, silences the hum, and restores it on remount', async () => {
    const store = createGameStore(createInitialState());
    const { factory, oscs } = factoryWithLog();
    function Harness() {
      const s = useSound(store, factory);
      return <BrandBar muted={s.muted} onToggleMute={s.toggleMute} />;
    }
    const first = render(<Harness />);
    act(() => void window.dispatchEvent(new Event('pointerdown')));
    act(() => store.emit([{ type: 'humStart' }]));
    expect(oscs).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /SFX: ON/ }));
    expect(oscs[0]?.stopped).toBe(1);
    expect(screen.getByRole('button', { name: /SFX: OFF/ })).toBeInTheDocument();
    expect(screen.getByTestId('pwr-led')).toHaveClass('pwr-led-muted');
    expect(localStorage.getItem(MUTE_STORAGE_KEY)).toBe('1');
    first.unmount();

    render(<Harness />);
    expect(screen.getByRole('button', { name: /SFX: OFF/ })).toBeInTheDocument();
  });

  it('survives a throwing localStorage', async () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const store = createGameStore(createInitialState());
    const { result } = renderHook(() => useSound(store, () => null));
    expect(result.current.muted).toBe(false);
    act(() => result.current.toggleMute());
    expect(result.current.muted).toBe(true);
    spy.mockRestore();
    set.mockRestore();
  });
});
