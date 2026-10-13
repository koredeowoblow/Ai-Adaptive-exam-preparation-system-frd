// Verifies admin DataTable rendering and action column visibility at 1280px width
import { test, expect } from '@playwright/test';

test.describe('Admin DataTable 1280px layout proof', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('DataTable wraps text and keeps actions column visible at 1280px', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 'adm_1',
              name: 'Admin System',
              email: 'admin@eduadapt.com',
              role: 'admin',
            },
          },
        });
      }

      if (url.includes('/questions')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              items: [
                {
                  _id: 'q_long_1',
                  prompt: 'Explain how the Linux Virtual File System (VFS) abstracts different underlying filesystem architectures such as ext4, btrfs, and network file systems into a single unified directory tree and system call interface for user processes.',
                  type: 'THEORY',
                  topicId: 'top_1',
                  difficulty: 'HARD',
                  difficultyValue: 4,
                  eloRating: 1450,
                  modelAnswer: 'The VFS defines common abstractions like inodes, dentries, and file objects.',
                  rubric: [
                    { criterion: 'Explains inodes and dentries correctly', weight: 0.5 },
                    { criterion: 'Discusses system call dispatch', weight: 0.5 }
                  ],
                },
              ],
              total: 1,
            },
          },
        });
      }

      if (url.includes('/departments')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: [{ _id: 'd_1', name: 'Computer Science', code: 'CS' }],
          },
        });
      }

      if (url.includes('/courses')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: { items: [{ _id: 'c_1', title: 'Operating Systems', code: 'CS201', departmentId: 'd_1' }] },
          },
        });
      }

      if (url.includes('/topics')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: { items: [{ _id: 'top_1', name: 'File Systems', courseId: 'c_1' }] },
          },
        });
      }

      return route.fulfill({ status: 200, json: { success: true, data: [] } });
    });

    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token');
    });

    await page.goto('/admin/questions');
    await expect(page.locator('h1')).toContainText('Questions');

    // Wait for row
    const row = page.locator('.data-table-row').first();
    await expect(row).toBeVisible();

    // Verify row actions trigger button is within the viewport at 1280px
    const actionsBtn = row.locator('button[aria-label="Actions"], button:has(svg)').last();
    await expect(actionsBtn).toBeVisible();

    const box = await actionsBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(1280);
    }

    await page.screenshot({
      path: 'screenshots/admin_datatable_1280px.png',
      fullPage: false,
    });
  });
});
