import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test.describe('basket flow (mobile)', () => {
  test('add → open drawer → stepper → WhatsApp + mailto URLs', async ({ page }) => {
    await page.goto('/');
    await page.locator('#catalog a[href^="/products/"]').first().click();

    await page.getByRole('button', { name: /הוסף לסל|בסל/ }).click();
    await expect(page.getByRole('dialog', { name: 'הסל שלי' })).toBeVisible();

    await page.getByRole('button', { name: 'הגדל כמות' }).click();
    await expect(page.getByLabel('כמות: 2')).toBeVisible();

    const waLink = page.getByRole('link', { name: 'שלח/י בוואטסאפ' });
    const waHref = await waLink.getAttribute('href');
    expect(waHref).toMatch(/^https:\/\/wa\.me\/972545570941\?text=/);
    expect(decodeURIComponent(waHref!)).toContain('שלום!');
    expect(decodeURIComponent(waHref!)).toContain('סה"כ');

    const mailLink = page.getByRole('link', { name: 'שלח/י באימייל' });
    const mailHref = await mailLink.getAttribute('href');
    expect(mailHref).toMatch(/^mailto:bat\.chipli@gmail\.com\?subject=/);
    expect(decodeURIComponent(mailHref!)).toContain('הזמנה חדשה מסלסלה');

    await page.getByRole('button', { name: 'הסר מהסל' }).click();
    await expect(
      page.getByText('הסל ריק. הוסיפ/י פריטים כדי להתחיל.'),
    ).toBeVisible();
  });
});
