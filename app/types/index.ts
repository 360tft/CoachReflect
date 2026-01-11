// CoachReflect Types

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
    reflections_per_month: 5,
    ai_features: false,
    session_plan_upload: false,
  },
  pro: {
    reflections_per_month: Infinity,
    ai_features: true,
    session_plan_upload: true,
  },
  pro_plus: {
    reflections_per_month: Infinity,
    ai_features: true,
    session_plan_upload: true,
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
  { id: 'training', label: 'Training Session', emoji: '⚽' },
  { id: 'match', label: 'Competitive Match', emoji: '🏆' },
  { id: 'friendly', label: 'Friendly Match', emoji: '🤝' },
  { id: 'tournament', label: 'Tournament', emoji: '🎯' },
  { id: 'trial', label: 'Trial/Assessment', emoji: '📋' },
  { id: 'individual', label: 'Individual Session', emoji: '👤' },
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
  { id: 'recurring_challenge', label: 'Recurring Challenge', emoji: '🔄' },
  { id: 'player_pattern', label: 'Player Pattern', emoji: '👤' },
  { id: 'improvement_trend', label: 'Improvement Trend', emoji: '📈' },
  { id: 'decline_trend', label: 'Needs Attention', emoji: '📉' },
  { id: 'suggestion', label: 'Suggestion', emoji: '💡' },
  { id: 'milestone', label: 'Milestone', emoji: '🏅' },
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
    placeholder: 'The pressing from the front was excellent...',
    tip: 'Think about tactics, exercises, or moments that clicked',
  },
  {
    id: 'what_didnt_work',
    category: 'performance', 
    question: "What didn't go as planned?",
    placeholder: 'The transition from defense to attack was slow...',
    tip: "Be honest - this is how we grow",
  },
  {
    id: 'player_standouts',
    category: 'players',
    question: 'Any player standouts (positive or needs support)?',
    placeholder: 'Jamie showed great leadership. Tom seemed distracted...',
    tip: 'Track individual progress over time',
  },
  {
    id: 'areas_to_improve',
    category: 'development',
    question: 'What areas need more work?',
    placeholder: 'Set pieces, communication in defense...',
    tip: 'These become focus areas for future sessions',
  },
  {
    id: 'next_focus',
    category: 'tactics',
    question: 'What will you focus on next session?',
    placeholder: 'Quick transitions, 1v1 defending...',
    tip: 'Turn reflections into action',
  },
]

export const MOOD_OPTIONS = [
  { value: 1, label: 'Frustrated', emoji: '😤' },
  { value: 2, label: 'Disappointed', emoji: '😔' },
  { value: 3, label: 'Neutral', emoji: '😐' },
  { value: 4, label: 'Satisfied', emoji: '🙂' },
  { value: 5, label: 'Excellent', emoji: '😊' },
]

export const ENERGY_OPTIONS = [
  { value: 1, label: 'Drained', emoji: '😴' },
  { value: 2, label: 'Low', emoji: '🥱' },
  { value: 3, label: 'Normal', emoji: '⚡' },
  { value: 4, label: 'Energized', emoji: '💪' },
  { value: 5, label: 'Fired Up', emoji: '🔥' },
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
      "A player is struggling with confidence",
      "How do I handle parents who interfere?",
      "My team keeps making the same mistakes",
      "I'm struggling with player motivation",
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
      "A star player is leaving the team",
      "I need to give difficult feedback to a player",
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
