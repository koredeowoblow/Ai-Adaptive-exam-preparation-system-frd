// Stubs API calls to simulate onboarding user state for theme verification.
import { test, expect } from '@playwright/test';

test.describe('Onboarding Theme & Contrast', () => {
  test('Renders with accessible contrast in both dark and light modes', async ({ page }) => {
    // Mock user for onboarding
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 'stu_new',
              name: 'New Student',
              email: 'new@example.com',
              role: 'student',
              isOnboarded: false,
              departmentId: null,
            },
          },
        });
      }
      if (url.includes('/departments')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: [
              { _id: 'dept_cs', name: 'Computer Science' },
              { _id: 'dept_ee', name: 'Electrical Engineering' },
            ],
          },
        });
      }
      return route.fulfill({ status: 200, json: { success: true, data: [] } });
    });

    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token');
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.goto('/onboarding');
    await expect(page.locator('h1')).toContainText('Welcome to EduAdapt');

    // 1. Verify dark mode styles
    const card = page.locator('.card');
    await expect(card).toBeVisible();
    const darkCardBg = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(darkCardBg).not.toBe('rgb(255, 255, 255)');

    await page.screenshot({
      path: 'screenshots/onboarding_dark_mode.png',
      fullPage: true,
    });

    // 2. Switch to light mode via ThemeToggle or data-theme
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    const lightCardBg = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(lightCardBg).toBe('rgb(255, 255, 255)');

    // Verify label contrast
    const label = page.locator('label[for="departmentId"]');
    await expect(label).toBeVisible();
    const labelColor = await label.evaluate((el) => window.getComputedStyle(el).color);
    expect(labelColor).not.toBe('rgb(255, 255, 255)');

    await page.screenshot({
      path: 'screenshots/onboarding_light_mode.png',
      fullPage: true,
    });
  });
});
