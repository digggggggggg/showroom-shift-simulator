import { createRng, randomInt } from './rng';

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRng(9);
    const b = createRng(9);
    const seqA = Array.from({ length: 20 }, () => a());
    expect(Array.from({ length: 20 }, () => b())).toEqual(seqA);
    expect(seqA.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it('differs across seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it('randomInt stays in [0, n)', () => {
    const rng = createRng(4);
    const seen = new Set(Array.from({ length: 500 }, () => randomInt(rng, 5)));
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});
