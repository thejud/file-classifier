import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

let serverProcess: ChildProcess | null = null;

test.describe('CSV Mode E2E Tests', () => {
  test.beforeAll(async () => {
    // Start the classifier in CSV mode with test data
    const testFile = join(__dirname, '..', 'fixtures', 'test.csv');
    serverProcess = spawn('bun', ['run', 'src/cli.ts', '--reset', '--csv', '--no-browser', '--port', '3001', testFile], {
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

  test('should load CSV data correctly', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Check filename shows CSV mode
    await expect(page.locator('#filename')).toContainText('test.csv (CSV)');

    // Should show CSV table
    await expect(page.locator('.csv-table')).toBeVisible();

    // Should show the first row's data
    await expect(page.locator('.csv-table')).toContainText('John Doe');
    await expect(page.locator('.csv-table')).toContainText('john@example.com');
  });

  test('should navigate between CSV rows', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Should start at first row (1/3)
    await expect(page.locator('#nav-progress')).toContainText('1/3');
    await expect(page.locator('.csv-table')).toContainText('John Doe');

    // Navigate to next row
    await page.locator('#next-btn').click();
    await expect(page.locator('#nav-progress')).toContainText('2/3');
    await expect(page.locator('.csv-table')).toContainText('Jane Smith');

    // Navigate to third row
    await page.locator('#next-btn').click();
    await expect(page.locator('#nav-progress')).toContainText('3/3');
    await expect(page.locator('.csv-table')).toContainText('Bob Johnson');

    // Should not be able to navigate further
    await expect(page.locator('#next-btn')).toBeDisabled();

    // Navigate back
    await page.locator('#prev-btn').click();
    await expect(page.locator('.csv-table')).toContainText('Jane Smith');
  });

  test('should classify CSV rows independently', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Classify first row as "good" (will auto-advance to next row)
    await page.keyboard.press('1');

    // Auto-advance should move to second row (2/3)
    await expect(page.locator('#nav-progress')).toContainText('2/3');
    await expect(page.locator('#classification-status')).toContainText('Unclassified');

    // Classify second row as "bad" (will auto-advance to third row)
    await page.keyboard.press('2');

    // Auto-advance should move to third row (3/3)
    await expect(page.locator('#nav-progress')).toContainText('3/3');

    // Navigate back to first row
    await page.locator('#prev-btn').click();
    await page.locator('#prev-btn').click();

    // Should still be classified as "good"
    await expect(page.locator('#classification-status')).toContainText('good');
    await expect(page.locator('#nav-progress')).toContainText('1/3');
  });

  test('should show correct statistics for CSV mode', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Initially no classifications (should be fresh session or cleared)
    await expect(page.locator('#stats-remaining')).toContainText('⏳3');

    // Classify first item (will auto-advance to item 2)
    await page.keyboard.press('1');

    // Stats should update
    await expect(page.locator('#stats-classified')).toContainText('✅1');
    await expect(page.locator('#stats-remaining')).toContainText('⏳2');

    // Classify second item (already on item 2 due to auto-advance)
    await page.keyboard.press('2');

    // Stats should update again
    await expect(page.locator('#stats-classified')).toContainText('✅2');
    await expect(page.locator('#stats-remaining')).toContainText('⏳1');
  });

  test('should handle keyboard navigation in CSV mode', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Use arrow keys to navigate
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#nav-progress')).toContainText('2/3');

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#nav-progress')).toContainText('1/3');

    // Use spacebar to skip
    await page.keyboard.press(' ');
    await expect(page.locator('#nav-progress')).toContainText('2/3');
  });
});