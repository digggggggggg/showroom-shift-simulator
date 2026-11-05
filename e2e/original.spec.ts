import { expect, test } from '@playwright/test';

for (const path of ['/showroom-shift-simulator.html', '/original']) {
  test(`serves the original single-file game at ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('#root')).toHaveCount(0);
    await expect(page.getByText('LONDON PAINT SHOWROOM').first()).toBeVisible();
  });
}
