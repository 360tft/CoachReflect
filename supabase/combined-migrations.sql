-- CoachReflect Database Schema

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  club_name TEXT,
  age_group TEXT,
  coaching_level TEXT CHECK (coaching_level IN ('grassroots', 'academy', 'semi-pro', 'professional')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'pro_plus')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (training, matches, etc.)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('training', 'match', 'friendly', 'tournament', 'trial', 'individual')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  players_present INTEGER,
  weather TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflections table (the core of the app)
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Guided questions
  what_worked TEXT,
  what_didnt_work TEXT,
  player_standouts TEXT,
  areas_to_improve TEXT,
  next_focus TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  energy_rating INTEGER CHECK (energy_rating >= 1 AND energy_rating <= 5),
  
  -- AI-generated content
  ai_summary TEXT,
  ai_insights TEXT,
  ai_action_items JSONB DEFAULT '[]',
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated insights (patterns detected across reflections)
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('recurring_challenge', 'player_pattern', 'improvement_trend', 'decline_trend', 'suggestion', 'milestone')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_reflections UUID[] DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reflections
DROP POLICY IF EXISTS "Users can view own reflections" ON reflections;
CREATE POLICY "Users can view own reflections" ON reflections
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own reflections" ON reflections;
CREATE POLICY "Users can insert own reflections" ON reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own reflections" ON reflections;
CREATE POLICY "Users can update own reflections" ON reflections
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own reflections" ON reflections;
CREATE POLICY "Users can delete own reflections" ON reflections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for insights
DROP POLICY IF EXISTS "Users can view own insights" ON insights;
CREATE POLICY "Users can view own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can dismiss own insights" ON insights;
CREATE POLICY "Users can dismiss own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON reflections(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_session ON reflections(session_id);
CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id, is_dismissed, created_at DESC);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get reflection stats
CREATE OR REPLACE FUNCTION get_reflection_stats(user_uuid UUID)
RETURNS TABLE (
  total_reflections BIGINT,
  avg_mood DECIMAL,
  avg_energy DECIMAL,
  streak_days INTEGER,
  most_common_tag TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_reflections,
    ROUND(AVG(mood_rating), 1) as avg_mood,
    ROUND(AVG(energy_rating), 1) as avg_energy,
    (
      SELECT COUNT(DISTINCT date)::INTEGER
      FROM reflections r2
      WHERE r2.user_id = user_uuid
      AND r2.date >= CURRENT_DATE - INTERVAL '30 days'
    ) as streak_days,
    (
      SELECT unnest(tags)
      FROM reflections r3
      WHERE r3.user_id = user_uuid
      GROUP BY unnest(tags)
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as most_common_tag
  FROM reflections
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;
-- Add column to track which month the reflection count is for
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reflection_count_period TEXT;

-- Initialize existing profiles with current month
UPDATE profiles SET reflection_count_period = TO_CHAR(NOW(), 'YYYY-MM') WHERE reflection_count_period IS NULL;
-- Session Plans table (uploaded coaching session plans with AI extraction)
CREATE TABLE session_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reflection_id UUID REFERENCES reflections(id) ON DELETE SET NULL,

  -- Image
  image_url TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('handwritten', 'digital', 'mixed')),

  -- Extracted content
  title TEXT,
  objectives TEXT[] DEFAULT '{}',
  drills JSONB DEFAULT '[]',
  coaching_points TEXT[] DEFAULT '{}',
  equipment_needed TEXT[] DEFAULT '{}',
  total_duration_minutes INTEGER,

  -- Metadata
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  raw_extraction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reflections_this_month INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled'));

-- Enable RLS on session_plans
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_plans
DROP POLICY IF EXISTS "Users can view own session plans" ON session_plans;
CREATE POLICY "Users can view own session plans" ON session_plans
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own session plans" ON session_plans;
CREATE POLICY "Users can insert own session plans" ON session_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own session plans" ON session_plans;
CREATE POLICY "Users can update own session plans" ON session_plans
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own session plans" ON session_plans;
CREATE POLICY "Users can delete own session plans" ON session_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Index for session_plans
CREATE INDEX IF NOT EXISTS idx_session_plans_user ON session_plans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_plans_reflection ON session_plans(reflection_id);

-- Function to reset monthly reflection count (called by cron or webhook)
CREATE OR REPLACE FUNCTION reset_monthly_reflections()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET reflections_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment reflection count
CREATE OR REPLACE FUNCTION increment_reflection_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET reflections_this_month = reflections_this_month + 1
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment count on new reflection
DROP TRIGGER IF EXISTS on_reflection_created ON reflections;
CREATE TRIGGER on_reflection_created
  AFTER INSERT ON reflections
  FOR EACH ROW EXECUTE FUNCTION increment_reflection_count();
-- CoachReflect V1.5 Migration - FootballGPT Features
-- Adds: conversations, streaks, badges, email sequences, push notifications,
--       user memory, feedback, analytics, and profile enhancements

-- ==================== HELPER FUNCTION ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== CONVERSATIONS TABLE ====================
-- For AI chat interface (coaching conversations)

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  summary TEXT, -- AI-generated summary of conversation
  key_topics TEXT[], -- Main topics discussed
  outcome TEXT, -- What was accomplished
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== MESSAGES TABLE ====================
-- Individual messages within conversations

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==================== STREAKS TABLE ====================
-- Tracks user engagement streaks (consecutive days of reflections)

CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  total_active_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own streaks" ON streaks;
CREATE POLICY "Users can view own streaks" ON streaks
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on streaks" ON streaks;
CREATE POLICY "Service role full access on streaks" ON streaks
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== BADGES TABLE ====================
-- Available badges that users can earn (CoachReflect context)

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY, -- e.g., 'streak_3', 'reflections_10', 'first_insight'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streak', 'milestone', 'topic', 'special')),
  requirement_type TEXT NOT NULL, -- 'streak', 'reflection_count', 'mood_tracking', etc.
  requirement_value INTEGER NOT NULL, -- e.g., 7 for 7-day streak
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default badges for CoachReflect
INSERT INTO badges (id, name, description, emoji, category, requirement_type, requirement_value, rarity) VALUES
  -- Streak badges
  ('streak_3', 'Getting Started', '3 days in a row!', '🌱', 'streak', 'streak', 3, 'common'),
  ('streak_7', 'Week Warrior', '7-day reflection streak!', '🔥', 'streak', 'streak', 7, 'common'),
  ('streak_14', 'Committed Coach', '2 weeks of daily reflection!', '💪', 'streak', 'streak', 14, 'uncommon'),
  ('streak_30', 'Reflection Master', '30-day streak achieved!', '🏆', 'streak', 'streak', 30, 'rare'),
  ('streak_100', 'Legend', '100 days of reflection!', '👑', 'streak', 'streak', 100, 'legendary'),
  -- Milestone badges
  ('reflections_1', 'First Reflection', 'Completed your first reflection', '📝', 'milestone', 'reflection_count', 1, 'common'),
  ('reflections_10', 'Getting Serious', '10 reflections logged', '📊', 'milestone', 'reflection_count', 10, 'common'),
  ('reflections_50', 'Dedicated', '50 reflections and counting', '🎯', 'milestone', 'reflection_count', 50, 'uncommon'),
  ('reflections_100', 'Centurion', '100 reflections completed', '💯', 'milestone', 'reflection_count', 100, 'rare'),
  ('reflections_500', 'Elite Coach', '500 reflections - true dedication', '⭐', 'milestone', 'reflection_count', 500, 'legendary'),
  -- Topic badges (specific to coaching)
  ('topic_tactics', 'Tactician', 'Reflected on tactical approaches 10 times', '♟️', 'topic', 'topic_tactics', 10, 'uncommon'),
  ('topic_player', 'Player Developer', 'Tracked player progress 10 times', '👤', 'topic', 'topic_player', 10, 'uncommon'),
  ('topic_mood', 'Self-Aware', 'Tracked mood and energy 20 times', '🧘', 'topic', 'topic_mood', 20, 'uncommon'),
  -- Special badges
  ('first_insight', 'Insight Unlocked', 'Received your first AI insight', '💡', 'special', 'special', 1, 'common'),
  ('session_plan', 'Planner', 'Uploaded first session plan', '📋', 'special', 'special', 1, 'common'),
  ('early_adopter', 'Early Adopter', 'Joined during beta', '🚀', 'special', 'special', 1, 'rare')
ON CONFLICT (id) DO NOTHING;

-- ==================== USER BADGES TABLE ====================
-- Tracks which badges each user has earned

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on user_badges" ON user_badges;
CREATE POLICY "Service role full access on user_badges" ON user_badges
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== EMAIL SEQUENCES TABLE ====================
-- Tracks where each user is in automated email sequences

CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sequence_name TEXT NOT NULL, -- 'onboarding', 'winback', 'streak_recovery', etc.
  current_step INTEGER DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  paused BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sequence_name)
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_next_send ON email_sequences(next_send_at)
  WHERE NOT completed AND NOT paused;
CREATE INDEX IF NOT EXISTS idx_email_sequences_user ON email_sequences(user_id);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email sequences" ON email_sequences;
CREATE POLICY "Users can view own email sequences" ON email_sequences
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on email_sequences" ON email_sequences;
CREATE POLICY "Service role full access on email_sequences" ON email_sequences
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== EMAIL LOG TABLE ====================
-- Records all sent emails for debugging and analytics

CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL, -- 'onboarding:welcome', 'streak:3', 'winback:day3', etc.
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error TEXT, -- null if sent successfully
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at DESC);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email log" ON email_log;
CREATE POLICY "Users can view own email log" ON email_log
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on email_log" ON email_log;
CREATE POLICY "Service role full access on email_log" ON email_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== PUSH SUBSCRIPTIONS TABLE ====================
-- Push notification subscriptions

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ==================== USER MEMORY TABLE ====================
-- Stores AI context about each user for personalized coaching

CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Coaching context
  coaching_style TEXT[], -- e.g., ['player-centered', 'structured', 'democratic']
  common_challenges TEXT[], -- Recurring issues they face
  strengths TEXT[], -- What they're good at
  goals TEXT[], -- What they're working toward
  player_info JSONB DEFAULT '{}', -- Key players and notes
  team_context TEXT, -- Current team situation
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user ON user_memory(user_id);

ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memory" ON user_memory;
CREATE POLICY "Users can view own memory" ON user_memory
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own memory" ON user_memory;
CREATE POLICY "Users can update own memory" ON user_memory
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on user_memory" ON user_memory;
CREATE POLICY "Service role full access on user_memory" ON user_memory
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== FEEDBACK TABLE ====================
-- User ratings on AI responses

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reflection_id UUID REFERENCES reflections(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('ai_summary', 'ai_insight', 'chat_response')),
  content_text TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  feedback_text TEXT, -- Optional text feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on feedback" ON feedback;
CREATE POLICY "Service role full access on feedback" ON feedback
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== EVENTS TABLE (Analytics) ====================
-- Tracks user actions for analytics

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID, -- For anonymous tracking before signup
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'auth', 'reflection', 'billing', 'feature', 'email', 'engagement'
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own events" ON events;
CREATE POLICY "Users can view own events" ON events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on events" ON events;
CREATE POLICY "Service role full access on events" ON events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== DAILY METRICS TABLE (Admin Dashboard) ====================
-- Aggregated metrics for admin dashboard

CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  -- User metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  pro_users INTEGER DEFAULT 0,
  -- Engagement metrics
  total_reflections INTEGER DEFAULT 0,
  unique_reflectors INTEGER DEFAULT 0,
  reflections_per_user DECIMAL(10,2) DEFAULT 0,
  -- Revenue metrics
  mrr_cents INTEGER DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  churned_subscriptions INTEGER DEFAULT 0,
  -- Feature usage
  session_plan_uploads INTEGER DEFAULT 0,
  ai_summaries_generated INTEGER DEFAULT 0,
  chat_conversations INTEGER DEFAULT 0,
  -- Email metrics
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  -- Calculated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on daily_metrics" ON daily_metrics;
CREATE POLICY "Service role full access on daily_metrics" ON daily_metrics
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== PROFILE ENHANCEMENTS ====================
-- Add new columns to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS reflections_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pro_trial_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_reflection_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_streak_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_features BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_reflections INTEGER DEFAULT 0;

-- Index for email queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_enabled ON profiles(email_notifications_enabled) WHERE email_notifications_enabled = true;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);

-- ==================== UPDATE HANDLE_NEW_USER FUNCTION ====================
-- Update to also create streak and start onboarding sequence

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  -- Create streak record
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES (NEW.id, 0, 0, CURRENT_DATE);

  -- Start onboarding email sequence
  INSERT INTO public.email_sequences (user_id, sequence_name, current_step, next_send_at)
  VALUES (NEW.id, 'onboarding', 0, NOW() + INTERVAL '5 minutes');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== STREAK UPDATE FUNCTION ====================
-- Called when a user creates a reflection

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS TABLE (
  new_streak INTEGER,
  streak_increased BOOLEAN,
  badges_earned TEXT[]
) AS $$
DECLARE
  v_streak RECORD;
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
  v_new_streak INTEGER;
  v_streak_increased BOOLEAN := false;
  v_earned_badges TEXT[] := '{}';
BEGIN
  -- Get current streak data
  SELECT * INTO v_streak FROM streaks WHERE user_id = p_user_id;

  -- If no streak record, create one
  IF v_streak IS NULL THEN
    INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date, total_active_days)
    VALUES (p_user_id, 1, 1, v_today, 1)
    RETURNING * INTO v_streak;
    v_new_streak := 1;
    v_streak_increased := true;
  ELSE
    v_last_date := v_streak.last_activity_date;

    IF v_last_date = v_today THEN
      -- Already active today, no change
      v_new_streak := v_streak.current_streak;
    ELSIF v_last_date = v_today - 1 THEN
      -- Consecutive day, increase streak
      v_new_streak := v_streak.current_streak + 1;
      v_streak_increased := true;

      UPDATE streaks SET
        current_streak = v_new_streak,
        longest_streak = GREATEST(v_new_streak, v_streak.longest_streak),
        last_activity_date = v_today,
        total_active_days = v_streak.total_active_days + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      -- Streak broken, reset to 1
      v_new_streak := 1;
      v_streak_increased := true;

      UPDATE streaks SET
        current_streak = 1,
        last_activity_date = v_today,
        total_active_days = v_streak.total_active_days + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  END IF;

  -- Check for streak badges
  IF v_new_streak >= 3 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'streak_3') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'streak_3');
    v_earned_badges := array_append(v_earned_badges, 'streak_3');
  END IF;

  IF v_new_streak >= 7 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'streak_7') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'streak_7');
    v_earned_badges := array_append(v_earned_badges, 'streak_7');
  END IF;

  IF v_new_streak >= 14 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'streak_14') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'streak_14');
    v_earned_badges := array_append(v_earned_badges, 'streak_14');
  END IF;

  IF v_new_streak >= 30 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'streak_30') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'streak_30');
    v_earned_badges := array_append(v_earned_badges, 'streak_30');
  END IF;

  IF v_new_streak >= 100 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'streak_100') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'streak_100');
    v_earned_badges := array_append(v_earned_badges, 'streak_100');
  END IF;

  RETURN QUERY SELECT v_new_streak, v_streak_increased, v_earned_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== REFLECTION MILESTONE CHECK ====================
-- Check and award reflection count badges

CREATE OR REPLACE FUNCTION check_reflection_badges(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  v_count INTEGER;
  v_earned_badges TEXT[] := '{}';
BEGIN
  -- Get total reflections
  SELECT COUNT(*) INTO v_count FROM reflections WHERE user_id = p_user_id;

  -- Update profile total
  UPDATE profiles SET total_reflections = v_count WHERE user_id = p_user_id;

  -- Check badges
  IF v_count >= 1 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'reflections_1') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'reflections_1');
    v_earned_badges := array_append(v_earned_badges, 'reflections_1');
  END IF;

  IF v_count >= 10 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'reflections_10') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'reflections_10');
    v_earned_badges := array_append(v_earned_badges, 'reflections_10');
  END IF;

  IF v_count >= 50 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'reflections_50') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'reflections_50');
    v_earned_badges := array_append(v_earned_badges, 'reflections_50');
  END IF;

  IF v_count >= 100 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'reflections_100') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'reflections_100');
    v_earned_badges := array_append(v_earned_badges, 'reflections_100');
  END IF;

  IF v_count >= 500 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'reflections_500') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'reflections_500');
    v_earned_badges := array_append(v_earned_badges, 'reflections_500');
  END IF;

  RETURN v_earned_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add Pro trial tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_trial_used BOOLEAN DEFAULT false;
-- Add shared_reflections table for social sharing
CREATE TABLE IF NOT EXISTS shared_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE NOT NULL,

  -- Optional custom excerpt for sharing
  share_excerpt TEXT,

  -- Metadata
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_shared_reflections_share_id ON shared_reflections(share_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shared_reflections_user ON shared_reflections(user_id);

-- RLS policies
ALTER TABLE shared_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shares" ON shared_reflections;
CREATE POLICY "Users can view own shares" ON shared_reflections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create shares" ON shared_reflections;
CREATE POLICY "Users can create shares" ON shared_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shares" ON shared_reflections;
CREATE POLICY "Users can update own shares" ON shared_reflections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view active shares" ON shared_reflections;
CREATE POLICY "Public can view active shares" ON shared_reflections
  FOR SELECT USING (is_active = true);
-- Migration: Add Blog system
-- Description: Tracks user questions and generates blog posts from popular coaching questions

-- =============================================
-- Table: question_tracking
-- Tracks coaching questions users ask in chat
-- =============================================
CREATE TABLE IF NOT EXISTS question_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  normalized_question TEXT NOT NULL,  -- Lowercase, trimmed for matching
  question_group TEXT,                -- Groups similar questions (e.g., "session_planning_u12")
  category TEXT,                      -- 'session_planning', 'player_development', 'tactics', 'reflection', etc.
  topics TEXT[],                      -- Detected topics (finishing, defending, age groups, etc.)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID,
  ask_count INTEGER DEFAULT 1,
  first_asked_at TIMESTAMPTZ DEFAULT NOW(),
  last_asked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for question_tracking
CREATE INDEX IF NOT EXISTS idx_question_tracking_normalized ON question_tracking(normalized_question);
CREATE INDEX IF NOT EXISTS idx_question_tracking_group ON question_tracking(question_group);
CREATE INDEX IF NOT EXISTS idx_question_tracking_category ON question_tracking(category);
CREATE INDEX IF NOT EXISTS idx_question_tracking_last_asked ON question_tracking(last_asked_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_tracking_user ON question_tracking(user_id);

-- =============================================
-- Table: blog_posts
-- Stores generated blog posts
-- =============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,              -- Short description/excerpt
  content TEXT NOT NULL,              -- Markdown content
  category TEXT,
  question_group TEXT,                -- Links to question_tracking.question_group
  source_questions UUID[],            -- Array of question_tracking IDs used
  topics TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  featured_image TEXT,
  word_count INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_question_group ON blog_posts(question_group);

-- =============================================
-- Table: blog_generation_queue
-- Tracks blog post generation requests
-- =============================================
CREATE TABLE IF NOT EXISTS blog_generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,                -- The question to generate a post from
  count INTEGER DEFAULT 1,            -- Number of times this query was asked
  status TEXT DEFAULT 'pending',      -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blog_generation_queue_status ON blog_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_blog_generation_queue_created ON blog_generation_queue(created_at DESC);

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE question_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_generation_queue ENABLE ROW LEVEL SECURITY;

-- question_tracking: Users can see their own questions, service role can see all
DROP POLICY IF EXISTS "Users can view own questions" ON question_tracking;
CREATE POLICY "Users can view own questions" ON question_tracking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all questions" ON question_tracking;
CREATE POLICY "Service role can manage all questions" ON question_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- blog_posts: Everyone can read published posts
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
CREATE POLICY "Anyone can view published posts" ON blog_posts FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Service role can manage all posts" ON blog_posts;
CREATE POLICY "Service role can manage all posts" ON blog_posts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- blog_generation_queue: Service role only
DROP POLICY IF EXISTS "Service role can manage generation queue" ON blog_generation_queue;
CREATE POLICY "Service role can manage generation queue" ON blog_generation_queue FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================
-- Functions
-- =============================================

-- Function to upsert question tracking
CREATE OR REPLACE FUNCTION upsert_question_tracking(
  p_question_text TEXT,
  p_normalized_question TEXT,
  p_question_group TEXT,
  p_category TEXT,
  p_topics TEXT[],
  p_user_id UUID,
  p_conversation_id UUID
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Check if similar question exists (by question_group)
  SELECT id INTO v_id
  FROM question_tracking
  WHERE question_group = p_question_group
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    -- Update existing question
    UPDATE question_tracking
    SET
      ask_count = ask_count + 1,
      last_asked_at = NOW()
    WHERE id = v_id;
    RETURN v_id;
  ELSE
    -- Insert new question
    INSERT INTO question_tracking (
      question_text,
      normalized_question,
      question_group,
      category,
      topics,
      user_id,
      conversation_id
    ) VALUES (
      p_question_text,
      p_normalized_question,
      p_question_group,
      p_category,
      p_topics,
      p_user_id,
      p_conversation_id
    )
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top questions for blog generation
CREATE OR REPLACE FUNCTION get_top_questions_for_blog(
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  question_group TEXT,
  category TEXT,
  topics TEXT[],
  total_asks BIGINT,
  sample_question TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qt.question_group,
    qt.category,
    qt.topics,
    SUM(qt.ask_count) as total_asks,
    (ARRAY_AGG(qt.question_text ORDER BY qt.ask_count DESC))[1] as sample_question
  FROM question_tracking qt
  WHERE
    qt.last_asked_at > NOW() - (p_days || ' days')::INTERVAL
    AND qt.question_group IS NOT NULL
    AND NOT EXISTS (
      -- Exclude questions that already have blog posts
      SELECT 1 FROM blog_posts bp
      WHERE bp.question_group = qt.question_group
    )
  GROUP BY qt.question_group, qt.category, qt.topics
  ORDER BY total_asks DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Trigger: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- =============================================
-- Function: Increment blog post view count
-- =============================================
CREATE OR REPLACE FUNCTION increment_blog_view(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE question_tracking IS 'Tracks coaching questions users ask for blog content generation';
COMMENT ON TABLE blog_posts IS 'AI-generated blog posts based on popular coaching questions';
COMMENT ON TABLE blog_generation_queue IS 'Queue for processing blog post generation requests';
COMMENT ON COLUMN question_tracking.question_group IS 'Groups similar questions together';
COMMENT ON COLUMN question_tracking.normalized_question IS 'Lowercase, trimmed version for exact duplicate detection';
COMMENT ON COLUMN blog_posts.question_group IS 'Links to the question_tracking.question_group this post answers';
-- Referral System (PRD 23)
-- Create referrals table for tracking referral codes and rewards

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type TEXT,
  reward_amount DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;
CREATE POLICY "Users can insert referrals" ON referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "System can update referrals" ON referrals;
CREATE POLICY "System can update referrals" ON referrals
  FOR UPDATE
  USING (true);

-- Add referral_code column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
  END IF;
END $$;

-- Add referred_by column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add referral_rewards_earned column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_rewards_earned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_rewards_earned INTEGER DEFAULT 0;
  END IF;
END $$;
-- CoachReflect Multi-Modal Chat Migration
-- Adds: message_attachments, extracted_insights, coach_daily_stats, coaching_themes
-- Enables: voice notes, image uploads in chat, theme extraction, analytics dashboard

-- ==================== MESSAGE ATTACHMENTS TABLE ====================
-- Stores uploaded files (voice, images) with processing status

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Attachment info
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('voice', 'image', 'session_plan')),
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  original_filename TEXT,

  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,

  -- Voice-specific results
  voice_transcription TEXT,
  voice_duration_seconds INTEGER,

  -- Image-specific results (SessionPlanAnalysis JSON)
  image_analysis JSONB,

  -- Metadata
  session_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_user ON message_attachments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_attachments_pending ON message_attachments(processing_status)
  WHERE processing_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_message_attachments_session_date ON message_attachments(user_id, session_date DESC);

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attachments" ON message_attachments;
CREATE POLICY "Users can view own attachments" ON message_attachments
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own attachments" ON message_attachments;
CREATE POLICY "Users can insert own attachments" ON message_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own attachments" ON message_attachments;
CREATE POLICY "Users can update own attachments" ON message_attachments
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own attachments" ON message_attachments;
CREATE POLICY "Users can delete own attachments" ON message_attachments
  FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on message_attachments" ON message_attachments;
CREATE POLICY "Service role full access on message_attachments" ON message_attachments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== EXTRACTED INSIGHTS TABLE ====================
-- Stores structured data extracted from conversations (players, themes, exercises)

CREATE TABLE IF NOT EXISTS extracted_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  attachment_id UUID REFERENCES message_attachments(id) ON DELETE CASCADE,

  -- Extraction type
  insight_type TEXT NOT NULL CHECK (insight_type IN ('player_mention', 'theme', 'exercise', 'challenge', 'sentiment')),

  -- Content
  name TEXT NOT NULL,
  category TEXT,
  context TEXT CHECK (context IN ('positive', 'concern', 'neutral', 'mixed')),
  snippet TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.8,

  -- Aggregation helpers
  session_date DATE,
  extraction_date DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extracted_insights_user ON extracted_insights(user_id, extraction_date DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_type ON extracted_insights(user_id, insight_type, extraction_date DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_name ON extracted_insights(user_id, insight_type, name);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_conversation ON extracted_insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_session_date ON extracted_insights(user_id, session_date DESC);

ALTER TABLE extracted_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own insights" ON extracted_insights;
CREATE POLICY "Users can view own insights" ON extracted_insights
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on extracted_insights" ON extracted_insights;
CREATE POLICY "Service role full access on extracted_insights" ON extracted_insights
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== COACH DAILY STATS TABLE ====================
-- Pre-computed daily aggregates for fast dashboard queries

CREATE TABLE IF NOT EXISTS coach_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stat_date DATE NOT NULL,

  -- Activity counts
  messages_sent INTEGER DEFAULT 0,
  voice_notes_sent INTEGER DEFAULT 0,
  images_uploaded INTEGER DEFAULT 0,
  reflections_created INTEGER DEFAULT 0,

  -- Extracted data counts
  unique_players_mentioned INTEGER DEFAULT 0,
  unique_themes INTEGER DEFAULT 0,
  unique_exercises INTEGER DEFAULT 0,

  -- Top items (for quick display)
  top_players JSONB DEFAULT '[]',
  top_themes JSONB DEFAULT '[]',
  top_exercises JSONB DEFAULT '[]',

  -- Mood tracking (from reflections)
  avg_mood DECIMAL(3,2),
  avg_energy DECIMAL(3,2),

  -- Sentiment summary
  positive_mentions INTEGER DEFAULT 0,
  concern_mentions INTEGER DEFAULT 0,
  neutral_mentions INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_coach_daily_stats_user_date ON coach_daily_stats(user_id, stat_date DESC);

ALTER TABLE coach_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON coach_daily_stats;
CREATE POLICY "Users can view own stats" ON coach_daily_stats
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access on coach_daily_stats" ON coach_daily_stats;
CREATE POLICY "Service role full access on coach_daily_stats" ON coach_daily_stats
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_coach_daily_stats_updated_at
  BEFORE UPDATE ON coach_daily_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== COACHING THEMES TABLE ====================
-- Predefined coaching themes for categorization

CREATE TABLE IF NOT EXISTS coaching_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('player_behavior', 'tactical', 'physical', 'mental', 'organizational', 'parent_related')),
  keywords TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common coaching themes
INSERT INTO coaching_themes (id, name, category, keywords) VALUES
  -- Player behavior
  ('discipline', 'Discipline', 'player_behavior', ARRAY['discipline', 'behavior', 'listening', 'focus', 'distracted', 'messing around', 'attention']),
  ('communication', 'Communication', 'player_behavior', ARRAY['communication', 'talking', 'quiet', 'shout', 'vocal', 'leadership', 'voice']),
  ('attitude', 'Attitude', 'player_behavior', ARRAY['attitude', 'body language', 'sulking', 'positive', 'negative', 'moody']),

  -- Mental
  ('motivation', 'Motivation', 'mental', ARRAY['motivation', 'motivated', 'lazy', 'effort', 'trying', 'energy', 'enthusiasm']),
  ('confidence', 'Confidence', 'mental', ARRAY['confidence', 'confident', 'shy', 'scared', 'afraid', 'nervous', 'brave']),
  ('resilience', 'Resilience', 'mental', ARRAY['resilience', 'bounce back', 'mistake', 'head down', 'giving up', 'perseverance']),
  ('concentration', 'Concentration', 'mental', ARRAY['concentration', 'focus', 'distracted', 'switched off', 'zoned out', 'alert']),

  -- Tactical
  ('technique', 'Technique', 'tactical', ARRAY['technique', 'skill', 'touch', 'passing', 'shooting', 'dribbling', 'first touch']),
  ('positioning', 'Positioning', 'tactical', ARRAY['positioning', 'position', 'space', 'movement', 'shape', 'structure']),
  ('decision_making', 'Decision Making', 'tactical', ARRAY['decision', 'choice', 'option', 'timing', 'when to pass', 'when to shoot']),
  ('game_understanding', 'Game Understanding', 'tactical', ARRAY['understanding', 'reading', 'awareness', 'game sense', 'football IQ']),

  -- Physical
  ('fitness', 'Fitness', 'physical', ARRAY['fitness', 'stamina', 'tired', 'running', 'pace', 'speed', 'endurance']),
  ('strength', 'Strength', 'physical', ARRAY['strength', 'strong', 'weak', 'physical', 'powerful', 'holding off']),
  ('injury', 'Injury', 'physical', ARRAY['injury', 'injured', 'pain', 'hurt', 'knock', 'recovery']),

  -- Organizational
  ('teamwork', 'Teamwork', 'organizational', ARRAY['teamwork', 'team', 'together', 'selfish', 'unit', 'collective']),
  ('attendance', 'Attendance', 'organizational', ARRAY['attendance', 'missing', 'absent', 'late', 'commitment', 'showing up']),
  ('training_quality', 'Training Quality', 'organizational', ARRAY['training', 'session', 'quality', 'intensity', 'effort', 'tempo']),

  -- Parent related
  ('parents', 'Parent Issues', 'parent_related', ARRAY['parent', 'parents', 'sideline', 'shouting', 'interfering', 'pressure', 'dad', 'mum'])
ON CONFLICT (id) DO NOTHING;

-- ==================== VOICE USAGE TRACKING ====================
-- Add voice note tracking to profiles for free tier limits

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS voice_notes_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS voice_notes_month_reset DATE DEFAULT CURRENT_DATE;

-- ==================== HELPER FUNCTIONS ====================

-- Function to reset monthly voice note count
CREATE OR REPLACE FUNCTION reset_monthly_voice_notes()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET voice_notes_this_month = 0,
      voice_notes_month_reset = CURRENT_DATE
  WHERE voice_notes_month_reset < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment voice note count and check limit
CREATE OR REPLACE FUNCTION check_voice_note_limit(p_user_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  is_pro BOOLEAN
) AS $$
DECLARE
  v_profile RECORD;
  v_is_pro BOOLEAN;
  v_limit INTEGER;
BEGIN
  -- Get profile
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;

  -- Check if pro
  v_is_pro := v_profile.subscription_tier IN ('pro', 'pro_plus');

  -- Set limit based on tier
  IF v_is_pro THEN
    v_limit := 999999; -- Effectively unlimited
  ELSE
    v_limit := 3; -- Free tier limit
  END IF;

  -- Reset if new month
  IF v_profile.voice_notes_month_reset < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE profiles
    SET voice_notes_this_month = 0,
        voice_notes_month_reset = CURRENT_DATE
    WHERE user_id = p_user_id;

    v_profile.voice_notes_this_month := 0;
  END IF;

  RETURN QUERY SELECT
    v_profile.voice_notes_this_month < v_limit,
    v_profile.voice_notes_this_month,
    v_limit,
    v_is_pro;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment voice note count
CREATE OR REPLACE FUNCTION increment_voice_note_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET voice_notes_this_month = voice_notes_this_month + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== STORAGE BUCKET ====================
-- Note: Run this in Supabase dashboard SQL editor or via storage API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('voice-notes', 'voice-notes', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('chat-images', 'chat-images', false)
-- ON CONFLICT (id) DO NOTHING;
-- CoachReflect: Club License System & Analytics Tables
-- Run this migration after 20260115_multimodal_chat.sql

-- =============================================================================
-- CLUBS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'incomplete', 'trialing')),
  tier TEXT NOT NULL CHECK (tier IN ('small_club', 'club', 'academy')),
  max_seats INTEGER NOT NULL DEFAULT 5,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual')) DEFAULT 'monthly',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clubs_admin ON clubs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_clubs_stripe_sub ON clubs(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_clubs_status ON clubs(subscription_status);

-- RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Club admins can view their own club
DROP POLICY IF EXISTS "Club admins can view own club" ON clubs;
CREATE POLICY "Club admins can view own club" ON clubs
  FOR SELECT USING (auth.uid() = admin_user_id);

-- Club admins can update their own club
DROP POLICY IF EXISTS "Club admins can update own club" ON clubs;
CREATE POLICY "Club admins can update own club" ON clubs
  FOR UPDATE USING (auth.uid() = admin_user_id);

-- =============================================================================
-- CLUB MEMBERSHIPS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach')) DEFAULT 'coach',
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'removed')) DEFAULT 'pending',
  invited_email TEXT,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_club_memberships_club ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_email ON club_memberships(invited_email);
CREATE INDEX IF NOT EXISTS idx_club_memberships_status ON club_memberships(status);

-- RLS
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON club_memberships;
CREATE POLICY "Users can view own memberships" ON club_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Club admins can view all memberships in their club
DROP POLICY IF EXISTS "Club admins can view club memberships" ON club_memberships;
CREATE POLICY "Club admins can view club memberships" ON club_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_memberships.club_id
      AND clubs.admin_user_id = auth.uid()
    )
  );

-- Club admins can insert memberships (invites)
DROP POLICY IF EXISTS "Club admins can invite members" ON club_memberships;
CREATE POLICY "Club admins can invite members" ON club_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_memberships.club_id
      AND clubs.admin_user_id = auth.uid()
    )
  );

-- Club admins can update memberships (remove members)
DROP POLICY IF EXISTS "Club admins can update memberships" ON club_memberships;
CREATE POLICY "Club admins can update memberships" ON club_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_memberships.club_id
      AND clubs.admin_user_id = auth.uid()
    )
  );

-- =============================================================================
-- ANALYTICS: EXTRACTED INSIGHTS TABLE (Phase 3)
-- =============================================================================

-- If not created in previous migration, create it now
CREATE TABLE IF NOT EXISTS extracted_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

  -- Extracted data
  players_mentioned JSONB DEFAULT '[]'::JSONB,  -- [{name, context, sentiment}]
  themes JSONB DEFAULT '[]'::JSONB,              -- [{theme_id, confidence}]
  exercises JSONB DEFAULT '[]'::JSONB,           -- [{name, context}]
  overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),

  -- Session context
  session_date DATE,
  session_type TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_extracted_insights_user ON extracted_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_date ON extracted_insights(session_date);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_user_date ON extracted_insights(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_created ON extracted_insights(created_at);

-- RLS
ALTER TABLE extracted_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own insights" ON extracted_insights;
CREATE POLICY "Users can view own insights" ON extracted_insights
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- ANALYTICS: DAILY STATS TABLE (Phase 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS coach_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stat_date DATE NOT NULL,

  -- Counts
  message_count INTEGER DEFAULT 0,
  reflection_count INTEGER DEFAULT 0,
  voice_note_count INTEGER DEFAULT 0,
  session_plan_count INTEGER DEFAULT 0,

  -- Aggregated themes (top themes for the day)
  top_themes JSONB DEFAULT '[]'::JSONB,  -- [{theme_id, count}]

  -- Aggregated players
  players_mentioned JSONB DEFAULT '[]'::JSONB,  -- [{name, count, sentiment}]

  -- Sentiment
  avg_sentiment TEXT,
  avg_energy NUMERIC(3,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, stat_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coach_daily_stats_user ON coach_daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_daily_stats_date ON coach_daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_coach_daily_stats_user_date ON coach_daily_stats(user_id, stat_date DESC);

-- RLS
ALTER TABLE coach_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON coach_daily_stats;
CREATE POLICY "Users can view own stats" ON coach_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- COACHING THEMES REFERENCE TABLE (Already created above - skipping duplicate)
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTION: Get user's club access status
-- =============================================================================

CREATE OR REPLACE FUNCTION check_club_access(p_user_id UUID)
RETURNS TABLE (
  has_access BOOLEAN,
  club_id UUID,
  club_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as has_access,
    c.id as club_id,
    c.name as club_name,
    cm.role
  FROM club_memberships cm
  JOIN clubs c ON c.id = cm.club_id
  WHERE cm.user_id = p_user_id
    AND cm.status = 'active'
    AND c.subscription_status = 'active'
  LIMIT 1;

  -- If no rows returned, return false with nulls
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Get analytics summary for date range
-- =============================================================================

CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_messages INTEGER,
  total_reflections INTEGER,
  total_voice_notes INTEGER,
  total_session_plans INTEGER,
  avg_energy NUMERIC,
  top_themes JSONB,
  top_players JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cds.message_count), 0)::INTEGER as total_messages,
    COALESCE(SUM(cds.reflection_count), 0)::INTEGER as total_reflections,
    COALESCE(SUM(cds.voice_note_count), 0)::INTEGER as total_voice_notes,
    COALESCE(SUM(cds.session_plan_count), 0)::INTEGER as total_session_plans,
    AVG(cds.avg_energy) as avg_energy,
    -- Aggregate top themes across the period (simplified)
    '[]'::JSONB as top_themes,
    '[]'::JSONB as top_players
  FROM coach_daily_stats cds
  WHERE cds.user_id = p_user_id
    AND cds.stat_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER: Update club updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_club_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_club_timestamp();
-- Multi-sport support for CoachReflect
-- Add sport column to profiles

-- Add sport column with football as default (existing users are football coaches)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'football';

-- Create index for sport-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_sport ON profiles(sport);

-- Add sport-specific coaching levels that work across sports
COMMENT ON COLUMN profiles.coaching_level IS 'Coaching level: grassroots, academy, semi-pro, professional - applies to all sports';

-- Update the coaching_level check to be more inclusive
-- (The existing values work for all sports, no change needed)

-- Create a reference table for supported sports (optional, for UI dropdowns)
CREATE TABLE IF NOT EXISTS supported_sports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  terminology JSONB DEFAULT '{}', -- sport-specific terms
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert supported sports
INSERT INTO supported_sports (id, name, icon, terminology) VALUES
  ('football', 'Football (Soccer)', '⚽', '{"session": "training session", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('rugby', 'Rugby', '🏉', '{"session": "training session", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('basketball', 'Basketball', '🏀', '{"session": "practice", "player": "player", "team": "team", "match": "game", "drill": "drill"}'),
  ('hockey', 'Hockey', '🏑', '{"session": "training session", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('tennis', 'Tennis', '🎾', '{"session": "practice session", "player": "player", "team": "doubles pair", "match": "match", "drill": "drill"}'),
  ('cricket', 'Cricket', '🏏', '{"session": "nets session", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('volleyball', 'Volleyball', '🏐', '{"session": "practice", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('baseball', 'Baseball', '⚾', '{"session": "practice", "player": "player", "team": "team", "match": "game", "drill": "drill"}'),
  ('american_football', 'American Football', '🏈', '{"session": "practice", "player": "player", "team": "team", "match": "game", "drill": "drill"}'),
  ('swimming', 'Swimming', '🏊', '{"session": "training session", "player": "swimmer", "team": "squad", "match": "meet", "drill": "set"}'),
  ('athletics', 'Athletics/Track & Field', '🏃', '{"session": "training session", "player": "athlete", "team": "squad", "match": "competition", "drill": "exercise"}'),
  ('gymnastics', 'Gymnastics', '🤸', '{"session": "training session", "player": "gymnast", "team": "squad", "match": "competition", "drill": "routine"}'),
  ('martial_arts', 'Martial Arts', '🥋', '{"session": "training session", "player": "student", "team": "class", "match": "bout", "drill": "technique"}'),
  ('other', 'Other Sport', '🏆', '{"session": "training session", "player": "athlete", "team": "team", "match": "competition", "drill": "drill"}')
ON CONFLICT (id) DO NOTHING;

-- RLS for supported_sports (public read)
ALTER TABLE supported_sports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view supported sports" ON supported_sports;
CREATE POLICY "Anyone can view supported sports" ON supported_sports FOR SELECT USING (true);
-- Migration: User Journey Enhancements
-- Created: 2026-01-18
-- Features:
--   1. Weekly summary email preference
--   2. Push notification reminders table
--   3. CPD exports tracking
--   4. Player development notes

-- ==========================================
-- 1. ADD WEEKLY SUMMARY PREFERENCE TO PROFILES
-- ==========================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN DEFAULT true;
COMMENT ON COLUMN profiles.weekly_summary_enabled IS 'Whether to send weekly coaching summary emails';

-- ==========================================
-- 2. PUSH NOTIFICATION REMINDERS
-- ==========================================

CREATE TABLE IF NOT EXISTS reminder_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Reminder settings
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('after_session', 'daily', 'custom')),
  enabled BOOLEAN DEFAULT true,

  -- For daily/custom reminders
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5]::INTEGER[], -- 0=Sun, 1=Mon, etc.
  time_of_day TIME DEFAULT '19:00:00', -- When to send reminder

  -- Timezone for user
  timezone TEXT DEFAULT 'Europe/London',

  -- Last sent tracking
  last_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_reminder_schedules_user ON reminder_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_enabled ON reminder_schedules(enabled, reminder_type);

ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminders" ON reminder_schedules;
CREATE POLICY "Users can view own reminders" ON reminder_schedules
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reminders" ON reminder_schedules;
CREATE POLICY "Users can insert own reminders" ON reminder_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reminders" ON reminder_schedules;
CREATE POLICY "Users can update own reminders" ON reminder_schedules
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reminders" ON reminder_schedules;
CREATE POLICY "Users can delete own reminders" ON reminder_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 3. CPD EXPORT TRACKING
-- ==========================================

CREATE TABLE IF NOT EXISTS cpd_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Export details
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,

  -- Computed stats at time of export
  total_sessions INTEGER DEFAULT 0,
  total_reflections INTEGER DEFAULT 0,
  themes_covered TEXT[] DEFAULT ARRAY[]::TEXT[],
  insights_generated INTEGER DEFAULT 0,

  -- PDF storage
  file_url TEXT, -- Supabase storage URL
  file_size_bytes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cpd_exports_user ON cpd_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_cpd_exports_date ON cpd_exports(created_at DESC);

ALTER TABLE cpd_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own exports" ON cpd_exports;
CREATE POLICY "Users can view own exports" ON cpd_exports
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own exports" ON cpd_exports;
CREATE POLICY "Users can create own exports" ON cpd_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. PLAYER DEVELOPMENT NOTES
-- ==========================================

-- Allows coaches to track individual players over time
CREATE TABLE IF NOT EXISTS player_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Player info (normalized from extracted_insights)
  player_name TEXT NOT NULL,

  -- Coach's note
  note TEXT NOT NULL,
  category TEXT CHECK (category IN ('strength', 'development', 'concern', 'goal', 'general')),

  -- Link to source reflection/conversation
  source_type TEXT CHECK (source_type IN ('reflection', 'conversation', 'manual')),
  source_id UUID, -- ID of reflection or conversation

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_notes_user ON player_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_player_notes_player ON player_notes(user_id, player_name);
CREATE INDEX IF NOT EXISTS idx_player_notes_date ON player_notes(created_at DESC);

ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notes" ON player_notes;
CREATE POLICY "Users can view own notes" ON player_notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own notes" ON player_notes;
CREATE POLICY "Users can create own notes" ON player_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON player_notes;
CREATE POLICY "Users can update own notes" ON player_notes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON player_notes;
CREATE POLICY "Users can delete own notes" ON player_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 5. ADD EMAIL LOG TABLE IF NOT EXISTS
-- ==========================================

-- email_log table already created above

CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_log(email_type, created_at DESC);

-- ==========================================
-- DONE
-- ==========================================

-- ==========================================
-- LIMIT HITS TRACKING TABLE
-- Tracks when users hit their usage limits (for identifying upgrade candidates)
-- ==========================================

CREATE TABLE IF NOT EXISTS limit_hits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  limit_type TEXT NOT NULL CHECK (limit_type IN ('messages', 'reflections', 'voice_notes')),
  daily_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, hit_date, limit_type)
);

CREATE INDEX IF NOT EXISTS idx_limit_hits_user ON limit_hits(user_id);
CREATE INDEX IF NOT EXISTS idx_limit_hits_date ON limit_hits(hit_date DESC);
CREATE INDEX IF NOT EXISTS idx_limit_hits_created ON limit_hits(created_at DESC);

ALTER TABLE limit_hits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage limit_hits" ON limit_hits;
CREATE POLICY "Service role can manage limit_hits" ON limit_hits
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add email column to profiles if not exists (for admin queries)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

