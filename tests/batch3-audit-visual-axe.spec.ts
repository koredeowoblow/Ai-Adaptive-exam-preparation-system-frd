// Stubs backend auth and domain APIs for deterministic multi-viewport screenshot capture and axe accessibility audits.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const VIEWPORTS = [
  { width: 375, height: 812, name: '375' },
  { width: 768, height: 1024, name: '768' },
  { width: 1440, height: 900, name: '1440' },
];

const THEMES = ['light', 'dark'] as const;

// Helper to setup common mock endpoints
async function setupMocks(page: any, role: 'student' | 'admin' = 'student') {
  await page.route('**/api/v1/**', async (route: any) => {
    const url = route.request().url();

    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: role === 'admin' ? 'admin_001' : 'stu_001',
            name: role === 'admin' ? 'System Administrator' : 'Alex Mercer',
            email: role === 'admin' ? 'admin@eduadapt.local' : 'alex@eduadapt.local',
            role,
            isOnboarded: true,
            departmentId: 'dept_cs',
            level: 300,
          },
        },
      });
    }

    if (url.includes('/analytics/dashboard') || url.includes('/analytics/overview')) {
      return route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            stats: {
              globalMasteryRate: 78,
              totalExamsConducted: 1420,
              activeExamineesCount: 89,
              activeDepartmentsCount: 6,
              flaggedIncidentsCount: 3,
            },
            eloScore: 1350,
            topicsMastered: 14,
            streakDays: 7,
            totalExamsTaken: 24,
            weakTopics: [{ _id: 't_os', name: 'Operating Systems - Concurrency', accuracy: 42 }],
            strongTopics: [{ _id: 't_algo', name: 'Algorithms & Data Structures', accuracy: 92 }],
            recentSessions: [
              { _id: 'sess_123', courseCode: 'CSC301', score: 85, completedAt: '2026-10-12T14:30:00Z', totalQuestions: 10 },
            ],
            departmentSummary: [
              { departmentId: 'dept_cs', name: 'Computer Science', averageScore: 78, totalStudents: 140 },
            ],
          },
        },
      });
    }

    if (url.includes('/courses')) {
      const courseItems = [
        {
          _id: 'c_os',
          code: 'CSC301',
          title: 'Operating Systems & Architecture',
          description: 'Processes, concurrency, memory paging, and storage subsystems.',
          level: 300,
          topicCount: 8,
          enrolledCount: 64,
          departmentId: { _id: 'dept_cs', name: 'Computer Science' },
        },
        {
          _id: 'c_ds',
          code: 'CSC201',
          title: 'Data Structures and Algorithms',
          description: 'Trees, heaps, graph traversals, and asymptotic complexity.',
          level: 200,
          topicCount: 12,
          enrolledCount: 120,
          departmentId: { _id: 'dept_cs', name: 'Computer Science' },
        },
      ];
      return route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            items: courseItems,
            total: 2,
            page: 1,
            totalPages: 1,
          },
        },
      });
    }

    if (url.includes('/topics')) {
      return route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            items: [
              { _id: 'top_1', name: 'Memory Management', courseId: 'c_os', order: 1 },
              { _id: 'top_2', name: 'Process Synchronization', courseId: 'c_os', order: 2 },
            ],
            total: 2,
            page: 1,
            totalPages: 1,
          },
        },
      });
    }

    if (url.includes('/practice-sessions/sess_123')) {
      return route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            session: {
              _id: 'sess_123',
              status: url.includes('review') ? 'completed' : 'active',
              courseId: 'c_os',
              departmentId: 'dept_cs',
              questionsServed: [
                {
                  _id: 'ans_1',
                  selectedAnswer: 'A',
                  correct: true,
                  timeTaken: 14,
                  questionId: {
                    _id: 'q_1',
                    questionText: 'Which paging replacement algorithm suffers from Belady’s Anomaly?',
                    type: 'MULTIPLE_CHOICE',
                    options: [
                      { id: 'A', text: 'FIFO (First-In, First-Out)' },
                      { id: 'B', text: 'LRU (Least Recently Used)' },
                      { id: 'C', text: 'Optimal (OPT)' },
                    ],
                    correctAnswer: 'A',
                    difficulty: 3,
                    explanation: 'FIFO can result in more page faults when allocated additional frames.',
                  },
                },
                {
                  _id: 'ans_2',
                  selectedAnswer: 'B',
                  correct: false,
                  timeTaken: 25,
                  explanationStatus: 'NOT_REQUESTED',
                  questionId: {
                    _id: 'q_2',
                    questionText: 'Explain the four Coffman conditions required for resource deadlock.',
                    type: 'THEORY',
                    difficulty: 4,
                    modelAnswer: 'Mutual exclusion, hold and wait, no preemption, and circular wait.',
                    rubric: [{ point: 'Identifies all 4 conditions clearly', weight: 1.0 }],
                  },
                },
              ],
            },
          },
        },
      });
    }

    if (url.includes('/departments')) {
      return route.fulfill({
        status: 200,
        json: {
          success: true,
          data: [
            { _id: 'dept_cs', name: 'Computer Science', code: 'CSC', courseCount: 14, studentCount: 280 },
            { _id: 'dept_se', name: 'Software Engineering', code: 'SEN', courseCount: 10, studentCount: 190 },
          ],
        },
      });
    }

    if (url.includes('/users') || url.includes('/students')) {
      return route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            items: [
              { _id: 'u_1', name: 'Alice Walker', email: 'alice@eduadapt.local', role: 'student', level: '300L', departmentId: 'dept_cs', createdAt: '2026-09-01T10:00:00Z', isOnboarded: true },
              { _id: 'u_2', name: 'Bob Roberts', email: 'bob@eduadapt.local', role: 'student', level: '200L', departmentId: 'dept_cs', createdAt: '2026-09-02T10:00:00Z', isOnboarded: true },
            ],
            total: 2,
            page: 1,
            totalPages: 1,
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
                _id: 'q_1',
                questionText: 'Which paging replacement algorithm suffers from Belady’s Anomaly?',
                type: 'MULTIPLE_CHOICE',
                difficulty: 3,
                topicId: { _id: 'top_1', name: 'Memory Management' },
                options: [{ id: 'A', text: 'FIFO' }, { id: 'B', text: 'LRU' }],
                correctAnswer: 'A',
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      });
    }

    if (url.includes('/ai-chat') || url.includes('/tutor')) {
      return route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            history: [
              { role: 'assistant', content: 'Hello Alex! I am your AI Exam Tutor. What topic shall we master today?' },
            ],
          },
        },
      });
    }

    return route.fulfill({ status: 200, json: { success: true, data: {} } });
  });
}

test.describe('Batch 3: Visual Screenshots & Accessibility (Axe-Core)', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots', { recursive: true });
    }
  });

  const screens = [
    { name: 'login', path: '/login', role: 'student' as const, isPublic: true },
    { name: 'register', path: '/register', role: 'student' as const, isPublic: true },
    { name: 'student_dashboard', path: '/dashboard', role: 'student' as const, isPublic: false },
    { name: 'active_exam', path: '/exam/sess_123', role: 'student' as const, isPublic: false },
    { name: 'review_page', path: '/practice/sess_123/review', role: 'student' as const, isPublic: false },
    { name: 'courses', path: '/courses', role: 'student' as const, isPublic: false },
    { name: 'ai_chat', path: '/ai-chat', role: 'student' as const, isPublic: false },
    { name: 'profile', path: '/profile', role: 'student' as const, isPublic: false },
    { name: 'admin_overview', path: '/admin', role: 'admin' as const, isPublic: false },
    { name: 'admin_users', path: '/admin/users', role: 'admin' as const, isPublic: false },
    { name: 'admin_questions', path: '/admin/questions', role: 'admin' as const, isPublic: false },
  ];

  for (const screen of screens) {
    for (const theme of THEMES) {
      test(`${screen.name} in ${theme} mode across viewports`, async ({ page }) => {
        await setupMocks(page, screen.role);

        await page.addInitScript(({ theme, isPublic, role }) => {
          localStorage.setItem('theme', theme);
          document.documentElement.setAttribute('data-theme', theme);
          if (!isPublic) {
            localStorage.setItem('accessToken', 'mock_token_' + role);
          } else {
            localStorage.removeItem('accessToken');
          }
        }, { theme, isPublic: screen.isPublic, role: screen.role });

        for (const vp of VIEWPORTS) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(screen.path, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(300);

          // Force theme attribute after load
          await page.evaluate((t) => {
            document.documentElement.setAttribute('data-theme', t);
          }, theme);

          const screenshotPath = `screenshots/${screen.name}_${theme}_${vp.name}w.png`;
          await page.screenshot({ path: screenshotPath, fullPage: false });

          // Layout check: Verify horizontal overflow does not break
          const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth + 5;
          });
          expect(overflow).toBe(false);
        }

        // Run axe accessibility analysis at desktop (1440w)
        await page.waitForTimeout(300);
        const axeResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast']) // color-contrast computed separately via CSS tokens
          .analyze();

        const criticalOrSerious = axeResults.violations.filter((v) =>
          v.impact === 'critical' || v.impact === 'serious'
        );

        if (criticalOrSerious.length > 0) {
          console.warn(
            `[Axe Warning] ${screen.name} (${theme}): ${criticalOrSerious.length} serious/critical violations:`,
            criticalOrSerious.map((v) => `${v.id}: ${v.description}`)
          );
        }

        expect(criticalOrSerious).toHaveLength(0);
      });
    }
  }
});
