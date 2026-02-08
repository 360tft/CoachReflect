// Coach Reflection - Centralized Configuration
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
      price: 76.99,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || '',
      savings: 20, // ~20% off
      monthlyEquivalent: 6.42,
    },
  },

  // Individual Pro+ (includes syllabus)
  PRO_PLUS: {
    monthly: {
      price: 19.99,
      stripePriceId: process.env.STRIPE_PRO_PLUS_PRICE_ID || '',
    },
    annual: {
      price: 199,
      stripePriceId: process.env.STRIPE_PRO_PLUS_ANNUAL_PRICE_ID || '',
      savings: 17, // 2 months free (~17% off)
      monthlyEquivalent: 16.58,
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
    name: 'Club',
    maxSeats: 5,
    monthlyPrice: 79,
    annualPrice: 790,
    perCoachMonthly: 15.80,
    discount: '20% off Pro+',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CLUB_SMALL_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CLUB_SMALL_ANNUAL || '',
    features: [
      'Up to 5 coach accounts',
      'All Pro+ features for each coach',
      '12 voice notes per coach/month',
      'Club syllabus upload',
      'Shared analytics dashboard',
      'Club admin portal',
    ],
  },
  {
    id: 'club',
    name: 'Club+',
    maxSeats: 15,
    monthlyPrice: 239,
    annualPrice: 2390,
    perCoachMonthly: 15.93,
    discount: '20% off Pro+',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CLUB_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CLUB_ANNUAL || '',
    features: [
      'Up to 15 coach accounts',
      'All Pro+ features for each coach',
      '12 voice notes per coach/month',
      'Club syllabus upload',
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
    monthlyPrice: 479,
    annualPrice: 4790,
    perCoachMonthly: 15.97,
    discount: '20% off Pro+',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CLUB_ACADEMY_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CLUB_ACADEMY_ANNUAL || '',
    features: [
      'Up to 30 coach accounts',
      'All Pro+ features for each coach',
      '12 voice notes per coach/month',
      'Club syllabus upload',
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
    messagesPerDay: 2,
    voiceNotesPerMonth: 0,
    shortVoiceNotesPerMonth: 0,
    fullRecordingsPerMonth: 0,
    isSharedVoicePool: false,
    sessionPlansPerMonth: 0,
    historyDays: 7, // 1 week
    analyticsWeeks: 1, // 1 week
    hasSyllabus: false,
  },
  PRO: {
    messagesPerDay: -1, // unlimited
    voiceNotesPerMonth: 4,
    shortVoiceNotesPerMonth: 4,   // shared pool of 4
    fullRecordingsPerMonth: 4,    // shared pool of 4
    isSharedVoicePool: true,
    sessionPlansPerMonth: -1,
    historyDays: -1,
    analyticsWeeks: -1, // unlimited
    hasSyllabus: false,
  },
  PRO_PLUS: {
    messagesPerDay: -1, // unlimited
    voiceNotesPerMonth: -1,
    shortVoiceNotesPerMonth: -1,  // unlimited
    fullRecordingsPerMonth: 12,
    isSharedVoicePool: false,
    sessionPlansPerMonth: -1,
    historyDays: -1,
    analyticsWeeks: -1, // unlimited
    hasSyllabus: true,
  },
} as const

// Voice duration thresholds (seconds)
export const VOICE_SHORT_MAX_SECONDS = 300     // 5 minutes
export const VOICE_FULL_MAX_SECONDS = 7200     // 2 hours

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURES = {
  FREE: {
    chat: true,
    voiceNotes: false,
    sessionPlanUpload: false,
    themeExtraction: false,
    analytics: true, // limited to 4 weeks
    export: false,
    memory: false,
    cpdDocumentation: false,
    structuredReflection: false,
    communicationAnalysis: false,
    developmentBlocks: false,
    cpdExport: false,
    ageNudges: false,
  },
  PRO: {
    chat: true,
    voiceNotes: true,
    sessionPlanUpload: true,
    themeExtraction: true,
    analytics: true,
    export: true,
    memory: true,
    cpdDocumentation: true,
    structuredReflection: true,
    communicationAnalysis: false,
    developmentBlocks: false,
    cpdExport: false,
    ageNudges: false,
  },
  PRO_PLUS: {
    chat: true,
    voiceNotes: true,
    sessionPlanUpload: true,
    themeExtraction: true,
    analytics: true,
    export: true,
    memory: true,
    cpdDocumentation: true,
    structuredReflection: true,
    communicationAnalysis: true,
    developmentBlocks: true,
    cpdExport: true,
    ageNudges: true,
  },
} as const

// =============================================================================
// APP SETTINGS
// =============================================================================

export const APP_CONFIG = {
  name: 'Coach Reflection',
  tagline: 'Grow as a Coach Through Guided Reflection',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com',
  supportEmail: 'admin@360tft.com',

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
  return tierMap[tier] || LIMITS.FREE
}

export function getTierFeatures(tier: 'free' | 'pro' | 'pro_plus') {
  const tierMap = {
    free: FEATURES.FREE,
    pro: FEATURES.PRO,
    pro_plus: FEATURES.PRO_PLUS,
  }
  return tierMap[tier] || FEATURES.FREE
}
