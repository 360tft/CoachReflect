import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local so E2E_TEST_EMAIL/PASSWORD are available
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Setup project - runs auth first
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Unauthenticated tests (login, signup, public pages)
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\.spec\.ts/,
      dependencies: ['setup'],
    },
    // Authenticated tests - all tests that need login
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testMatch: /authenticated\.spec\.ts/,
      dependencies: ['setup'],
    },
    // Main authenticated tests (admin, settings, reflection, etc.)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testIgnore: [/authenticated\.spec\.ts/, /auth\.spec\.ts/, /logout\.spec\.ts/],
      dependencies: ['setup'],
    },
    // Logout tests run LAST (signOut invalidates refresh token for all contexts)
    {
      name: 'logout',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testMatch: /logout\.spec\.ts/,
      dependencies: ['chromium', 'authenticated'],
    },
  ],
  // Optionally start dev server for tests
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180 * 1000,
  },
})
