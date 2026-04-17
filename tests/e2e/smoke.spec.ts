import { test, expect } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('unauthed /admin redirects to /admin/login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
});
