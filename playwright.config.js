import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx start-server-and-test dev:server http-get://localhost:3001/api/meta dev:client http-get://localhost:5173',
    // multi-server tuple: (cmd, probe) (cmd, probe)
    // multi-server tuple: (cmd, probe) (cmd, probe)
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
