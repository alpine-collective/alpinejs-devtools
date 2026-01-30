import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Defaults to CPU count / 2
  // we know we can run 2 on 2 cores in GH Actions
  // 8 locally, we have ~10 cores
  workers: process.env.CI ? 2 : 8,
  retries: process.env.CI ? 2 : 1,
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
