import { test, expect } from '@playwright/test';

test.describe('product detail', () => {
  test('clicking a card opens the detail page', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('#catalog a[href^="/products/"]').first();
    await firstCard.click();

    await expect(page).toHaveURL(/\/products\/[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /הוסף לסל|בסל/ })).toBeVisible();
  });

  test('unknown product id renders Hebrew 404', async ({ page }) => {
    const res = await page.goto('/products/00000000-0000-0000-0000-000000000000');
    expect(res?.status()).toBe(404);
    await expect(page.getByText('המוצר לא נמצא')).toBeVisible();
    await expect(page.getByRole('link', { name: 'חזרה לחנות' })).toBeVisible();
  });
});
