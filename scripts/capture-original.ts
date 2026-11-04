// Captures reference screenshots of the original (the approved design, docs/adr/0002)
// at the viewports in .forger/ui.json. The original is served read-only from here;
// the app never builds or serves it.
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

interface Viewport {
  name: string;
  width: number;
  height: number;
}

const root = resolve(import.meta.dir, '..');
const outDir = resolve(root, 'docs/screenshots/original');
const ui = JSON.parse(readFileSync(resolve(root, '.forger/ui.json'), 'utf8')) as { viewports: Viewport[] };
const html = readFileSync(resolve(root, 'original/showroom-shift-simulator.html'));

const server = Bun.serve({
  port: 0,
  fetch: () => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
});

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of ui.viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.goto(server.url.href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const path = resolve(outDir, `index-${viewport.name}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log(`wrote ${path}`);
    await page.close();
  }
} finally {
  await browser.close();
  await server.stop();
}
