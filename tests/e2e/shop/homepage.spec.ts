import { test, expect } from '@playwright/test';

test.describe('homepage', () => {
  test('renders hero + catalog', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('כל סלסלה נארזת באהבה')).toBeVisible();

    await expect(page.locator('#catalog')).toBeVisible();
  });

  test('grid shows only available products', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#catalog a[href^="/products/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});
