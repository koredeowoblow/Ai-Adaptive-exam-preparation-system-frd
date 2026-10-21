import { test, expect } from '@playwright/test';
import { normalizeChatText, repairUnclosedFences } from '../src/features/ai-study/utils/chatTextNormalizer';

// ============================================================================
// 1. UNIT TESTS: Normalizer & Math Protection
// ============================================================================
test.describe('chatTextNormalizer Unit Tests', () => {
  test('normalizes line endings and trims whitespace', () => {
    const input = '   \r\nHello world\r\nTest\r   ';
    const { normalizedMarkdown } = normalizeChatText(input);
    expect(normalizedMarkdown).toBe('Hello world\nTest');
  });

  test('collapses 3+ blank lines into 2', () => {
    const input = 'Paragraph 1\n\n\n\n\nParagraph 2\n   \n   \n   \nParagraph 3';
    const { normalizedMarkdown } = normalizeChatText(input);
    expect(normalizedMarkdown).toBe('Paragraph 1\n\n\nParagraph 2\n\n\nParagraph 3');
  });

  test('repairs unclosed code fence at the end', () => {
    const unclosed = 'Here is code:\n```typescript\nconst a = 10;\nconsole.log(a);';
    const repaired = repairUnclosedFences(unclosed);
    expect(repaired).toBe('Here is code:\n```typescript\nconst a = 10;\nconsole.log(a);\n```\n');

    const { normalizedMarkdown } = normalizeChatText(unclosed);
    expect(normalizedMarkdown).toContain('```typescript\nconst a = 10;\nconsole.log(a);\n```');
  });

  test('converts literal escaped sequences outside code blocks only', () => {
    const input = 'Line 1\\nLine 2 with \\`code\\`\n```python\nprint("\\n")\nx = "\\`"\n```\nLine 3';
    const { normalizedMarkdown } = normalizeChatText(input);

    // Outside code blocks: \\n -> \n, \\` -> `
    expect(normalizedMarkdown).toContain('Line 1\nLine 2 with `code`');
    expect(normalizedMarkdown).toContain('Line 3');

    // Inside code block: literal \n and \` are preserved!
    expect(normalizedMarkdown).toContain('print("\\n")');
    expect(normalizedMarkdown).toContain('x = "\\`"');
  });

  test('protects math with underscores and asterisks from markdown emphasis', () => {
    const input = 'Calculate $x_1 * y_2 = z_{total}$ and display $$\\sum_{i=1}^n a_i * b_i$$';
    const { normalizedMarkdown, mathStore } = normalizeChatText(input);

    // Tokens replace formulas so markdown never sees underscores or asterisks
    expect(normalizedMarkdown).not.toContain('$x_1 * y_2 = z_{total}$');
    expect(normalizedMarkdown).toContain('MATHINLINE');
    expect(normalizedMarkdown).toContain('MATHDISPLAY');

    // mathStore holds original equations intact
    const storedFormulas = Array.from(mathStore.values());
    expect(storedFormulas).toContain('$x_1 * y_2 = z_{total}$');
    expect(storedFormulas).toContain('$$\\sum_{i=1}^n a_i * b_i$$');
  });

  test('does not mangle code blocks containing dollar signs or formulas', () => {
    const input = '```bash\necho $PATH\nx="$val_1 * 2"\n```\nInline `$not_math` code';
    const { normalizedMarkdown, mathStore } = normalizeChatText(input);

    expect(normalizedMarkdown).toContain('echo $PATH');
    expect(normalizedMarkdown).toContain('x="$val_1 * 2"');
    expect(normalizedMarkdown).toContain('`$not_math`');
    expect(mathStore.size).toBe(0);
  });

  test('preserves bold, italic, and emoji without altering line breaks', () => {
    const input = '1. **Core Concept 🚀**: This is *very* important ✨ for exams.\n2. **Second Concept**: Review now.';
    const { normalizedMarkdown } = normalizeChatText(input);

    expect(normalizedMarkdown).toContain('1. **Core Concept 🚀**: This is *very* important ✨ for exams.');
    expect(normalizedMarkdown).toContain('2. **Second Concept**: Review now.');
  });

  test('handles very long messages without truncation or crashing', () => {
    const longLines = Array.from({ length: 200 }, (_, i) => `${i + 1}. **Topic ${i + 1}**: Detail $x_{${i}} * y_{${i}}$ explanation.`).join('\n');
    const { normalizedMarkdown, mathStore } = normalizeChatText(longLines);

    expect(normalizedMarkdown).toContain('200. **Topic 200**:');
    expect(mathStore.size).toBe(200);
  });
});

// ============================================================================
// 2. BROWSER TESTS: Rendering, Hostile Inputs, and Accessibility
// ============================================================================
test.describe('ChatMessageRenderer Browser Suite', () => {
  const mockUser = {
    id: 'stu_001',
    _id: 'stu_001',
    name: 'Ada Lovelace',
    email: 'ada@university.edu.ng',
    role: 'student',
    departmentId: 'dept_cs',
    isOnboarded: true,
  };

  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions for copy button test
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Add auth token to localStorage so route guards don't redirect to /login
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock_jwt_token');
    });

    // Intercept auth
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: mockUser },
      });
    });

    // Intercept department courses
    await page.route('**/departments/*/courses*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            items: [
              {
                _id: 'course_csc401',
                courseCode: 'CSC401',
                title: 'Organization of Programming Languages',
                departmentId: 'dept_cs',
                units: 3,
              },
            ],
            limit: 50,
            nextCursor: null,
          },
        },
      });
    });

    // Intercept course topics
    await page.route('**/courses/*/topics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            items: [
              { _id: 'top_1', name: 'Language Paradigms', courseId: 'course_csc401' },
              { _id: 'top_2', name: 'Syntax and Semantics', courseId: 'course_csc401' },
            ],
            limit: 50,
            nextCursor: null,
          },
        },
      });
    });
  });

  test('renders numbered list with bold items without raw ** visible', async ({ page }) => {
    const replyContent = [
      'Here are key concepts for CSC401:',
      '',
      '1. **Language Syntax and Semantics:** Defines formal grammar and semantic execution rules.',
      '2. **Compilation vs Interpretation:** Compilers translate ahead-of-time whereas interpreters execute directly.',
      '3. **Type Systems:** Strongly-typed languages ensure type safety at compile or run time.',
    ].join('\n');

    await page.route('**/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: { reply: replyContent } },
      });
    });

    await page.goto('/ai-chat');
    await page.waitForLoadState('networkidle');

    // Click first topic chip to send message
    const chip = page.locator('button:has-text("Language Paradigms")').first();
    await chip.waitFor({ state: 'visible', timeout: 10000 });
    await chip.click();
    await page.locator('button[aria-label="Send message to AI Tutor"]').click();

    // Wait for AI reply to render
    const replyItem = page.locator('ol li:has-text("Language Syntax and Semantics:")');
    await replyItem.waitFor({ state: 'visible', timeout: 10000 });

    // Assert NO raw ** visible anywhere in message text
    const textContent = await page.locator('[role="log"]').innerText();
    expect(textContent).not.toContain('**');

    // Assert bold styling is in <strong> tags
    const strongTags = page.locator('ol li strong');
    await expect(strongTags.first()).toHaveText('Language Syntax and Semantics:');
    await expect(strongTags).toHaveCount(3);
  });

  test('renders fenced code block with accessible Copy button and focus ring', async ({ page }) => {
    const replyContent = [
      'Here is a quick TypeScript example:',
      '',
      '```typescript',
      'interface Student {',
      '  id: string;',
      '  score: number;',
      '}',
      'const compute = (s: Student): number => s.score * 2;',
      '```',
    ].join('\n');

    await page.route('**/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: { reply: replyContent } },
      });
    });

    await page.goto('/ai-chat');
    await page.waitForLoadState('networkidle');

    const chip = page.locator('button:has-text("Language Paradigms")').first();
    await chip.waitFor({ state: 'visible', timeout: 10000 });
    await chip.click();
    await page.locator('button[aria-label="Send message to AI Tutor"]').click();

    // Verify code block appears with language label
    const langLabel = page.locator('text=TYPESCRIPT').first();
    await langLabel.waitFor({ state: 'visible', timeout: 10000 });

    // Verify Copy button accessibility
    const copyBtn = page.locator('button[aria-label="Copy code to clipboard"]').first();
    await expect(copyBtn).toBeVisible();

    // Test keyboard focus
    await copyBtn.focus();
    await expect(copyBtn).toBeFocused();

    // Click Copy button and verify "Copied" feedback
    await copyBtn.click();
    await expect(page.locator('text=Copied')).toBeVisible();
  });

  test('renders tables inside overflow-x-auto container', async ({ page }) => {
    const replyContent = [
      'Comparison table:',
      '',
      '| Paradigm | Characteristic | Example |',
      '| :--- | :--- | :--- |',
      '| Imperative | State mutation | C, Pascal |',
      '| Functional | Pure functions | Haskell, Lisp |',
      '| Logic | Horn clauses | Prolog |',
    ].join('\n');

    await page.route('**/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: { reply: replyContent } },
      });
    });

    await page.goto('/ai-chat');
    await page.waitForLoadState('networkidle');

    const chip = page.locator('button:has-text("Language Paradigms")').first();
    await chip.waitFor({ state: 'visible', timeout: 10000 });
    await chip.click();
    await page.locator('button[aria-label="Send message to AI Tutor"]').click();

    // Verify table and overflow container
    const tableContainer = page.locator('.overflow-x-auto table').first();
    await tableContainer.waitFor({ state: 'visible', timeout: 10000 });

    const ths = tableContainer.locator('th');
    await expect(ths).toHaveCount(3);
    const rows = tableContainer.locator('tbody tr');
    await expect(rows).toHaveCount(3);
  });

  test('renders math equations cleanly without layout breaks', async ({ page }) => {
    const replyContent = [
      'Examine the asymptotic complexity:',
      '',
      'Given $T(n) = 2T(n/2) + n_1 * k_2$, we apply Master Theorem: $O(n \\log n)$.',
    ].join('\n');

    await page.route('**/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: { reply: replyContent } },
      });
    });

    await page.goto('/ai-chat');
    await page.waitForLoadState('networkidle');

    const chip = page.locator('button:has-text("Language Paradigms")').first();
    await chip.waitFor({ state: 'visible', timeout: 10000 });
    await chip.click();
    await page.locator('button[aria-label="Send message to AI Tutor"]').click();

    // Wait for KaTeX math container
    const katexEl = page.locator('.katex').first();
    await katexEl.waitFor({ state: 'visible', timeout: 10000 });

    // Assert no raw math delimiter or broken markup in visible text
    const textContent = await page.locator('[role="log"]').innerText();
    expect(textContent).not.toContain('$T(n)');
  });

  test('renders hostile input as safe, inert text with NO execution', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    const hostileReply = [
      '# Hostile Input Test',
      '',
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '',
      '[Bad JS Link](javascript:alert(1))',
      '',
      '[Bad Data Link](data:text/html,<script>alert(1)</script>)',
      '',
      '[Safe Link](https://eduadapt.edu.ng/faq)',
      '',
      '![Evil Image](http://evil.com/x.png)',
      '',
      '- List item with <script>alert(1)</script> embedded',
    ].join('\n');

    await page.route('**/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, data: { reply: hostileReply } },
      });
    });

    await page.goto('/ai-chat');
    await page.waitForLoadState('networkidle');

    const chip = page.locator('button:has-text("Language Paradigms")').first();
    await chip.waitFor({ state: 'visible', timeout: 10000 });
    await chip.click();
    await page.locator('button[aria-label="Send message to AI Tutor"]').click();

    // Wait for message to render
    const heading = page.locator('h3:has-text("Hostile Input Test")');
    await heading.waitFor({ state: 'visible', timeout: 10000 });

    // 1. Assert no dialog was triggered
    expect(alertTriggered).toBe(false);

    // 2. Assert NO <script> tag exists inside the message log
    const scriptCount = await page.locator('[role="log"] script').count();
    expect(scriptCount).toBe(0);

    // 3. Assert NO <img> tag exists inside the message log
    const imgCount = await page.locator('[role="log"] img:not([alt*="avatar"])').count();
    expect(imgCount).toBe(0);

    // 4. Assert unsafe links are NOT rendered as <a> links
    const jsLinkCount = await page.locator('[role="log"] a[href^="javascript:"]').count();
    expect(jsLinkCount).toBe(0);

    const dataLinkCount = await page.locator('[role="log"] a[href^="data:"]').count();
    expect(dataLinkCount).toBe(0);

    // Unsafe link text should still render as plain span text
    await expect(page.locator('text=Bad JS Link').first()).toBeVisible();
    await expect(page.locator('text=Bad Data Link').first()).toBeVisible();

    // 5. Assert safe link DOES render as <a> with target="_blank" and rel="noopener noreferrer"
    const safeLink = page.locator('a:has-text("Safe Link")');
    await expect(safeLink).toBeVisible();
    await expect(safeLink).toHaveAttribute('href', 'https://eduadapt.edu.ng/faq');
    await expect(safeLink).toHaveAttribute('target', '_blank');
    await expect(safeLink).toHaveAttribute('rel', 'noopener noreferrer');

    // 6. Assert evil image tag rendered as alt placeholder
    await expect(page.locator('text=[Image: Evil Image]').first()).toBeVisible();

    // 7. Message list maintains role="log"
    const roleLog = page.locator('[role="log"]');
    await expect(roleLog).toBeVisible();
  });
});
