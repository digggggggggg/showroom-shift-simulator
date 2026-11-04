import { createCustomer } from './customer';
import type { Rng } from './rng';

/** Feeds the palette roll, then the category roll, then the tin roll. */
function scripted(...values: number[]): Rng {
  return () => {
    const v = values.shift();
    if (v === undefined) throw new Error('rng exhausted');
    return v;
  };
}

describe('createCustomer', () => {
  it.each([
    [0.0, 0.0, { category: 'TRADE_LARGE', tins: 6, val: 420, name: '6x Tins Trade Order', bubble: '6 TINS' }],
    [0.34, 0.99, { category: 'TRADE_LARGE', tins: 10, val: 700 }],
    [0.35, 0.0, { category: 'MIX_SMALL', tins: 2, val: 120, name: '2x Tins Emulsion' }],
    [0.59, 0.99, { category: 'MIX_SMALL', tins: 5, val: 300 }],
    [0.6, null, { category: 'ADVICE', tins: 0, val: 45, name: 'Colour Consultation', bubble: 'ADVICE' }],
    [0.82, null, { category: 'ADVICE', tins: 1, val: 55, name: 'Sample Pot (1 Tin)', bubble: '1 POT' }],
  ])('roll %s, tins %s', (roll, tinRoll, expected) => {
    const values = tinRoll === null ? [0.5, roll] : [0.5, roll, tinRoll];
    const cust = createCustomer(3, scripted(...values));
    expect(cust).toMatchObject({ ...expected, id: 3, paletteIndex: 2, patience: 660, maxPatience: 660, x: -24, y: 148 });
  });

  it('seeds the guaranteed trade order without a category roll', () => {
    const cust = createCustomer(0, scripted(0.99), true);
    expect(cust).toMatchObject({ category: 'TRADE_LARGE', tins: 10, val: 700, name: '10x Tins Trade Order', paletteIndex: 4 });
  });
});
