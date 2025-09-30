import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const testDir = join(process.cwd(), 'test-data-comments');
const testFile = join(testDir, 'test.txt');

test.beforeAll(() => {
    // Create test directory and file
    if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
    }

    writeFileSync(testFile, 'This is a test file for comment functionality.\nIt has multiple lines.\nEach line can be classified and commented.');
});

test.describe('Comment Functionality', () => {
    test('should show comment button and allow adding comments', async ({ page }) => {
        // Start the classifier
        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--reset',
            '--categories', 'good,bad,neutral',
            '--port', '3001',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3001');

            // Wait for content to load
            await expect(page.locator('#content-display')).toBeVisible();

            // Check that comment button exists
            await expect(page.locator('#comment-btn')).toBeVisible();
            await expect(page.locator('#comment-btn')).toContainText('💬');

            // Initially, comment display should be hidden
            await expect(page.locator('#comment-display')).toHaveClass(/hidden/);

            // Click comment button to open modal
            await page.locator('#comment-btn').click();

            // Check modal is visible
            await expect(page.locator('#comment-modal')).toBeVisible();
            await expect(page.locator('#comment-modal')).not.toHaveClass(/hidden/);

            // Check modal elements
            await expect(page.locator('#comment-text')).toBeVisible();
            await expect(page.locator('#comment-save')).toBeVisible();
            await expect(page.locator('#comment-delete')).toBeVisible();
            await expect(page.locator('#comment-cancel')).toBeVisible();

            // Add a comment
            await page.locator('#comment-text').fill('This is a test comment about the file content.');
            await page.locator('#comment-save').click();

            // Modal should close
            await expect(page.locator('#comment-modal')).toHaveClass(/hidden/);

            // Comment should now be displayed
            await expect(page.locator('#comment-display')).toBeVisible();
            await expect(page.locator('#comment-display')).not.toHaveClass(/hidden/);
            await expect(page.locator('#comment-display')).toContainText('This is a test comment about the file content.');

        } finally {
            classifier.kill();
        }
    });

    test('should handle keyboard conflicts correctly', async ({ page }) => {
        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3002',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3002');

            await expect(page.locator('#content-display')).toBeVisible();

            // Test that Cmd+M (or Ctrl+M) toggles markdown mode, not comment modal
            const isMac = process.platform === 'darwin';
            const modifierKey = isMac ? 'Meta' : 'Control';

            // Press Cmd+M (Mac) or Ctrl+M (Windows/Linux) to toggle markdown
            await page.keyboard.press(`${modifierKey}+KeyM`);

            // Check that markdown indicator appears (markdown mode enabled)
            await expect(page.locator('#markdown-indicator')).toBeVisible();

            // Check that comment modal did NOT open
            await expect(page.locator('#comment-modal')).toHaveClass(/hidden/);

            // Now test that plain 'M' key opens comment modal
            await page.keyboard.press('m');

            // Check that comment modal opens
            await expect(page.locator('#comment-modal')).toBeVisible();
            await expect(page.locator('#comment-modal')).not.toHaveClass(/hidden/);

            // Close modal for cleanup
            await page.keyboard.press('Escape');

        } finally {
            classifier.kill();
        }
    });

    test('should save comment with Shift+Enter', async ({ page }) => {
        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3003',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3003');

            await expect(page.locator('#content-display')).toBeVisible();

            // Open comment modal with M key
            await page.keyboard.press('m');
            await expect(page.locator('#comment-modal')).toBeVisible();

            // Type a comment
            await page.locator('#comment-text').fill('Comment saved with Shift+Enter');

            // Use Shift+Enter to save
            await page.keyboard.press('Shift+Enter');

            // Modal should close
            await expect(page.locator('#comment-modal')).toHaveClass(/hidden/);

            // Comment should be displayed
            await expect(page.locator('#comment-display')).toBeVisible();
            await expect(page.locator('#comment-display')).toContainText('Comment saved with Shift+Enter');

        } finally {
            classifier.kill();
        }
    });

    test('should open comment modal with M key', async ({ page }) => {
        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3004',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3004');

            await expect(page.locator('#content-display')).toBeVisible();

            // Press M key to open comment modal
            await page.keyboard.press('m');

            // Check modal is visible
            await expect(page.locator('#comment-modal')).toBeVisible();
            await expect(page.locator('#comment-modal')).not.toHaveClass(/hidden/);

            // Check textarea is focused
            await expect(page.locator('#comment-text')).toBeFocused();

            // Press Escape to close
            await page.keyboard.press('Escape');

            // Modal should be closed
            await expect(page.locator('#comment-modal')).toHaveClass(/hidden/);

        } finally {
            classifier.kill();
        }
    });

    test('should allow editing existing comments', async ({ page }) => {
        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3005',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3005');

            await expect(page.locator('#content-display')).toBeVisible();

            // Add initial comment
            await page.locator('#comment-btn').click();
            await page.locator('#comment-text').fill('Initial comment');
            await page.locator('#comment-save').click();

            // Verify comment is displayed
            await expect(page.locator('#comment-display')).toContainText('Initial comment');

            // Edit the comment
            await page.locator('#comment-btn').click();

            // Check that existing comment is loaded in textarea
            await expect(page.locator('#comment-text')).toHaveValue('Initial comment');

            // Delete button should be visible now
            await expect(page.locator('#comment-delete')).toBeVisible();

            // Modify the comment
            await page.locator('#comment-text').fill('Updated comment with more details');
            await page.locator('#comment-save').click();

            // Verify updated comment is displayed
            await expect(page.locator('#comment-display')).toContainText('Updated comment with more details');

        } finally {
            classifier.kill();
        }
    });

    test('should allow deleting comments', async ({ page }) => {
        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3006',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3006');

            await expect(page.locator('#content-display')).toBeVisible();

            // Add a comment first
            await page.locator('#comment-btn').click();
            await page.locator('#comment-text').fill('Comment to be deleted');
            await page.locator('#comment-save').click();

            // Verify comment is displayed
            await expect(page.locator('#comment-display')).toContainText('Comment to be deleted');

            // Open modal to delete
            await page.locator('#comment-btn').click();

            // Delete the comment
            await page.locator('#comment-delete').click();

            // Comment display should be hidden again
            await expect(page.locator('#comment-display')).toHaveClass(/hidden/);

        } finally {
            classifier.kill();
        }
    });

    test('should persist comments across navigation', async ({ page }) => {
        // Create a second test file
        const testFile2 = join(testDir, 'test2.txt');
        writeFileSync(testFile2, 'Second test file content for navigation testing.');

        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3007',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3007');

            await expect(page.locator('#content-display')).toBeVisible();

            // Add comment to first file
            await page.locator('#comment-btn').click();
            await page.locator('#comment-text').fill('Comment on first file');
            await page.locator('#comment-save').click();

            // Navigate to next file
            await page.locator('#next-btn').click();

            // Add comment to second file
            await page.locator('#comment-btn').click();
            await page.locator('#comment-text').fill('Comment on second file');
            await page.locator('#comment-save').click();

            // Navigate back to first file
            await page.locator('#prev-btn').click();

            // First file's comment should still be there
            await expect(page.locator('#comment-display')).toContainText('Comment on first file');

            // Navigate to second file again
            await page.locator('#next-btn').click();

            // Second file's comment should still be there
            await expect(page.locator('#comment-display')).toContainText('Comment on second file');

        } finally {
            classifier.kill();
        }
    });

    test('should work with classifications', async ({ page }) => {
        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3008',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3008');

            await expect(page.locator('#content-display')).toBeVisible();

            // Add a comment first
            await page.locator('#comment-btn').click();
            await page.locator('#comment-text').fill('This file looks good but needs review');
            await page.locator('#comment-save').click();

            // Then classify the item
            await page.locator('[data-category="1"]').click(); // Click first category button (good)

            // Wait for classification to process
            await new Promise(resolve => setTimeout(resolve, 500));

            // Both comment and classification should be visible
            await expect(page.locator('#comment-display')).toContainText('This file looks good but needs review');
            await expect(page.locator('#classification-status')).toContainText('good');

            // Navigate away and back
            await page.locator('#next-btn').click();
            await page.locator('#prev-btn').click();

            // Both should still be there
            await expect(page.locator('#comment-display')).toContainText('This file looks good but needs review');
            await expect(page.locator('#classification-status')).toContainText('good');

        } finally {
            classifier.kill();
        }
    });

    test('should stay at current position when no more unrated items', async ({ page }) => {
        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3009',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3009');

            await expect(page.locator('#content-display')).toBeVisible();

            // Classify the current item (there's only one test file)
            await page.locator('[data-category="1"]').click(); // Click first category button (good)

            // Wait for classification to process
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify it's classified
            await expect(page.locator('#classification-status')).toContainText('good');

            // Try to navigate to next unrated item using Shift+K (should do nothing)
            await page.keyboard.press('Shift+KeyK');

            // Should still be on the same item (classified)
            await expect(page.locator('#classification-status')).toContainText('good');

            // Try to navigate to previous unrated item using Shift+J (should do nothing)
            await page.keyboard.press('Shift+KeyJ');

            // Should still be on the same item
            await expect(page.locator('#classification-status')).toContainText('good');

        } finally {
            classifier.kill();
        }
    });

    test('should navigate using Shift+J/K for unrated items', async ({ page }) => {
        // Create multiple test files for navigation testing
        const testFile2 = join(testDir, 'test2.txt');
        const testFile3 = join(testDir, 'test3.txt');
        writeFileSync(testFile2, 'Second test file content.');
        writeFileSync(testFile3, 'Third test file content.');

        const { spawn } = await import('child_process');
        const classifier = spawn(`${process.env.HOME}/.bun/bin/bun`, ['run', 'src/cli.ts',
            '--categories', 'good,bad,neutral',
            '--port', '3010',
            '--no-browser',
            `${testDir}/*.txt`
        ], {
            stdio: 'pipe',
            shell: true
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.goto('http://localhost:3010');

            await expect(page.locator('#content-display')).toBeVisible();

            // Should start on first item (unrated)
            await expect(page.locator('#classification-status')).toContainText('Unclassified');

            // Use Shift+K to go to next unrated item
            await page.keyboard.press('Shift+KeyK');

            // Should be on second item (still unrated)
            await expect(page.locator('#classification-status')).toContainText('Unclassified');

            // Use Shift+J to go back to previous unrated item
            await page.keyboard.press('Shift+KeyJ');

            // Should be back on first item
            await expect(page.locator('#classification-status')).toContainText('Unclassified');

            // Classify the current item
            await page.locator('[data-category="1"]').click(); // Click first category button (good)

            // Wait for classification to process
            await new Promise(resolve => setTimeout(resolve, 500));

            // Use Shift+K to go to next unrated item (should skip classified items)
            await page.keyboard.press('Shift+KeyK');

            // Should find the next unrated item
            await expect(page.locator('#classification-status')).toContainText('Unclassified');

        } finally {
            classifier.kill();
        }
    });
});