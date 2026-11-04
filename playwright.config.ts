import { defineConfig, devices } from '@playwright/test';

// A port of its own, so a run never reuses some other app that holds the dev port.
const port = Number(process.env.E2E_PORT ?? 4173);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `bunx vite --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
