import { test, expect } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Logout Flow', () => {
  test('should allow user to logout', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard`)
    await page.waitForTimeout(1000)

    // Find sign out button
    const signOutButton = page.locator('button, a').filter({ hasText: /sign out|log out|logout/i }).first()

    await expect(signOutButton).toBeVisible()
    await signOutButton.click()

    // Should redirect to login page after logout
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/login/)
  })

  test('should redirect to login when not authenticated', async ({ page }) => {
    // After the previous test logged out, try accessing a protected page directly
    // Clear all cookies to simulate a fresh unauthenticated visit
    await page.context().clearCookies()

    await page.goto(`${baseURL}/dashboard`)
    await page.waitForTimeout(2000)

    // Should be redirected to login
    await expect(page).toHaveURL(/login/)
  })
})
