import { test, expect } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto(`${baseURL}/login`)

    await expect(page.locator('h1, h2').filter({ hasText: /sign in|log in/i })).toBeVisible()
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto(`${baseURL}/login`)

    await page.locator('button[type="submit"]').click()

    // HTML5 validation or custom error messages should appear
    const emailInput = page.locator('input[name="email"], input[type="email"]')
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBe(true)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`)

    await page.locator('input[name="email"], input[type="email"]').fill('invalid@example.com')
    await page.locator('input[name="password"], input[type="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()

    // Wait for error message
    await page.waitForTimeout(2000)

    // Should show error (either toast, alert, or text message)
    const errorVisible = await page.locator('text=/invalid|incorrect|error/i').count() > 0
    expect(errorVisible).toBe(true)
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto(`${baseURL}/login`)

    const forgotLink = page.locator('a').filter({ hasText: /forgot.*password/i })
    if (await forgotLink.count() > 0) {
      await forgotLink.click()
      await expect(page).toHaveURL(/forgot-password/)
    }
  })

  test('should display signup option', async ({ page }) => {
    await page.goto(`${baseURL}/login`)

    // Should have link to signup page
    const signupLink = page.locator('a').filter({ hasText: /sign up|create account/i })
    await expect(signupLink).toBeVisible()
  })
})

test.describe('Sign Up Flow', () => {
  test('should display signup form', async ({ page }) => {
    await page.goto(`${baseURL}/signup`)

    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should validate password requirements', async ({ page }) => {
    await page.goto(`${baseURL}/signup`)

    await page.locator('input[name="email"], input[type="email"]').fill('newuser@example.com')
    await page.locator('input[name="password"], input[type="password"]').fill('123') // Too short
    await page.locator('button[type="submit"]').click()

    // Should show password validation error
    await page.waitForTimeout(1000)
    const errorVisible = await page.locator('text=/password.*characters|password.*short/i').count() > 0
    expect(errorVisible).toBe(true)
  })
})

test.describe('Password Reset Flow', () => {
  test('should display forgot password page', async ({ page }) => {
    await page.goto(`${baseURL}/forgot-password`)

    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show confirmation after reset request', async ({ page }) => {
    await page.goto(`${baseURL}/forgot-password`)

    await page.locator('input[name="email"], input[type="email"]').fill('test@example.com')
    await page.locator('button[type="submit"]').click()

    await page.waitForTimeout(2000)

    // Should show success message or confirmation
    const hasConfirmation = await page.locator('text=/check.*email|sent.*link|instructions/i').count() > 0
    expect(hasConfirmation).toBe(true)
  })

  test('should handle invalid email format', async ({ page }) => {
    await page.goto(`${baseURL}/forgot-password`)

    await page.locator('input[name="email"], input[type="email"]').fill('invalid-email')
    await page.locator('button[type="submit"]').click()

    await page.waitForTimeout(1000)

    // HTML5 validation or custom error
    const emailInput = page.locator('input[name="email"], input[type="email"]')
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBe(true)
  })
})

test.describe('Logout Flow', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

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

  test('should clear session after logout', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard`)
    await page.waitForTimeout(1000)

    // Logout
    const signOutButton = page.locator('button, a').filter({ hasText: /sign out|log out|logout/i }).first()
    await signOutButton.click()
    await page.waitForTimeout(2000)

    // Try to access protected page
    await page.goto(`${baseURL}/dashboard`)
    await page.waitForTimeout(1000)

    // Should be redirected to login
    await expect(page).toHaveURL(/login/)
  })
})
