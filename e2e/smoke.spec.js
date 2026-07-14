import { test, expect } from '@playwright/test';

// Smoke test: ensure the app boots, login works, and the Dashboard
// (S-Curve + health gauges) renders without JS errors.
// Auth is injected via localStorage to keep the flow deterministic.

const AUTH = {
  authToken: 'dummy-token',
  currentUser: JSON.stringify({
    id: 'u1',
    username: 'nguyen.nguyen',
    name: 'Nguyen Nguyen',
    role: 'admin',
  }),
  currentProjectId: 'block-b-gas',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((auth) => {
    Object.entries(auth).forEach(([k, v]) => localStorage.setItem(k, v));
  }, AUTH);
});

test('Dashboard boots with S-Curve and health gauges', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Ignore antd deprecation warnings (logged as console.error by antd itself)
    if (/\[antd:/i.test(t)) return;
    errors.push(t);
  });

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  // Wait for the dashboard shell to render (hero "Thêm dự án" button is always present)
  await expect(page.getByRole('button', { name: /Thêm dự án/i })).toBeVisible({ timeout: 15000 });

  // S-Curve card present
  await expect(page.getByText('Tiến độ & Chi phí (S-Curve)')).toBeVisible({ timeout: 15000 });

  // Health gauges present (labels + PMO names)
  await expect(page.getByText('Chi phí (CPI)')).toBeVisible();
  const gaugeName = (t) => page.locator('.dash-gauge-name', { hasText: t }).first();
  await expect(gaugeName('Schedule')).toBeVisible();
  await expect(gaugeName('Procurement')).toBeVisible();
  await expect(gaugeName('Fabrication')).toBeVisible();

  // No uncaught JS errors
  expect(errors, `Console/page errors:\n${errors.join('\n')}`).toEqual([]);
});
