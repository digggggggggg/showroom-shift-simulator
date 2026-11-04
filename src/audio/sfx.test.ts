import { describe, expect, it, vi } from 'vitest';
import { createSoftSfx, type AudioContextLike, type OscillatorLike } from './sfx';
import { MUTE_STORAGE_KEY, readMuted, writeMuted } from './mutePreference';

interface FakeOsc extends OscillatorLike {
  freqs: number[];
  started: number[];
  stopped: number[];
}

function fakeContext(state = 'running') {
  const oscs: FakeOsc[] = [];
  const resume = vi.fn<() => void>();
  const ctx: AudioContextLike = {
    currentTime: 1,
    state,
    destination: {},
    resume,
    createGain: () => ({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    }),
    createOscillator: () => {
      const o: FakeOsc = {
        type: '',
        freqs: [],
        started: [],
        stopped: [],
        frequency: { setValueAtTime: (v: number) => void o.freqs.push(v), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: (t?: number) => void o.started.push(t ?? 0),
        stop: (t?: number) => void o.stopped.push(t ?? 0),
      };
      oscs.push(o);
      return o;
    },
  };
  return { ctx, oscs, resume };
}

function setup(opts: { muted?: boolean; state?: string } = {}) {
  const { ctx, oscs, resume } = fakeContext(opts.state);
  const factory = vi.fn(() => ctx);
  const sfx = createSoftSfx(factory, opts.muted ?? false);
  return { sfx, factory, oscs, resume };
}

describe('SoftSfx', () => {
  it('constructs no AudioContext before a user gesture', () => {
    const { sfx, factory, oscs } = setup();
    sfx.chime();
    sfx.humStart();
    expect(factory).not.toHaveBeenCalled();
    expect(oscs).toHaveLength(0);
    sfx.unlock();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('resumes a suspended context', () => {
    const { sfx, resume } = setup({ state: 'suspended' });
    sfx.unlock();
    expect(resume).toHaveBeenCalled();
  });

  it.each([
    ['chime', [587.33, 880, 1174.66], 'triangle'],
    ['whoosh', [440, 554.37, 659.25, 880], 'sine'],
    ['coins', [659.25, 554.37, 440, 329.63, 220], 'square'],
  ] as const)('%s schedules the original frequencies', (name, freqs, type) => {
    const { sfx, oscs } = setup();
    sfx.unlock();
    sfx[name]();
    expect(oscs.map((o) => o.freqs[0])).toEqual(freqs);
    expect(oscs.every((o) => o.type === type)).toBe(true);
    expect(oscs.every((o) => o.started.length === 1 && o.stopped.length === 1)).toBe(true);
  });

  it('plays the shaker hum at 45 Hz and does not stack it', () => {
    const { sfx, oscs } = setup();
    sfx.unlock();
    sfx.humStart();
    sfx.humStart();
    expect(oscs).toHaveLength(1);
    expect(oscs[0]?.freqs).toEqual([45]);
    expect(oscs[0]?.type).toBe('triangle');
  });

  it('stops the hum on humStop and on dispose', () => {
    const a = setup();
    a.sfx.unlock();
    a.sfx.humStart();
    a.sfx.humStop();
    expect(a.oscs[0]?.stopped).toHaveLength(1);

    const b = setup();
    b.sfx.unlock();
    b.sfx.humStart();
    b.sfx.dispose();
    expect(b.oscs[0]?.stopped).toHaveLength(1);
  });

  it('muting silences a playing hum and blocks later sounds', () => {
    const { sfx, oscs } = setup();
    sfx.unlock();
    sfx.humStart();
    sfx.setMuted(true);
    expect(oscs[0]?.stopped).toHaveLength(1);
    sfx.chime();
    sfx.whoosh();
    sfx.coins();
    sfx.humStart();
    expect(oscs).toHaveLength(1);
  });

  it('plays nothing when constructed muted', () => {
    const { sfx, oscs } = setup({ muted: true });
    sfx.unlock();
    sfx.chime();
    expect(oscs).toHaveLength(0);
  });

  it('degrades silently without AudioContext support', () => {
    const sfx = createSoftSfx(() => null);
    sfx.unlock();
    expect(() => {
      sfx.chime();
      sfx.humStart();
      sfx.humStop();
      sfx.dispose();
    }).not.toThrow();
    const throwing = createSoftSfx(() => {
      throw new Error('nope');
    });
    throwing.unlock();
    expect(() => throwing.coins()).not.toThrow();
  });
});

describe('mute preference', () => {
  it('round-trips through storage', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    expect(readMuted(storage)).toBe(false);
    writeMuted(true, storage);
    expect(data.get(MUTE_STORAGE_KEY)).toBe('1');
    expect(readMuted(storage)).toBe(true);
    writeMuted(false, storage);
    expect(readMuted(storage)).toBe(false);
  });

  it('defaults to on and never throws when storage throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readMuted(storage)).toBe(false);
    expect(() => writeMuted(true, storage)).not.toThrow();
  });
});
