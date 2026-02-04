'use client'

import { useState, useEffect, useCallback } from 'react'
import { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { isNativePlatform } from '@/lib/platform'
import {
  initializeRevenueCat,
  identifyUser,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkProEntitlement,
} from '@/lib/revenuecat'

interface UseRevenueCatReturn {
  isNative: boolean
  isInitialized: boolean
  isLoading: boolean
  packages: PurchasesPackage[]
  hasProAccess: boolean
  error: string | null
  purchase: (pkg: PurchasesPackage) => Promise<boolean>
  restore: () => Promise<boolean>
  refresh: () => Promise<void>
}

export function useRevenueCat(userId?: string): UseRevenueCatReturn {
  const [isNative] = useState(() => {
    if (typeof window === 'undefined') return false
    return isNativePlatform()
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [hasProAccess, setHasProAccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize RevenueCat
  useEffect(() => {
    if (!isNative) {
      setIsLoading(false)
      return
    }

    async function init() {
      try {
        await initializeRevenueCat(userId)
        setIsInitialized(true)

        if (userId) {
          await identifyUser(userId)
        }

        const [offerings, hasPro] = await Promise.all([
          getOfferings(),
          checkProEntitlement(),
        ])

        setPackages(offerings)
        setHasProAccess(hasPro)
      } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to initialize purchases'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [isNative, userId])

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!isNative || !isInitialized) return false

    setIsLoading(true)
    setError(null)

    try {
      const result = await purchasePackage(pkg)

      if (result.success) {
        setHasProAccess(true)
        return true
      }

      if (result.error === 'cancelled') {
        return false
      }

      setError(result.error || 'Purchase failed')
      return false
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Purchase failed'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isNative, isInitialized])

  const restore = useCallback(async (): Promise<boolean> => {
    if (!isNative || !isInitialized) return false

    setIsLoading(true)
    setError(null)

    try {
      const result = await restorePurchases()

      if (result.success) {
        setHasProAccess(result.hasProAccess)
        return result.hasProAccess
      }

      setError(result.error || 'Restore failed')
      return false
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Restore failed'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isNative, isInitialized])

  const refresh = useCallback(async () => {
    if (!isNative || !isInitialized) return

    try {
      const hasPro = await checkProEntitlement()
      setHasProAccess(hasPro)
    } catch {
      // Silently handle refresh errors
    }
  }, [isNative, isInitialized])

  return {
    isNative,
    isInitialized,
    isLoading,
    packages,
    hasProAccess,
    error,
    purchase,
    restore,
    refresh,
  }
}
