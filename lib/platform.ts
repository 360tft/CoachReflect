// Platform detection utilities for hybrid web/native app

import { Capacitor } from '@capacitor/core'

export type Platform = 'ios' | 'android' | 'web'

/**
 * Check if running in a native mobile app (iOS or Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return 'ios'
  if (platform === 'android') return 'android'
  return 'web'
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios'
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android'
}

/**
 * Check if in-app purchases should be used
 * Returns true for native platforms where IAP is required
 */
export function shouldUseIAP(): boolean {
  return isNativePlatform()
}
