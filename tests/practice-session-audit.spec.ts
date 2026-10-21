// Stubs backend auth and practice session APIs for deterministic exam state inspection.
import { test, expect } from '@playwright/test';

test.describe('Mock Exam State and Polling Integrity', () => {
  const mockSession = {
    session: {
      _id: 'sess_123',
      status: 'active',
      courseId: 'course_1',
      questionsServed: [
        {
          questionId: {
            _id: 'q_001',
            questionText: 'What is the primary role of an operating system kernel?',
            type: 'MULTIPLE_CHOICE',
            options: [
              { id: 'opt_a', text: 'Manage hardware resources' },
              { id: 'opt_b', text: 'Render 3D graphics' },
              { id: 'opt_c', text: 'Compile high level code' },
            ],
            difficulty: 3,
            eloRating: 1200,
          },
        },
        {
          questionId: {
            _id: 'q_002',
            questionText: 'Explain the concept of virtual memory.',
            type: 'THEORY',
            difficulty: 4,
            eloRating: 1300,
          },
        },
        {
          questionId: {
            _id: 'q_003',
            questionText: 'What is a deadlock in multiprocessing?',
            type: 'MULTIPLE_CHOICE',
            options: [
              { id: 'opt_d1', text: 'A circular wait condition' },
              { id: 'opt_d2', text: 'Fast memory cache' },
            ],
            difficulty: 3,
            eloRating: 1250,
          },
        },
      ],
    },
  };

  test('Exam answers survive a reload without data loss', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: 'stu_123',
            name: 'Student Tester',
            role: 'student',
            isOnboarded: true,
            departmentId: 'dept_1',
          },
        },
      });
    });

    await page.route('**/practice-sessions/sess_123*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: mockSession,
        },
      });
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('exam_started_sess_123', 'true');
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => document.documentElement,
        configurable: true,
      });
    });

    await page.goto('/exam/sess_123');

    // Dismiss exam notice modal if visible
    const modalCheckbox = page.locator('div[role="dialog"] input[type="checkbox"]');
    if (await modalCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalCheckbox.check();
      await page.click('button:has-text("Begin Exam")');
    }

    // Wait for the exam question to be visible
    await expect(page.getByText('What is the primary role of an operating system kernel?')).toBeVisible();

    // Select Option A
    await page.getByText('Manage hardware resources').click();

    // Verify QuestionNavigator marks question 1 as answered
    await expect(page.getByRole('button', { name: /Question 1,.*answered/i })).toBeVisible();

    // Reload the page mid-exam
    await page.reload();

    if (await modalCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalCheckbox.check();
      await page.click('button:has-text("Begin Exam")');
    }

    // Verify answer is hydrated from localStorage and remains selected
    await expect(page.getByText('What is the primary role of an operating system kernel?')).toBeVisible();
    await expect(page.getByRole('button', { name: /Question 1,.*answered/i })).toBeVisible();
  });

  test('AI explanation polling continues when questions have pending explanations', async ({ page }) => {
    let pollCount = 0;

    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: 'stu_123',
            name: 'Student Tester',
            role: 'student',
            isOnboarded: true,
            departmentId: 'dept_1',
          },
        },
      });
    });

    await page.route('**/practice-sessions/sess_completed*', async (route) => {
      pollCount++;
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            session: {
              _id: 'sess_completed',
              status: 'completed',
              questionsServed: [
                {
                  questionId: 'q_001',
                  gradingStatus: 'GRADED',
                  explanationStatus: pollCount < 2 ? 'PENDING' : 'COMPLETED',
                },
              ],
            },
          },
        },
      });
    });

    // Navigate to review where completed session is inspected
    await page.goto('/practice/sess_completed/review');

    // Wait 3.5 seconds to confirm refetch happens while explanationStatus is PENDING
    await page.waitForTimeout(3500);

    // Verify polling was not killed immediately despite session status being 'completed'
    expect(pollCount).toBeGreaterThanOrEqual(2);
  });

  test('Session timer does not reset to 0:00 when answering multiple questions', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: 'stu_123',
            name: 'Student Tester',
            role: 'student',
            isOnboarded: true,
            departmentId: 'dept_1',
          },
        },
      });
    });

    await page.route('**/practice-sessions/sess_123*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: mockSession,
        },
      });
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('exam_started_sess_123', 'true');
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => document.documentElement,
        configurable: true,
      });
    });

    await page.goto('/exam/sess_123');
    const modalCheckbox = page.locator('div[role="dialog"] input[type="checkbox"]');
    if (await modalCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalCheckbox.check();
      await page.click('button:has-text("Begin Exam")');
    }
    await expect(page.locator('text=What is the primary role of an operating system kernel?')).toBeVisible();

    // Answer Q1 and proceed to Q2
    await page.click('text=Manage hardware resources');
    await page.click('button:has-text("Next")');

    // Answer Q2 and proceed to Q3
    await expect(page.locator('text=Explain the concept of virtual memory.')).toBeVisible();
    await page.fill('textarea', 'Virtual memory maps physical RAM to a larger address space.');
    await page.click('button:has-text("Next")');

    // Answer Q3
    await expect(page.locator('text=What is a deadlock in multiprocessing?')).toBeVisible();
    await page.click('text=A circular wait condition');

    // Wait 1.2s so stopwatch ticks
    await page.waitForTimeout(1200);

    // Verify timer in header is running and did not drop back to 0:00 / 00:00
    const timerText = await page.locator('header').locator('svg ~ span').textContent();
    expect(timerText).not.toBe('00:00');
    expect(timerText).not.toBe('0:00');
    expect(timerText).toMatch(/\d+:\d{2}/);
  });

  test('Review page passes Answer ID rather than Question ID to explain endpoint', async ({ page }) => {
    let capturedAnswerId: string | null = null;

    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: 'stu_123',
            name: 'Student Tester',
            role: 'student',
            isOnboarded: true,
            departmentId: 'dept_1',
          },
        },
      });
    });

    await page.route('**/practice-sessions/sess_explain_test*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            session: {
              _id: 'sess_explain_test',
              status: 'completed',
              questionsServed: [
                {
                  _id: 'ans_spec_uuid_777',
                  selectedAnswer: 'opt_b',
                  correct: false,
                  timeTaken: 12,
                  explanationStatus: 'NOT_REQUESTED',
                  questionId: {
                    _id: 'q_wrong_uuid_999',
                    questionText: 'What is the speed of light?',
                    type: 'MULTIPLE_CHOICE',
                    options: [
                      { id: 'opt_a', text: '3x10^8 m/s' },
                      { id: 'opt_b', text: '150 km/h' },
                    ],
                    correctAnswer: 'opt_a',
                  },
                },
              ],
            },
          },
        },
      });
    });

    await page.route('**/answers/*/explain', async (route) => {
      const url = route.request().url();
      const match = url.match(/\/answers\/([^/]+)\/explain/);
      if (match) {
        capturedAnswerId = match[1];
      }
      await route.fulfill({
        status: 200,
        json: { success: true, message: 'Explanation queued' },
      });
    });

    await page.goto('/practice/sess_explain_test/review');
    await expect(page.locator('text=Ask AI Tutor for Explanation')).toBeVisible();

    await page.click('button:has-text("Ask AI Tutor for Explanation")');

    await expect(page.getByText(/Generating.*AI explanation/i)).toBeVisible();
    expect(capturedAnswerId).toBe('ans_spec_uuid_777');
    expect(capturedAnswerId).not.toBe('q_wrong_uuid_999');
  });
});
