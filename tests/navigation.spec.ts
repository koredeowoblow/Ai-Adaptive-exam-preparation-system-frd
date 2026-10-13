import { test, expect } from '@playwright/test';

test.describe('Navigation and Auth Route Guards', () => {
  test('Register page is reachable while logged out', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });

    await page.goto('/register');
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('h2')).toContainText('Welcome to EduAdapt');
  });

  test('Logged-in user at / lands on dashboard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token');
    });
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 'stu_123',
              name: 'Ada Lovelace',
              email: 'ada@example.com',
              role: 'student',
              isOnboarded: true,
              departmentId: 'dept_1',
            },
          },
        });
      }
      return route.fulfill({ status: 200, json: { success: true, data: {} } });
    });

    await page.goto('/');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('Student at /admin is redirected to /dashboard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token');
    });
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 'stu_123',
              name: 'Ada Lovelace',
              email: 'ada@example.com',
              role: 'student',
              isOnboarded: true,
              departmentId: 'dept_1',
            },
          },
        });
      }
      return route.fulfill({ status: 200, json: { success: true, data: {} } });
    });

    await page.goto('/admin');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('Unauthenticated visitor at / is redirected to /login', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });

    await page.goto('/');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
  });
});
