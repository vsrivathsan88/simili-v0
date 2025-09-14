module.exports = {
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'REACT_APP_GEMINI_API_KEY=test_key REACT_APP_E2E=true npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
};