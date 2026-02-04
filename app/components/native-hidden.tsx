'use client'

import { type ReactNode, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

interface NativeHiddenProps {
  children: ReactNode
}

/**
 * Hides children when running inside a native mobile app (iOS/Android).
 * Used to comply with App Store guidelines by hiding external purchase links.
 *
 * Uses useEffect (not render-path check) to avoid React hydration mismatches
 * between server HTML and client-side Capacitor detection.
 */
export function NativeHidden({ children }: NativeHiddenProps) {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
  }, [])

  if (isNative) return null

  return <>{children}</>
}
