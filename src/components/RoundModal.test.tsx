import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { App } from '../App';
import { createGameStore, createInitialState, createRng, step, type GameStore, type Stats } from '../game';
import { modalPhase } from './RoundModal';

const r1: Stats = { captured: 240, lost: 130, walkouts: 2, unmannedSeconds: 12.7, hubOrders: 0 };
const r2: Stats = { captured: 610, lost: 20, walkouts: 1, unmannedSeconds: 2, hubOrders: 3 };

function setup(): GameStore {
  const store = createGameStore(createInitialState());
  render(<App store={store} rng={createRng(3)} />);
  return store;
}

/** Ends the running round with the given stats by letting the sim's own last step run. */
function finishRound(store: GameStore, stats: Stats): void {
  act(() => {
    store.setState(step({ ...store.getState(), stats, framesLeft: 1 }, createRng(1)).state);
  });
}

const dialog = () => screen.getByRole('dialog');
const action = () => within(dialog()).getByRole('button');

describe('RoundModal flow', () => {
  it('walks briefing -> round 1 -> report -> round 2 -> comparison -> replay', async () => {
    const store = setup();

    expect(dialog()).toHaveAccessibleName('ROUND 1: IN-STORE BOTTLENECK');
    expect(screen.getByText(/on-site at 1s per tin/)).toBeInTheDocument();
    expect(action()).toHaveTextContent('START ROUND 1 (30s)');
    await userEvent.click(action());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(store.getState()).toMatchObject({ round: 1, shiftActive: true });

    finishRound(store, r1);
    expect(dialog()).toHaveAccessibleName('ROUND 1: BOTTLENECK REPORT');
    expect(within(dialog()).getByText('\u00A3240')).toBeInTheDocument();
    expect(within(dialog()).getByText('\u00A3130')).toBeInTheDocument();
    expect(within(dialog()).getByText('2 customers')).toBeInTheDocument();
    expect(within(dialog()).getByText('12s / 30s')).toBeInTheDocument();
    expect(action()).toHaveTextContent('START ROUND 2 (HUB MODEL)');
    await userEvent.click(action());
    expect(store.getState()).toMatchObject({ round: 2, shiftActive: true });
    expect(store.getState().round1Stats).toEqual(r1);

    finishRound(store, r2);
    expect(dialog()).toHaveAccessibleName('EXECUTIVE COMPARISON REPORT');
    const d = dialog();
    expect(within(d).getByText('R1 Sales:').textContent).toBe('R1 Sales: \u00A3240');
    expect(within(d).getByText('R2 Sales:').textContent).toBe('R2 Sales: \u00A3610');
    expect(within(d).getByText('R1 Lost:').textContent).toBe('R1 Lost: \u00A3130');
    expect(within(d).getByText('R2 Lost:').textContent).toBe('R2 Lost: \u00A320');
    expect(within(d).getByText('R1 Walkouts:').textContent).toBe('R1 Walkouts: 2');
    expect(within(d).getByText('R2 Walkouts:').textContent).toBe('R2 Walkouts: 1');
    expect(within(d).getByText('Key Takeaway:')).toBeInTheDocument();
    expect(action()).toHaveTextContent('REPLAY SIMULATION');

    await userEvent.click(action());
    expect(store.getState()).toMatchObject({ round: 1, shiftActive: true, round1Stats: null });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a modal dialog scoped to the canvas container', () => {
    setup();
    expect(dialog()).toHaveAttribute('aria-modal', 'true');
    expect(dialog().closest('.canvas-container')).not.toBeNull();
  });
});

describe('RoundModal focus', () => {
  it('focuses the action button on open and at every later modal', async () => {
    const store = setup();
    expect(action()).toHaveFocus();
    await userEvent.click(action());
    finishRound(store, r1);
    expect(action()).toHaveFocus();
    await userEvent.click(action());
    finishRound(store, r2);
    expect(action()).toHaveFocus();
  });

  it('Tab and Shift+Tab keep focus inside the dialog', async () => {
    setup();
    await userEvent.tab();
    expect(action()).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(action()).toHaveFocus();
  });

  it('Enter activates the action', async () => {
    const store = setup();
    await userEvent.keyboard('{Enter}');
    expect(store.getState().shiftActive).toBe(true);
  });
});

describe('modalPhase', () => {
  it('is null while a shift runs', () => {
    expect(modalPhase({ ...createInitialState(), shiftActive: true })).toBeNull();
  });
});
