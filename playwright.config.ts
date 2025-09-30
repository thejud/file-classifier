import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,  // Run tests serially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // Single worker to ensure serial execution
  reporter: 'html',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Isolate storage state for each test to prevent cross-contamination
    storageState: undefined,  // Don't persist storage between tests
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Force a new context for each test to prevent state leakage
        contextOptions: {
          // This ensures localStorage/sessionStorage is cleared
          ignoreHTTPSErrors: true,
        }
      },
      // Each test file gets a fresh browser context
      testMatch: '**/*.spec.ts',
    },
  ],
  webServer: {
    command: '~/.bun/bin/bun run src/cli.ts --port 3000 --no-browser tests/fixtures/test.txt',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});