import { test, expect } from '@playwright/test';

test('Frontend is reachable', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('Backend health API is reachable', async ({ request }) => {
  const response = await request.get('http://localhost:3000/health');
  expect(response.ok()).toBeTruthy();
});
