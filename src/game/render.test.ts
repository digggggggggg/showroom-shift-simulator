import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { palette } from './palette';
import { render } from './render';
import { createInitialState, startShift } from './sim';
import { createRng } from './rng';

interface Recorder {
  ctx: CanvasRenderingContext2D;
  fills: string[];
  texts: string[];
}

function recorder(): Recorder {
  const fills: string[] = [];
  const texts: string[] = [];
  const target: Record<string, unknown> = {
    fillText: (t: string) => texts.push(t),
    fillRect: () => undefined,
  };
  const ctx = new Proxy(target, {
    get: (t, k: string) => t[k] ?? (() => undefined),
    set: (t, k: string, v) => {
      t[k] = v;
      if (k === 'fillStyle') fills.push(v as string);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, fills, texts };
}

function colours(v: unknown): string[] {
  if (typeof v === 'string') return v.startsWith('#') || v.startsWith('rgba') ? [v] : [];
  if (v && typeof v === 'object') return Object.values(v).flatMap(colours);
  return [];
}

describe('render', () => {
  it('draws the start state using palette colours only', () => {
    const r = recorder();
    render(r.ctx, createInitialState(), { shakerJitter: 0 });
    const allowed = new Set(colours(palette));
    expect(r.fills.length).toBeGreaterThan(0);
    for (const f of r.fills) expect(allowed.has(f)).toBe(true);
  });

  it('is deterministic for the same state and view, and does not touch Math.random', () => {
    const spy = vi.spyOn(Math, 'random');
    const state = startShift(createInitialState(), 1, createRng(1)).state;
    const a = recorder();
    const b = recorder();
    render(a.ctx, state, { shakerJitter: 0.5 });
    render(b.ctx, state, { shakerJitter: 0.5 });
    expect(a.fills).toEqual(b.fills);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('shows the unmanned banner as plain pixel-font text when the clerk leaves the till', () => {
    const state = startShift(createInitialState(), 1, createRng(1)).state;
    const away = { ...state, clerk: { ...state.clerk, state: 'mixing' as const, tinsRemaining: 3 } };
    const r = recorder();
    render(r.ctx, away, { shakerJitter: 0 });
    expect(r.texts).toContain('! COUNTER UNMANNED');
    expect(r.texts).toContain('MIX 3s');
    expect(r.texts.join('')).not.toMatch(/[^\x20-\x7e]/);
  });

  it('keeps raw colour literals out of render.ts', () => {
    const src = readFileSync(resolve(__dirname, 'render.ts'), 'utf8');
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
