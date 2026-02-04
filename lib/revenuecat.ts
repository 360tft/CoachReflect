// RevenueCat integration for in-app purchases on iOS and Android

import { Purchases, LOG_LEVEL, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor'
import { isNativePlatform, isIOS } from './platform'

// RevenueCat API keys - set in environment variables
const REVENUECAT_IOS_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY || ''
const REVENUECAT_ANDROID_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY || ''

// Product identifiers - must match App Store Connect / Google Play Console
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'coachreflect_pro_monthly',
  PRO_ANNUAL: 'coachreflect_pro_annual',
  PRO_PLUS_MONTHLY: 'coachreflect_proplus_monthly',
  PRO_PLUS_ANNUAL: 'coachreflect_proplus_annual',
}

// Entitlement identifiers in RevenueCat
export const ENTITLEMENT_ID = 'pro'
export const ENTITLEMENT_PRO_PLUS_ID = 'pro_plus'

let isInitialized = false

/**
 * Initialize RevenueCat SDK
 * Should be called once when the app starts on native platforms
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  if (!isNativePlatform()) {
    return
  }

  if (isInitialized) {
    return
  }

  const apiKey = isIOS() ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY

  if (!apiKey) {
    return
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })

    await Purchases.configure({
      apiKey,
      appUserID: userId || null,
    })

    isInitialized = true
  } catch (error) {
    throw error
  }
}

/**
 * Identify the user in RevenueCat (call after login)
 */
export async function identifyUser(userId: string): Promise<CustomerInfo | null> {
  if (!isNativePlatform() || !isInitialized) {
    return null
  }

  try {
    const result = await Purchases.logIn({ appUserID: userId })
    return result.customerInfo
  } catch {
    return null
  }
}

/**
 * Log out the user from RevenueCat (call after logout)
 */
export async function logoutUser(): Promise<void> {
  if (!isNativePlatform() || !isInitialized) {
    return
  }

  try {
    await Purchases.logOut()
  } catch {
    // Silently handle logout errors
  }
}

/**
 * Get available subscription packages
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  if (!isNativePlatform() || !isInitialized) {
    return []
  }

  try {
    const offerings = await Purchases.getOfferings()

    if (!offerings.current?.availablePackages) {
      return []
    }

    return offerings.current.availablePackages
  } catch {
    return []
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<{
  success: boolean
  customerInfo?: CustomerInfo
  error?: string
}> {
  if (!isNativePlatform() || !isInitialized) {
    return { success: false, error: 'Not on native platform' }
  }

  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg })

    const hasAccess = hasAnyEntitlement(result.customerInfo)

    if (hasAccess) {
      return { success: true, customerInfo: result.customerInfo }
    } else {
      return { success: false, error: 'Purchase completed but subscription not activated' }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PURCHASE_CANCELLED') {
      return { success: false, error: 'cancelled' }
    }

    const message = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Purchase failed'
    return { success: false, error: message }
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{
  success: boolean
  hasProAccess: boolean
  customerInfo?: CustomerInfo
  error?: string
}> {
  if (!isNativePlatform() || !isInitialized) {
    return { success: false, hasProAccess: false, error: 'Not on native platform' }
  }

  try {
    const result = await Purchases.restorePurchases()
    const hasProAccess = hasAnyEntitlement(result.customerInfo)

    return { success: true, hasProAccess, customerInfo: result.customerInfo }
  } catch (error: unknown) {
    const message = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Restore failed'
    return { success: false, hasProAccess: false, error: message }
  }
}

/**
 * Check if a CustomerInfo object has any paid entitlement (pro or pro_plus)
 */
function hasAnyEntitlement(customerInfo: CustomerInfo): boolean {
  const active = customerInfo.entitlements.active
  return active[ENTITLEMENT_ID] !== undefined || active[ENTITLEMENT_PRO_PLUS_ID] !== undefined
}

/**
 * Check if user has active pro or pro_plus subscription via RevenueCat
 */
export async function checkProEntitlement(): Promise<boolean> {
  if (!isNativePlatform() || !isInitialized) {
    return false
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo()
    return hasAnyEntitlement(customerInfo.customerInfo)
  } catch {
    return false
  }
}

/**
 * Get the customer info including subscription status
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isNativePlatform() || !isInitialized) {
    return null
  }

  try {
    const result = await Purchases.getCustomerInfo()
    return result.customerInfo
  } catch {
    return null
  }
}

/**
 * Format price for display
 */
export function formatPackagePrice(pkg: PurchasesPackage): string {
  const product = pkg.product
  return product.priceString || `$${product.price}`
}

/**
 * Get the billing period text for a package
 */
export function getPackagePeriod(pkg: PurchasesPackage): string {
  const identifier = pkg.identifier
  if (identifier.includes('annual') || identifier.includes('yearly')) {
    return '/year'
  }
  return '/month'
}
