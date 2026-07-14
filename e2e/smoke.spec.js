import { test, expect } from '@playwright/test';

// Smoke test: real login flow, then assert the Dashboard (S-Curve + health
// gauges) renders without JS errors. Also asserts the auth gate rejects
// unauthenticated API calls.

const CREDS = { username: 'nguyen.nguyen', password: '123456' };

test('auth gate rejects unauthenticated API', async ({ request }) => {
  const res = await request.get('/api/dashboard');
  expect(res.status()).toBe(401);
});

test('spoofed project id is rejected (404)', async ({ page, request }) => {
  // Log in for real to obtain a valid token
  await page.goto('/login');
  await page.getByPlaceholder('Tài khoản').fill('nguyen.nguyen');
  await page.getByPlaceholder('Mật khẩu').fill('123456');
  await page.getByRole('button', { name: /Đăng nhập/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  const res = await request.get('/api/dashboard', {
    headers: { Authorization: `Bearer ${token}`, 'x-project-id': 'project-khong-ton-tai-xyz' },
  });
  expect(res.status()).toBe(404);
});

test('Dashboard boots after real login (S-Curve + health gauges)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/\[antd:/i.test(m.text())) return; // ignore antd deprecation warnings
    errors.push(m.text());
  });

  await page.goto('/login');
  await page.getByPlaceholder('Tài khoản').fill(CREDS.username);
  await page.getByPlaceholder('Mật khẩu').fill(CREDS.password);
  await page.getByRole('button', { name: /Đăng nhập/i }).click();

  // Landed on the dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
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
