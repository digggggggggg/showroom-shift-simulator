export interface AudioParamLike {
  setValueAtTime(value: number, time: number): unknown;
  exponentialRampToValueAtTime(value: number, time: number): unknown;
}

export interface AudioNodeLike {
  connect(destination: unknown): unknown;
}

export interface OscillatorLike extends AudioNodeLike {
  type: string;
  readonly frequency: AudioParamLike;
  start(when?: number): void;
  stop(when?: number): void;
}

export interface GainLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}

export interface AudioContextLike {
  readonly currentTime: number;
  readonly state: string;
  readonly destination: unknown;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  resume(): unknown;
}

/** Returns null when the platform has no Web Audio support. */
export type AudioContextFactory = () => AudioContextLike | null;

export interface SoftSfx {
  /** Call from a user gesture; this is the only place an AudioContext is created. */
  unlock(): void;
  setMuted(muted: boolean): void;
  chime(): void;
  whoosh(): void;
  coins(): void;
  humStart(): void;
  humStop(): void;
  dispose(): void;
}

interface Note {
  readonly freq: number;
  readonly step: number;
  readonly peak: number;
  readonly decay: number;
  readonly stop: number;
  readonly type: string;
}

const CHIME: Note = { freq: 0, step: 0.05, peak: 0.04, decay: 0.14, stop: 0.15, type: 'triangle' };
const WHOOSH: Note = { freq: 0, step: 0.04, peak: 0.035, decay: 0.12, stop: 0.13, type: 'sine' };
const COINS: Note = { freq: 0, step: 0.06, peak: 0.03, decay: 0.08, stop: 0.09, type: 'square' };

const CHIME_FREQS = [587.33, 880, 1174.66];
const WHOOSH_FREQS = [440, 554.37, 659.25, 880];
const COINS_FREQS = [659.25, 554.37, 440.0, 329.63, 220.0];

const HUM_FREQ = 45;
const HUM_GAIN = 0.015;

export function defaultAudioContextFactory(): AudioContextLike | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: new () => AudioContextLike; webkitAudioContext?: new () => AudioContextLike };
  const AC = w.AudioContext ?? w.webkitAudioContext;
  return AC ? new AC() : null;
}

export function createSoftSfx(factory: AudioContextFactory = defaultAudioContextFactory, initiallyMuted = false): SoftSfx {
  let ctx: AudioContextLike | null = null;
  let unlocked = false;
  let muted = initiallyMuted;
  let hum: { osc: OscillatorLike; gain: GainLike } | null = null;

  /** Lazily builds the context; before the first gesture nothing is constructed. */
  const context = (): AudioContextLike | null => {
    if (!unlocked) return null;
    if (!ctx) {
      try {
        ctx = factory();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') {
      try {
        void ctx.resume();
      } catch {
        // resume is best-effort
      }
    }
    return ctx;
  };

  const arpeggio = (freqs: readonly number[], note: Note): void => {
    if (muted) return;
    const c = context();
    if (!c) return;
    const t = c.currentTime;
    freqs.forEach((freq, i) => {
      try {
        const osc = c.createOscillator();
        const gain = c.createGain();
        const start = t + i * note.step;
        osc.type = note.type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(note.peak, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + note.decay);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        osc.stop(start + note.stop);
      } catch {
        // a failing voice must not break the game
      }
    });
  };

  const humStop = (): void => {
    if (!hum) return;
    const { osc, gain } = hum;
    hum = null;
    try {
      const now = ctx?.currentTime ?? 0;
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.stop(now + 0.05);
    } catch {
      // already stopped
    }
  };

  const humStart = (): void => {
    if (muted || hum) return;
    const c = context();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(HUM_FREQ, c.currentTime);
      gain.gain.setValueAtTime(HUM_GAIN, c.currentTime);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      hum = { osc, gain };
    } catch {
      hum = null;
    }
  };

  return {
    unlock() {
      unlocked = true;
      if (!muted) context();
    },
    setMuted(next) {
      muted = next;
      if (muted) humStop();
    },
    chime: () => arpeggio(CHIME_FREQS, CHIME),
    whoosh: () => arpeggio(WHOOSH_FREQS, WHOOSH),
    coins: () => arpeggio(COINS_FREQS, COINS),
    humStart,
    humStop,
    dispose: humStop,
  };
}
