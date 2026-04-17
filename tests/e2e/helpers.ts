import type { Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set to run E2E tests.');
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel(/אימייל|email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/סיסמה|password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /התחברות|sign in/i }).click();
  await page.waitForURL('**/admin');
}
