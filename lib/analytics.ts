/**
 * Google Analytics 4 helper functions for client-side event tracking
 * Use these functions to track custom events and conversions throughout the app
 */

// Event parameters interface
interface EventParams {
  [key: string]: string | number | boolean | undefined
}

/**
 * Track a custom event
 * @param name - Event name (e.g., 'button_click', 'form_submit')
 * @param params - Event parameters (e.g., { category: 'engagement', label: 'upgrade_button' })
 */
export function trackEvent(name: string, params?: EventParams): void {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, params)
    }
  } catch (error) {
    // Analytics should never break the app
    console.error('Failed to track event:', error)
  }
}

/**
 * Track conversion events (signup, upgrade, etc.)
 * @param type - Conversion type
 * @param value - Optional conversion value
 * @param params - Additional parameters
 */
export function trackConversion(
  type: 'signup' | 'upgrade' | 'trial_start' | 'purchase' | 'subscription',
  value?: number,
  params?: EventParams
): void {
  try {
    const eventParams: EventParams = {
      ...params,
      conversion_type: type,
    }

    // Add value if provided
    if (value !== undefined) {
      eventParams.value = value
      eventParams.currency = 'USD'
    }

    // Map to GA4 recommended event names
    const eventName = type === 'signup' ? 'sign_up' :
                     type === 'upgrade' || type === 'subscription' ? 'begin_checkout' :
                     type === 'purchase' ? 'purchase' :
                     type

    trackEvent(eventName, eventParams)
  } catch (error) {
    console.error('Failed to track conversion:', error)
  }
}

/**
 * Track reflection events
 * @param action - Reflection action (e.g., 'reflection_created', 'reflection_analyzed')
 * @param params - Additional parameters (e.g., { session_type: 'training' })
 */
export function trackReflection(action: string, params?: EventParams): void {
  trackEvent('reflection_event', {
    ...params,
    action,
  })
}

/**
 * Track subscription events
 * @param action - Subscription action (e.g., 'checkout_started', 'cancelled')
 * @param params - Additional parameters
 */
export function trackSubscription(action: string, params?: EventParams): void {
  trackEvent('subscription_event', {
    ...params,
    action,
  })
}

/**
 * Track feature usage
 * @param feature - Feature name (e.g., 'ai_insights', 'session_analytics')
 * @param params - Additional parameters
 */
export function trackFeature(feature: string, params?: EventParams): void {
  trackEvent('feature_usage', {
    ...params,
    feature,
  })
}

/**
 * Track page views manually (if needed beyond automatic tracking)
 * @param path - Page path
 * @param title - Page title
 */
export function trackPageView(path: string, title?: string): void {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      const GA_ID = process.env.NEXT_PUBLIC_GA4_ID
      if (GA_ID) {
        window.gtag('config', GA_ID, {
          page_path: path,
          page_title: title,
        })
      }
    }
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}
