import { test, expect } from '@playwright/test';

test.describe('Admin Topbar & Theme Toggle', () => {
  test('Toggles theme and maintains fixed navbar', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 'admin_1',
              name: 'Admin Tester',
              role: 'admin',
            },
          },
        });
      }
      return route.fulfill({ status: 200, json: { success: true, data: [] } });
    });

    await page.goto('/admin');

    // 1. Set light mode initially
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    });

    const themeToggleBtn = page.locator('#admin-theme-toggle-btn');
    await expect(themeToggleBtn).toBeVisible();

    // 2. Click theme toggle button to switch to dark mode
    await themeToggleBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // 3. Click again to return to light mode
    await themeToggleBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // 4. Verify navbar remains visible on scroll
    await page.evaluate(() => window.scrollTo(0, 400));
    const header = page.locator('.admin-header-nav');
    await expect(header).toBeVisible();
  });
});
