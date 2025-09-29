import { chromium } from '@playwright/test';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  const page = await context.newPage();

  // Go to the classifier
  await page.goto('http://localhost:8899');
  await page.waitForLoadState('networkidle');

  // Capture initial view (first alert)
  await page.screenshot({
    path: 'screenshots/ui-initial.png',
    fullPage: false
  });

  // Classify the first item as "investigate" (key 2)
  await page.keyboard.press('2');
  await page.waitForTimeout(500);

  // Navigate to next item
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);

  // Capture a view with markdown content
  await page.screenshot({
    path: 'screenshots/ui-markdown-content.png',
    fullPage: false
  });

  // Navigate to the ransomware alert (item 3) and classify as critical
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.press('1');
  await page.waitForTimeout(500);

  // Add a comment (press M)
  await page.keyboard.press('m');
  await page.waitForTimeout(500);

  // Capture comment modal
  await page.screenshot({
    path: 'screenshots/ui-comment-modal.png',
    fullPage: false
  });

  // Type comment
  await page.keyboard.type('Confirmed ransomware incident. IR team engaged. System isolated at 10:17 AM.');

  // Save comment (Shift+Enter)
  await page.keyboard.press('Shift+Enter');
  await page.waitForTimeout(500);

  // Navigate to see classified items with different statuses
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('3'); // Classify as false-positive
  await page.waitForTimeout(300);

  // Skip a few items
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);

  // Toggle markdown mode (Cmd+M or Ctrl+M)
  await page.keyboard.press('Meta+m');
  await page.waitForTimeout(500);

  // Capture markdown rendered view
  await page.screenshot({
    path: 'screenshots/ui-markdown-rendered.png',
    fullPage: false
  });

  // Show keyboard shortcuts (?)
  await page.keyboard.press('?');
  await page.waitForTimeout(500);

  // Capture help modal
  await page.screenshot({
    path: 'screenshots/ui-help-modal.png',
    fullPage: false
  });

  // Close help modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Export (Cmd+E)
  await page.keyboard.press('Meta+e');
  await page.waitForTimeout(500);

  // Capture export success
  await page.screenshot({
    path: 'screenshots/ui-export-success.png',
    fullPage: false
  });

  // Navigate back to show progress bar
  await page.keyboard.press('1'); // Go to first item
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press(String((i % 3) + 1));
    if (i < 9) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
  }

  // Capture final view with progress
  await page.screenshot({
    path: 'screenshots/ui-progress-view.png',
    fullPage: false
  });

  await browser.close();
  console.log('Screenshots captured successfully!');
}

captureScreenshots().catch(console.error);