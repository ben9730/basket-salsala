import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('admin product CRUD', () => {
  test('empty state shows Hebrew copy and CTA', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'מוצרים' })).toBeVisible();
    // At least one "מוצר חדש" CTA is visible (header or empty state).
    await expect(page.getByRole('link', { name: 'מוצר חדש' }).first()).toBeVisible();
  });
});
