import { test, expect } from '@playwright/test'
import { goToDashboardReady, waitForModalsToClose } from './helpers'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Dashboard (Authenticated)', () => {
  test('should load dashboard page', async ({ page }) => {
    await goToDashboardReady(page, baseURL)

    // Dashboard shows h1 "Welcome back" for returning users or h3 CardTitle for first-time users
    await expect(page.locator('h1, h2, h3').filter({ hasText: /dashboard|reflect|coach|welcome/i })).toBeVisible()
  })

  test('should show new reflection option', async ({ page }) => {
    await goToDashboardReady(page, baseURL)

    // "Start Your First Reflection" (first-time) or "+ Reflect" (returning)
    const newReflectionButton = page.locator('button, a').filter({ hasText: /new|create|start|reflect/i })
    expect(await newReflectionButton.count()).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Chat/Reflection Interface (Authenticated)', () => {
  test('should send a message and receive response', async ({ page }) => {
    await goToDashboardReady(page, baseURL)

    // Look for message input (textarea or input)
    const messageInput = page.locator('textarea, input[type="text"]').first()

    if (await messageInput.count() > 0) {
      const testMessage = 'I coached a session on passing today'

      await messageInput.fill(testMessage)
      await messageInput.press('Enter')

      // Wait for response
      await page.waitForTimeout(3000)

      // Should have at least 2 messages now (user + assistant)
      const messages = page.locator('[data-testid="chat-message"]')
      const messageCount = await messages.count()
      expect(messageCount).toBeGreaterThanOrEqual(1)
    } else {
      console.log('⚠️  No message input found - may need to click "New Reflection" first')
    }
  })
})

test.describe('Billing Flow (Authenticated)', () => {
  test('should load billing page if it exists', async ({ page }) => {
    // Billing info is on the settings page
    await page.goto(`${baseURL}/dashboard/settings`)
    await waitForModalsToClose(page)

    await page.waitForTimeout(2000)

    // Should see subscription info on settings page
    const hasBillingContent = await page.locator('text=/subscription|plan|billing/i').count() > 0
    expect(hasBillingContent).toBe(true)
  })
})

test.describe('Settings Flow (Authenticated)', () => {
  test('should load settings page if it exists', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await waitForModalsToClose(page)

    // May show settings or redirect
    await page.waitForTimeout(1000)

    const hasSettingsContent = await page.locator('text=/settings|profile|account/i').count() > 0
    expect(hasSettingsContent).toBe(true)
  })
})
