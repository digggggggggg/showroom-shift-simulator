import { palette } from './palette';
import type { Customer, FloaterKind, SimState } from './types';

export const CANVAS_WIDTH = 320;
export const CANVAS_HEIGHT = 288;
export const FONT_FAMILY = '"Press Start 2P"';

/** Presentation-only inputs; kept out of SimState so the sim RNG is never touched. */
export interface RenderView {
  /** Horizontal shaker wobble in pixels while the clerk is mixing. */
  readonly shakerJitter: number;
}

const floaterColour: Record<FloaterKind, string> = {
  gain: palette.good,
  loss: palette.bad,
  hub: palette.info,
};

function font(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.font = `${size}px ${FONT_FAMILY}`;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string): void {
  ctx.fillStyle = col;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function plant(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, x + 3, y + 10, 10, 8, palette.plantPot);
  px(ctx, x, y, 16, 10, palette.plantLeaf);
  px(ctx, x + 3, y - 2, 10, 5, palette.plantTip);
}

export function renderMartEnvironment(ctx: CanvasRenderingContext2D, state: SimState, view: RenderView): void {
  for (let r = 0; r < 18; r++) {
    for (let c = 0; c < 20; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? palette.floorLight : palette.floorDark;
      ctx.fillRect(c * 16, r * 16, 16, 16);
    }
  }

  px(ctx, 0, 0, 320, 52, palette.wall);
  px(ctx, 0, 48, 320, 4, palette.wallTrim);

  px(ctx, 140, 10, 18, 22, palette.windowFrame);
  px(ctx, 142, 12, 14, 18, palette.windowPane);
  px(ctx, 164, 10, 18, 22, palette.windowFrame);
  px(ctx, 166, 12, 14, 18, palette.windowPane);

  px(ctx, 194, 8, 116, 40, palette.shelfFrame);
  px(ctx, 196, 10, 112, 36, palette.shelfBack);
  px(ctx, 196, 22, 112, 2, palette.shelfFrame);
  for (let i = 0; i < 6; i++) {
    px(ctx, 204 + i * 18, 13, 6, 8, palette.tinRed);
    px(ctx, 205 + i * 18, 11, 4, 2, palette.tinLid);
    px(ctx, 204 + i * 18, 26, 7, 7, palette.tinLid);
    px(ctx, 204 + i * 18, 26, 7, 4, palette.tinRed);
    px(ctx, 206 + i * 18, 29, 3, 2, palette.ink);
  }

  px(ctx, 44, 24, 68, 30, palette.shakerBody);
  px(ctx, 44, 50, 68, 4, palette.shakerBase);
  px(ctx, 50, 12, 8, 12, palette.canRed);
  px(ctx, 62, 12, 8, 12, palette.canTeal);
  px(ctx, 74, 12, 8, 12, palette.canBlue);

  const mixing = state.clerk.state === 'mixing';
  const jitter = mixing ? view.shakerJitter : 0;
  px(ctx, 86 + jitter, 14, 22, 22, palette.shakerDrum);
  px(ctx, 88 + jitter, 18, 18, 14, palette.shakerSlot);
  if (mixing) px(ctx, 94 + jitter, 21, 6, 8, palette.tinRed);
  ctx.fillStyle = palette.ink;
  font(ctx, 5);
  ctx.fillText('SHAKER', 54, 60);

  px(ctx, 180, 84, 130, 48, palette.counter);
  px(ctx, 180, 84, 130, 5, palette.counterTop);
  px(ctx, 180, 128, 130, 4, palette.counterShade);
  px(ctx, 180, 84, 18, 48, palette.counterCorner);

  px(ctx, 194, 92, 18, 16, palette.till);
  px(ctx, 196, 94, 14, 6, palette.tillScreen);
  px(ctx, 196, 102, 14, 5, palette.tillBase);

  plant(ctx, 12, 84);
  plant(ctx, 12, 210);

  px(ctx, 190, 220, 120, 36, palette.rug);
  palette.swatches.forEach((colour, s) => {
    px(ctx, 198 + s * 22, 226, 16, 24, colour);
  });
}

function shadow(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 12, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawClerk(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  shadow(ctx);
  px(ctx, -7, -4, 14, 12, palette.clerkShirt);
  px(ctx, -2, -4, 4, 7, palette.clerkCollar);
  px(ctx, -6, -16, 12, 12, palette.skin);
  px(ctx, -7, -18, 14, 6, palette.clerkHair);
  px(ctx, -7, -14, 2, 5, palette.clerkHair);
  px(ctx, 5, -14, 2, 5, palette.clerkHair);
  px(ctx, -4, -11, 2, 2, palette.ink);
  px(ctx, 2, -11, 2, 2, palette.ink);
  px(ctx, -5, 8, 4, 5, palette.clerkTrousers);
  px(ctx, 1, 8, 4, 5, palette.clerkTrousers);
  ctx.restore();
}

export function drawCustomer(ctx: CanvasRenderingContext2D, cust: Customer): void {
  ctx.save();
  ctx.translate(Math.floor(cust.x), Math.floor(cust.y));
  shadow(ctx);
  const pal = palette.customers[cust.paletteIndex % palette.customers.length] ?? palette.customers[0];

  px(ctx, -6, -4, 12, 12, pal.shirt);
  px(ctx, -5, 8, 4, 5, pal.pants);
  px(ctx, 1, 8, 4, 5, pal.pants);
  px(ctx, -5, -16, 10, 12, palette.skin);
  px(ctx, -6, -18, 12, 5, pal.hair);

  if (pal.hat !== null) {
    if (pal.hatType === 'cap') {
      px(ctx, -7, -20, 14, 4, pal.hat);
      px(ctx, -9, -17, 5, 2, pal.hat);
    } else {
      px(ctx, -9, -19, 18, 3, pal.hat);
      px(ctx, -5, -23, 10, 4, pal.hat);
    }
  }

  if (cust.isLeaving) {
    px(ctx, -4, -11, 3, 2, palette.ink);
    px(ctx, 1, -11, 3, 2, palette.ink);
    px(ctx, -2, -7, 4, 1, palette.angryMouth);
  } else {
    px(ctx, -3, -11, 2, 2, palette.ink);
    px(ctx, 2, -11, 2, 2, palette.ink);
  }
  ctx.restore();
}

export function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  px(ctx, x - 20, y - 32, 40, 14, palette.bubble);
  px(ctx, x - 21, y - 30, 42, 10, palette.bubble);
  px(ctx, x - 20, y - 33, 40, 1, palette.bubbleOutline);
  px(ctx, x - 20, y - 18, 40, 1, palette.bubbleOutline);
  px(ctx, x - 22, y - 30, 1, 10, palette.bubbleOutline);
  px(ctx, x + 21, y - 30, 1, 10, palette.bubbleOutline);
  px(ctx, x - 2, y - 18, 4, 2, palette.bubble);
  px(ctx, x - 1, y - 16, 2, 2, palette.bubbleOutline);

  ctx.fillStyle = palette.bubbleOutline;
  font(ctx, 5.5);
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y - 22);
  ctx.textAlign = 'left';
}

function patienceColour(ratio: number): string {
  if (ratio > 0.5) return palette.good;
  if (ratio > 0.25) return palette.warn;
  return palette.bad;
}

/** Draws one frame: a pure function of (ctx, state, view); it reads no clock and no RNG. */
export function render(ctx: CanvasRenderingContext2D, state: SimState, view: RenderView): void {
  const { clerk, queue, floaters } = state;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  renderMartEnvironment(ctx, state, view);
  drawClerk(ctx, clerk.x, clerk.y);

  if (clerk.state === 'mixing') {
    px(ctx, clerk.x - 22, clerk.y - 32, 44, 10, palette.alert);
    ctx.fillStyle = palette.white;
    font(ctx, 5);
    ctx.fillText(`MIX ${clerk.tinsRemaining}s`, clerk.x - 18, clerk.y - 25);
  }

  if (clerk.state !== 'at_till') {
    px(ctx, 180, 76, 130, 10, palette.alert);
    ctx.fillStyle = palette.warn;
    font(ctx, 5);
    ctx.fillText('! COUNTER UNMANNED', 186, 83);
  }

  for (let i = queue.length - 1; i >= 0; i--) {
    const cust = queue[i];
    if (!cust) continue;
    drawCustomer(ctx, cust);

    const ratio = Math.max(0, cust.patience / cust.maxPatience);
    px(ctx, cust.x - 10, cust.y - 30, 20, 3, palette.black);
    px(ctx, cust.x - 9, cust.y - 29, Math.floor(18 * ratio), 1, patienceColour(ratio));

    if (!cust.isLeaving) {
      if (i === 0) drawSpeechBubble(ctx, cust.x, cust.y - 8, cust.bubble);
      else if (ratio < 0.4) drawSpeechBubble(ctx, cust.x, cust.y - 8, 'WAIT...');
    } else {
      px(ctx, cust.x - 5, cust.y - 40, 10, 10, palette.bad);
      ctx.fillStyle = palette.white;
      font(ctx, 7);
      ctx.fillText('!', cust.x - 2, cust.y - 32);
    }
  }

  for (const f of floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, f.alpha);
    ctx.fillStyle = floaterColour[f.kind];
    font(ctx, 7);
    ctx.fillText(f.text, f.x - 10, f.y);
    ctx.restore();
  }
}
