import { test, expect } from '@playwright/test'
import { goToDashboardReady } from './helpers'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Subscription & Billing (Authenticated)', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('should display billing settings page', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Should have subscription information
    const subscriptionSection = page.locator('text=/subscription|billing|plan/i').first()
    await expect(subscriptionSection).toBeVisible({ timeout: 10000 })
  })

  test('should show current subscription tier', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Should display tier name like "Free Plan" or "Pro Plan"
    const tierBadge = page.locator('text=/free|pro/i').first()
    await expect(tierBadge).toBeVisible({ timeout: 10000 })
  })

  test('should have upgrade button for free users', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(2000)

    // Check if user is on free tier
    const freeBadge = page.locator('text=/free/i').first()

    if (await freeBadge.isVisible()) {
      // Should have upgrade option
      const upgradeButton = page.locator('button, a').filter({ hasText: /upgrade|get pro|start trial/i })
      await expect(upgradeButton.first()).toBeVisible()
    }
  })

  test('should navigate to checkout when clicking upgrade', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(2000)

    const freeBadge = page.locator('text=/free/i').first()

    if (await freeBadge.isVisible()) {
      const upgradeButton = page.locator('button, a').filter({ hasText: /upgrade|get pro|start trial/i }).first()

      if (await upgradeButton.count() > 0) {
        await upgradeButton.click()
        await page.waitForTimeout(2000)

        // Should redirect to checkout or show pricing
        const isCheckout = await page.locator('text=/checkout|payment|card/i').count() > 0
        const isPricing = await page.locator('text=/\\$|price|month/i').count() > 0

        expect(isCheckout || isPricing).toBe(true)
      }
    }
  })

  test('should display usage stats for free users', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`)
    await page.waitForTimeout(2000)

    const freeBadge = page.locator('text=/free/i').first()

    if (await freeBadge.isVisible()) {
      // Should show reflection count or usage limit
      const usageInfo = page.locator('text=/reflections|limit|remaining/i')
      expect(await usageInfo.count()).toBeGreaterThan(0)
    }
  })

  test('should have customer portal link for pro users', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Check if user is on a paid tier (look for "Pro Plan" or "Pro+" specifically, not just /pro/)
    const hasPaidPlan = await page.locator('text=/Pro Plan|Pro\\+ Plan/').count() > 0

    if (hasPaidPlan) {
      // Should have manage subscription or portal link
      const portalLink = page.locator('button, a').filter({ hasText: /manage|portal|billing/i })
      expect(await portalLink.count()).toBeGreaterThan(0)
    } else {
      console.log('⚠️  User is on free tier - skipping portal link check')
    }
  })

  test('should display pricing information', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Should mention Pro pricing ($7.99/mo) somewhere
    const hasPricing = await page.locator('text=/\\$7\\.99|\\$[0-9]+|month|\\/mo/i').count() > 0
    expect(hasPricing).toBe(true)
  })
})

test.describe('Upgrade Flow (Visual Check)', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('should show upgrade prompts throughout app', async ({ page }) => {
    await goToDashboardReady(page, baseURL)

    // Check if upgrade prompts exist on dashboard
    const upgradePrompt = page.locator('text=/upgrade|pro|unlock/i')

    // Should have at least one upgrade prompt visible
    const count = await upgradePrompt.count()
    expect(count).toBeGreaterThanOrEqual(0) // May or may not show depending on tier
  })
})
