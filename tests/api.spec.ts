import { test, expect } from '@playwright/test';

test.describe('API Connections', () => {
  test('Backend server responds with JSON on health endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toBeDefined();
  });
});
