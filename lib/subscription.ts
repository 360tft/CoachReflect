// Subscription validation for Coach Reflection
// Unified subscription checking across individual and club memberships

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Admin emails get Pro+ access - loaded from environment variable
// Format: comma-separated emails (e.g., "admin@example.com")
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0)

// Pro testers whitelist - loaded from environment variable
// Format: comma-separated emails (e.g., "email1@example.com,email2@example.com")
const PRO_TESTERS_WHITELIST: string[] = (process.env.PRO_TESTERS_WHITELIST || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0)

export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'past_due' | 'unpaid' | 'incomplete' | null

export type SubscriptionTier = 'free' | 'pro' | 'pro_plus'

// Tier feature limits
export interface TierLimits {
  /** @deprecated Use shortVoiceNotesPerMonth / fullRecordingsPerMonth instead */
  voiceNotesPerMonth: number
  shortVoiceNotesPerMonth: number  // -1 = unlimited
  fullRecordingsPerMonth: number   // -1 = unlimited
  isSharedVoicePool: boolean       // Pro shares short+full in one pool
  hasSyllabus: boolean
  hasAdvancedAnalytics: boolean
  hasStructuredReflection: boolean
  hasCommunicationAnalysis: boolean
  hasDevelopmentBlocks: boolean
  hasCPDExport: boolean
  hasAgeNudges: boolean
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    voiceNotesPerMonth: 0,
    shortVoiceNotesPerMonth: 0,
    fullRecordingsPerMonth: 0,
    isSharedVoicePool: false,
    hasSyllabus: false,
    hasAdvancedAnalytics: false,
    hasStructuredReflection: false,
    hasCommunicationAnalysis: false,
    hasDevelopmentBlocks: false,
    hasCPDExport: false,
    hasAgeNudges: false,
  },
  pro: {
    voiceNotesPerMonth: 4,
    shortVoiceNotesPerMonth: 4,   // shared pool
    fullRecordingsPerMonth: 4,    // shared pool
    isSharedVoicePool: true,
    hasSyllabus: false,
    hasAdvancedAnalytics: false,
    hasStructuredReflection: true,
    hasCommunicationAnalysis: false,
    hasDevelopmentBlocks: false,
    hasCPDExport: false,
    hasAgeNudges: false,
  },
  pro_plus: {
    voiceNotesPerMonth: -1,
    shortVoiceNotesPerMonth: -1,  // unlimited
    fullRecordingsPerMonth: 12,
    isSharedVoicePool: false,
    hasSyllabus: true,
    hasAdvancedAnalytics: true,
    hasStructuredReflection: true,
    hasCommunicationAnalysis: true,
    hasDevelopmentBlocks: true,
    hasCPDExport: true,
    hasAgeNudges: true,
  },
}

// Club members get Pro+ equivalent
export const CLUB_MEMBER_LIMITS: TierLimits = {
  voiceNotesPerMonth: -1,
  shortVoiceNotesPerMonth: -1,
  fullRecordingsPerMonth: 12,
  isSharedVoicePool: false,
  hasSyllabus: true,
  hasAdvancedAnalytics: true,
  hasStructuredReflection: true,
  hasCommunicationAnalysis: true,
  hasDevelopmentBlocks: true,
  hasCPDExport: true,
  hasAgeNudges: true,
}

// Pricing configuration (single source of truth)
export const PRICING = {
  individual: {
    pro: {
      monthly: 9.99,
      yearly: 99,
      yearlyMonthly: 8.25,
    },
    pro_plus: {
      monthly: 19.99,
      yearly: 199,
      yearlyMonthly: 16.58,
    },
  },
  club: {
    club: {
      coaches: 5,
      monthly: 79,
      yearly: 790,
      yearlyMonthly: 65.83,
    },
    club_plus: {
      coaches: 15,
      monthly: 239,
      yearly: 2390,
      yearlyMonthly: 199.17,
    },
    academy: {
      coaches: 30,
      monthly: 479,
      yearly: 4790,
      yearlyMonthly: 399.17,
    },
  },
} as const

/**
 * Get the voice note limit for a subscription tier
 * @deprecated Use getVoiceLimits() instead for split short/full limits
 */
export function getVoiceNoteLimit(tier: SubscriptionTier | string): number {
  const limits = TIER_LIMITS[tier as SubscriptionTier]
  return limits?.voiceNotesPerMonth ?? 0
}

/**
 * Get split voice limits for a subscription tier
 */
export function getVoiceLimits(tier: SubscriptionTier | string, isClubMember: boolean = false): {
  shortPerMonth: number
  fullPerMonth: number
  isSharedPool: boolean
} {
  const limits = isClubMember ? CLUB_MEMBER_LIMITS : TIER_LIMITS[tier as SubscriptionTier]
  if (!limits) {
    return { shortPerMonth: 0, fullPerMonth: 0, isSharedPool: false }
  }
  return {
    shortPerMonth: limits.shortVoiceNotesPerMonth,
    fullPerMonth: limits.fullRecordingsPerMonth,
    isSharedPool: limits.isSharedVoicePool,
  }
}

export type FeatureFlag =
  | 'structuredReflection'
  | 'communicationAnalysis'
  | 'developmentBlocks'
  | 'cpdExport'
  | 'ageNudges'
  | 'syllabus'
  | 'advancedAnalytics'

/**
 * Check if a tier has a specific feature
 */
export function hasFeature(tier: SubscriptionTier | string, feature: FeatureFlag, isClubMember: boolean = false): boolean {
  const limits = isClubMember ? CLUB_MEMBER_LIMITS : TIER_LIMITS[tier as SubscriptionTier]
  if (!limits) return false

  switch (feature) {
    case 'structuredReflection': return limits.hasStructuredReflection
    case 'communicationAnalysis': return limits.hasCommunicationAnalysis
    case 'developmentBlocks': return limits.hasDevelopmentBlocks
    case 'cpdExport': return limits.hasCPDExport
    case 'ageNudges': return limits.hasAgeNudges
    case 'syllabus': return limits.hasSyllabus
    case 'advancedAnalytics': return limits.hasAdvancedAnalytics
    default: return false
  }
}

/**
 * Check if a tier has syllabus feature
 */
export function hasSyllabusFeature(tier: SubscriptionTier | string, isClubMember: boolean = false): boolean {
  if (isClubMember) return true
  const limits = TIER_LIMITS[tier as SubscriptionTier]
  return limits?.hasSyllabus ?? false
}

/**
 * Get display name for tier
 */
export function getTierDisplayName(tier: SubscriptionTier | string): string {
  switch (tier) {
    case 'free': return 'Free'
    case 'pro': return 'Pro'
    case 'pro_plus': return 'Pro+'
    default: return tier
  }
}

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

export type SubscriptionSource = 'stripe' | 'apple' | 'google' | null

export interface SubscriptionInfo {
  tier: SubscriptionTier
  type: 'individual' | 'club' | 'tester' | 'free'
  isActive: boolean
  expiresAt: string | null
  clubName?: string
  source?: SubscriptionSource
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

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Check if user is admin - gets Pro+ access
  if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return {
      tier: 'pro_plus',
      type: 'tester',
      isActive: true,
      expiresAt: null,
    }
  }

  // 2. Check if user is in Pro testers whitelist
  if (user?.email && PRO_TESTERS_WHITELIST.includes(user.email.toLowerCase())) {
    return {
      tier: 'pro',
      type: 'tester',
      isActive: true,
      expiresAt: null,
    }
  }

  // 3. Check individual subscription (Stripe or RevenueCat/IAP)
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, subscription_period_end, subscription_source')
    .eq('user_id', userId)
    .single()

  if (profile) {
    const isPro = profile.subscription_tier === 'pro' || profile.subscription_tier === 'pro_plus'
    const isActive = profile.subscription_status === 'active' || profile.subscription_status === 'trialing'
    const notExpired = profile.subscription_period_end
      ? new Date(profile.subscription_period_end) > new Date()
      : true

    if (isPro && isActive && notExpired) {
      return {
        tier: profile.subscription_tier as SubscriptionTier,
        type: 'individual',
        isActive: true,
        expiresAt: profile.subscription_period_end,
        source: (profile.subscription_source as SubscriptionSource) || null,
      }
    }
  }

  // 4. Check club membership (use admin client to bypass RLS)
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

  // 5. Free tier
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
