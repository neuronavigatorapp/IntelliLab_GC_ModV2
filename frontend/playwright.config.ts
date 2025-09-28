import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration - Mock-First Strategy
 * 
 * By default, uses deterministic mocks for all API calls.
 * Set USE_REAL_API=true to test against real backend.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false, // Disable parallel execution for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Increased retries for flaky tests
  workers: 1, // Run tests sequentially
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  globalSetup: './tests/global-setup.ts',
  outputDir: 'test-results/',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    actionTimeout: 15000, // Increased for stability
    navigationTimeout: 30000,
    testIdAttribute: 'data-testid',
    // Mock-first configuration
    extraHTTPHeaders: {
      'X-Test-Mode': process.env.USE_REAL_API ? 'real' : 'mock'
    },
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.USE_REAL_API ? [
    // Real API mode - start both frontend and backend
    {
      command: 'cd .. && .\\venv\\Scripts\\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000',
      url: 'http://localhost:8000/api/health',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30000,
    }
  ] : [
    // Mock mode - only start frontend
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30000,
    }
  ],
});