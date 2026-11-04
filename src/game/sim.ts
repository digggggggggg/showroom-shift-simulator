import { config, STEPS_PER_SECOND, type Point } from './config';
import { createCustomer } from './customer';
import type { Rng } from './rng';
import type { Clerk, Customer, Floater, FloaterKind, Round, SimEvent, SimResult, SimState, Stats } from './types';

const GBP = '\u00a3';
const BOLT = '\u26a1';

const zeroStats: Stats = { captured: 0, lost: 0, walkouts: 0, unmannedSeconds: 0, hubOrders: 0 };

const homeClerk: Clerk = {
  x: config.clerk.home.x,
  y: config.clerk.home.y,
  state: 'at_till',
  tinsRemaining: 0,
  busyTimer: 0,
  busyMax: 0,
};

export function createInitialState(): SimState {
  return {
    round: 1,
    shiftActive: false,
    framesLeft: config.shiftSteps,
    spawnTimer: 0,
    nextCustomerId: 0,
    queue: [],
    floaters: [],
    clerk: homeClerk,
    stats: zeroStats,
    round1Stats: null,
    dialogue: 'CLERK: Ready for shift. Customer approaching till.',
  };
}

export function shiftSecondsLeft(state: SimState): number {
  return Math.max(0, Math.ceil(state.framesLeft / STEPS_PER_SECOND));
}

/** The front customer is the first one not walking out, as in the original. */
export function frontCustomerIndex(state: SimState): number {
  return state.queue.findIndex((c) => !c.isLeaving);
}

export function sendsToHub(round: Round, tins: number): boolean {
  return round === 2 && tins > config.hubThresholdTins;
}

function moveToward(x: number, y: number, target: Point, speed: number): { x: number; y: number; arrived: boolean } {
  const dx = target.x - x;
  const dy = target.y - y;
  const dist = Math.hypot(dx, dy);
  if (dist > speed) {
    return { x: x + (dx / dist) * speed, y: y + (dy / dist) * speed, arrived: false };
  }
  return { x: target.x, y: target.y, arrived: true };
}

function floater(at: Customer, text: string, kind: FloaterKind): Floater {
  return { x: at.x, y: at.y + config.floater.offsetY, text, kind, alpha: 1.0 };
}

function dialogue(text: string): SimEvent {
  return { type: 'dialogue', text };
}

export function startShift(state: SimState, round: Round, rng: Rng): SimResult {
  const text =
    round === 1
      ? 'SHIFT STARTED: Customer at till needs 10 tins of paint!'
      : 'SHIFT STARTED: Orders >5 tins can be dispatched to the London Hub!';
  const seeded = createCustomer(state.nextCustomerId, rng, true);
  return {
    state: {
      round,
      shiftActive: true,
      framesLeft: config.shiftSteps,
      spawnTimer: 0,
      nextCustomerId: state.nextCustomerId + 1,
      queue: [seeded],
      floaters: [],
      clerk: homeClerk,
      stats: zeroStats,
      round1Stats: round === 1 ? null : state.round1Stats,
      dialogue: text,
    },
    events: [{ type: 'humStop' }, dialogue(text)],
  };
}

/** The modal's single button: briefing -> Round 1, bottleneck report -> Round 2, comparison -> replay Round 1. */
export function continueFromModal(state: SimState, rng: Rng): SimResult {
  if (state.round === 1 && state.round1Stats !== null) return startShift(state, 2, rng);
  return startShift(state, 1, rng);
}

function endRound(state: SimState): SimResult {
  const round1Stats = state.round === 1 ? state.stats : state.round1Stats;
  return {
    state: { ...state, shiftActive: false, framesLeft: 0, round1Stats },
    events: [
      { type: 'humStop' },
      { type: 'roundEnded', round: state.round, stats: state.stats, round1Stats: state.round === 2 ? round1Stats : null },
    ],
  };
}

export function step(state: SimState, rng: Rng): SimResult {
  if (!state.shiftActive) return { state, events: [] };

  const framesLeft = state.framesLeft - 1;
  if (framesLeft <= 0) return endRound({ ...state, framesLeft });

  const events: SimEvent[] = [];
  let { stats, dialogue: text, nextCustomerId } = state;
  let floaters: Floater[] = [...state.floaters];

  let spawnTimer = state.spawnTimer + 1;
  let queue: Customer[] = [...state.queue];
  if (spawnTimer >= config.spawnIntervalSteps) {
    spawnTimer = 0;
    if (queue.length < config.maxQueueLength) {
      queue.push(createCustomer(nextCustomerId, rng));
      nextCustomerId += 1;
    }
  }

  const drain = state.clerk.state !== 'at_till' ? config.drainUnmanned : config.drainAtTill;
  queue = queue.map((cust, i) => {
    const slot = config.queueSlots[Math.min(i, config.queueSlots.length - 1)] as Point;
    const target = cust.isLeaving ? { x: cust.targetX, y: cust.targetY } : slot;
    const moved = moveToward(cust.x, cust.y, target, config.customer.speed);
    const next: Customer = { ...cust, x: moved.x, y: moved.y, targetX: target.x, targetY: target.y };
    if (next.isLeaving) return next;

    const patience = next.patience - drain;
    if (patience > 0) return { ...next, patience };

    const { exit } = config.customer;
    stats = { ...stats, lost: stats.lost + next.val, walkouts: stats.walkouts + 1 };
    text = `WALKOUT: Customer left! "Nobody is serving at the till!" (-${GBP}${next.val})`;
    floaters.push(floater(next, `-${GBP}${next.val}`, 'loss'));
    events.push({ type: 'coins' }, dialogue(text));
    return { ...next, patience, isLeaving: true, targetX: exit.x, targetY: exit.y };
  });
  queue = queue.filter((c) => !(c.isLeaving && c.x <= config.customer.removeAtX));

  let clerk = state.clerk;
  if (clerk.state !== 'at_till') {
    stats = { ...stats, unmannedSeconds: stats.unmannedSeconds + 1 / STEPS_PER_SECOND };
  }
  if (clerk.state === 'walking_to_shaker') {
    const moved = moveToward(clerk.x, clerk.y, config.clerk.shaker, config.clerk.speed);
    clerk = { ...clerk, x: moved.x, y: moved.y };
    if (moved.arrived) {
      clerk = { ...clerk, state: 'mixing' };
      events.push({ type: 'humStart' });
    }
  } else if (clerk.state === 'mixing') {
    const busyTimer = clerk.busyTimer - 1;
    clerk = { ...clerk, busyTimer, tinsRemaining: Math.max(1, Math.ceil(busyTimer / STEPS_PER_SECOND)) };
    if (busyTimer <= 0) {
      clerk = { ...clerk, state: 'walking_to_till' };
      events.push({ type: 'humStop' });
    }
  } else if (clerk.state === 'walking_to_till') {
    const moved = moveToward(clerk.x, clerk.y, config.clerk.home, config.clerk.speed);
    clerk = { ...clerk, x: moved.x, y: moved.y };
    if (moved.arrived) {
      clerk = { ...clerk, state: 'at_till' };
      text = 'CLERK: Returned to till. Ready to serve!';
      events.push({ type: 'chime' }, dialogue(text));
    }
  }

  floaters = floaters
    .map((f) => ({ ...f, y: f.y - config.floater.risePerStep, alpha: f.alpha - config.floater.fadePerStep }))
    .filter((f) => f.alpha > 0);

  return {
    state: { ...state, framesLeft, spawnTimer, nextCustomerId, queue, floaters, clerk, stats, dialogue: text },
    events,
  };
}

function actionable(state: SimState): { index: number; cust: Customer } | null {
  if (!state.shiftActive || state.clerk.state !== 'at_till') return null;
  const index = frontCustomerIndex(state);
  const cust = state.queue[index];
  return cust ? { index, cust } : null;
}

function without(queue: readonly Customer[], index: number): Customer[] {
  return queue.filter((_, i) => i !== index);
}

export function serveAdvice(state: SimState): SimResult {
  const front = actionable(state);
  if (!front || front.cust.category !== 'ADVICE') return { state, events: [] };
  const { cust, index } = front;
  const text = `CLERK: Completed ${cust.name}! (+${GBP}${cust.val})`;
  return {
    state: {
      ...state,
      stats: { ...state.stats, captured: state.stats.captured + cust.val },
      floaters: [...state.floaters, floater(cust, `+${GBP}${cust.val}`, 'gain')],
      queue: without(state.queue, index),
      dialogue: text,
    },
    events: [{ type: 'chime' }, dialogue(text)],
  };
}

export function processMix(state: SimState): SimResult {
  const front = actionable(state);
  if (!front || front.cust.category === 'ADVICE') return { state, events: [] };
  const { cust, index } = front;
  const { tins } = cust;
  const queue = without(state.queue, index);

  if (sendsToHub(state.round, tins)) {
    const text = `${BOLT} Dispatched ${tins} tins to 2-Hr London Hub! Counter remains staffed.`;
    return {
      state: {
        ...state,
        stats: { ...state.stats, captured: state.stats.captured + cust.val, hubOrders: state.stats.hubOrders + 1 },
        floaters: [...state.floaters, floater(cust, `HUB SENT! +${GBP}${cust.val}`, 'hub')],
        queue,
        dialogue: text,
      },
      events: [{ type: 'whoosh' }, dialogue(text)],
    };
  }

  const busyMax = tins * config.stepsPerTin;
  const text = `CLERK: Left counter to shake ${tins} tins (${tins}s). Counter is UNMANNED!`;
  return {
    state: {
      ...state,
      stats: { ...state.stats, captured: state.stats.captured + cust.val },
      clerk: { ...state.clerk, state: 'walking_to_shaker', tinsRemaining: tins, busyMax, busyTimer: busyMax },
      queue,
      dialogue: text,
    },
    events: [dialogue(text)],
  };
}
