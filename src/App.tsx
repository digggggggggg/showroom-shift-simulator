import { useCallback, useMemo, useRef } from 'react';
import { ActionButtons } from './components/ActionButtons';
import { BrandBar } from './components/BrandBar';
import { DialogueBox } from './components/DialogueBox';
import { GameCanvas } from './components/GameCanvas';
import { KpiRow } from './components/KpiRow';
import { RoundModal } from './components/RoundModal';
import { SubStatusBar } from './components/SubStatusBar';
import { continueFromModal, createGameStore, createInitialState, createRng, deriveActionButtons, processMix, serveAdvice, type GameStore, type Rng } from './game';
import { useActionKeys } from './hooks/useActionKeys';
import { useSound } from './hooks/useSound';
import { useGameState } from './hooks/useGameState';
import './styles/hud.css';

const defaultStore = createGameStore(createInitialState());

export function App({ store = defaultStore, rng }: { readonly store?: GameStore; readonly rng?: Rng }) {
  const state = useGameState(store);
  const sound = useSound(store);
  const rngRef = useRef<Rng | null>(rng ?? null);
  const buttons = useMemo(() => deriveActionButtons(state), [state]);

  const onAdvice = useCallback(() => {
    if (!deriveActionButtons(store.getState()).advice.enabled) return;
    const result = serveAdvice(store.getState());
    store.setState(result.state);
    store.emit(result.events);
  }, [store]);
  const onMix = useCallback(() => {
    if (!deriveActionButtons(store.getState()).mix.enabled) return;
    const result = processMix(store.getState());
    store.setState(result.state);
    store.emit(result.events);
  }, [store]);

  const onModalAction = useCallback(() => {
    rngRef.current ??= createRng(Date.now());
    const result = continueFromModal(store.getState(), rngRef.current);
    store.setState(result.state);
    store.emit(result.events);
  }, [store]);

  useActionKeys({ active: state.shiftActive, onAdvice, onMix });

  return (
    <main className="gameboy-frame" aria-label="London Paint Showroom: Shift Simulator">
      <BrandBar muted={sound.muted} onToggleMute={sound.toggleMute} />
      <div className="screen-bezel">
        <SubStatusBar state={state} />
        <div className="canvas-container">
          <GameCanvas store={store} />
          <RoundModal state={state} onAction={onModalAction} />
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
