import { config } from './config';
import { randomInt, type Rng } from './rng';
import type { Customer, CustomerCategory } from './types';

interface Order {
  readonly category: CustomerCategory;
  readonly tins: number;
  readonly val: number;
  readonly name: string;
  readonly bubble: string;
}

function guaranteedTrade(): Order {
  const { guaranteedTradeTins: tins, guaranteedTradeValue: val } = config.orders;
  return { category: 'TRADE_LARGE', tins, val, name: `${tins}x Tins Trade Order`, bubble: `${tins} TINS` };
}

function rollOrder(rng: Rng): Order {
  const roll = rng();
  const { orders } = config;
  if (roll < config.roll.tradeLarge) {
    const tins = randomInt(rng, orders.tradeLarge.tinRange) + orders.tradeLarge.minTins;
    return {
      category: 'TRADE_LARGE',
      tins,
      val: tins * orders.tradeLarge.valuePerTin,
      name: `${tins}x Tins Trade Order`,
      bubble: `${tins} TINS`,
    };
  }
  if (roll < config.roll.mixSmall) {
    const tins = randomInt(rng, orders.mixSmall.tinRange) + orders.mixSmall.minTins;
    return {
      category: 'MIX_SMALL',
      tins,
      val: tins * orders.mixSmall.valuePerTin,
      name: `${tins}x Tins Emulsion`,
      bubble: `${tins} TINS`,
    };
  }
  if (roll < config.roll.consultation) {
    return { category: 'ADVICE', tins: 0, val: orders.consultationValue, name: 'Colour Consultation', bubble: 'ADVICE' };
  }
  return { category: 'ADVICE', tins: 1, val: orders.samplePotValue, name: 'Sample Pot (1 Tin)', bubble: '1 POT' };
}

/** Draws the palette before the order, the same order the original consumes randomness. */
export function createCustomer(id: number, rng: Rng, guaranteed = false): Customer {
  const paletteIndex = randomInt(rng, config.customer.paletteCount);
  const order = guaranteed ? guaranteedTrade() : rollOrder(rng);
  const { spawn } = config.customer;
  return {
    id,
    x: spawn.x,
    y: spawn.y,
    targetX: spawn.x,
    targetY: spawn.y,
    paletteIndex,
    ...order,
    maxPatience: config.patienceSteps,
    patience: config.patienceSteps,
    isLeaving: false,
  };
}
