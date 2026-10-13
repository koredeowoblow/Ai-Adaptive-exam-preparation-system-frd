import { test, expect } from '@playwright/test';

test.describe('Performance thresholds', () => {
  test('Page loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page load time < 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
