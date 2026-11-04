import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('scaffold invariants', () => {
  const html = read('index.html');

  it('keeps the original page title', () => {
    expect(html).toContain('<title>London Paint Showroom: Shift Simulator</title>');
  });

  it('does not disable pinch-zoom in the viewport meta', () => {
    const viewport = /<meta name="viewport" content="([^"]*)"/.exec(html)?.[1];
    expect(viewport).toBeDefined();
    expect(viewport).not.toMatch(/maximum-scale|user-scalable\s*=\s*no/);
  });

  it('loads no web fonts from Google', () => {
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    expect(read('src/main.tsx')).toContain('@fontsource/press-start-2p');
  });

  it('lists both token files and only the light theme in the ui config', () => {
    const ui = JSON.parse(read('.forger/ui.json')) as { tokens: string[]; themes: string[] };
    expect(ui.tokens).toEqual(expect.arrayContaining(['src/styles/tokens.css', 'src/game/palette.ts']));
    expect(ui.themes).toEqual(['light']);
  });
});
