import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

let serverProcess: ChildProcess | null = null;

test.describe('Web Classifier E2E Tests', () => {
  test.beforeAll(async () => {
    // Start the classifier with test data
    const testFile = join(__dirname, '..', 'fixtures', 'test.txt');
    serverProcess = spawn('bun', ['run', 'src/cli.ts', '--reset', '--no-browser', '--port', '3000', testFile], {
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

  test('should load the classification interface', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check that the main elements are present
    await expect(page.locator('.title')).toBeVisible();
    await expect(page.locator('#content-display')).toBeVisible();
    await expect(page.locator('#category-buttons')).toBeVisible();

    // Check default categories
    await expect(page.locator('[data-category="1"]')).toHaveText('[1] good');
    await expect(page.locator('[data-category="2"]')).toHaveText('[2] bad');
    await expect(page.locator('[data-category="3"]')).toHaveText('[3] review');
  });

  test('should display file content', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check that file content is displayed
    await expect(page.locator('.file-content')).toBeVisible();
    await expect(page.locator('.line')).toBeTruthy();

    // Check filename in header
    await expect(page.locator('#filename')).toContainText('test.txt');
  });

  test('should classify items using keyboard shortcuts', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Initially should be unclassified
    await expect(page.locator('#classification-status')).toContainText('Unclassified');

    // Use keyboard shortcut to classify as "good" (category 1)
    await page.keyboard.press('1');

    // Should show as classified
    await expect(page.locator('#classification-status')).toContainText('good');

    // Category button should be selected
    await expect(page.locator('[data-category="1"]')).toHaveClass(/selected/);
  });

  test('should classify items using button clicks', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Click on "bad" category
    await page.locator('[data-category="2"]').click();

    // Should show as classified
    await expect(page.locator('#classification-status')).toContainText('bad');

    // Button should be selected
    await expect(page.locator('[data-category="2"]')).toHaveClass(/selected/);
  });

  test('should update statistics after classification', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Initially no classifications
    await expect(page.locator('#stats-classified')).toContainText('✅0');
    await expect(page.locator('#stats-remaining')).toContainText('⏳1');

    // Classify the item
    await page.keyboard.press('1');

    // Wait a bit for the stats to update
    await page.waitForTimeout(100);

    // Stats should be updated
    await expect(page.locator('#stats-classified')).toContainText('✅1');
    await expect(page.locator('#stats-remaining')).toContainText('⏳0');
  });

  test('should handle navigation with multiple items', async ({ page }) => {
    // This test would need multiple items, which our current test.txt doesn't provide
    // For now, just verify navigation buttons exist and are properly disabled
    await page.goto('http://localhost:3000');

    // With only one item, prev should be disabled, next should be disabled
    await expect(page.locator('#prev-btn')).toBeDisabled();
    await expect(page.locator('#next-btn')).toBeDisabled();

    // Progress should show 1/1
    await expect(page.locator('#nav-progress')).toContainText('1/1');
  });

  test('should persist classifications across page refresh', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Classify the item
    await page.keyboard.press('2'); // bad
    await expect(page.locator('#classification-status')).toContainText('bad');

    // Refresh the page
    await page.reload();

    // Classification should persist
    await expect(page.locator('#classification-status')).toContainText('bad');
    await expect(page.locator('[data-category="2"]')).toHaveClass(/selected/);
  });
});