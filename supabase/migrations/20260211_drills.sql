-- User's saved drills (Pro only)
CREATE TABLE IF NOT EXISTS saved_drills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'technical',
  age_group TEXT,
  type TEXT NOT NULL DEFAULT 'drill',
  set_piece_type TEXT,
  drill_data JSONB NOT NULL,
  is_favourite BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_drills_user ON saved_drills(user_id) WHERE is_active = true;
CREATE INDEX idx_saved_drills_share ON saved_drills(share_id);

ALTER TABLE saved_drills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own drills" ON saved_drills
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own drills" ON saved_drills
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own drills" ON saved_drills
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-saved from chat (for future admin curation)
CREATE TABLE IF NOT EXISTS generated_drills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'technical',
  age_group TEXT,
  type TEXT NOT NULL DEFAULT 'drill',
  set_piece_type TEXT,
  drill_data JSONB NOT NULL,
  prompt TEXT,
  conversation_id UUID,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  share_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_drills_user ON generated_drills(user_id);
