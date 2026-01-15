import { test as setup, expect } from '@playwright/test'
import path from 'path'

// Storage state file - saves authenticated session
const authFile = path.join(__dirname, '.auth/user.json')

/**
 * This setup file logs in once and saves the auth state.
 * Other tests can reuse this state to skip login.
 *
 * Required environment variables:
 * - E2E_TEST_EMAIL: Test user email
 * - E2E_TEST_PASSWORD: Test user password
 */
setup('authenticate', async ({ page }) => {
  const testEmail = process.env.E2E_TEST_EMAIL
  const testPassword = process.env.E2E_TEST_PASSWORD

  if (!testEmail || !testPassword) {
    console.log('⚠️  E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set')
    console.log('   Skipping auth setup - tests will run unauthenticated')
    return
  }

  console.log(`🔐 Logging in as ${testEmail}...`)

  // Go to login page (CoachReflect uses (auth) route group)
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
  await page.goto(`${baseUrl}/login`)
  await page.waitForLoadState('networkidle')

  // Fill in credentials
  await page.locator('input[name="email"], input[type="email"]').fill(testEmail)
  await page.locator('input[name="password"], input[type="password"]').fill(testPassword)

  // Click sign in
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to dashboard (successful login)
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })

  console.log('✅ Logged in successfully')

  // Save authentication state
  await page.context().storageState({ path: authFile })
  console.log(`💾 Auth state saved to ${authFile}`)
})
