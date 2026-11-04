import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createGameStore, createInitialState, type GameStore, type SimState } from './game';
import { consultation, customer, shiftWith, tinOrder } from './game/test/fixtures';
import { processMix } from './game';

function renderWith(state: SimState): GameStore {
  const store = createGameStore(state);
  render(<App store={store} />);
  return store;
}

const adviceBtn = () => screen.getByRole('button', { name: /CONSULT|COLOUR ADVICE|SAMPLE POT|TILL UNMANNED|WAITING/ });
const mixBtn = () => screen.getByRole('button', { name: /MIX|DISPATCH|MIXING|STAND BY/ });

describe('App shell', () => {
  it('renders the handheld frame, brand, round tag and timer', () => {
    renderWith(createInitialState());
    expect(screen.getByRole('main', { name: 'London Paint Showroom: Shift Simulator' })).toBeInTheDocument();
    expect(screen.getByText('LONDON PAINT SHOWROOM')).toBeInTheDocument();
    expect(screen.getByText('ROUND 1: IN-STORE MIXING')).toBeInTheDocument();
    expect(screen.getByText('SHIFT: 30s')).toBeInTheDocument();
  });

  it('shows the round 2 tag', () => {
    renderWith(shiftWith(2, []));
    expect(screen.getByText('ROUND 2: 2-HR LONDON HUB')).toBeInTheDocument();
  });

  it('marks the dialogue as a polite live region', () => {
    renderWith(createInitialState());
    expect(screen.getByText('CLERK: Ready for shift. Customer approaching till.')).toHaveAttribute('aria-live', 'polite');
  });

  it('before the first shift: default labels, both buttons disabled, keys inert', async () => {
    const store = renderWith(createInitialState());
    expect(adviceBtn()).toBeDisabled();
    expect(mixBtn()).toBeDisabled();
    expect(screen.getByText('[KEY: 1]')).toBeInTheDocument();
    expect(screen.getByText('[KEY: 2 / SPACE]')).toBeInTheDocument();
    const before = store.getState();
    await userEvent.keyboard('1 2');
    expect(store.getState()).toBe(before);
  });

  it('clerk away: TILL UNMANNED / MIXING Ns', () => {
    renderWith(processMix(shiftWith(1, [customer(tinOrder(4))])).state);
    expect(screen.getByText('TILL UNMANNED')).toBeInTheDocument();
    expect(screen.getByText('Associate mixing paint!')).toBeInTheDocument();
    expect(screen.getByText('MIXING (4s)')).toBeInTheDocument();
    expect(adviceBtn()).toBeDisabled();
    expect(mixBtn()).toBeDisabled();
  });

  it('queue empty: WAITING / STAND BY', () => {
    renderWith(shiftWith(1, []));
    expect(screen.getByText('WAITING...')).toBeInTheDocument();
    expect(screen.getByText('STAND BY')).toBeInTheDocument();
    expect(adviceBtn()).toBeDisabled();
  });

  it('after the shift ends: default labels, disabled', () => {
    renderWith({ ...shiftWith(1, [customer(tinOrder(3))]), shiftActive: false });
    expect(screen.getByText('MIX ORDER')).toBeInTheDocument();
    expect(adviceBtn()).toBeDisabled();
    expect(mixBtn()).toBeDisabled();
  });

  it('shows the hub variant label for a large round 2 order', () => {
    renderWith(shiftWith(2, [customer(tinOrder(8))]));
    expect(screen.getByText(/DISPATCH 8 TINS TO HUB/)).toBeInTheDocument();
    expect(mixBtn()).toBeEnabled();
  });

  it('KPIs show pound values and floored unmanned seconds', () => {
    const base = shiftWith(1, []);
    renderWith({ ...base, stats: { captured: 240, lost: 130, walkouts: 2, unmannedSeconds: 3.9, hubOrders: 2 } });
    expect(screen.getByText('£240')).toBeInTheDocument();
    expect(screen.getByText('£130')).toBeInTheDocument();
    expect(screen.getByText('3s')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    for (const label of ['CAPTURED', 'WALKOUTS', 'UNMANNED', 'HUB ORDERS']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe('App actions', () => {
  it('clicking advice serves the advice customer', async () => {
    const store = renderWith(shiftWith(1, [customer(consultation)]));
    expect(screen.getByText('COLOUR ADVICE')).toBeInTheDocument();
    await userEvent.click(adviceBtn());
    expect(store.getState().stats.captured).toBe(45);
    expect(store.getState().queue).toHaveLength(0);
  });

  it('clicking mix sends the clerk to the shaker', async () => {
    const store = renderWith(shiftWith(1, [customer(tinOrder(3))]));
    await userEvent.click(mixBtn());
    expect(store.getState().clerk.state).toBe('walking_to_shaker');
  });

  it('key 1 serves advice only when enabled', async () => {
    const store = renderWith(shiftWith(1, [customer(tinOrder(3))]));
    await userEvent.keyboard('1');
    expect(store.getState().queue).toHaveLength(1);
    expect(store.getState().stats.captured).toBe(0);
  });

  it('key 1 serves an advice customer', async () => {
    const store = renderWith(shiftWith(1, [customer(consultation)]));
    await userEvent.keyboard('1');
    expect(store.getState().stats.captured).toBe(45);
  });

  it.each(['2', ' '])('key %j processes the mix and is default-prevented', (key) => {
    const store = renderWith(shiftWith(1, [customer(tinOrder(3))]));
    const event = new KeyboardEvent('keydown', { key, code: key === ' ' ? 'Space' : 'Digit2', cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(store.getState().clerk.state).toBe('walking_to_shaker');
  });

  it('keys 2 and Space do not mix an advice customer', async () => {
    const store = renderWith(shiftWith(1, [customer(consultation)]));
    await userEvent.keyboard('2 ');
    expect(store.getState().queue).toHaveLength(1);
    expect(store.getState().stats.captured).toBe(0);
  });

  it('Space with the mix button focused dispatches once, not twice', async () => {
    const store = renderWith(shiftWith(1, [customer(tinOrder(2)), customer(tinOrder(2))]));
    mixBtn().focus();
    await userEvent.keyboard(' ');
    expect(store.getState().queue).toHaveLength(1);
  });
});
