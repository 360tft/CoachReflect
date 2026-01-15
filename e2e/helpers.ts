import { Page } from '@playwright/test'

/**
 * Wait for any blocking modals to close
 */
export async function waitForModalsToClose(page: Page): Promise<void> {
  // Wait for the blocking overlay to disappear
  const overlay = page.locator('.fixed.inset-0.z-50.bg-black\\/50')

  try {
    await overlay.waitFor({ state: 'hidden', timeout: 5000 })
  } catch {
    // No overlay present or already hidden
  }
}

/**
 * Navigate to dashboard and ensure it's ready for interaction
 */
export async function goToDashboardReady(page: Page, baseURL: string): Promise<void> {
  await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' })
  await waitForModalsToClose(page)
  // Additional wait for any animations
  await page.waitForTimeout(300)
}
