import { test, expect } from '@playwright/test'
import { goToDashboardReady } from './helpers'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Settings Page (Authenticated)', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('should display settings page', async ({ page }) => {
    await goToDashboardReady(page, baseURL)
    await page.goto(`${baseURL}/dashboard/settings`)

    await expect(page.locator('h1, h2').filter({ hasText: /settings/i })).toBeVisible()
  })

  test('should show profile section', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    // Should have profile-related fields
    const hasProfile = await page.locator('text=/profile|name|email/i').count() > 0
    expect(hasProfile).toBe(true)
  })

  test('should display user email', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    // Should show email address somewhere
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    const hasEmail = await page.locator(`text=${emailPattern}`).count() > 0

    // Email might be in input or as text
    const emailInput = page.locator('input[type="email"]')
    const hasEmailInput = await emailInput.count() > 0

    expect(hasEmail || hasEmailInput).toBe(true)
  })

  test('should have account management options', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    // Should have options like export data, delete account, etc.
    const accountOptions = page.locator('text=/export|delete|download/i')
    expect(await accountOptions.count()).toBeGreaterThan(0)
  })

  test('should allow updating display name', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    const nameInput = page.locator('input[name="name"], input[name="display_name"], input[placeholder*="name" i]').first()

    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Coach Name')

      // Look for save button
      const saveButton = page.locator('button').filter({ hasText: /save|update/i }).first()

      if (await saveButton.count() > 0) {
        await saveButton.click()
        await page.waitForTimeout(1500)

        // Should show success message or confirmation
        const hasSuccess = await page.locator('text=/success|saved|updated/i').count() > 0
        expect(hasSuccess).toBe(true)
      }
    }
  })

  test('should have notification preferences', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    // Should have notification settings
    const hasNotifications = await page.locator('text=/notification|email|alert/i').count() > 0
    expect(hasNotifications).toBe(true)
  })

  test('should display export data option', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    const exportButton = page.locator('button, a').filter({ hasText: /export/i })
    expect(await exportButton.count()).toBeGreaterThan(0)
  })

  test('should display delete account option', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    const deleteOption = page.locator('text=/delete.*account/i')
    expect(await deleteOption.count()).toBeGreaterThan(0)
  })

  test('should show warning before account deletion', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    const deleteButton = page.locator('button').filter({ hasText: /delete.*account/i }).first()

    if (await deleteButton.count() > 0) {
      await deleteButton.click()
      await page.waitForTimeout(500)

      // Should show confirmation dialog or warning
      const hasWarning = await page.locator('text=/confirm|sure|permanent|cannot be undone/i').count() > 0
      expect(hasWarning).toBe(true)
    }
  })
})

test.describe('Profile Updates', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('should persist profile changes', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    const testName = `Test Coach ${Date.now()}`
    const nameInput = page.locator('input[name="name"], input[name="display_name"], input[placeholder*="name" i]').first()

    if (await nameInput.count() > 0) {
      await nameInput.fill(testName)

      const saveButton = page.locator('button').filter({ hasText: /save|update/i }).first()

      if (await saveButton.count() > 0) {
        await saveButton.click()
        await page.waitForTimeout(2000)

        // Reload page and check if name persisted
        await page.reload()
        await page.waitForTimeout(1000)

        const nameValue = await nameInput.inputValue()
        expect(nameValue).toBe(testName)
      }
    }
  })
})

test.describe('Theme & Preferences', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('should have theme or appearance settings', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(1000)

    // Look for theme or dark mode toggle
    const hasTheme = await page.locator('text=/theme|dark mode|appearance/i').count() > 0
    expect(hasTheme).toBe(true)
  })
})
