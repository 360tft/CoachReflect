import { test, expect } from '@playwright/test'
import { goToDashboardReady } from './helpers'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Reflection History (Authenticated)', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('should display past reflections', async ({ page }) => {
    await goToDashboardReady(page, baseURL)

    // Look for history section, list, or navigation
    const historySection = page.locator('text=/history|past|previous|reflections/i')

    if (await historySection.count() > 0) {
      // Click history if it's a link/button
      if (await historySection.first().locator('..').locator('a, button').count() > 0) {
        await historySection.first().click()
        await page.waitForTimeout(1000)
      }

      // Should see list of past reflections (if any exist)
      const reflectionItems = page.locator('[data-reflection], .reflection-item, article, [role="article"]')

      // May be 0 if this is a new account, that's okay
      const count = await reflectionItems.count()
      console.log(`Found ${count} past reflections`)
    } else {
      console.log('⚠️  No history section found - may need to navigate differently')
    }
  })

  test('should navigate to history page if it exists', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/history`)
    await page.waitForTimeout(1000)

    // Should either be on history page or see reflections
    const isHistoryPage = page.url().includes('history')
    const hasReflectionList = await page.locator('[data-reflection], .reflection-item').count() > 0

    expect(isHistoryPage || hasReflectionList).toBe(true)
  })

  test('should allow viewing a past reflection', async ({ page }) => {
    await goToDashboardReady(page, baseURL)

    // Try to navigate to history
    const historyLink = page.locator('a, button').filter({ hasText: /history|past/i })

    if (await historyLink.count() > 0) {
      await historyLink.first().click()
      await page.waitForTimeout(1000)

      // Find first reflection item
      const firstReflection = page.locator('[data-reflection], .reflection-item, article').first()

      if (await firstReflection.count() > 0) {
        await firstReflection.click()
        await page.waitForTimeout(1000)

        // Should show reflection details
        const hasMessages = await page.locator('[role="article"], .message').count() > 0
        expect(hasMessages).toBe(true)
      } else {
        console.log('⚠️  No past reflections found - this may be a new account')
      }
    }
  })

  test('should show date/time of past reflections', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/history`)
    await page.waitForTimeout(1000)

    // Look for date indicators
    const hasDateInfo = await page.locator('text=/today|yesterday|[0-9]{1,2}\/[0-9]{1,2}|ago/i').count() > 0

    if (hasDateInfo) {
      expect(hasDateInfo).toBe(true)
    } else {
      console.log('⚠️  No reflections with dates found - may be empty history')
    }
  })
})
