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

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_user ON message_attachments(user_id, created_at DESC);
CREATE INDEX idx_message_attachments_pending ON message_attachments(processing_status)
  WHERE processing_status = 'pending';
CREATE INDEX idx_message_attachments_session_date ON message_attachments(user_id, session_date DESC);

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachments" ON message_attachments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attachments" ON message_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attachments" ON message_attachments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own attachments" ON message_attachments
  FOR DELETE USING (auth.uid() = user_id);
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

CREATE INDEX idx_extracted_insights_user ON extracted_insights(user_id, extraction_date DESC);
CREATE INDEX idx_extracted_insights_type ON extracted_insights(user_id, insight_type, extraction_date DESC);
CREATE INDEX idx_extracted_insights_name ON extracted_insights(user_id, insight_type, name);
CREATE INDEX idx_extracted_insights_conversation ON extracted_insights(conversation_id);
CREATE INDEX idx_extracted_insights_session_date ON extracted_insights(user_id, session_date DESC);

ALTER TABLE extracted_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" ON extracted_insights
  FOR SELECT USING (auth.uid() = user_id);
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

CREATE INDEX idx_coach_daily_stats_user_date ON coach_daily_stats(user_id, stat_date DESC);

ALTER TABLE coach_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats" ON coach_daily_stats
  FOR SELECT USING (auth.uid() = user_id);
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
