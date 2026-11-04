import { frontCustomerIndex, sendsToHub } from './sim';
import type { SimState } from './types';

const GBP = '\u00a3';
const DOT = '\u2022';
const BOLT = '\u26a1';

export interface ActionButton {
  readonly enabled: boolean;
  readonly title: string;
  readonly subtitle: string;
}

export interface MixButton extends ActionButton {
  readonly variant: 'mix' | 'hub';
}

export interface ActionButtons {
  readonly advice: ActionButton;
  readonly mix: MixButton;
}

function buttons(advice: [string, string], mix: [string, string], opts: Partial<{ advice: boolean; mix: boolean; hub: boolean }> = {}): ActionButtons {
  return {
    advice: { enabled: opts.advice ?? false, title: advice[0], subtitle: advice[1] },
    mix: { enabled: opts.mix ?? false, title: mix[0], subtitle: mix[1], variant: opts.hub ? 'hub' : 'mix' },
  };
}

/** The two till buttons, with the original's labels for every situation. */
export function deriveActionButtons(state: SimState): ActionButtons {
  if (!state.shiftActive) {
    return buttons(['CONSULT / SAMPLE', '[KEY: 1]'], ['MIX ORDER', '[KEY: 2 / SPACE]']);
  }
  if (state.clerk.state !== 'at_till') {
    return buttons(
      ['TILL UNMANNED', 'Associate mixing paint!'],
      [`MIXING (${state.clerk.tinsRemaining}s)`, 'Shaker locked in back'],
    );
  }
  const front = state.queue[frontCustomerIndex(state)];
  if (!front) {
    return buttons(['WAITING...', 'Queue clear'], ['STAND BY', 'Ready at counter']);
  }
  if (front.category === 'ADVICE') {
    return buttons(
      [front.tins === 1 ? 'SERVE SAMPLE POT' : 'COLOUR ADVICE', `[KEY: 1] ${DOT} +${GBP}${front.val}`],
      ['MIX ORDER', 'Not requested'],
      { advice: true },
    );
  }
  const { tins, val } = front;
  const advice: [string, string] = ['CONSULT / SAMPLE', 'Wants paint order'];
  if (sendsToHub(state.round, tins)) {
    return buttons(
      advice,
      [`${BOLT} DISPATCH ${tins} TINS TO HUB`, `[KEY: 2 / SPACE] ${DOT} 1.5s Off-Site (+${GBP}${val})`],
      { mix: true, hub: true },
    );
  }
  return buttons(
    advice,
    [`MIX ${tins} TINS ON-SITE`, `[KEY: 2 / SPACE] ${DOT} Locks till ${tins}s (+${GBP}${val})`],
    { mix: true },
  );
}
