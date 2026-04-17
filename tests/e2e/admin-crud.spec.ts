import { test, expect } from '@playwright/test';
import path from 'node:path';
import { loginAsAdmin } from './helpers';

test.describe('admin product CRUD', () => {
  test('empty state shows Hebrew copy and CTA', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'מוצרים' })).toBeVisible();
    // At least one "מוצר חדש" CTA is visible (header or empty state).
    await expect(page.getByRole('link', { name: 'מוצר חדש' }).first()).toBeVisible();
  });

  test('edit product name and price', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.getByRole('link', { name: 'ערוך' }).first().click();

    const editedName = 'Edited ' + Date.now();
    await page.getByLabel('שם המוצר').fill(editedName);
    await page.getByLabel('מחיר (₪)').fill('123.45');
    await page.getByRole('button', { name: 'שמור' }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    await expect(page.getByText(editedName)).toBeVisible();
  });

  test('delete product', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');

    const rowsBefore = await page.locator('ul li').count();

    await page.getByRole('link', { name: 'ערוך' }).first().click();
    // Open confirm modal
    await page.getByRole('button', { name: 'מחק' }).first().click();
    // Use data-testid to unambiguously target the modal submit button
    await page.locator('[data-testid="confirm-delete-submit"]').click();

    await page.waitForURL('**/admin', { timeout: 30000 });
    // Row count should have decreased by 1
    await expect(page.locator('ul li')).toHaveCount(rowsBefore - 1);
  });

  test('create product with primary + one extra image', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products/new');

    const uniqueName = 'Test Product ' + Date.now();
    await page.getByLabel('שם המוצר').fill(uniqueName);
    await page.getByLabel('מחיר (₪)').fill('99.90');
    await page.getByLabel('תיאור').fill('בדיקה אוטומטית');

    const fixturesDir = path.join(__dirname, 'fixtures');

    // Upload primary image and wait for it to finish uploading to Supabase storage
    await page
      .locator('input[type=file]')
      .first()
      .setInputFiles(path.join(fixturesDir, 'sample-1.jpg'));
    // Wait until the uploading spinner disappears for primary slot
    await page.locator('text=מעלה…').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await page.locator('text=מעלה…').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    // Upload extra image and wait for it to finish
    await page
      .locator('input[type=file]')
      .nth(1)
      .setInputFiles(path.join(fixturesDir, 'sample-2.jpg'));
    await page.locator('text=מעלה…').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await page.locator('text=מעלה…').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    // Ensure image_urls hidden input is populated (at least one URL)
    await page.waitForFunction(
      () => {
        const el = document.querySelector('input[name="image_urls"]') as HTMLInputElement | null;
        if (!el) return false;
        try {
          const arr = JSON.parse(el.value);
          return Array.isArray(arr) && arr.length >= 1;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    await page.getByRole('button', { name: 'שמור' }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });

    await expect(page.getByText(uniqueName)).toBeVisible();
  });
});
