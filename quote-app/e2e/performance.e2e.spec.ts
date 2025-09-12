import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load the home page within performance thresholds', async ({ page }) => {
    // Start measuring
    const startTime = Date.now();
    
    // Navigate to the page
    await page.goto('/');
    
    // Wait for main content to be visible
    await expect(page.locator('app-quote-of-the-day')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Performance assertion - page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have acceptable Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    // LCP should be less than 2.5 seconds (2500ms)
    expect(lcp).toBeLessThan(2500);
  });

  test('should have minimal layout shift', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial render
    await page.waitForTimeout(1000);
    
    // Measure Cumulative Layout Shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Measure for 3 seconds
        setTimeout(() => resolve(clsValue), 3000);
      });
    });
    
    // CLS should be less than 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('should load JavaScript bundles efficiently', async ({ page }) => {
    const requests: any[] = [];
    
    // Capture all network requests
    page.on('request', request => {
      if (request.url().endsWith('.js')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().endsWith('.js')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length']
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that all JS requests succeeded
    const failedRequests = responses.filter(response => response.status >= 400);
    expect(failedRequests).toHaveLength(0);
    
    // Check that we don't have too many JS files
    expect(requests.length).toBeLessThan(10);
  });

  test('should be responsive and fast on mobile', async ({ page, browser }) => {
    // Create a mobile context
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const mobilePage = await mobileContext.newPage();
    
    const startTime = Date.now();
    await mobilePage.goto('/');
    await mobilePage.waitForSelector('app-quote-of-the-day');
    const loadTime = Date.now() - startTime;
    
    // Mobile should load within 4 seconds (accounting for slower mobile networks)
    expect(loadTime).toBeLessThan(4000);
    
    // Check that content is properly sized for mobile
    const quoteDimensions = await mobilePage.locator('app-quote-of-the-day').boundingBox();
    expect(quoteDimensions?.width).toBeLessThanOrEqual(375);
    
    await mobileContext.close();
  });
});