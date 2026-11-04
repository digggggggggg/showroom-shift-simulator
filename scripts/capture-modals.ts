// Captures the three round-modal states of the running app into docs/screenshots/.
// Plays two real 30s rounds, so it takes about a minute. Needs a dev server: bun run dev.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const url = process.env.APP_URL ?? 'http://localhost:3000/';
const outDir = resolve(import.meta.dir, '../docs/screenshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const states = [
    { name: 'modal-briefing', next: /START ROUND 1/ },
    { name: 'modal-bottleneck-report', next: /START ROUND 2/ },
    { name: 'modal-comparison-report', next: null },
  ];
  for (const { name, next } of states) {
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 45_000 });
    await page.screenshot({ path: resolve(outDir, `${name}.png`) });
    console.log(`wrote ${name}.png`);
    if (next) await dialog.getByRole('button', { name: next }).click();
  }
} finally {
  await browser.close();
}
