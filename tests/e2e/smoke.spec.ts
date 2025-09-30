import { test, expect } from '@playwright/test';

/**
 * Minimal smoke tests - fast execution (<30s target)
 * Uses the single webServer defined in playwright.config.ts
 */

test.describe('File Classifier Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Check main UI elements are present
    await expect(page.locator('.title')).toBeVisible();
    await expect(page.locator('#content-display')).toBeVisible();
    await expect(page.locator('#category-buttons')).toBeVisible();
  });

  test('should display file content and categories', async ({ page }) => {
    await page.goto('/');

    // Check filename is displayed
    await expect(page.locator('#filename')).toContainText('test.txt');

    // Check default categories exist
    await expect(page.locator('[data-category="1"]')).toBeVisible();
    await expect(page.locator('[data-category="2"]')).toBeVisible();
    await expect(page.locator('[data-category="3"]')).toBeVisible();
  });

  test('should classify item with keyboard shortcut', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Press key to classify
    await page.keyboard.press('1');

    // Wait for classification to complete (give it time for API call)
    await page.waitForTimeout(500);

    // Check that status updated (should NOT be Unclassified anymore)
    const status = page.locator('#classification-status');
    await expect(status).not.toContainText('Unclassified');

    // Category button should be selected
    await expect(page.locator('[data-category="1"]')).toHaveClass(/selected/);
  });

  test('should classify item with button click', async ({ page }) => {
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Click category button
    await page.locator('[data-category="2"]').click();

    // Wait for classification
    await page.waitForTimeout(500);

    // Check button is selected
    await expect(page.locator('[data-category="2"]')).toHaveClass(/selected/);

    // Should not be unclassified
    await expect(page.locator('#classification-status')).not.toContainText('Unclassified');
  });

  test('should show statistics', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Check that statistics elements exist and show reasonable values
    const statsClassified = page.locator('#stats-classified');
    const statsRemaining = page.locator('#stats-remaining');

    await expect(statsClassified).toBeVisible();
    await expect(statsRemaining).toBeVisible();

    // Stats should contain numbers (may be 0 or more due to session persistence)
    await expect(statsClassified).toContainText(/[✅0-9]/);
    await expect(statsRemaining).toContainText(/[⏳0-9]/);
  });
});