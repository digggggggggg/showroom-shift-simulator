import { useCallback, useMemo } from 'react';
import { ActionButtons } from './components/ActionButtons';
import { BrandBar } from './components/BrandBar';
import { DialogueBox } from './components/DialogueBox';
import { GameCanvas } from './components/GameCanvas';
import { KpiRow } from './components/KpiRow';
import { SubStatusBar } from './components/SubStatusBar';
import { createGameStore, createInitialState, deriveActionButtons, processMix, serveAdvice, type GameStore } from './game';
import { useActionKeys } from './hooks/useActionKeys';
import { useGameState } from './hooks/useGameState';
import './styles/hud.css';

const defaultStore = createGameStore(createInitialState());

export function App({ store = defaultStore }: { readonly store?: GameStore }) {
  const state = useGameState(store);
  const buttons = useMemo(() => deriveActionButtons(state), [state]);

  const onAdvice = useCallback(() => {
    if (deriveActionButtons(store.getState()).advice.enabled) store.setState(serveAdvice(store.getState()).state);
  }, [store]);
  const onMix = useCallback(() => {
    if (deriveActionButtons(store.getState()).mix.enabled) store.setState(processMix(store.getState()).state);
  }, [store]);

  useActionKeys({ active: state.shiftActive, onAdvice, onMix });

  return (
    <main className="gameboy-frame" aria-label="London Paint Showroom: Shift Simulator">
      <BrandBar />
      <div className="screen-bezel">
        <SubStatusBar state={state} />
        <div className="canvas-container">
          <GameCanvas store={store} />
        </div>
        <DialogueBox text={state.dialogue} />
      </div>
      <div className="controls-panel">
        <ActionButtons buttons={buttons} onAdvice={onAdvice} onMix={onMix} />
        <KpiRow stats={state.stats} />
      </div>
    </main>
  );
}
