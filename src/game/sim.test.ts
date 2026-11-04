import { config } from './config';
import { createRng, type Rng } from './rng';
import {
  continueFromModal,
  createInitialState,
  processMix,
  serveAdvice,
  shiftSecondsLeft,
  startShift,
  step,
} from './sim';
import { consultation, customer, samplePot, shiftWith, tinOrder } from './test/fixtures';
import type { SimEvent, SimResult, SimState, Stats } from './types';

const noRandom: Rng = () => {
  throw new Error('rng must not be used here');
};

/** Steps the sim, holding spawning off so a test controls the queue. */
function stepQuiet(state: SimState, n: number): { state: SimState; events: SimEvent[]; history: SimState[] } {
  const events: SimEvent[] = [];
  const history: SimState[] = [];
  let s = state;
  for (let i = 0; i < n; i++) {
    const r = step({ ...s, spawnTimer: 0 }, noRandom);
    s = r.state;
    events.push(...r.events);
    history.push(s);
  }
  return { state: s, events, history };
}

/** A greedy player: serves whatever the front customer wants the moment the clerk is free. */
function playShift(state: SimState, rng: Rng): { result: SimResult; events: SimEvent[] } {
  let s = state;
  const events: SimEvent[] = [];
  for (;;) {
    const acted = processMix(serveAdvice(s).state);
    s = acted.state;
    const r = step(s, rng);
    s = r.state;
    events.push(...r.events);
    if (!s.shiftActive) return { result: r, events };
  }
}

function playGame(seed: number) {
  const rng = createRng(seed);
  const r1 = playShift(startShift(createInitialState(), 1, rng).state, rng);
  const r2 = playShift(continueFromModal(r1.result.state, rng).state, rng);
  return { round1: r1, round2: r2 };
}

describe('startShift', () => {
  it('resets stats and seeds the guaranteed 10-tin trade customer', () => {
    const dirty: SimState = { ...createInitialState(), stats: { ...createInitialState().stats, captured: 999 } };
    const { state, events } = startShift(dirty, 1, createRng(1));
    expect(state.shiftActive).toBe(true);
    expect(state.framesLeft).toBe(1800);
    expect(state.stats).toEqual({ captured: 0, lost: 0, walkouts: 0, unmannedSeconds: 0, hubOrders: 0 });
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0]).toMatchObject({ category: 'TRADE_LARGE', tins: 10, val: 700, bubble: '10 TINS' });
    expect(state.clerk.state).toBe('at_till');
    expect(events).toContainEqual({ type: 'humStop' });
    expect(events).toContainEqual({ type: 'dialogue', text: 'SHIFT STARTED: Customer at till needs 10 tins of paint!' });
  });

  it('announces the hub in Round 2', () => {
    const { state } = startShift(createInitialState(), 2, createRng(1));
    expect(state.round).toBe(2);
    expect(state.dialogue).toBe('SHIFT STARTED: Orders >5 tins can be dispatched to the London Hub!');
  });

  it('does nothing when no shift is running', () => {
    const s = createInitialState();
    expect(step(s, noRandom)).toEqual({ state: s, events: [] });
  });
});

describe('patience', () => {
  it('drains 1.0 per step with the clerk at the till', () => {
    const s = shiftWith(1, [customer()]);
    const after = stepQuiet(s, 1).state;
    expect(after.queue[0]?.patience).toBe(659);
  });

  it('drains 1.8 per step in every unmanned clerk state', () => {
    for (const clerkState of ['walking_to_shaker', 'mixing', 'walking_to_till'] as const) {
      const base = shiftWith(1, [customer()]);
      const s: SimState = { ...base, clerk: { ...base.clerk, state: clerkState, busyTimer: 600, x: 140, y: 60 } };
      const after = stepQuiet(s, 1).state;
      expect(after.queue[0]?.patience).toBeCloseTo(660 - 1.8);
      expect(after.stats.unmannedSeconds).toBeCloseTo(1 / 60);
    }
  });

  it('drains while a customer is still walking in', () => {
    const s = shiftWith(1, [customer({ x: -24, targetX: -24 })]);
    const after = stepQuiet(s, 1).state;
    expect(after.queue[0]?.x).toBeCloseTo(-24 + 2.2);
    expect(after.queue[0]?.patience).toBe(659);
  });

  it('walks a customer out at zero patience, counting the value as lost', () => {
    const s = shiftWith(1, [customer({ ...tinOrder(3), patience: 1 })]);
    const { state, events } = stepQuiet(s, 1);
    expect(state.queue[0]?.isLeaving).toBe(true);
    expect(state.stats.lost).toBe(180);
    expect(state.stats.walkouts).toBe(1);
    expect(state.floaters).toHaveLength(1);
    expect(state.floaters[0]?.text).toBe('-\u00a3180');
    expect(events).toContainEqual({ type: 'coins' });
    expect(state.dialogue).toBe('WALKOUT: Customer left! "Nobody is serving at the till!" (-\u00a3180)');
  });

  it('removes a walked-out customer once it has left the floor, and counts it only once', () => {
    const s = shiftWith(1, [customer({ patience: 1 })]);
    const { state, history } = stepQuiet(s, 200);
    expect(state.queue).toHaveLength(0);
    expect(state.stats.walkouts).toBe(1);
    expect(history.some((h) => h.queue.length === 1 && h.queue[0]?.isLeaving)).toBe(true);
  });
});

describe('spawning', () => {
  it('spawns a customer every 135 steps', () => {
    let s = shiftWith(1, []);
    const rng = createRng(3);
    for (let i = 0; i < 134; i++) s = step(s, rng).state;
    expect(s.queue).toHaveLength(0);
    s = step(s, rng).state;
    expect(s.queue).toHaveLength(1);
    expect(s.spawnTimer).toBe(0);
  });

  it('counts leaving customers toward the queue cap of 5', () => {
    const queue = [0, 1, 2, 3, 4].map((id) => customer({ id, isLeaving: id === 0, x: 0 }));
    const s = { ...shiftWith(1, queue), spawnTimer: 134 };
    const after = step(s, noRandom).state;
    expect(after.queue).toHaveLength(5);
    expect(after.spawnTimer).toBe(0);
  });
});

describe('serveAdvice', () => {
  it('captures an ADVICE front customer with the clerk at the till', () => {
    const s = shiftWith(1, [customer(samplePot)]);
    const { state, events } = serveAdvice(s);
    expect(state.queue).toHaveLength(0);
    expect(state.stats.captured).toBe(55);
    expect(state.dialogue).toBe('CLERK: Completed Sample Pot (1 Tin)! (+\u00a355)');
    expect(state.floaters[0]?.text).toBe('+\u00a355');
    expect(events[0]).toEqual({ type: 'chime' });
  });

  it('skips walking-out customers to find the front', () => {
    const s = shiftWith(1, [customer({ id: 1, isLeaving: true }), customer({ id: 2, ...consultation })]);
    const { state } = serveAdvice(s);
    expect(state.queue.map((c) => c.id)).toEqual([1]);
    expect(state.stats.captured).toBe(45);
  });

  it.each([
    ['a paint order at the front', shiftWith(1, [customer(tinOrder(3))])],
    ['the clerk away', (() => {
      const s = shiftWith(1, [customer(consultation)]);
      return { ...s, clerk: { ...s.clerk, state: 'mixing' as const } };
    })()],
    ['no shift running', { ...shiftWith(1, [customer(consultation)]), shiftActive: false }],
    ['an empty queue', shiftWith(1, [])],
  ])('does nothing with %s', (_, s) => {
    expect(serveAdvice(s)).toEqual({ state: s, events: [] });
  });
});

describe('processMix', () => {
  it('in Round 1 sends the clerk to mix a 10-tin order for 10 s, the till unmanned throughout', () => {
    const s = shiftWith(1, [customer(tinOrder(10))]);
    const mixed = processMix(s);
    expect(mixed.state.stats.captured).toBe(700);
    expect(mixed.state.queue).toHaveLength(0);
    expect(mixed.state.clerk).toMatchObject({ state: 'walking_to_shaker', tinsRemaining: 10, busyTimer: 600 });
    expect(mixed.state.dialogue).toBe('CLERK: Left counter to shake 10 tins (10s). Counter is UNMANNED!');

    const { history, events } = stepQuiet(mixed.state, 900);
    const backAt = history.findIndex((h) => h.clerk.state === 'at_till');
    expect(backAt).toBeGreaterThan(0);
    const away = history.slice(0, backAt);
    expect(away.every((h) => h.clerk.state !== 'at_till')).toBe(true);
    expect(away.filter((h) => h.clerk.state === 'mixing')).toHaveLength(600);
    expect(history[backAt]?.clerk).toMatchObject({ x: 200, y: 72 });
    expect(history[backAt]?.stats.unmannedSeconds).toBeCloseTo((backAt + 1) / 60);
    expect(events.map((e) => e.type)).toEqual(['humStart', 'humStop', 'chime', 'dialogue']);
    expect(history[backAt]?.dialogue).toBe('CLERK: Returned to till. Ready to serve!');
  });

  it('counts down tinsRemaining while mixing', () => {
    const s = shiftWith(1, [customer(tinOrder(3))]);
    const mixing = stepQuiet(processMix(s).state, 200).history.filter((h) => h.clerk.state === 'mixing');
    expect(mixing.map((h) => h.clerk.tinsRemaining)).toEqual(expect.arrayContaining([3, 2, 1]));
    expect(mixing.at(-1)?.clerk.tinsRemaining).toBe(1);
  });

  it('in Round 2 dispatches an order of more than 5 tins to the hub and keeps the clerk at the till', () => {
    const s = shiftWith(2, [customer(tinOrder(6))]);
    const { state, events } = processMix(s);
    expect(state.stats.captured).toBe(420);
    expect(state.stats.hubOrders).toBe(1);
    expect(state.clerk.state).toBe('at_till');
    expect(state.queue).toHaveLength(0);
    expect(state.floaters[0]).toMatchObject({ text: 'HUB SENT! +\u00a3420', kind: 'hub' });
    expect(events[0]).toEqual({ type: 'whoosh' });
    expect(state.dialogue).toBe('\u26a1 Dispatched 6 tins to 2-Hr London Hub! Counter remains staffed.');
  });

  it('in Round 2 still mixes an order of 5 tins on site', () => {
    const s = shiftWith(2, [customer(tinOrder(5))]);
    const { state } = processMix(s);
    expect(state.stats.hubOrders).toBe(0);
    expect(state.clerk).toMatchObject({ state: 'walking_to_shaker', busyMax: 300 });
  });

  it('does nothing for an ADVICE customer or with the clerk away', () => {
    const advice = shiftWith(1, [customer(consultation)]);
    expect(processMix(advice)).toEqual({ state: advice, events: [] });
    const busy = processMix(shiftWith(1, [customer(tinOrder(3)), customer(tinOrder(4))])).state;
    expect(processMix(busy)).toEqual({ state: busy, events: [] });
  });
});

describe('floaters', () => {
  it('rise and fade, then disappear', () => {
    const s = serveAdvice(shiftWith(1, [customer(consultation)])).state;
    const y0 = s.floaters[0]?.y ?? 0;
    const one = stepQuiet(s, 1).state.floaters[0];
    expect(one?.y).toBe(y0 - config.floater.risePerStep);
    expect(one?.alpha).toBeCloseTo(1 - config.floater.fadePerStep);
    expect(stepQuiet(s, 56).state.floaters).toHaveLength(0);
  });
});

describe('round flow', () => {
  it('ends the shift after exactly 1800 steps and reports that round', () => {
    const rng = createRng(11);
    let s = startShift(createInitialState(), 1, rng).state;
    for (let i = 0; i < 1799; i++) {
      const r = step(s, rng);
      expect(r.events.some((e) => e.type === 'roundEnded')).toBe(false);
      s = r.state;
    }
    expect(s.shiftActive).toBe(true);
    expect(shiftSecondsLeft(s)).toBe(1);
    const end = step(s, rng);
    expect(end.state.shiftActive).toBe(false);
    expect(shiftSecondsLeft(end.state)).toBe(0);
    expect(end.events).toContainEqual({ type: 'roundEnded', round: 1, stats: s.stats, round1Stats: null });
    expect(end.events).toContainEqual({ type: 'humStop' });
    expect(end.state.round1Stats).toEqual(s.stats);
  });

  it('runs briefing -> Round 1 -> Round 2 -> comparison -> replay Round 1', () => {
    const rng = createRng(5);
    const briefing = createInitialState();
    const r1 = playShift(continueFromModal(briefing, rng).state, rng);
    expect(r1.result.state.round).toBe(1);
    const round1Stats = r1.result.state.round1Stats;
    expect(round1Stats).not.toBeNull();

    const r2start = continueFromModal(r1.result.state, rng).state;
    expect(r2start.round).toBe(2);
    expect(r2start.round1Stats).toEqual(round1Stats);

    const r2 = playShift(r2start, rng);
    const ended = r2.result.events.find((e) => e.type === 'roundEnded');
    expect(ended).toMatchObject({ round: 2, round1Stats });

    const replay = continueFromModal(r2.result.state, rng).state;
    expect(replay.round).toBe(1);
    expect(replay.round1Stats).toBeNull();
  });
});

describe('seeded replay', () => {
  function summary(stats: Stats) {
    return { ...stats, unmannedSeconds: Math.floor(stats.unmannedSeconds) };
  }

  it('produces identical stats on every run', () => {
    const a = playGame(42);
    const b = playGame(42);
    expect(b.round1.result.state).toEqual(a.round1.result.state);
    expect(b.round2.events).toEqual(a.round2.events);
    expect({
      round1: summary(a.round1.result.state.stats),
      round2: summary(a.round2.result.state.stats),
    }).toMatchSnapshot();
  });

  it('shows the hub model beating in-store mixing for the greedy player', () => {
    const { round1, round2 } = playGame(42);
    expect(round2.result.state.stats.hubOrders).toBeGreaterThan(0);
    expect(round2.result.state.stats.unmannedSeconds).toBeLessThan(round1.result.state.stats.unmannedSeconds);
  });
});
