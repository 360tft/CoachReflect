-- Email events table for Resend webhook tracking
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_id TEXT,
  email_type TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up events by user
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id);

-- Index for looking up events by email_id
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);

-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);

-- RLS policies
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (webhook endpoint uses admin client)
CREATE POLICY "Service role can manage email_events"
  ON email_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can view their own email events
CREATE POLICY "Users can view own email_events"
  ON email_events
  FOR SELECT
  USING (auth.uid() = user_id);
