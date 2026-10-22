import { test, expect } from '@playwright/test';

test.describe('basket persistence', () => {
  test('survives reload via localStorage', async ({ page }) => {
    await page.goto('/');
    await page.locator('#catalog a[href^="/products/"]').first().click();
    // Cards now have their own add-to-basket buttons, so wait for the product page before looking for one.
    await page.waitForURL(/\/products\//);
    await page.getByRole('button', { name: /הוסף לסל|בסל/ }).click();
    await expect(page.getByRole('dialog', { name: 'הסל שלי' })).toBeVisible();

    await page.keyboard.press('Escape');
    await page.reload();

    await expect(page.getByRole('button', { name: 'פתח/י את הסל' })).toBeVisible();
    await page.getByRole('button', { name: 'פתח/י את הסל' }).click();
    await expect(page.getByLabel('כמות: 1')).toBeVisible();
  });
});
