import { useCallback, useMemo, useRef } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FONT_FAMILY, render, type GameStore } from '../game';
import { useGameLoop } from '../hooks/useGameLoop';

interface Props {
  readonly store: GameStore;
}

export function GameCanvas({ store }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const ready = useMemo(
    () => (typeof document !== 'undefined' && document.fonts ? document.fonts.load(`8px ${FONT_FAMILY}`) : Promise.resolve()),
    [],
  );

  const onFrame = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    // Visual-only wobble; deliberately not drawn from the sim RNG.
    render(ctx, store.getState(), { shakerJitter: (Math.random() - 0.5) * 2 });
  }, [store]);

  useGameLoop(store, { onFrame, ready });

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      aria-label="Showroom floor"
      role="img"
    />
  );
}
