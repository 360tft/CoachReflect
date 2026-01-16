// CoachReflect - Centralized Configuration
// Single source of truth for pricing, limits, and settings

// =============================================================================
// PRICING
// =============================================================================

export type BillingPeriod = 'monthly' | 'annual'

export const PRICING = {
  // Individual Pro
  PRO: {
    monthly: {
      price: 7.99,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    },
    annual: {
      price: 79,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || '',
      savings: 17, // ~17% off ($7.99 * 12 = $95.88, save $16.88)
      monthlyEquivalent: 6.58,
    },
  },

  // Pro+ (Team/Advanced features)
  PRO_PLUS: {
    monthly: {
      price: 29,
      stripePriceId: process.env.STRIPE_PRO_PLUS_PRICE_ID || '',
    },
    annual: {
      price: 290,
      stripePriceId: process.env.STRIPE_PRO_PLUS_ANNUAL_PRICE_ID || '',
      savings: 17,
      monthlyEquivalent: 24.17,
    },
  },

  // Sponsor/Partner
  SPONSOR: {
    monthly: {
      price: 99,
      stripePriceId: process.env.STRIPE_SPONSOR_PRICE_ID || '',
    },
    annual: {
      price: 899,
      stripePriceId: process.env.STRIPE_SPONSOR_ANNUAL_PRICE_ID || '',
      savings: 24, // 24% off
      monthlyEquivalent: 74.92,
    },
  },

  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
} as const

// =============================================================================
// CLUB TIERS
// =============================================================================

export type ClubTier = 'small_club' | 'club' | 'academy'

export interface ClubTierConfig {
  id: ClubTier
  name: string
  maxSeats: number
  monthlyPrice: number
  annualPrice: number
  perCoachMonthly: number
  discount: string
  stripePriceIdMonthly: string
  stripePriceIdAnnual: string
  features: string[]
  recommended?: boolean
}

export const CLUB_TIERS: ClubTierConfig[] = [
  {
    id: 'small_club',
    name: 'Small Club',
    maxSeats: 5,
    monthlyPrice: 29,
    annualPrice: 259,
    perCoachMonthly: 5.80,
    discount: '27% off',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CLUB_SMALL_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CLUB_SMALL_ANNUAL || '',
    features: [
      'Up to 5 coach accounts',
      'All Pro features for each coach',
      'Shared analytics dashboard',
      'Club admin portal',
    ],
  },
  {
    id: 'club',
    name: 'Club',
    maxSeats: 15,
    monthlyPrice: 59,
    annualPrice: 529,
    perCoachMonthly: 3.93,
    discount: '51% off',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CLUB_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CLUB_ANNUAL || '',
    features: [
      'Up to 15 coach accounts',
      'All Pro features for each coach',
      'Shared analytics dashboard',
      'Club admin portal',
      'Priority support',
    ],
    recommended: true,
  },
  {
    id: 'academy',
    name: 'Academy',
    maxSeats: 30,
    monthlyPrice: 99,
    annualPrice: 899,
    perCoachMonthly: 3.30,
    discount: '59% off',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CLUB_ACADEMY_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CLUB_ACADEMY_ANNUAL || '',
    features: [
      'Up to 30 coach accounts',
      'All Pro features for each coach',
      'Shared analytics dashboard',
      'Club admin portal',
      'Priority support',
      'Custom onboarding',
      'API access',
    ],
  },
]

export function getClubTier(tierId: ClubTier): ClubTierConfig | undefined {
  return CLUB_TIERS.find(t => t.id === tierId)
}

// =============================================================================
// SUBSCRIPTION LIMITS
// =============================================================================

export const LIMITS = {
  FREE: {
    messagesPerDay: 5,
    voiceNotesPerMonth: 3,
    sessionPlansPerMonth: 0,
    historyDays: 14, // 2 weeks
    analyticsWeeks: 4,
  },
  PRO: {
    messagesPerDay: -1, // unlimited
    voiceNotesPerMonth: -1,
    sessionPlansPerMonth: -1,
    historyDays: -1,
    analyticsWeeks: 12,
  },
  PRO_PLUS: {
    messagesPerDay: -1,
    voiceNotesPerMonth: -1,
    sessionPlansPerMonth: -1,
    historyDays: -1,
    analyticsWeeks: -1, // unlimited
  },
} as const

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURES = {
  FREE: {
    chat: true,
    voiceNotes: true, // limited
    sessionPlanUpload: false,
    themeExtraction: false,
    analytics: true, // limited to 4 weeks
    export: false,
    memory: false,
  },
  PRO: {
    chat: true,
    voiceNotes: true,
    sessionPlanUpload: true,
    themeExtraction: true,
    analytics: true,
    export: true,
    memory: true,
  },
  PRO_PLUS: {
    chat: true,
    voiceNotes: true,
    sessionPlanUpload: true,
    themeExtraction: true,
    analytics: true,
    export: true,
    memory: true,
    teamAnalytics: true,
    cpdDocumentation: true,
  },
} as const

// =============================================================================
// APP SETTINGS
// =============================================================================

export const APP_CONFIG = {
  name: 'CoachReflect',
  tagline: 'Grow as a Coach Through Guided Reflection',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflect.com',
  supportEmail: 'support@coachreflect.com',

  // Sponsors
  maxSponsorSlots: 5,

  // Chat
  maxHistoryMessages: 20,
  maxMessageLength: 10000,
  maxTokens: 2048,

  // Voice
  maxVoiceDurationSeconds: 300, // 5 minutes

  // Analytics
  analyticsPeriodsWeeks: [4, 8, 12] as const,
} as const

// =============================================================================
// HELPERS
// =============================================================================

export function formatPrice(amount: number): string {
  return `${PRICING.CURRENCY_SYMBOL}${amount.toFixed(2)}`
}

export function getAnnualSavings(monthlyPrice: number, annualPrice: number): number {
  const yearlyAtMonthly = monthlyPrice * 12
  return Math.round(((yearlyAtMonthly - annualPrice) / yearlyAtMonthly) * 100)
}

export function getTierLimits(tier: 'free' | 'pro' | 'pro_plus') {
  const tierMap = {
    free: LIMITS.FREE,
    pro: LIMITS.PRO,
    pro_plus: LIMITS.PRO_PLUS,
  }
  return tierMap[tier]
}

export function getTierFeatures(tier: 'free' | 'pro' | 'pro_plus') {
  const tierMap = {
    free: FEATURES.FREE,
    pro: FEATURES.PRO,
    pro_plus: FEATURES.PRO_PLUS,
  }
  return tierMap[tier]
}
