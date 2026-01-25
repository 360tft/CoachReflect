'use client'

import { useCallback, useEffect, useRef } from 'react'

// Get or create session ID for anonymous tracking
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('cr_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('cr_session_id', sessionId)
  }
  return sessionId
}

interface TrackEventOptions {
  event_type: string
  event_category: 'auth' | 'reflection' | 'billing' | 'feature' | 'email' | 'engagement' | 'navigation'
  event_data?: Record<string, unknown>
}

export function useAnalytics() {
  const sessionIdRef = useRef<string>('')

  useEffect(() => {
    sessionIdRef.current = getSessionId()
  }, [])

  const track = useCallback(async (options: TrackEventOptions) => {
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          session_id: sessionIdRef.current,
        }),
      })
    } catch {
      // Silently fail - don't block user experience
    }
  }, [])

  return { track }
}

// Predefined event helpers
export function trackPageView(page: string) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'page_view',
      event_category: 'navigation',
      event_data: { page },
      session_id: typeof window !== 'undefined' ? sessionStorage.getItem('cr_session_id') : null,
    }),
  }).catch(() => {})
}

// Common event types for Coach Reflection
export const EVENTS = {
  // Auth events
  SIGNUP_START: { event_type: 'signup_start', event_category: 'auth' as const },
  SIGNUP_COMPLETE: { event_type: 'signup_complete', event_category: 'auth' as const },
  LOGIN: { event_type: 'login', event_category: 'auth' as const },
  LOGOUT: { event_type: 'logout', event_category: 'auth' as const },

  // Reflection events
  REFLECTION_START: { event_type: 'reflection_start', event_category: 'reflection' as const },
  REFLECTION_COMPLETE: { event_type: 'reflection_complete', event_category: 'reflection' as const },
  REFLECTION_VIEW: { event_type: 'reflection_view', event_category: 'reflection' as const },
  AI_ANALYSIS_REQUEST: { event_type: 'ai_analysis_request', event_category: 'reflection' as const },

  // Billing events
  UPGRADE_VIEW: { event_type: 'upgrade_view', event_category: 'billing' as const },
  CHECKOUT_START: { event_type: 'checkout_start', event_category: 'billing' as const },
  SUBSCRIPTION_CREATED: { event_type: 'subscription_created', event_category: 'billing' as const },
  SUBSCRIPTION_CANCELLED: { event_type: 'subscription_cancelled', event_category: 'billing' as const },

  // Feature events
  CHAT_START: { event_type: 'chat_start', event_category: 'feature' as const },
  CHAT_MESSAGE: { event_type: 'chat_message', event_category: 'feature' as const },
  SESSION_PLAN_UPLOAD: { event_type: 'session_plan_upload', event_category: 'feature' as const },
  SHARE_REFLECTION: { event_type: 'share_reflection', event_category: 'feature' as const },
  FEEDBACK_SUBMIT: { event_type: 'feedback_submit', event_category: 'feature' as const },

  // Engagement events
  PUSH_SUBSCRIBE: { event_type: 'push_subscribe', event_category: 'engagement' as const },
  PUSH_UNSUBSCRIBE: { event_type: 'push_unsubscribe', event_category: 'engagement' as const },
  TRIAL_USED: { event_type: 'trial_used', event_category: 'engagement' as const },
}
