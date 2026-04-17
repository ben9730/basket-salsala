import type { Page } from '@playwright/test';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set to run E2E tests.`);
  return v;
}

export async function loginAsAdmin(page: Page) {
  const email = requireEnv('E2E_ADMIN_EMAIL');
  const password = requireEnv('E2E_ADMIN_PASSWORD');
  await page.goto('/admin/login');
  await page.getByLabel(/אימייל|email/i).fill(email);
  await page.getByLabel(/סיסמה|password/i).fill(password);
  await page.getByRole('button', { name: /התחברות|sign in/i }).click();
  await page.waitForURL('**/admin');
}
