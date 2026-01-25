'use client'

import { useState } from 'react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'

interface Props {
  variant?: 'banner' | 'card' | 'inline'
  onDismiss?: () => void
}

export function PushNotificationPrompt({ variant = 'card', onDismiss }: Props) {
  const { isSupported, permission, isSubscribed, isLoading, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(() => {
    // Check during initialization (client-side only)
    if (typeof window === 'undefined') return false
    const dismissedTime = localStorage.getItem('push-prompt-dismissed')
    if (dismissedTime) {
      const dismissedDate = new Date(dismissedTime)
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceDismissed < 7
    }
    return false
  })

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-dismissed', new Date().toISOString())
    setDismissed(true)
    onDismiss?.()
  }

  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      setDismissed(true)
    }
  }

  // Don't show if not supported, already subscribed, denied, or dismissed
  if (!isSupported || isSubscribed || permission === 'denied' || dismissed) {
    return null
  }

  if (variant === 'banner') {
    return (
      <div className="bg-muted/50 dark:bg-primary/10/20 border-b border dark:border px-4 py-3">
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl">bell symbol</span>
            <p className="text-sm text-primary dark:text-primary">
              Enable notifications to keep your reflection streak going
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleEnable}
              disabled={isLoading}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/80 rounded"
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

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span>bell symbol</span>
          <span className="text-sm text-muted-foreground">Push Notifications</span>
        </div>
        <Button
          onClick={handleEnable}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="text-primary dark:text-primary hover:bg-muted/50 dark:hover:bg-primary/10/20"
        >
          {isLoading ? 'Enabling...' : 'Enable'}
        </Button>
      </div>
    )
  }

  // Default card variant
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 dark:bg-primary/10/30 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">
              Stay on track with notifications
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get reminders to maintain your reflection streak and never miss important coaching insights.
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleEnable}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
              >
                Maybe later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Settings toggle component
export function PushNotificationToggle() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications()

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between py-3 opacity-50">
        <div>
          <p className="font-medium">Push Notifications</p>
          <p className="text-sm text-muted-foreground">Not supported in this browser</p>
        </div>
        <div className="text-sm text-muted-foreground">Unavailable</div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="font-medium">Push Notifications</p>
          <p className="text-sm text-muted-foreground">
            Blocked - enable in browser settings
          </p>
        </div>
        <div className="text-sm text-destructive">Blocked</div>
      </div>
    )
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium">Push Notifications</p>
        <p className="text-sm text-muted-foreground">
          Get streak reminders and coaching insights
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          isSubscribed ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isSubscribed ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
