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
    // No Friday-only item in the basket, so the picker offers more than Fridays.
    const dayLabels = await page.getByLabel('יום איסוף').locator('option').allTextContents();
    expect(dayLabels.some((l) => !l.includes('שישי'))).toBe(true);
    await expect(page.getByLabel('הערה (לא חובה)')).toBeVisible();

    await page.getByRole('button', { name: 'הסר מהסל' }).click();
    await expect(
      page.getByText('הסל ריק. הוסיפ/י פריטים כדי להתחיל.'),
    ).toBeVisible();
  });

  // Seeded through storage so the test doesn't depend on which real products are flagged.
  test('a Friday-only item limits the pickup picker to Fridays', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'salsala.basket.v1',
        JSON.stringify({ items: [{ id: 'x', name: 'חלה', price: 10, quantity: 1, fridayOnly: true }] }),
      );
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'פתח/י את הסל' }).click();

    const dayLabels = await page.getByLabel('יום איסוף').locator('option').allTextContents();
    expect(dayLabels.length).toBeGreaterThan(0);
    for (const l of dayLabels) expect(l).toContain('שישי');
    await expect(page.getByText('בסל יש מוצרים של שישי בלבד, לכן האיסוף ביום שישי')).toBeVisible();
  });
});
