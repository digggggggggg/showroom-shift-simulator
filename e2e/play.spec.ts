import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const SHIFT_MS = 31_000;

// Each fake-clock shift steps every animation frame, so a full run is slow on a loaded machine.
test.setTimeout(120_000);

async function expectNoSeriousViolations(page: Page, state: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking, `axe violations in ${state}`).toEqual([]);
}

async function start(page: Page): Promise<void> {
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(100);
}

/** Plays a shift with keys only, then runs out the clock. */
async function playShiftByKeyboard(page: Page): Promise<void> {
  await expect(page.getByRole('dialog')).toBeHidden();
  for (let i = 0; i < 6; i++) {
    await page.clock.runFor(2_000);
    await page.keyboard.press('1');
    await page.keyboard.press('2');
  }
  await page.clock.runFor(SHIFT_MS);
}

/** Both rounds by keyboard to the comparison report and back, with axe at each state. */
async function playBothRounds(page: Page): Promise<void> {
  await start(page);
  const dialog = page.getByRole('dialog');

  await expect(dialog.getByRole('heading')).toHaveText(/ROUND 1: IN-STORE BOTTLENECK/);
  await expect(dialog.getByRole('button')).toBeFocused();
  await expectNoSeriousViolations(page, 'briefing');
  await page.keyboard.press('Enter');

  await page.clock.runFor(5_000);
  await page.keyboard.press('1');
  await page.keyboard.press('Space');
  await page.clock.runFor(3_000);
  await expectNoSeriousViolations(page, 'mid-shift');

  await playShiftByKeyboard(page);
  await expect(dialog.getByRole('heading')).toHaveText(/BOTTLENECK REPORT/);
  await expectNoSeriousViolations(page, 'bottleneck report');
  await page.keyboard.press('Enter');

  await playShiftByKeyboard(page);
  await expect(dialog.getByRole('heading')).toHaveText(/EXECUTIVE COMPARISON REPORT/);
  await expectNoSeriousViolations(page, 'comparison report');
  await page.keyboard.press('Enter');

  await expect(dialog).toBeHidden();
  await expect(page.getByText('ROUND 1: IN-STORE MIXING')).toBeVisible();
}

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('both rounds by keyboard, comparison report, replay', async ({ page }) => {
    await playBothRounds(page);
  });
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('both rounds by keyboard, comparison report, replay', async ({ page }) => {
    await playBothRounds(page);
  });
});
