// Stubs API calls to simulate partial failure in admin bulk deletion.
import { test, expect } from '@playwright/test';

test.describe('Admin Bulk Delete Actions', () => {
  test('Bulk delete calls API once per ID and reports partial failures', async ({ page }) => {
    const deletedIds: string[] = [];

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: { success: true, data: { id: 'admin_1', name: 'Admin User', role: 'admin' } },
        });
      }

      if (url.includes('/students')) {
        if (method === 'DELETE') {
          const id = url.split('/').pop()?.split('?')[0] || '';
          deletedIds.push(id);
          if (id === 'user_001') {
            return route.fulfill({ status: 200, json: { success: true } });
          } else {
            return route.fulfill({ status: 500, json: { success: false, message: 'Server error' } });
          }
        }
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              total: 2,
              page: 1,
              limit: 10,
              items: [
                {
                  _id: 'user_001',
                  name: 'Student One',
                  email: 'one@example.com',
                  level: '100L',
                  isOnboarded: true,
                  createdAt: '2026-01-01T00:00:00.000Z',
                },
                {
                  _id: 'user_002',
                  name: 'Student Two',
                  email: 'two@example.com',
                  level: '200L',
                  isOnboarded: false,
                  createdAt: '2026-01-02T00:00:00.000Z',
                },
              ],
            },
          },
        });
      }

      if (url.includes('/courses')) {
        return route.fulfill({
          status: 200,
          json: { success: true, data: { items: [], total: 0, pages: [{ items: [] }] } },
        });
      }

      return route.fulfill({ status: 200, json: { success: true, data: [] } });
    });

    await page.goto('/admin/users');

    // Wait for the users table to load
    await expect(page.getByText('Student One')).toBeVisible();
    await expect(page.getByText('Student Two')).toBeVisible();

    // Select all rows
    await page.locator('thead input[type="checkbox"]').click();

    // Click Delete Selected (2)
    const bulkDeleteBtn = page.getByRole('button', { name: /Delete Selected \(2\)/i });
    await expect(bulkDeleteBtn).toBeVisible();
    await bulkDeleteBtn.click();

    // Confirm dialog appears
    const confirmBtn = page.getByRole('button', { name: /Delete 2 Accounts/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify toast notifications and failure name reporting
    await expect(page.getByText(/Successfully removed 1 user/i).first()).toBeVisible();
    await expect(page.getByText(/Failed to remove 1 user: Student Two/i).first()).toBeVisible();

    // Verify only the failed row remains selected
    await expect(page.getByRole('button', { name: /Delete Selected \(1\)/i })).toBeVisible();
    await expect(page.locator('tbody tr input[type="checkbox"]').nth(1)).toBeChecked();
    await expect(page.locator('tbody tr input[type="checkbox"]').nth(0)).not.toBeChecked();

    expect(deletedIds).toContain('user_001');
    expect(deletedIds).toContain('user_002');
  });
});
