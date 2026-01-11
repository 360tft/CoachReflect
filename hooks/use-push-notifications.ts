'use client'

import { useState, useEffect, useCallback } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

interface UsePushNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
  isLoading: boolean
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        !!VAPID_PUBLIC_KEY

      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)

        // Check if already subscribed
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        } catch (error) {
          console.error('Error checking subscription:', error)
        }
      }

      setIsLoading(false)
    }

    checkSupport()
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false

    setIsLoading(true)

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setIsLoading(false)
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Push subscription error:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe()

        // Notify server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Push unsubscribe error:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  }
}
