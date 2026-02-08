import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { notifyNewProSubscription, notifySubscriptionCancelled, sendProWelcomeEmail } from '@/lib/email-sender'

export const dynamic = 'force-dynamic'

// Idempotency: Track processed events to prevent duplicates
const processedEvents = new Map<string, number>()
const EVENT_TTL = 5 * 60 * 1000 // 5 minutes

function cleanupProcessedEvents() {
  const now = Date.now()
  for (const [eventId, timestamp] of processedEvents) {
    if (now - timestamp > EVENT_TTL) {
      processedEvents.delete(eventId)
    }
  }
}

// RevenueCat webhook event types
// https://www.revenuecat.com/docs/webhooks
type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER'

interface RevenueCatWebhookEvent {
  api_version: string
  event: {
    aliases: string[]
    app_id: string
    app_user_id: string
    commission_percentage?: number
    country_code?: string
    currency?: string
    entitlement_id?: string
    entitlement_ids?: string[]
    environment: 'SANDBOX' | 'PRODUCTION'
    event_timestamp_ms: number
    expiration_at_ms?: number
    id: string
    is_family_share?: boolean
    offer_code?: string
    original_app_user_id: string
    original_transaction_id?: string
    period_type?: 'NORMAL' | 'INTRO' | 'TRIAL'
    presented_offering_id?: string
    price?: number
    price_in_purchased_currency?: number
    product_id: string
    purchased_at_ms?: number
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL'
    subscriber_attributes?: Record<string, { value: string; updated_at_ms: number }>
    takehome_percentage?: number
    tax_percentage?: number
    transaction_id?: string
    type: RevenueCatEventType
  }
}

function verifyWebhookSignature(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[RevenueCat Webhook] REVENUECAT_WEBHOOK_SECRET not configured')
    return false
  }

  // RevenueCat sends the secret as Bearer token
  const expectedAuth = `Bearer ${webhookSecret}`
  return authHeader === expectedAuth
}

// Determine subscription tier from product_id
function getTierFromProductId(productId: string): 'pro' | 'pro_plus' {
  if (productId.includes('proplus') || productId.includes('pro_plus')) {
    return 'pro_plus'
  }
  return 'pro'
}

export async function POST(request: NextRequest) {
  const body = await request.text()

  if (!verifyWebhookSignature(request)) {
    console.error('[RevenueCat Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: RevenueCatWebhookEvent

  try {
    event = JSON.parse(body)
  } catch {
    console.error('[RevenueCat Webhook] Invalid JSON body')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, app_user_id, product_id, expiration_at_ms, store, price, id: eventId } = event.event

  // Idempotency check - prevent duplicate processing
  cleanupProcessedEvents()
  if (processedEvents.has(eventId)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Skip sandbox events in production
  if (event.event.environment === 'SANDBOX' && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ received: true, skipped: true })
  }

  const adminClient = createAdminClient()

  // The app_user_id should be the Supabase user ID (set when identifying user in RevenueCat)
  const userId = app_user_id
  const isAnnual = product_id.includes('annual') || product_id.includes('yearly')
  const subscriptionTier = getTierFromProductId(product_id)
  const subscriptionSource = store === 'APP_STORE' ? 'apple' : 'google'

  try {
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'NON_RENEWING_PURCHASE': {
        const expirationDate = expiration_at_ms
          ? new Date(expiration_at_ms).toISOString()
          : new Date(Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()

        // Update profiles table directly (CoachReflect pattern)
        const { error } = await adminClient
          .from('profiles')
          .update({
            subscription_tier: subscriptionTier,
            subscription_status: 'active',
            subscription_period_end: expirationDate,
            subscription_source: subscriptionSource,
            revenuecat_app_user_id: userId,
          })
          .eq('user_id', userId)

        if (error) {
          console.error('[RevenueCat Webhook] Failed to update profile:', error)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        // Send notifications for initial purchase
        if (type === 'INITIAL_PURCHASE') {
          const { data: userData } = await adminClient.auth.admin.getUserById(userId)
          const userEmail = userData?.user?.email

          if (userEmail) {
            notifyNewProSubscription(userEmail, price ? Math.round(price * 100) : undefined).catch(console.error)
            sendProWelcomeEmail(userEmail).catch(console.error)
          }
        }

        break
      }

      case 'CANCELLATION': {
        // Mark as cancelling but don't remove access yet
        const { error } = await adminClient
          .from('profiles')
          .update({
            subscription_status: 'canceled',
          })
          .eq('user_id', userId)
          .eq('subscription_source', subscriptionSource)

        if (error) {
          console.error('[RevenueCat Webhook] Failed to update cancellation:', error)
        }

        const { data: userData } = await adminClient.auth.admin.getUserById(userId)
        if (userData?.user?.email) {
          notifySubscriptionCancelled(userData.user.email).catch(console.error)
        }

        break
      }

      case 'UNCANCELLATION': {
        const { error } = await adminClient
          .from('profiles')
          .update({
            subscription_status: 'active',
          })
          .eq('user_id', userId)
          .eq('subscription_source', subscriptionSource)

        if (error) {
          console.error('[RevenueCat Webhook] Failed to process uncancellation:', error)
        }

        break
      }

      case 'EXPIRATION': {
        // Subscription expired - revoke access
        const { error } = await adminClient
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'inactive',
            subscription_source: null,
          })
          .eq('user_id', userId)
          .eq('subscription_source', subscriptionSource)

        if (error) {
          console.error('[RevenueCat Webhook] Failed to process expiration:', error)
        }

        break
      }

      case 'BILLING_ISSUE': {
        const { error } = await adminClient
          .from('profiles')
          .update({
            subscription_status: 'past_due',
          })
          .eq('user_id', userId)
          .eq('subscription_source', subscriptionSource)

        if (error) {
          console.error('[RevenueCat Webhook] Failed to process billing issue:', error)
        }

        break
      }

      case 'PRODUCT_CHANGE': {
        // User changed subscription (e.g., monthly to annual, or pro to pro_plus)
        const newExpirationDate = expiration_at_ms
          ? new Date(expiration_at_ms).toISOString()
          : null

        const updateData: Record<string, string | null> = {
          subscription_tier: subscriptionTier,
        }
        if (newExpirationDate) {
          updateData.subscription_period_end = newExpirationDate
        }

        await adminClient
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId)

        break
      }

      case 'TRANSFER':
      case 'SUBSCRIPTION_PAUSED':
      default:
        // No action needed
        break
    }

    // Mark event as processed
    processedEvents.set(eventId, Date.now())

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[RevenueCat Webhook] Error processing event:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
