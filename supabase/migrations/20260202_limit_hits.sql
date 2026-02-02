-- Track when users hit their usage limits (for admin analytics and upgrade targeting)
CREATE TABLE IF NOT EXISTS limit_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  limit_type TEXT NOT NULL DEFAULT 'daily_messages', -- 'daily_messages', 'voice_notes', etc.
  daily_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_limit_hits_user_id ON limit_hits(user_id);
CREATE INDEX IF NOT EXISTS idx_limit_hits_created_at ON limit_hits(created_at DESC);

ALTER TABLE limit_hits ENABLE ROW LEVEL SECURITY;

-- Service role can manage limit hits (written by API routes)
CREATE POLICY "Service role can manage limit_hits"
  ON limit_hits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view their own limit hits
CREATE POLICY "Users can view own limit_hits"
  ON limit_hits
  FOR SELECT
  USING (auth.uid() = user_id);
