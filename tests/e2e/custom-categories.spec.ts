import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

let serverProcess: ChildProcess | null = null;

test.describe('Custom Categories E2E Tests', () => {
  test.beforeAll(async () => {
    // Start the classifier with custom categories
    const testFile = join(__dirname, '..', 'fixtures', 'test.txt');
    serverProcess = spawn('bun', [
      'run', 'src/cli.ts',
      '--categories', 'urgent,normal,low,spam',
      '--no-browser',
      '--port', '3002',
      testFile
    ], {
      cwd: join(__dirname, '..', '..'),
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test.afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    }
  });

  test('should display custom categories', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Check that custom categories are displayed
    await expect(page.locator('[data-category="1"]')).toHaveText('[1] urgent');
    await expect(page.locator('[data-category="2"]')).toHaveText('[2] normal');
    await expect(page.locator('[data-category="3"]')).toHaveText('[3] low');
    await expect(page.locator('[data-category="4"]')).toHaveText('[4] spam');

    // Should not have a 5th category
    await expect(page.locator('[data-category="5"]')).toHaveCount(0);
  });

  test('should classify using custom categories', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Classify as "urgent"
    await page.keyboard.press('1');
    await expect(page.locator('#classification-status')).toContainText('urgent');

    // Reclassify as "spam"
    await page.keyboard.press('4');
    await expect(page.locator('#classification-status')).toContainText('spam');

    // Check button selection
    await expect(page.locator('[data-category="4"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-category="1"]')).not.toHaveClass(/selected/);
  });

  test('should handle keyboard shortcuts for all categories', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Test each category
    const categories = ['urgent', 'normal', 'low', 'spam'];

    for (let i = 0; i < categories.length; i++) {
      await page.keyboard.press((i + 1).toString());
      await expect(page.locator('#classification-status')).toContainText(categories[i]);
      await expect(page.locator(`[data-category="${i + 1}"]`)).toHaveClass(/selected/);
    }
  });

  test('should ignore invalid keyboard shortcuts', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Try to use category 5 (doesn't exist)
    await page.keyboard.press('5');
    await expect(page.locator('#classification-status')).toContainText('Unclassified');

    // Try category 9 (doesn't exist)
    await page.keyboard.press('9');
    await expect(page.locator('#classification-status')).toContainText('Unclassified');

    // Valid category should still work
    await page.keyboard.press('2');
    await expect(page.locator('#classification-status')).toContainText('normal');
  });

  test('should work with button clicks for custom categories', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Click each category button
    await page.locator('[data-category="3"]').click(); // low
    await expect(page.locator('#classification-status')).toContainText('low');

    await page.locator('[data-category="1"]').click(); // urgent
    await expect(page.locator('#classification-status')).toContainText('urgent');
  });
});