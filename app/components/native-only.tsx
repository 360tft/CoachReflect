'use client'

import { type ReactNode, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

interface NativeOnlyProps {
  children: ReactNode
}

/**
 * Only renders children when running inside a native mobile app (iOS/Android).
 * Inverse of NativeHidden. Used to show IAP purchase options on native.
 *
 * Uses useEffect (not render-path check) to avoid React hydration mismatches.
 */
export function NativeOnly({ children }: NativeOnlyProps) {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
  }, [])

  if (!isNative) return null

  return <>{children}</>
}
