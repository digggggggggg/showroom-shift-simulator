import { GameCanvas } from './components/GameCanvas';
import { createGameStore, createInitialState } from './game';

const store = createGameStore(createInitialState());

export function App() {
  return (
    <main className="gameboy-frame" aria-label="London Paint Showroom: Shift Simulator">
      <div className="brand-bar">
        <span>LONDON PAINT SHOWROOM</span>
      </div>
      <div className="screen-bezel">
        <div className="canvas-container">
          <GameCanvas store={store} />
        </div>
      </div>
    </main>
  );
}
