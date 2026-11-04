import { createLoopDriver, MAX_FRAME_MS, STEP_MS } from './loop';

function stepsOver(seconds: number, hz: number): number {
  const driver = createLoopDriver();
  const dt = 1000 / hz;
  let total = 0;
  for (let t = 0; t <= seconds * 1000 + 1e-6; t += dt) total += driver.frame(t, false);
  return total;
}

describe('loop driver', () => {
  it('advances the same number of steps per second at 60 Hz and 120 Hz', () => {
    expect(stepsOver(10, 60)).toBe(600);
    expect(stepsOver(10, 120)).toBe(600);
  });

  it('runs no steps on the first frame', () => {
    expect(createLoopDriver().frame(5000, false)).toBe(0);
  });

  it('caps a 10 s gap at 250 ms of game time', () => {
    const driver = createLoopDriver();
    driver.frame(0, false);
    expect(driver.frame(10_000, false)).toBe(Math.round(MAX_FRAME_MS / STEP_MS));
  });

  it('does not advance while hidden and does not catch up afterwards', () => {
    const driver = createLoopDriver();
    driver.frame(0, false);
    expect(driver.frame(1000, true)).toBe(0);
    expect(driver.frame(60_000, true)).toBe(0);
    expect(driver.frame(60_000, false)).toBe(0);
    expect(driver.frame(60_000 + STEP_MS * 3, false)).toBe(3);
  });
});
