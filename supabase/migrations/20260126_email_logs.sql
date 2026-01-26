-- Email logs for tracking sent emails (re-engagement, recovery, etc.)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'reengagement', 'checkout_recovery', 'weekly_summary', etc.
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up emails by user
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);

-- Index for looking up emails by type
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);

-- Index for looking up recent emails
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Composite index for checking if user has received specific email type recently
CREATE INDEX IF NOT EXISTS idx_email_logs_user_type ON email_logs(user_id, email_type, sent_at DESC);

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read email logs (admin operations)
CREATE POLICY "Service role can manage email_logs"
  ON email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users cannot access email_logs directly (privacy)
