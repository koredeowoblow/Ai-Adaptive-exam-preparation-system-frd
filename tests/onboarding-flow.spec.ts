import { test, expect } from '@playwright/test';

test.describe('Onboarding Course Selection Flow', () => {
  test('Successfully loads courses for chosen department and completes onboarding', async ({ page }) => {
    let onboardedPayload: any = null;

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 'stu_new_123',
              name: 'Taylor Swift',
              email: 'taylor@example.com',
              role: 'student',
              isOnboarded: false,
              departmentId: null,
            },
          },
        });
      }

      if (url.includes('/departments') && !url.includes('/courses')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: [
              { _id: 'dept_math', name: 'Mathematics' },
              { _id: 'dept_cs', name: 'Computer Science' },
            ],
          },
        });
      }

      if (url.includes('/departments/dept_math/courses')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              items: [
                { _id: 'c_mat101', code: 'MAT101', title: 'Calculus I', departmentId: 'dept_math' },
                { _id: 'c_mat102', code: 'MAT102', title: 'Linear Algebra', departmentId: 'dept_math' },
              ],
            },
          },
        });
      }

      if (url.includes('/students/onboarding') && method === 'POST') {
        onboardedPayload = JSON.parse(route.request().postData() || '{}');
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 'stu_new_123',
              departmentId: onboardedPayload.departmentId,
              enrolledCourseIds: onboardedPayload.courseIds,
              isOnboarded: true,
            },
          },
        });
      }

      return route.fulfill({ status: 200, json: { success: true, data: [] } });
    });

    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token');
    });

    await page.goto('/onboarding');
    await expect(page.locator('h1')).toContainText('Welcome to EduAdapt');

    // Select Mathematics department
    const nativeSelect = page.locator('select#departmentId-native');
    if (await nativeSelect.count() > 0) {
      await nativeSelect.selectOption('dept_math', { force: true });
    } else {
      await page.click('button#departmentId');
      await page.locator('text="Mathematics"').click();
    }

    // Click Continue
    await page.click('button:has-text("Continue to Choose Courses")');

    // Verify Step 2 renders courses
    await expect(page.locator('h1')).toContainText('Choose Your Courses');
    await expect(page.locator('text=MAT101')).toBeVisible();
    await expect(page.locator('text=Calculus I')).toBeVisible();
    await expect(page.locator('text=MAT102')).toBeVisible();
    await expect(page.locator('text=Linear Algebra')).toBeVisible();

    // Verify empty state is NOT shown
    await expect(page.locator('text=No courses listed yet for this department')).not.toBeVisible();

    // Click "Enroll & Complete Setup"
    await page.click('button:has-text("Enroll & Complete Setup")');

    // Verify Step 3: Ready
    await expect(page.locator('h1')).toHaveText(/You're all set!/i);
    expect(onboardedPayload).toEqual({
      departmentId: 'dept_math',
      courseIds: ['c_mat101', 'c_mat102'],
      level: '100L',
    });
  });
});
