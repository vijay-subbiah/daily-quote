/**
 * T026: E2E/Playwright Tests
 * 
 * IMPORTANT: This test MUST fail initially as components don't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * End-to-end tests that verify complete user journeys and real browser interactions
 * using Playwright for cross-browser testing.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Quote of the Day - End-to-End Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      // Test in various viewport sizes
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    
    // Navigate to the application
    await page.goto('/');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('Initial Page Load', () => {
    test('should load the application and display quote of the day', async () => {
      // Should show loading state initially
      await expect(page.getByTestId('loading-spinner')).toBeVisible();
      await expect(page.getByText('Loading your daily inspiration')).toBeVisible();

      // Wait for quote to load
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
      
      // Should display a quote
      await expect(page.getByRole('figure')).toBeVisible();
      await expect(page.locator('[data-testid="quote-text"]')).not.toBeEmpty();
      await expect(page.locator('[data-testid="quote-author"]')).not.toBeEmpty();

      // Should display action buttons
      await expect(page.getByRole('button', { name: /new quote/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /copy quote/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    });

    test('should handle API failures gracefully', async () => {
      // Mock API failure
      await page.route('**/quotegarden.io/**', route => {
        route.abort('failed');
      });
      await page.route('**/api.quotable.io/**', route => {
        route.abort('failed');
      });

      await page.reload();

      // Should show fallback quote
      await expect(page.getByText(/the only way to do great work/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/steve jobs/i)).toBeVisible();

      // Should show retry option
      await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
    });

    test('should be responsive on mobile devices', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // Wait for quote to load
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      // Should display properly on mobile
      await expect(page.getByRole('figure')).toBeVisible();
      
      // Buttons should be touch-friendly
      const buttons = await page.getByRole('button').all();
      for (const button of buttons) {
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Quote Generation', () => {
    test('should generate new quotes when requested', async () => {
      // Wait for initial quote
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
      
      const initialQuote = await page.locator('[data-testid="quote-text"]').textContent();
      
      // Click new quote button
      await page.getByRole('button', { name: /new quote/i }).click();

      // Should show loading state
      await expect(page.getByTestId('loading-spinner')).toBeVisible();

      // Should load new quote
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
      
      const newQuote = await page.locator('[data-testid="quote-text"]').textContent();
      expect(newQuote).not.toBe(initialQuote);
    });

    test('should disable new quote button while loading', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      const newQuoteButton = page.getByRole('button', { name: /new quote/i });
      await newQuoteButton.click();

      // Button should be disabled during loading
      await expect(newQuoteButton).toBeDisabled();
      
      // Should be enabled again after loading
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
      await expect(newQuoteButton).toBeEnabled();
    });

    test('should handle rapid clicks gracefully', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      const newQuoteButton = page.getByRole('button', { name: /new quote/i });
      
      // Rapid clicks
      await newQuoteButton.click();
      await newQuoteButton.click();
      await newQuoteButton.click();

      // Should not cause errors or multiple parallel requests
      await expect(page.getByTestId('loading-spinner')).toBeVisible();
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
      
      // Should display a valid quote
      await expect(page.locator('[data-testid="quote-text"]')).not.toBeEmpty();
    });
  });

  test.describe('Copy Functionality', () => {
    test('should copy quote to clipboard', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      const quoteText = await page.locator('[data-testid="quote-text"]').textContent();
      const authorText = await page.locator('[data-testid="quote-author"]').textContent();

      // Click copy button
      await page.getByRole('button', { name: /copy quote/i }).click();

      // Should show success message
      await expect(page.getByText(/copied to clipboard/i)).toBeVisible();

      // Verify clipboard content
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toBe(`"${quoteText}" - ${authorText}`);

      // Success message should disappear
      await expect(page.getByText(/copied to clipboard/i)).toBeHidden({ timeout: 4000 });
    });

    test('should handle clipboard permission denied', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      // Mock clipboard failure
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: () => Promise.reject(new Error('Permission denied'))
          }
        });
      });

      await page.reload();
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      await page.getByRole('button', { name: /copy quote/i }).click();

      // Should show error message
      await expect(page.getByText(/unable to copy/i)).toBeVisible();
    });
  });

  test.describe('Share Dialog', () => {
    test('should open and close share dialog', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      // Open share dialog
      await page.getByRole('button', { name: /share/i }).click();

      // Dialog should be visible
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /share quote/i })).toBeVisible();

      // Should display social media options
      await expect(page.getByRole('button', { name: /share on twitter/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /share on facebook/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /share on linkedin/i })).toBeVisible();

      // Close dialog with close button
      await page.getByRole('button', { name: /close/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('should close dialog with Escape key', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      await page.getByRole('button', { name: /share/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('should close dialog when clicking backdrop', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      await page.getByRole('button', { name: /share/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click backdrop
      await page.locator('[data-testid="modal-backdrop"]').click();
      await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('should open social media sharing in new tab', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      await page.getByRole('button', { name: /share/i }).click();

      // Listen for new page creation
      const pagePromise = context.waitForEvent('page');
      
      await page.getByRole('button', { name: /share on twitter/i }).click();
      
      const newPage = await pagePromise;
      expect(newPage.url()).toContain('twitter.com');
      
      await newPage.close();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      // Start from first interactive element
      await page.keyboard.press('Tab');
      
      let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBe('BUTTON');

      // Tab through all buttons
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      
      // Should have triggered an action (share dialog or copy)
      const dialogVisible = await page.getByRole('dialog').isVisible().catch(() => false);
      const successMessageVisible = await page.getByText(/copied/i).isVisible().catch(() => false);
      
      expect(dialogVisible || successMessageVisible).toBe(true);
    });

    test('should trap focus in share dialog', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      await page.getByRole('button', { name: /share/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Focus should be trapped within dialog
      const dialog = page.getByRole('dialog');
      const focusableElements = await dialog.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
      
      expect(focusableElements).toBeGreaterThan(0);

      // Tab through dialog elements
      for (let i = 0; i < focusableElements + 2; i++) {
        await page.keyboard.press('Tab');
        
        // Focus should remain within dialog
        const focusedElementInDialog = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          return dialog?.contains(document.activeElement);
        });
        
        expect(focusedElementInDialog).toBe(true);
      }
    });
  });

  test.describe('Offline Functionality', () => {
    test('should work when offline', async () => {
      // Load page while online first
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      // Go offline
      await context.setOffline(true);

      // Reload page
      await page.reload();

      // Should show offline indicator
      await expect(page.getByText(/you are offline/i)).toBeVisible();

      // Should display cached or fallback quote
      await expect(page.locator('[data-testid="quote-text"]')).not.toBeEmpty();

      // Copy should still work offline
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.getByRole('button', { name: /copy quote/i }).click();
      await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
    });

    test('should sync when coming back online', async () => {
      // Start offline
      await context.setOffline(true);
      await page.reload();

      await expect(page.getByText(/you are offline/i)).toBeVisible();

      // Come back online
      await context.setOffline(false);
      await page.reload();

      // Should fetch fresh content
      await expect(page.getByTestId('loading-spinner')).toBeVisible();
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
      
      // Should not show offline indicator
      await expect(page.getByText(/you are offline/i)).toBeHidden();
    });
  });

  test.describe('Progressive Web App', () => {
    test('should be installable as PWA', async () => {
      // Trigger beforeinstallprompt event
      await page.evaluate(() => {
        const event = new Event('beforeinstallprompt');
        (event as any).prompt = () => Promise.resolve();
        (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);
      });

      // Should show install button
      await expect(page.getByRole('button', { name: /install app/i })).toBeVisible();

      await page.getByRole('button', { name: /install app/i }).click();

      // Should trigger installation flow
      const installTriggered = await page.evaluate(() => {
        return window.dispatchEvent(new Event('appinstalled'));
      });
      
      expect(installTriggered).toBe(true);
    });

    test('should work in standalone mode', async () => {
      // Mock standalone mode
      await page.addInitScript(() => {
        Object.defineProperty(window, 'matchMedia', {
          value: (query: string) => ({
            matches: query === '(display-mode: standalone)',
            addEventListener: () => {},
            removeEventListener: () => {}
          })
        });
      });

      await page.reload();
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      // Should show PWA-specific UI
      await expect(page.getByTestId('pwa-header')).toBeVisible();
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach((browserName: string) => {
      test(`should work in ${browserName}`, async ({ browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`);
        
        await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
        
        // Basic functionality should work
        await expect(page.locator('[data-testid="quote-text"]')).not.toBeEmpty();
        await expect(page.getByRole('button', { name: /new quote/i })).toBeVisible();
        
        // Interaction should work
        await page.getByRole('button', { name: /copy quote/i }).click();
        await expect(page.getByText(/copied/i)).toBeVisible();
      });
    });
  });

  test.describe('Performance', () => {
    test('should load within performance budget', async () => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have good Core Web Vitals', async () => {
      await page.goto('/');
      
      // Measure FCP (First Contentful Paint)
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime);
              }
            }
          }).observe({ type: 'paint', buffered: true });
        });
      });
      
      // FCP should be under 1.5 seconds
      expect(fcp).toBeLessThan(1500);
    });

    test('should handle large amounts of quote changes efficiently', async () => {
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });

      const startTime = Date.now();
      
      // Generate multiple quotes rapidly
      for (let i = 0; i < 10; i++) {
        await page.getByRole('button', { name: /new quote/i }).click();
        await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 2000 });
      }
      
      const totalTime = Date.now() - startTime;
      
      // Should handle efficiently (under 20 seconds for 10 quotes)
      expect(totalTime).toBeLessThan(20000);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Block all network requests after initial load
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
      
      await page.route('**/*', route => route.abort('failed'));

      // Try to get new quote
      await page.getByRole('button', { name: /new quote/i }).click();

      // Should show appropriate error message
      await expect(page.getByText(/unable to load quote/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
    });

    test('should recover from errors', async () => {
      // Cause an error first
      await page.route('**/quotegarden.io/**', route => route.abort('failed'));
      await page.route('**/api.quotable.io/**', route => route.abort('failed'));
      
      await page.reload();
      await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();

      // Remove the route block
      await page.unroute('**/quotegarden.io/**');
      await page.unroute('**/api.quotable.io/**');

      // Try again
      await page.getByRole('button', { name: /try again/i }).click();

      // Should recover and load quote
      await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 5000 });
      await expect(page.locator('[data-testid="quote-text"]')).not.toBeEmpty();
    });
  });
});
