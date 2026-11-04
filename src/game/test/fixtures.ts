import { createCustomer } from '../customer';
import { createRng } from '../rng';
import { createInitialState, startShift } from '../sim';
import type { Customer, Round, SimState } from '../types';

export function customer(overrides: Partial<Customer> = {}): Customer {
  return { ...createCustomer(100, createRng(1)), x: 196, y: 148, targetX: 196, targetY: 148, ...overrides };
}

export function tinOrder(tins: number): Partial<Customer> {
  return tins > 5
    ? { category: 'TRADE_LARGE', tins, val: tins * 70, name: `${tins}x Tins Trade Order` }
    : { category: 'MIX_SMALL', tins, val: tins * 60, name: `${tins}x Tins Emulsion` };
}

export const consultation: Partial<Customer> = { category: 'ADVICE', tins: 0, val: 45, name: 'Colour Consultation' };
export const samplePot: Partial<Customer> = { category: 'ADVICE', tins: 1, val: 55, name: 'Sample Pot (1 Tin)' };

/** A running shift whose queue is exactly the given customers. */
export function shiftWith(round: Round, queue: Customer[], from: SimState = createInitialState()): SimState {
  const started = startShift(from, round, createRng(7)).state;
  const withStats = round === 2 && !started.round1Stats ? { ...started, round1Stats: started.stats } : started;
  return { ...withStats, queue };
}
