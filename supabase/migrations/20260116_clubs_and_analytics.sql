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
CREATE POLICY "Club admins can view own club" ON clubs
  FOR SELECT USING (auth.uid() = admin_user_id);

-- Club admins can update their own club
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
CREATE POLICY "Users can view own memberships" ON club_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Club admins can view all memberships in their club
CREATE POLICY "Club admins can view club memberships" ON club_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_memberships.club_id
      AND clubs.admin_user_id = auth.uid()
    )
  );

-- Club admins can insert memberships (invites)
CREATE POLICY "Club admins can invite members" ON club_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_memberships.club_id
      AND clubs.admin_user_id = auth.uid()
    )
  );

-- Club admins can update memberships (remove members)
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

CREATE POLICY "Users can view own stats" ON coach_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- COACHING THEMES REFERENCE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS coaching_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default coaching themes
INSERT INTO coaching_themes (id, name, category, keywords, description) VALUES
  ('discipline', 'Discipline', 'behavior', ARRAY['discipline', 'behavior', 'focus', 'attention', 'listening'], 'Player behavior and focus'),
  ('motivation', 'Motivation', 'psychology', ARRAY['motivation', 'effort', 'attitude', 'energy', 'enthusiasm'], 'Player motivation and effort levels'),
  ('technique', 'Technique', 'skills', ARRAY['technique', 'skill', 'touch', 'control', 'passing', 'shooting'], 'Technical skill development'),
  ('tactical', 'Tactical', 'understanding', ARRAY['tactical', 'positioning', 'movement', 'decision', 'awareness'], 'Game understanding and decision making'),
  ('physical', 'Physical', 'fitness', ARRAY['fitness', 'stamina', 'speed', 'strength', 'endurance'], 'Physical conditioning'),
  ('communication', 'Communication', 'teamwork', ARRAY['communication', 'talking', 'leadership', 'organization'], 'Player communication on field'),
  ('teamwork', 'Teamwork', 'teamwork', ARRAY['teamwork', 'combination', 'support', 'chemistry', 'unity'], 'Team cohesion and collaboration'),
  ('confidence', 'Confidence', 'psychology', ARRAY['confidence', 'belief', 'brave', 'risk', 'expression'], 'Player confidence and self-belief'),
  ('session_planning', 'Session Planning', 'coaching', ARRAY['session', 'plan', 'preparation', 'organization', 'timing'], 'Session preparation and execution'),
  ('player_development', 'Player Development', 'coaching', ARRAY['development', 'progress', 'improvement', 'growth', 'learning'], 'Individual player growth'),
  ('game_management', 'Game Management', 'coaching', ARRAY['substitution', 'formation', 'in-game', 'adjustment', 'halftime'], 'Match day decisions'),
  ('parent_management', 'Parent Management', 'stakeholders', ARRAY['parent', 'family', 'sideline', 'communication'], 'Managing parent relationships')
ON CONFLICT (id) DO NOTHING;

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
