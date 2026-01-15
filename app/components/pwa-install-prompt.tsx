'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface Props {
  variant?: 'banner' | 'card'
  onDismiss?: () => void
}

function getInitialState() {
  if (typeof window === 'undefined') {
    return { dismissed: true, isIOS: false, isStandalone: false }
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as { standalone?: boolean }).standalone === true
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  const dismissedTime = localStorage.getItem('pwa-install-dismissed')
  let shouldDismiss = true

  if (dismissedTime) {
    const dismissedDate = new Date(dismissedTime)
    const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
    shouldDismiss = daysSinceDismissed < 7
  } else if (iOS && !standalone) {
    shouldDismiss = false
  }

  return { dismissed: shouldDismiss, isIOS: iOS, isStandalone: standalone }
}

export function PWAInstallPrompt({ variant = 'card', onDismiss }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState(getInitialState)

  const { dismissed, isIOS, isStandalone } = state

  useEffect(() => {
    // Listen for beforeinstallprompt
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setState(prev => ({ ...prev, dismissed: false }))
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setState(prev => ({ ...prev, dismissed: true }))
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
    setState(prev => ({ ...prev, dismissed: true }))
    onDismiss?.()
  }

  // Don't show if already installed, dismissed, or no prompt available (unless iOS)
  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null
  }

  if (variant === 'banner') {
    return (
      <div className="bg-[#E5A11C]/10 dark:bg-[#E5A11C]/20 border-b border-[#E5A11C]/20 dark:border-[#E5A11C]/30 px-4 py-3">
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E5A11C] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {isIOS
                ? 'Add CoachReflect to your home screen for quick access'
                : 'Install CoachReflect for a better experience'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 text-sm font-medium bg-[#E5A11C] text-white rounded-lg hover:bg-[#CC8F17]"
              >
                Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <div className="bg-white dark:bg-[#111111] rounded-xl shadow-sm border border-gray-200 dark:border-[#222222] p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-[#E5A11C]/10 dark:bg-[#E5A11C]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-[#E5A11C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {isIOS ? 'Add to Home Screen' : 'Install CoachReflect'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {isIOS
              ? 'Tap the Share button below, then "Add to Home Screen" for the best experience.'
              : 'Install the app for offline access and a native-like experience.'
            }
          </p>
          <div className="flex items-center gap-3">
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="px-4 py-2 text-sm font-medium bg-[#E5A11C] text-white rounded-lg hover:bg-[#CC8F17] transition-colors"
              >
                Install App
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {isIOS ? 'Got it' : 'Maybe later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
