import { expect, test } from '@playwright/test';

test('serves the app with the bundled font and no Google Fonts request', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) external.push(request.url());
  });

  await page.goto('/');
  await expect(page).toHaveTitle('London Paint Showroom: Shift Simulator');
  await expect(page.getByText('LONDON PAINT SHOWROOM')).toBeVisible();

  const fontLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('8px "Press Start 2P"');
  });
  expect(fontLoaded).toBe(true);
  expect(external).toEqual([]);
});
