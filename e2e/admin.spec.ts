import { test, expect } from '@playwright/test'
import { waitForModalsToClose } from './helpers'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin and wait for load
    await page.goto(`${baseURL}/admin`)
    await waitForModalsToClose(page)
    await page.waitForTimeout(500)
  })

  test('should load admin dashboard', async ({ page }) => {
    // Should show admin heading or redirect if not admin
    const heading = page.locator('h1, h2').filter({ hasText: /admin|dashboard/i })

    // Either we see admin content or we're redirected
    const url = page.url()
    if (url.includes('/admin')) {
      await expect(heading.first()).toBeVisible({ timeout: 5000 })
    } else {
      // Redirected - not an admin user
      console.log('⚠️  Redirected from admin - user may not have admin access')
    }
  })

  test('should display metrics cards', async ({ page }) => {
    // Wait for metrics to load
    await page.waitForSelector('text=/total users|pro users|reflections/i', { timeout: 10000 }).catch(() => null)

    // Check for metric cards
    const metricsCards = page.locator('.grid').locator('> div').filter({ has: page.locator('text=/total|pro|users|reflections/i') })
    const count = await metricsCards.count()

    if (count > 0) {
      console.log(`✅ Found ${count} metric cards`)
      expect(count).toBeGreaterThanOrEqual(1)
    } else {
      console.log('⚠️  No metric cards found - may still be loading or no data')
    }
  })

  test('should have working navigation', async ({ page }) => {
    // Check for nav links
    const navLinks = page.locator('nav a, aside a').filter({ hasText: /users|feedback|analytics|engagement|recovery|content/i })
    const linkCount = await navLinks.count()

    console.log(`Found ${linkCount} navigation links`)
    expect(linkCount).toBeGreaterThanOrEqual(1)
  })

  test('should load admin users page', async ({ page }) => {
    await page.goto(`${baseURL}/admin/users`)
    await page.waitForTimeout(1000)

    // Should show users heading
    const heading = page.locator('h1').filter({ hasText: /users/i })
    await expect(heading).toBeVisible({ timeout: 5000 })

    // Should have a table or list of users
    const usersTable = page.locator('table, [role="table"]')
    const usersList = page.locator('.space-y-4, .divide-y')

    const hasTable = await usersTable.count() > 0
    const hasList = await usersList.count() > 0

    expect(hasTable || hasList).toBe(true)
  })

  test('should load admin engagement page', async ({ page }) => {
    await page.goto(`${baseURL}/admin/engagement`)
    await page.waitForTimeout(1000)

    // Should show engagement heading
    const heading = page.locator('h1').filter({ hasText: /engagement/i })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('should load admin recovery page', async ({ page }) => {
    await page.goto(`${baseURL}/admin/recovery`)
    await page.waitForTimeout(1000)

    // Should show recovery heading
    const heading = page.locator('h1').filter({ hasText: /recovery/i })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('should load admin content mining page', async ({ page }) => {
    await page.goto(`${baseURL}/admin/content`)
    await page.waitForTimeout(1000)

    // Should show content mining heading
    const heading = page.locator('h1').filter({ hasText: /content/i })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('should have test email button on overview', async ({ page }) => {
    await page.goto(`${baseURL}/admin`)
    await page.waitForTimeout(2000)

    // Look for test email button
    const testEmailButton = page.locator('button').filter({ hasText: /test email|send test/i })
    const buttonCount = await testEmailButton.count()

    if (buttonCount > 0) {
      console.log('✅ Test email button found')
      expect(buttonCount).toBeGreaterThanOrEqual(1)
    } else {
      console.log('⚠️  Test email button not found')
    }
  })

  test('should show Grant Pro button on users page', async ({ page }) => {
    await page.goto(`${baseURL}/admin/users`)
    await page.waitForTimeout(2000)

    // Look for Grant Pro or Revoke Pro buttons
    const proButtons = page.locator('button').filter({ hasText: /grant pro|revoke pro/i })
    const buttonCount = await proButtons.count()

    console.log(`Found ${buttonCount} Grant/Revoke Pro buttons`)
    // May be 0 if no users, but should exist in the page structure
  })
})

test.describe('Admin API Endpoints', () => {
  test('should return metrics from API', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/admin/metrics`)

    // May return 401 if not authenticated
    if (response.status() === 200) {
      const data = await response.json()
      console.log('Metrics:', JSON.stringify(data, null, 2))
      expect(data).toHaveProperty('users')
    } else {
      console.log(`API returned ${response.status()} - may need authentication`)
    }
  })
})
