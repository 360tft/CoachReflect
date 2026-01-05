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
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reflections
CREATE POLICY "Users can view own reflections" ON reflections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections" ON reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reflections" ON reflections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reflections" ON reflections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for insights
CREATE POLICY "Users can view own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can dismiss own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_sessions_user_date ON sessions(user_id, date DESC);
CREATE INDEX idx_reflections_user_date ON reflections(user_id, date DESC);
CREATE INDEX idx_reflections_session ON reflections(session_id);
CREATE INDEX idx_insights_user ON insights(user_id, is_dismissed, created_at DESC);

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
