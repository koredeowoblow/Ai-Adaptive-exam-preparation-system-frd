import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/pc/.gemini/antigravity-ide/brain/e05d6abf-50c3-4ff1-bd5e-f6528cde9035';

const mockUser = {
  id: 'stu_001',
  _id: 'stu_001',
  name: 'Demo Student',
  email: 'student@eduadapt.com',
  role: 'student',
  departmentId: 'dept_cs',
  isOnboarded: true,
};

const mockSessions = [
  {
    _id: 'sess-pending-1',
    status: 'PENDING_GRADING',
    isGradingPending: true,
    mode: 'mock',
    courseCode: 'CSC201',
    courseId: {
      _id: 'c1',
      code: 'CSC201',
      title: 'Computer Programming I'
    },
    totalQuestions: 10,
    questionsAnswered: 10,
    score: 0,
    startedAt: new Date().toISOString()
  },
  {
    _id: 'sess-failed-2',
    status: 'FAILED',
    mode: 'quick',
    courseCode: 'MTH201',
    courseId: {
      _id: 'c2',
      code: 'MTH201',
      title: 'Mathematical Methods'
    },
    totalQuestions: 10,
    questionsAnswered: 8,
    startedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: 'sess-completed-3',
    status: 'completed',
    mode: 'quick',
    courseCode: 'PHY201',
    courseId: {
      _id: 'c3',
      code: 'PHY201',
      title: 'General Physics'
    },
    totalQuestions: 10,
    questionsAnswered: 10,
    score: 85,
    startedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

test.describe('Practice History UI States and Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Add auth token to localStorage so route guards don't redirect to /login
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token');
      localStorage.setItem('theme', 'light');
    });

    // Abort external fonts to avoid hanging networkidle
    await page.route('**fonts.googleapis.com**', (route) => route.abort());
    await page.route('**fonts.gstatic.com**', (route) => route.abort());

    // Intercept auth
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: mockUser },
      });
    });
  });

  test('Desktop (1440px) Light & Dark States + Retry action', async ({ page }) => {
    let currentSessions = [...mockSessions];

    // Intercept retry endpoint
    await page.route('**/practice-sessions/*/retry', async (route) => {
      currentSessions = currentSessions.map((s) =>
        s._id === 'sess-failed-2'
          ? { ...s, status: 'PENDING_GRADING', isGradingPending: true }
          : s
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            session: {
              _id: 'sess-failed-2',
              status: 'PENDING_GRADING',
              isGradingPending: true
            }
          }
        }
      });
    });

    // Intercept practice-sessions list
    await page.route('**/practice-sessions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: { sessions: currentSessions } }
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/practice/history');
    await page.waitForLoadState('domcontentloaded');

    // Confirm Pending Grading badge and text
    const pendingBadge = page.locator('span:has-text("Grading in progress")').first();
    await pendingBadge.waitFor({ state: 'visible', timeout: 15000 });
    await expect(pendingBadge).toBeVisible();

    // Confirm that pending session does NOT display "0%" as score
    const pendingSessionRow = page.locator('text=CSC201: Computer Programming I').locator('xpath=ancestor::div[contains(@class, "group")]');
    await expect(pendingSessionRow).toBeVisible();
    const pendingText = await pendingSessionRow.innerText();
    expect(pendingText).toContain('Grading in progress');
    expect(pendingText).not.toMatch(/\b0%\b/);

    // Confirm Failed session shows outcome and retry button
    const failedSessionRow = page.locator('text=MTH201: Mathematical Methods').locator('xpath=ancestor::div[contains(@class, "group")]');
    await expect(failedSessionRow).toBeVisible();
    await expect(failedSessionRow.locator('text=Grading failed, your answers are saved')).toBeVisible();
    await expect(failedSessionRow.locator('button:has-text("Retry")')).toBeVisible();

    // Confirm Completed session shows 85% score and Review button
    const completedSessionRow = page.locator('text=PHY201: General Physics').locator('xpath=ancestor::div[contains(@class, "group")]');
    await expect(completedSessionRow).toBeVisible();
    await expect(completedSessionRow.locator('text=85%')).toBeVisible();
    await expect(completedSessionRow.locator('button:has-text("Review")')).toBeVisible();

    // 1. Screenshot Desktop 1440 Light
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'history_desktop_1440_light.png'),
      fullPage: true
    });

    // 2. Switch to Dark Theme & Screenshot Desktop 1440 Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'history_desktop_1440_dark.png'),
      fullPage: true
    });

    // 3. Retry the failed session and Screenshot
    await failedSessionRow.locator('button:has-text("Retry")').click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'history_desktop_1440_failed_retried.png'),
      fullPage: true
    });
  });

  test('Mobile (390px) Light & Dark States + Retry action', async ({ page }) => {
    let currentSessions = [...mockSessions];

    // Intercept retry endpoint
    await page.route('**/practice-sessions/*/retry', async (route) => {
      currentSessions = currentSessions.map((s) =>
        s._id === 'sess-failed-2'
          ? { ...s, status: 'PENDING_GRADING', isGradingPending: true }
          : s
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            session: {
              _id: 'sess-failed-2',
              status: 'PENDING_GRADING',
              isGradingPending: true
            }
          }
        }
      });
    });

    // Intercept practice-sessions list
    await page.route('**/practice-sessions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: { sessions: currentSessions } }
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/practice/history');
    await page.waitForLoadState('domcontentloaded');

    // Confirm Pending Grading
    const pendingText = page.locator('text=Grading in progress').first();
    await pendingText.waitFor({ state: 'visible', timeout: 15000 });
    await expect(pendingText).toBeVisible();

    // 1. Screenshot Mobile 390 Light
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'history_mobile_390_light.png'),
      fullPage: true
    });

    // 2. Switch to Dark Theme & Screenshot Mobile 390 Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'history_mobile_390_dark.png'),
      fullPage: true
    });

    // 3. Retry the failed session and Screenshot Mobile
    const failedSessionRow = page.locator('text=MTH201: Mathematical Methods').locator('xpath=ancestor::div[contains(@class, "group")]');
    await failedSessionRow.locator('button:has-text("Retry")').click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'history_mobile_390_failed_retried.png'),
      fullPage: true
    });
  });
});
