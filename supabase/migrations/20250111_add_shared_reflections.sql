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

CREATE POLICY "Users can view own shares" ON shared_reflections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares" ON shared_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares" ON shared_reflections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public can view active shares" ON shared_reflections
  FOR SELECT USING (is_active = true);
