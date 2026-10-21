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
  level: '200L',
  nextExamDate: '2026-11-20',
  courseExamDates: {
    c1: '2026-11-20',
    c2: '2026-11-25',
  },
  isOnboarded: true,
};

const mockCourses = [
  {
    _id: 'c1',
    code: 'CSC201',
    title: 'Data Structures and Algorithms',
    level: 200,
  },
  {
    _id: 'c2',
    code: 'CSC202',
    title: 'Database Management Systems',
    level: 200,
  },
];

const mockPlan = {
  _id: 'plan_12345',
  studentId: 'stu_001',
  status: 'active',
  startDate: '2026-10-22',
  endDate: '2026-11-25',
  totalWeeks: 5,
  skeletonVersion: 1,
  completionPercentage: 25,
  totalTasks: 20,
  completedTasks: 5,
  stale: false,
  examDatesSnapshot: {
    c1: '2026-11-20',
    c2: '2026-11-25',
  },
  weeks: [
    {
      weekNumber: 1,
      startDate: '2026-10-22',
      endDate: '2026-10-28',
      status: 'READY',
      generatingStartedAt: null,
      summary: 'Week 1: Core Fundamentals & Topic Mastery',
      days: [
        {
          date: '2026-10-22',
          dayName: 'Thursday',
          tasks: [
            {
              _id: 'task_001',
              courseId: {
                _id: 'c1',
                code: 'CSC201',
                title: 'Data Structures',
              },
              title: 'CSC201: Binary Search Trees Drill',
              description: 'Review tree balancing and asymptotic search complexities.',
              type: 'STUDY',
              durationMinutes: 45,
              completedAt: null,
            },
            {
              _id: 'task_002',
              courseId: {
                _id: 'c1',
                code: 'CSC201',
                title: 'Data Structures',
              },
              title: 'CSC201: BST Practice Set',
              description: '10 adaptive practice questions on balanced trees.',
              type: 'PRACTICE',
              durationMinutes: 30,
              completedAt: '2026-10-22T08:00:00.000Z',
            },
          ],
        },
        {
          date: '2026-10-23',
          dayName: 'Friday',
          tasks: [
            {
              _id: 'task_003',
              courseId: {
                _id: 'c2',
                code: 'CSC202',
                title: 'Database Systems',
              },
              title: 'CSC202: Relational Normalization Drill',
              description: 'Study 1NF through BCNF functional dependencies.',
              type: 'STUDY',
              durationMinutes: 45,
              completedAt: null,
            },
          ],
        },
      ],
    },
    {
      weekNumber: 2,
      startDate: '2026-10-29',
      endDate: '2026-11-04',
      status: 'NOT_STARTED',
      generatingStartedAt: null,
      summary: 'Week 2: Advanced Topics',
      days: [],
    },
  ],
};

async function setupStudyPlannerMocks(page: any) {
  // Abort external fonts
  await page.route('**fonts.googleapis.com**', (route: any) => route.abort());
  await page.route('**fonts.gstatic.com**', (route: any) => route.abort());

  // Set fake local storage auth
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock_jwt_token');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  // Mock auth check
  await page.route('**/auth/me', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        success: true,
        data: mockUser,
      },
    });
  });

  // Mock student profile
  await page.route('**/students/profile', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        success: true,
        data: {
          ...mockUser,
          enrolledCourses: mockCourses,
          totalSessions: 12,
          averageScore: 78,
        },
      },
    });
  });

  // Mock enrolled courses
  await page.route('**/students/courses', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        success: true,
        data: mockCourses,
      },
    });
  });

  // Mock active study plan
  await page.route('**/study-plans/active', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        success: true,
        data: mockPlan,
      },
    });
  });
}

test.describe('Study Planner UI Tests', () => {
  test('renders active study plan with weekly skeleton and task toggles', async ({ page }) => {
    await setupStudyPlannerMocks(page);

    let toggleCalled = false;
    await page.route('**/study-plans/*/tasks/*', async (route) => {
      toggleCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            task: {
              _id: 'task_001',
              title: 'CSC201: Binary Search Trees Drill',
              completedAt: new Date().toISOString(),
            },
            totalTasks: 20,
            completedTasks: 6,
            completionPercentage: 30,
          },
        },
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/study-planner');

    // Verify title and active plan pill
    await expect(page.getByRole('heading', { name: 'Adaptive Study Planner' })).toBeVisible();
    await expect(page.getByText('Active Plan')).toBeVisible();

    // Verify completion metrics
    await expect(page.getByText('Overall Preparation Progress')).toBeVisible();
    await expect(page.getByText('25% Complete')).toBeVisible();

    // Verify week tabs
    await expect(page.locator('#tab-week-1')).toBeVisible();
    await expect(page.locator('#tab-week-2')).toBeVisible();

    // Verify task visibility
    const taskTitle = page.getByText('CSC201: Binary Search Trees Drill');
    await expect(taskTitle).toBeVisible();

    // Capture screenshot of desktop active study plan (light)
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'study_planner_desktop_light.png'),
      fullPage: true,
    });

    // Switch to dark theme and capture dark screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'study_planner_desktop_dark.png'),
      fullPage: true,
    });

    // Toggle task completion
    const toggleBtn = page.locator('#task-toggle-task_001');
    await toggleBtn.click();
    expect(toggleCalled).toBe(true);
  });

  test('opens Course Exam Dates modal and saves updated course dates', async ({ page }) => {
    await setupStudyPlannerMocks(page);

    let saveCalledWith: any = null;
    await page.route('**/students/course-exam-dates', async (route) => {
      saveCalledWith = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            ...mockUser,
            courseExamDates: saveCalledWith?.dates || {},
          },
        },
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/study-planner');

    // Open Course Exam Dates modal
    const openDatesBtn = page.locator('#btn-manage-course-exam-dates');
    await openDatesBtn.click();

    // Verify modal header and enrolled course inputs
    await expect(page.getByText('Course Exam Dates (Single Source of Truth)')).toBeVisible();
    await expect(page.getByText('Data Structures and Algorithms')).toBeVisible();
    await expect(page.getByText('Database Management Systems')).toBeVisible();

    // Capture screenshot of Course Exam Dates modal
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'study_planner_dates_modal.png'),
    });

    // Click Save All Dates
    const saveBtn = page.locator('#btn-save-course-exam-dates');
    await saveBtn.click();

    expect(saveCalledWith).not.toBeNull();
  });

  test('renders responsively on mobile viewport (390px)', async ({ page }) => {
    await setupStudyPlannerMocks(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/study-planner');

    await expect(page.getByRole('heading', { name: 'Adaptive Study Planner' })).toBeVisible();
    await expect(page.locator('#tab-week-1')).toBeVisible();

    // Capture mobile screenshot (light)
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'study_planner_mobile_light.png'),
      fullPage: true,
    });

    // Switch to dark theme and capture dark mobile screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'study_planner_mobile_dark.png'),
      fullPage: true,
    });
  });
});
