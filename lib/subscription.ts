// Subscription validation for Coach Reflection
// Unified subscription checking across individual and club memberships

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Pro testers whitelist - loaded from environment variable
// Format: comma-separated emails (e.g., "email1@example.com,email2@example.com")
const PRO_TESTERS_WHITELIST: string[] = (process.env.PRO_TESTERS_WHITELIST || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0)

export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'past_due' | 'unpaid' | 'incomplete' | null

export type SubscriptionTier = 'free' | 'pro'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  status: SubscriptionStatus
  current_period_end: string
  cancel_at_period_end: boolean
  cancel_at: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionInfo {
  tier: SubscriptionTier
  type: 'individual' | 'club' | 'tester' | 'free'
  isActive: boolean
  expiresAt: string | null
  clubName?: string
}

/**
 * Check if a user has an active subscription (individual, club, or tester)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const info = await getSubscriptionInfo(userId)
  return info.isActive
}

/**
 * Get detailed subscription information for a user
 */
export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const supabase = await createClient()

  // 1. Check if user is in Pro testers whitelist
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email && PRO_TESTERS_WHITELIST.includes(user.email.toLowerCase())) {
    return {
      tier: 'pro',
      type: 'tester',
      isActive: true,
      expiresAt: null,
    }
  }

  // 2. Check individual subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, subscription_period_end')
    .eq('user_id', userId)
    .single()

  if (profile) {
    const isPro = profile.subscription_tier === 'pro'
    const isActive = profile.subscription_status === 'active'
    const notExpired = profile.subscription_period_end
      ? new Date(profile.subscription_period_end) > new Date()
      : true

    if (isPro && isActive && notExpired) {
      return {
        tier: 'pro',
        type: 'individual',
        isActive: true,
        expiresAt: profile.subscription_period_end,
      }
    }
  }

  // 3. Check club membership (use admin client to bypass RLS)
  const adminClient = createAdminClient()
  const { data: membership } = await adminClient
    .from('club_memberships')
    .select(`
      club_id,
      status,
      clubs (
        name,
        subscription_status,
        current_period_end
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (membership?.clubs) {
    const club = membership.clubs as unknown as {
      name: string
      subscription_status: string
      current_period_end: string
    }
    const clubActive = club.subscription_status === 'active'
    const clubNotExpired = club.current_period_end
      ? new Date(club.current_period_end) > new Date()
      : true

    if (clubActive && clubNotExpired) {
      return {
        tier: 'pro',
        type: 'club',
        isActive: true,
        expiresAt: club.current_period_end,
        clubName: club.name,
      }
    }
  }

  // 4. Free tier
  return {
    tier: 'free',
    type: 'free',
    isActive: false,
    expiresAt: null,
  }
}

/**
 * Get user's subscription type for display
 */
export async function getSubscriptionType(userId: string): Promise<'individual' | 'club' | 'free'> {
  const info = await getSubscriptionInfo(userId)

  if (info.type === 'tester' || info.type === 'individual') {
    return 'individual'
  }
  if (info.type === 'club') {
    return 'club'
  }
  return 'free'
}

/**
 * Get the full subscription record for a user (if individual)
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as Subscription
}

/**
 * Check if user can perform a Pro action
 */
export async function canUsePro(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const info = await getSubscriptionInfo(userId)

  if (info.isActive) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'This feature requires a Pro subscription'
  }
}

/**
 * Check if user is a Pro tester
 */
export function isProTester(email: string | undefined): boolean {
  if (!email) return false
  return PRO_TESTERS_WHITELIST.includes(email.toLowerCase())
}
