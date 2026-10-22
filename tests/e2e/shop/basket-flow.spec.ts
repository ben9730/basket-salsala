import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test.describe('basket flow (mobile)', () => {
  test('add → open drawer → stepper → order form validation', async ({ page }) => {
    await page.goto('/');
    await page.locator('#catalog a[href^="/products/"]').first().click();
    // Cards now have their own add-to-basket buttons, so wait for the product page before looking for one.
    await page.waitForURL(/\/products\//);

    await page.getByRole('button', { name: /הוסף לסל|בסל/ }).click();
    await expect(page.getByRole('dialog', { name: 'הסל שלי' })).toBeVisible();

    await page.getByRole('button', { name: 'הגדל כמות' }).click();
    await expect(page.getByLabel('כמות: 2')).toBeVisible();

    // Sending requires name + phone; invalid input shows inline errors and does not send.
    await page.getByRole('button', { name: 'שלח/י בוואטסאפ' }).click();
    await expect(page.getByText('שם נדרש')).toBeVisible();
    await expect(page.getByText('מספר טלפון לא תקין')).toBeVisible();

    await page.getByLabel('טלפון').fill('12345');
    await page.getByRole('button', { name: 'שלח/י באימייל' }).click();
    await expect(page.getByText('מספר טלפון לא תקין')).toBeVisible();

    await expect(page.getByLabel('יום איסוף')).toBeVisible();
    await expect(page.getByLabel('הערה (לא חובה)')).toBeVisible();

    await page.getByRole('button', { name: 'הסר מהסל' }).click();
    await expect(
      page.getByText('הסל ריק. הוסיפ/י פריטים כדי להתחיל.'),
    ).toBeVisible();
  });
});
