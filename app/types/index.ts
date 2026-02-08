// Coach Reflection Types

export interface Profile {
  id: string
  user_id: string
  display_name: string | null
  club_name: string | null
  age_group: string | null
  coaching_level: 'grassroots' | 'academy' | 'semi-pro' | 'professional' | null
  subscription_tier: 'free' | 'pro' | 'pro_plus'
  stripe_customer_id: string | null
  reflections_this_month: number
  reflection_count_period: string | null
  subscription_period_end: string | null
  subscription_status: 'active' | 'inactive' | 'past_due' | 'canceled'
  created_at: string
  updated_at: string
}

export type SubscriptionTier = 'free' | 'pro' | 'pro_plus'

export const SUBSCRIPTION_LIMITS = {
  free: {
    messages_per_day: 2,
    analytics_history_weeks: 1,  // Limited to last 7 days
    ai_features: false,
    session_plan_upload: false,
    voice_notes_per_month: 0,
    short_voice_notes_per_month: 0,
    full_recordings_per_month: 0,
    is_shared_voice_pool: false,
    has_syllabus: false,
    has_structured_reflection: false,
    has_communication_analysis: false,
    has_development_blocks: false,
    has_cpd_export: false,
    has_age_nudges: false,
  },
  pro: {
    messages_per_day: Infinity,
    analytics_history_weeks: Infinity,  // Full history
    ai_features: true,
    session_plan_upload: true,
    voice_notes_per_month: 4,
    short_voice_notes_per_month: 4,   // shared pool
    full_recordings_per_month: 4,     // shared pool
    is_shared_voice_pool: true,
    has_syllabus: false,
    has_structured_reflection: true,
    has_communication_analysis: false,
    has_development_blocks: false,
    has_cpd_export: false,
    has_age_nudges: false,
  },
  pro_plus: {
    messages_per_day: Infinity,
    analytics_history_weeks: Infinity,  // Full history
    ai_features: true,
    session_plan_upload: true,
    voice_notes_per_month: -1,          // unlimited (short)
    short_voice_notes_per_month: -1,    // unlimited
    full_recordings_per_month: 12,
    is_shared_voice_pool: false,
    has_syllabus: true,
    has_structured_reflection: true,
    has_communication_analysis: true,
    has_development_blocks: true,
    has_cpd_export: true,
    has_age_nudges: true,
  },
} as const

export interface Session {
  id: string
  user_id: string
  title: string
  session_type: SessionType
  date: string
  duration_minutes: number | null
  players_present: number | null
  weather: string | null
  notes: string | null
  created_at: string
}

export type SessionType = 
  | 'training'
  | 'match'
  | 'friendly'
  | 'tournament'
  | 'trial'
  | 'individual'

export const SESSION_TYPES: { id: SessionType; label: string; emoji: string }[] = [
  { id: 'training', label: 'Training Session', emoji: '' },
  { id: 'match', label: 'Competitive Match', emoji: '' },
  { id: 'friendly', label: 'Friendly Match', emoji: '' },
  { id: 'tournament', label: 'Tournament', emoji: '' },
  { id: 'trial', label: 'Trial/Assessment', emoji: '' },
  { id: 'individual', label: 'Individual Session', emoji: '' },
]

export interface Reflection {
  id: string
  user_id: string
  session_id: string | null
  date: string
  
  // Guided reflection questions
  what_worked: string | null
  what_didnt_work: string | null
  player_standouts: string | null
  areas_to_improve: string | null
  next_focus: string | null
  mood_rating: number | null // 1-5
  energy_rating: number | null // 1-5
  
  // AI-generated
  ai_summary: string | null
  ai_insights: string | null
  ai_action_items: string[] | null
  
  // Metadata
  tags: string[] | null
  is_private: boolean
  created_at: string
  updated_at: string
  
  // Relations
  session?: Session
  session_plan?: SessionPlan
}

export interface Insight {
  id: string
  user_id: string
  insight_type: InsightType
  title: string
  description: string
  related_reflections: string[] // reflection IDs
  confidence_score: number // 0-1
  is_dismissed: boolean
  created_at: string
}

export type InsightType =
  | 'recurring_challenge' // Same issue appears multiple times
  | 'player_pattern' // Specific player mentioned often
  | 'improvement_trend' // Getting better at something
  | 'decline_trend' // Getting worse at something
  | 'suggestion' // AI recommendation
  | 'milestone' // Achievement unlocked

export const INSIGHT_TYPES: { id: InsightType; label: string; emoji: string }[] = [
  { id: 'recurring_challenge', label: 'Recurring Challenge', emoji: '' },
  { id: 'player_pattern', label: 'Athlete Pattern', emoji: '' },
  { id: 'improvement_trend', label: 'Improvement Trend', emoji: '' },
  { id: 'decline_trend', label: 'Needs Attention', emoji: '' },
  { id: 'suggestion', label: 'Suggestion', emoji: '' },
  { id: 'milestone', label: 'Milestone', emoji: '' },
]

export interface GuidedPrompt {
  id: string
  category: PromptCategory
  question: string
  placeholder: string
  tip: string | null
}

export type PromptCategory = 
  | 'performance'
  | 'players'
  | 'tactics'
  | 'emotions'
  | 'development'

export const GUIDED_PROMPTS: GuidedPrompt[] = [
  {
    id: 'what_worked',
    category: 'performance',
    question: 'What worked well today?',
    placeholder: 'The warm-up set the tone and the main activity clicked...',
    tip: 'Think about exercises, coaching moments, or things that clicked',
  },
  {
    id: 'what_didnt_work',
    category: 'performance',
    question: "What didn't go as planned?",
    placeholder: 'The group lost focus during the main activity...',
    tip: "Be honest - this is how we grow",
  },
  {
    id: 'player_standouts',
    category: 'players',
    question: 'Any athlete standouts (positive or needs support)?',
    placeholder: 'Jamie showed great leadership. Tom seemed distracted...',
    tip: 'Track individual progress over time',
  },
  {
    id: 'areas_to_improve',
    category: 'development',
    question: 'What areas need more work?',
    placeholder: 'Communication, decision-making under pressure...',
    tip: 'These become focus areas for future sessions',
  },
  {
    id: 'next_focus',
    category: 'tactics',
    question: 'What will you focus on next session?',
    placeholder: 'Build on today\'s theme, address weak areas...',
    tip: 'Turn reflections into action',
  },
]

export const MOOD_OPTIONS = [
  { value: 1, label: 'Frustrated', emoji: '\u{1F624}' },
  { value: 2, label: 'Disappointed', emoji: '\u{1F61E}' },
  { value: 3, label: 'Neutral', emoji: '\u{1F610}' },
  { value: 4, label: 'Satisfied', emoji: '\u{1F60A}' },
  { value: 5, label: 'Excellent', emoji: '\u{1F525}' },
]

export const ENERGY_OPTIONS = [
  { value: 1, label: 'Drained', emoji: '\u{1F634}' },
  { value: 2, label: 'Low', emoji: '\u{1F614}' },
  { value: 3, label: 'Normal', emoji: '\u{1F610}' },
  { value: 4, label: 'Energized', emoji: '\u{26A1}' },
  { value: 5, label: 'Fired Up', emoji: '\u{1F525}' },
]

// Session Plan types (for uploaded coaching plans)
export interface SessionDrill {
  name: string
  description: string | null
  duration_minutes: number | null
  setup: string | null
  coaching_focus: string | null
}

export interface SessionPlan {
  id: string
  user_id: string
  reflection_id: string | null

  // Image
  image_url: string
  image_type: 'handwritten' | 'digital' | 'mixed' | null

  // Extracted content
  title: string | null
  objectives: string[]
  drills: SessionDrill[]
  coaching_points: string[]
  equipment_needed: string[]
  total_duration_minutes: number | null

  // Metadata
  confidence_score: number // 0-1
  raw_extraction: string | null
  created_at: string
}

// API response types
export interface SessionPlanAnalysis {
  title: string | null
  objectives: string[]
  drills: SessionDrill[]
  coaching_points: string[]
  equipment_needed: string[]
  total_duration_minutes: number | null
  image_type: 'handwritten' | 'digital' | 'mixed'
  confidence_score: number
  raw_extraction: string
}

export interface ReflectionAIAnalysis {
  summary: string
  insights: string[]
  action_items: string[]
}

// Chat types
export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
  followUps?: string[]
}

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  summary: string | null
  key_topics: string[] | null
  outcome: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

// Chat starters for reflection-focused conversations
export const CHAT_STARTERS = [
  {
    category: 'Reflection',
    prompts: [
      "I just finished a session and want to reflect on it",
      "Help me identify patterns in my coaching",
      "What questions should I ask myself after a match?",
      "I'm feeling frustrated after today's session",
    ]
  },
  {
    category: 'Challenges',
    prompts: [
      "An athlete is struggling with confidence",
      "How do I handle parents who interfere?",
      "My group keeps making the same mistakes",
      "I'm struggling with athlete motivation",
    ]
  },
  {
    category: 'Development',
    prompts: [
      "How can I improve my communication as a coach?",
      "What makes a good training session?",
      "Help me set coaching goals for the season",
      "I want to work on my tactical knowledge",
    ]
  },
  {
    category: 'Specific Situations',
    prompts: [
      "We lost badly today and morale is low",
      "A key athlete is leaving the group",
      "I need to give difficult feedback to an athlete",
      "How do I balance winning vs development?",
    ]
  },
]

// Streak and Badge types
export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string
  total_active_days: number
  created_at: string
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  category: 'streak' | 'milestone' | 'topic' | 'special'
  requirement_type: string
  requirement_value: number
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  notified: boolean
  badge?: Badge
}

// User Memory for personalized AI
export interface UserMemory {
  id: string
  user_id: string
  coaching_style: string[] | null
  common_challenges: string[] | null
  strengths: string[] | null
  goals: string[] | null
  player_info: Record<string, unknown>
  team_context: string | null
  last_updated: string
  created_at: string
}

// Feedback types
export interface Feedback {
  id: string
  user_id: string
  reflection_id: string | null
  conversation_id: string | null
  content_type: 'ai_summary' | 'ai_insight' | 'chat_response'
  content_text: string
  rating: 'positive' | 'negative'
  feedback_text: string | null
  created_at: string
}

// ==================== Voice & Multi-Modal Types ====================

export type AttachmentType = 'voice' | 'image' | 'session_plan'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface MessageAttachment {
  id: string
  message_id: string | null
  user_id: string
  attachment_type: AttachmentType
  storage_path: string
  file_url: string | null
  mime_type: string
  file_size_bytes: number
  original_filename: string | null
  processing_status: ProcessingStatus
  processing_error: string | null
  voice_transcription: string | null
  voice_duration_seconds: number | null
  image_analysis: SessionPlanAnalysis | null
  session_date: string | null
  created_at: string
  processed_at: string | null
}

export interface VoiceUploadResponse {
  attachment_id: string
  storage_path: string
  status: ProcessingStatus
}

export interface TranscriptionResponse {
  transcription: string
  duration_seconds: number
  attachment_id: string
}

// Extended chat message with attachments
export interface ChatMessageWithAttachments extends ChatMessage {
  attachments?: MessageAttachment[]
  extracted_data?: ExtractedData
}

// ==================== Extracted Insights Types ====================

export type ExtractedInsightType = 'player_mention' | 'theme' | 'exercise' | 'challenge' | 'sentiment'
export type InsightContext = 'positive' | 'concern' | 'neutral' | 'mixed'

export interface ExtractedInsight {
  id: string
  user_id: string
  conversation_id: string | null
  message_id: string | null
  attachment_id: string | null
  insight_type: ExtractedInsightType
  name: string
  category: string | null
  context: InsightContext | null
  snippet: string | null
  confidence: number
  session_date: string | null
  extraction_date: string
  created_at: string
}

export interface PlayerMention {
  name: string
  context: InsightContext
  snippet: string
}

export interface ThemeExtraction {
  theme: string
  category: ThemeCategory
  frequency: number
}

export type ThemeCategory =
  | 'player_behavior'
  | 'tactical'
  | 'physical'
  | 'mental'
  | 'organizational'
  | 'parent_related'

export interface ExerciseMention {
  name: string
  context: string | null
}

export interface ExtractedData {
  players_mentioned: PlayerMention[]
  themes: ThemeExtraction[]
  exercises: ExerciseMention[]
  challenges: string[]
  overall_sentiment: InsightContext
  confidence: number
}

// ==================== Analytics Types ====================

export interface CoachDailyStats {
  id: string
  user_id: string
  stat_date: string
  messages_sent: number
  voice_notes_sent: number
  images_uploaded: number
  reflections_created: number
  unique_players_mentioned: number
  unique_themes: number
  unique_exercises: number
  top_players: PlayerAnalyticsItem[]
  top_themes: ThemeAnalyticsItem[]
  top_exercises: ExerciseAnalyticsItem[]
  avg_mood: number | null
  avg_energy: number | null
  positive_mentions: number
  concern_mentions: number
  neutral_mentions: number
  created_at: string
  updated_at: string
}

export interface PlayerAnalyticsItem {
  name: string
  count: number
  context: InsightContext
}

export interface ThemeAnalyticsItem {
  theme: string
  category: ThemeCategory
  count: number
}

export interface ExerciseAnalyticsItem {
  name: string
  count: number
}

export type AnalyticsPeriod = '4w' | '8w' | '12w'

export interface PatternAnalytics {
  period: AnalyticsPeriod
  start_date: string
  end_date: string
  players: PlayerAnalyticsItem[]
  themes: ThemeAnalyticsItem[]
  exercises: ExerciseAnalyticsItem[]
  mood_trend: MoodTrendPoint[]
  energy_trend: MoodTrendPoint[]
  insights: InsightSummary[]
  totals: {
    voice_notes: number
    images: number
    reflections: number
    messages: number
  }
}

export interface MoodTrendPoint {
  date: string
  value: number | null
}

export interface InsightSummary {
  type: 'pattern' | 'milestone' | 'suggestion'
  title: string
  description: string
  data?: Record<string, unknown>
}

// ==================== Coaching Themes ====================

export interface CoachingTheme {
  id: string
  name: string
  category: ThemeCategory
  keywords: string[]
  created_at: string
}

export const COACHING_THEME_CATEGORIES: { id: ThemeCategory; label: string }[] = [
  { id: 'player_behavior', label: 'Athlete Behaviour' },
  { id: 'tactical', label: 'Tactical' },
  { id: 'physical', label: 'Physical' },
  { id: 'mental', label: 'Mental' },
  { id: 'organizational', label: 'Organizational' },
  { id: 'parent_related', label: 'Parent Related' },
]

// ==================== Voice Limits ====================

/** @deprecated Use VOICE_LIMITS instead */
export const VOICE_NOTE_LIMITS = {
  free: 0,        // No voice notes
  pro: 4,         // 4 voice notes per month (shared pool)
  pro_plus: -1,   // Unlimited short voice notes
} as const

export const VOICE_LIMITS = {
  free: { shortPerMonth: 0, fullPerMonth: 0, isSharedPool: false },
  pro: { shortPerMonth: 4, fullPerMonth: 4, isSharedPool: true },     // 4 total shared
  pro_plus: { shortPerMonth: -1, fullPerMonth: 12, isSharedPool: false }, // unlimited short, 12 full
} as const

export const VOICE_SHORT_THRESHOLD_SECONDS = 300  // < 5 min = short

/** @deprecated Use tier-aware max durations from config */
export const VOICE_MAX_DURATION_SECONDS = 300  // 5 minutes (kept for backwards compat)

export const VOICE_MAX_FILE_SIZE = {
  short: 10 * 1024 * 1024,   // 10MB for short voice notes
  full: 100 * 1024 * 1024,   // 100MB for full recordings
} as const

/** @deprecated Use VOICE_MAX_FILE_SIZE instead */
export const VOICE_MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024  // 200MB (kept for backwards compat)

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',     // .mp3
  'audio/mp4',      // .m4a
  'audio/wav',      // .wav
  'audio/webm',     // .webm
  'audio/ogg',      // .ogg
  'audio/flac',     // .flac
] as const
