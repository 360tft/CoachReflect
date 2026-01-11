// Admin authentication helpers

// Admin emails from environment variable
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// Also support admin user ID
const ADMIN_USER_ID = process.env.ADMIN_USER_ID

export function isAdminById(userId: string | undefined | null): boolean {
  if (!userId || !ADMIN_USER_ID) return false
  return userId === ADMIN_USER_ID
}

export function isAdminUser(email: string | undefined | null, userId: string | undefined | null): boolean {
  return isAdmin(email) || isAdminById(userId)
}
