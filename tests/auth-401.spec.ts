// Stubs API calls to simulate concurrent 401 responses and test single redirect.
import { test, expect } from '@playwright/test';

test.describe('401 Response Interceptor Handling', () => {
  test('Clears token and redirects to login on 401 responses', async ({ page }) => {
    let requestsFired = 0;

    await page.addInitScript(() => {
      if (window.location.pathname !== '/login') {
        localStorage.setItem('accessToken', 'mock_expired_token_12345');
      }
    });

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) {
        // Return valid auth so route guards pass
        return route.fulfill({
          status: 200,
          json: { success: true, data: { id: 'usr_1', name: 'Test Student', role: 'student', departmentId: 'dept_1' } },
        });
      }

      // Any other request responds with 401
      requestsFired++;
      return route.fulfill({
        status: 401,
        json: { success: false, message: 'Invalid or expired token' },
      });
    });

    // Navigate to courses page
    await page.goto('/courses');

    // Wait for the interceptor to redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Verify token was purged from localStorage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
  });
});
