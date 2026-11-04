/** Every tuning number of the sim, with the original's values (docs/adr/0001). */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export const STEPS_PER_SECOND = 60;

export const config = {
  shiftSeconds: 30,
  shiftSteps: 30 * STEPS_PER_SECOND,

  spawnIntervalSteps: 135,
  /** Leaving customers still occupy the queue for this cap, as in the original. */
  maxQueueLength: 5,

  patienceSteps: 660,
  drainAtTill: 1.0,
  drainUnmanned: 1.8,

  stepsPerTin: STEPS_PER_SECOND,
  /** Round 2 dispatches orders with strictly more tins than this to the hub. */
  hubThresholdTins: 5,

  clerk: {
    speed: 2.4,
    home: { x: 200, y: 72 } as Point,
    shaker: { x: 74, y: 42 } as Point,
  },

  customer: {
    speed: 2.2,
    spawn: { x: -24, y: 148 } as Point,
    exit: { x: -32, y: 220 } as Point,
    /** A leaving customer is removed once its x is at or below this. */
    removeAtX: -28,
    paletteCount: 5,
  },

  queueSlots: [
    { x: 196, y: 148 },
    { x: 160, y: 148 },
    { x: 124, y: 148 },
    { x: 88, y: 148 },
    { x: 52, y: 148 },
    { x: 16, y: 148 },
  ] as readonly Point[],

  /** Cumulative roll thresholds for a spawned customer's category. */
  roll: {
    tradeLarge: 0.35,
    mixSmall: 0.6,
    consultation: 0.82,
  },
  orders: {
    tradeLarge: { minTins: 6, tinRange: 5, valuePerTin: 70 },
    mixSmall: { minTins: 2, tinRange: 4, valuePerTin: 60 },
    consultationValue: 45,
    samplePotValue: 55,
    guaranteedTradeTins: 10,
    guaranteedTradeValue: 700,
  },

  floater: {
    offsetY: -20,
    risePerStep: 0.5,
    fadePerStep: 0.018,
  },
} as const;
