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
CREATE POLICY "Users can view own session plans" ON session_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own session plans" ON session_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own session plans" ON session_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own session plans" ON session_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Index for session_plans
CREATE INDEX idx_session_plans_user ON session_plans(user_id, created_at DESC);
CREATE INDEX idx_session_plans_reflection ON session_plans(reflection_id);

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
