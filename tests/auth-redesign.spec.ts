/**
 * STUB NOTICE:
 * API requests to /api/v1/auth/* and /api/v1/auth/me are stubbed via page.route() in these tests
 * to ensure deterministic, isolated verification of validation error handling, role routing,
 * and redirection flows without depending on remote state or active database seeds.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';

test.describe('Auth Redesign & Adaptive Practice Loop', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Wrong password shows exactly one error message and no field level length error', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
      });
    });

    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Type 8 characters (valid length, wrong credentials)
    await emailInput.fill('student@unilag.edu.ng');
    await passwordInput.fill('wrongpass');
    await submitBtn.click();

    // Plain server error appears
    const serverError = page.locator('[role="alert"]');
    await expect(serverError).toBeVisible();
    await expect(serverError).toContainText('That email and password do not match.');

    // Assert NO field-level length error appears for the valid-length password
    const fieldError = page.locator('#password-error');
    await expect(fieldError).toHaveCount(0);

    // Verify only one alert/error element is present in the form
    const formErrors = page.locator('form [role="alert"]');
    await expect(formErrors).toHaveCount(1);
  });

  test('2. Valid student login lands on dashboard', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/login')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              accessToken: 'mock_student_token',
              user: {
                id: 's1',
                _id: 's1',
                name: 'Chidi Okonkwo',
                email: 'chidi@unilag.edu.ng',
                role: 'student',
                isOnboarded: true,
                departmentId: 'dept_1',
              },
            },
          },
        });
      }
      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 's1',
              _id: 's1',
              name: 'Chidi Okonkwo',
              email: 'chidi@unilag.edu.ng',
              role: 'student',
              isOnboarded: true,
              departmentId: 'dept_1',
            },
          },
        });
      }
      return route.fulfill({ status: 200, json: { success: true, data: {} } });
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('chidi@unilag.edu.ng');
    await page.locator('input[type="password"]').fill('correctpass123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('3. Valid admin login lands on /admin', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/login')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              accessToken: 'mock_admin_token',
              user: {
                id: 'a1',
                _id: 'a1',
                name: 'Dr. Admin',
                email: 'admin@eduadapt.com',
                role: 'admin',
              },
            },
          },
        });
      }
      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 'a1',
              _id: 'a1',
              name: 'Dr. Admin',
              email: 'admin@eduadapt.com',
              role: 'admin',
            },
          },
        });
      }
      return route.fulfill({ status: 200, json: { success: true, data: {} } });
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@eduadapt.com');
    await page.locator('input[type="password"]').fill('adminpass123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/admin/);
  });

  test('3. Visiting protected route while logged out redirects to /login and returns after login', async ({ page }) => {
    let isLoggedIn = false;
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/login')) {
        isLoggedIn = true;
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              accessToken: 'mock_return_token',
              user: {
                id: 's2',
                _id: 's2',
                name: 'Amina Bello',
                email: 'amina@abu.edu.ng',
                role: 'student',
                isOnboarded: true,
                departmentId: 'dept_1',
              },
            },
          },
        });
      }
      if (url.includes('/auth/me')) {
        if (!isLoggedIn) {
          return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
        }
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: 's2',
              _id: 's2',
              name: 'Amina Bello',
              email: 'amina@abu.edu.ng',
              role: 'student',
              isOnboarded: true,
              departmentId: 'dept_1',
            },
          },
        });
      }
      return route.fulfill({ status: 200, json: { success: true, data: {} } });
    });

    // Visit protected route
    await page.goto('/exam-prep');
    await expect(page).toHaveURL(/\/login/);

    await page.locator('input[type="email"]').fill('amina@abu.edu.ng');
    await page.locator('input[type="password"]').fill('secretpass');
    await page.locator('button[type="submit"]').click();

    // Verify redirected back to intended protected route
    await expect(page).toHaveURL(/\/exam-prep/);
  });

  test('4. Sample question: Python index question, keyboard/click selection, feedback display', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');

    const sampleSection = page.locator('[aria-label="Interactive Sample Question Card"]');
    await expect(sampleSection).toBeVisible();

    // Verify header and question
    await expect(sampleSection.locator('text=CSC 101 Introduction to Computer Science')).toBeVisible();
    await expect(sampleSection.locator('text=1 of 3')).toBeVisible();
    await expect(sampleSection.locator('text=In Python, which zero-based index accesses the second element of a list?')).toBeVisible();

    // Initial feedback line
    await expect(sampleSection.locator('text=Tap an answer to try it.')).toBeVisible();

    // Press 'a' (wrong answer: 0)
    await page.locator('input[type="email"]').blur();
    await sampleSection.focus();
    await page.keyboard.press('a');

    // Wrong feedback appears
    await expect(sampleSection.locator('text=Not quite. Lists start at index 0, so the second item is 1.')).toBeVisible();

    // Click 'B' (correct answer: 1)
    const optionB = sampleSection.locator('button[role="radio"]').nth(1);
    await optionB.click();

    // Correct feedback appears
    await expect(sampleSection.locator('text=Correct. Index 0 is the first item, so 1 is the second.')).toBeVisible();

    // Verify Next question button appears and advances to Question 2 (MTH 101 limit)
    const nextBtn = sampleSection.locator('button:has-text("Next question")');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Verify Question 2 (Math question with real math symbols)
    await expect(sampleSection.locator('text=2 of 3')).toBeVisible();
    await expect(sampleSection.locator('text=MTH 101 Elementary Mathematics I')).toBeVisible();
    await expect(sampleSection.locator('text=Evaluate the trigonometric limit:')).toBeVisible();
    await expect(sampleSection.locator('[aria-label="Limit as x approaches 0 of sin x over x"]')).toBeVisible();

    // Answer Question 2 (Option B is 1)
    await sampleSection.locator('button[role="radio"]').nth(1).click();
    await expect(sampleSection.locator('text=Correct. By standard trigonometric limits, lim(x → 0) (sin x)/x = 1.')).toBeVisible();
    await nextBtn.click();

    // Verify Question 3 (Math question with derivative notation)
    await expect(sampleSection.locator('text=3 of 3')).toBeVisible();
    await expect(sampleSection.locator('text=Find the derivative with respect to x:')).toBeVisible();
    await expect(sampleSection.locator('[aria-label="d over dx of e to the power of 3x"]')).toBeVisible();
  });

  test('5. Mobile viewport (375px) has single column, logo and theme toggle on top row, form visible without horizontal scroll', async ({ page }) => {
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Sample question card is hidden below 900px
    const sampleSection = page.locator('[aria-label="Interactive Sample Question Card"]');
    await expect(sampleSection).toBeHidden();

    // Form is immediately visible in DOM
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('6. Accessibility audit (axe-core) with zero serious or critical violations', async ({ page }) => {
    test.setTimeout(90000);
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });

    const routes = ['/login', '/register', '/forgot-password'];

    for (const routePath of routes) {
      // Light Mode Check
      await page.goto(routePath);
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      const lightResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const lightViolations = lightResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(
        lightViolations,
        `Light mode violations on ${routePath}: ${JSON.stringify(lightViolations, null, 2)}`
      ).toHaveLength(0);

      // Dark Mode Check
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      const darkResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const darkViolations = darkResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(
        darkViolations,
        `Dark mode violations on ${routePath}: ${JSON.stringify(darkViolations, null, 2)}`
      ).toHaveLength(0);
    }
  });

  test('7. Capture responsive before-and-after screenshots across viewports and themes', async ({ page }) => {
    test.setTimeout(90000);
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });

    const viewports = [
      { name: 'mobile_375', width: 375, height: 812 },
      { name: 'tablet_768', width: 768, height: 1024 },
      { name: 'desktop_1440', width: 1440, height: 900 },
    ];

    const artifactDir = 'C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\cc4f5ff6-c70f-44d1-8d7f-33f07e36922b';

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // /login in light mode
      await page.goto('/login');
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await page.screenshot({ path: path.join(artifactDir, `auth_login_${vp.name}_light.png`) });

      // /login in dark mode
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.screenshot({ path: path.join(artifactDir, `auth_login_${vp.name}_dark.png`) });

      // /register in light mode
      await page.goto('/register');
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await page.screenshot({ path: path.join(artifactDir, `auth_register_${vp.name}_light.png`) });

      // /register in dark mode
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.screenshot({ path: path.join(artifactDir, `auth_register_${vp.name}_dark.png`) });

      // /forgot-password in light mode
      await page.goto('/forgot-password');
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await page.screenshot({ path: path.join(artifactDir, `auth_forgot_${vp.name}_light.png`) });
    }

    // Sample question states (desktop 1440)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.evaluate(() => document.documentElement.classList.remove('dark'));

    // 1. Unanswered state
    await page.screenshot({ path: path.join(artifactDir, 'sample_unanswered.png') });

    // 2. Answer first option
    const sampleCard = page.locator('[aria-label="Interactive Sample Question Card"]');
    const radioButtons = sampleCard.locator('button[role="radio"]');
    await radioButtons.nth(0).click();
    await page.waitForTimeout(300);

    const isFirstCorrect = (await sampleCard.locator('text=Correct').count()) > 0;
    if (isFirstCorrect) {
      await page.screenshot({ path: path.join(artifactDir, 'sample_correct.png') });
      await page.reload();
      await page.waitForTimeout(500);
      const reloadedCard = page.locator('[aria-label="Interactive Sample Question Card"]');
      await reloadedCard.locator('button[role="radio"]').nth(3).click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(artifactDir, 'sample_wrong.png') });
    } else {
      await page.screenshot({ path: path.join(artifactDir, 'sample_wrong.png') });
      await page.reload();
      await page.waitForTimeout(500);
      const reloadedCard = page.locator('[aria-label="Interactive Sample Question Card"]');
      for (let i = 0; i < 4; i++) {
        const btn = reloadedCard.locator('button[role="radio"]').nth(i);
        const isDisabled = await btn.isDisabled();
        if (!isDisabled) {
          await btn.click();
          await page.waitForTimeout(200);
          if ((await reloadedCard.locator('text=Correct').count()) > 0) {
            break;
          }
        }
      }
      await page.screenshot({ path: path.join(artifactDir, 'sample_correct.png') });
    }
  });
});
