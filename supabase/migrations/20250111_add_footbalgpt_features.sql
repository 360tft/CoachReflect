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

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);
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

CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);
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

CREATE POLICY "Users can view own streaks" ON streaks
  FOR SELECT USING (auth.uid() = user_id);
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

CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);
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

CREATE POLICY "Users can view own email sequences" ON email_sequences
  FOR SELECT USING (auth.uid() = user_id);
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
  error TEXT -- null if sent successfully
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at DESC);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email log" ON email_log
  FOR SELECT USING (auth.uid() = user_id);
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

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
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

CREATE POLICY "Users can view own memory" ON user_memory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own memory" ON user_memory
  FOR UPDATE USING (auth.uid() = user_id);
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

CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);
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

CREATE POLICY "Users can view own events" ON events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
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
