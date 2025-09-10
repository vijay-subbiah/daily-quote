import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/QuoteApp/);
});

test('should load the application', async ({ page }) => {
  await page.goto('/');

  // Should show either welcome screen or loading state
  const welcomeVisible = await page.getByText('Welcome to Daily Inspiration').isVisible().catch(() => false);
  const loadingVisible = await page.locator('.spinner-border').isVisible().catch(() => false);
  const titleVisible = await page.getByText('Daily Inspiration').isVisible().catch(() => false);
  
  expect(welcomeVisible || loadingVisible || titleVisible).toBe(true);
});
