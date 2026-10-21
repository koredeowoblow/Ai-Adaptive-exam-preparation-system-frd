import { test, expect } from '@playwright/test';

test.describe('Choose Question Count When Starting Practice', () => {
  test('User can choose custom or preset question count in Exam Wizard and start practice', async ({ page }) => {
    let capturedPayload: any = null;

    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token_student');
    });

    // 1. Mock Auth
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: 'stu_123',
            name: 'Jane Doe',
            email: 'jane@eduadapt.local',
            role: 'student',
            isOnboarded: true,
            departmentId: 'dept_cs',
            level: '200L',
          },
        },
      });
    });

    // 2. Mock department courses
    await page.route('**/api/v1/departments/dept_cs/courses*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            items: [
              {
                _id: 'c_cs201',
                title: 'Data Structures and Algorithms',
                code: 'CS201',
                departmentId: 'dept_cs',
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      });
    });

    // 3. Intercept start practice session request
    await page.route('**/api/v1/practice-sessions/start', async (route) => {
      capturedPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            session: {
              _id: 'sess_custom_20',
              courseId: 'c_cs201',
              status: 'active',
              totalQuestions: capturedPayload.totalQuestions || 20,
              questionsServed: [],
            },
          },
        },
      });
    });

    // Navigate to exam-prep
    await page.goto('/exam-prep');

    // Select 200 Level (Year 2 Core)
    await page.click('button:has-text("Year 2 Core")');

    // Confirm Step 2 (Select a course to practice) is shown
    await expect(page.getByText('Select a course to practice')).toBeVisible();

    // Verify Question Count Picker is visible
    await expect(page.getByText('Number of Questions')).toBeVisible();

    // Click preset "20 Qs"
    await page.click('button:has-text("20 Qs")');

    // Start Practice button reflects 20 Qs
    const startBtn = page.getByRole('button', { name: /Start Practice \(20 Qs\)/i });
    await expect(startBtn).toBeVisible();

    // Click start practice
    await startBtn.click();

    // Verify session started with exactly totalQuestions: 20
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.courseId).toBe('c_cs201');
    expect(capturedPayload.totalQuestions).toBe(20);
    expect(capturedPayload.questionType).toBe('MIXED');
  });

  test('User can choose custom question count in Course Details page modal', async ({ page }) => {
    let capturedPayload: any = null;

    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token_student');
    });

    // 1. Mock Auth
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: 'stu_123',
            name: 'Jane Doe',
            email: 'jane@eduadapt.local',
            role: 'student',
            isOnboarded: true,
            departmentId: 'dept_cs',
            level: '200L',
            enrolledCourseIds: ['c_cs201'],
          },
        },
      });
    });

    // 2. Mock student profile
    await page.route('**/api/v1/students/profile', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            _id: 'stu_123',
            userId: 'user_123',
            enrolledCourses: ['c_cs201'],
            totalSessions: 5,
            averageScore: 78,
          },
        },
      });
    });

    // 3. Mock course details & topics
    await page.route('**/api/v1/courses/c_cs201', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            _id: 'c_cs201',
            title: 'Data Structures and Algorithms',
            code: 'CS201',
            departmentId: 'dept_cs',
          },
        },
      });
    });

    await page.route('**/api/v1/courses/c_cs201/topics*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            items: [
              { _id: 'top_1', name: 'Binary Trees', courseId: 'c_cs201' },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      });
    });

    // 4. Intercept start practice session request
    await page.route('**/api/v1/practice-sessions/start', async (route) => {
      capturedPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            session: {
              _id: 'sess_custom_15',
              courseId: 'c_cs201',
              status: 'active',
              totalQuestions: capturedPayload.totalQuestions || 15,
              questionsServed: [],
            },
          },
        },
      });
    });

    // Navigate to course details
    await page.goto('/courses/c_cs201');

    // Click "Choose Question Count..."
    const customizeBtn = page.getByRole('button', { name: /Choose Question Count/i });
    await expect(customizeBtn).toBeVisible();
    await customizeBtn.click();

    // Modal opens
    await expect(page.getByText('Customize Practice Session')).toBeVisible();

    // Select 15 Qs
    await page.click('button:has-text("15 Qs")');

    // Submit modal
    await page.click('button:has-text("Start Practice (15 Qs)")');

    // Verify session started with exactly totalQuestions: 15
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.courseId).toBe('c_cs201');
    expect(capturedPayload.totalQuestions).toBe(15);
  });
});
