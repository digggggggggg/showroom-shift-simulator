import { deriveActionButtons } from './buttons';
import { createInitialState, processMix } from './sim';
import { consultation, customer, samplePot, shiftWith, tinOrder } from './test/fixtures';

describe('deriveActionButtons', () => {
  it('with no shift running', () => {
    expect(deriveActionButtons(createInitialState())).toEqual({
      advice: { enabled: false, title: 'CONSULT / SAMPLE', subtitle: '[KEY: 1]' },
      mix: { enabled: false, title: 'MIX ORDER', subtitle: '[KEY: 2 / SPACE]', variant: 'mix' },
    });
  });

  it('with the clerk away mixing', () => {
    const away = processMix(shiftWith(1, [customer(tinOrder(4))])).state;
    expect(deriveActionButtons(away)).toEqual({
      advice: { enabled: false, title: 'TILL UNMANNED', subtitle: 'Associate mixing paint!' },
      mix: { enabled: false, title: 'MIXING (4s)', subtitle: 'Shaker locked in back', variant: 'mix' },
    });
  });

  it('with an empty queue, or only walkouts', () => {
    const expected = {
      advice: { enabled: false, title: 'WAITING...', subtitle: 'Queue clear' },
      mix: { enabled: false, title: 'STAND BY', subtitle: 'Ready at counter', variant: 'mix' },
    };
    expect(deriveActionButtons(shiftWith(1, []))).toEqual(expected);
    expect(deriveActionButtons(shiftWith(1, [customer({ isLeaving: true })]))).toEqual(expected);
  });

  it('with an advice customer', () => {
    expect(deriveActionButtons(shiftWith(1, [customer(consultation)]))).toEqual({
      advice: { enabled: true, title: 'COLOUR ADVICE', subtitle: '[KEY: 1] \u2022 +\u00a345' },
      mix: { enabled: false, title: 'MIX ORDER', subtitle: 'Not requested', variant: 'mix' },
    });
    expect(deriveActionButtons(shiftWith(1, [customer(samplePot)])).advice).toEqual({
      enabled: true,
      title: 'SERVE SAMPLE POT',
      subtitle: '[KEY: 1] \u2022 +\u00a355',
    });
  });

  it('with a small mix order', () => {
    expect(deriveActionButtons(shiftWith(2, [customer(tinOrder(5))]))).toEqual({
      advice: { enabled: false, title: 'CONSULT / SAMPLE', subtitle: 'Wants paint order' },
      mix: { enabled: true, title: 'MIX 5 TINS ON-SITE', subtitle: '[KEY: 2 / SPACE] \u2022 Locks till 5s (+\u00a3300)', variant: 'mix' },
    });
  });

  it('with a large order in Round 1, mixed on site', () => {
    expect(deriveActionButtons(shiftWith(1, [customer(tinOrder(10))])).mix).toEqual({
      enabled: true,
      title: 'MIX 10 TINS ON-SITE',
      subtitle: '[KEY: 2 / SPACE] \u2022 Locks till 10s (+\u00a3700)',
      variant: 'mix',
    });
  });

  it('with a Round 2 hub order', () => {
    expect(deriveActionButtons(shiftWith(2, [customer(tinOrder(8))])).mix).toEqual({
      enabled: true,
      title: '\u26a1 DISPATCH 8 TINS TO HUB',
      subtitle: '[KEY: 2 / SPACE] \u2022 1.5s Off-Site (+\u00a3560)',
      variant: 'hub',
    });
  });
});
