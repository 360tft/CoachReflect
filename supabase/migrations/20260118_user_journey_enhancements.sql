-- Migration: User Journey Enhancements
-- Created: 2026-01-18
-- Features:
--   1. Weekly summary email preference
--   2. Push notification reminders table
--   3. CPD exports tracking
--   4. Player development notes

-- ==========================================
-- 1. ADD WEEKLY SUMMARY PREFERENCE TO PROFILES
-- ==========================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN DEFAULT true;
COMMENT ON COLUMN profiles.weekly_summary_enabled IS 'Whether to send weekly coaching summary emails';

-- ==========================================
-- 2. PUSH NOTIFICATION REMINDERS
-- ==========================================

CREATE TABLE IF NOT EXISTS reminder_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Reminder settings
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('after_session', 'daily', 'custom')),
  enabled BOOLEAN DEFAULT true,

  -- For daily/custom reminders
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5]::INTEGER[], -- 0=Sun, 1=Mon, etc.
  time_of_day TIME DEFAULT '19:00:00', -- When to send reminder

  -- Timezone for user
  timezone TEXT DEFAULT 'Europe/London',

  -- Last sent tracking
  last_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, reminder_type)
);

CREATE INDEX idx_reminder_schedules_user ON reminder_schedules(user_id);
CREATE INDEX idx_reminder_schedules_enabled ON reminder_schedules(enabled, reminder_type);

ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON reminder_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON reminder_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON reminder_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON reminder_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 3. CPD EXPORT TRACKING
-- ==========================================

CREATE TABLE IF NOT EXISTS cpd_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Export details
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,

  -- Computed stats at time of export
  total_sessions INTEGER DEFAULT 0,
  total_reflections INTEGER DEFAULT 0,
  themes_covered TEXT[] DEFAULT ARRAY[]::TEXT[],
  insights_generated INTEGER DEFAULT 0,

  -- PDF storage
  file_url TEXT, -- Supabase storage URL
  file_size_bytes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cpd_exports_user ON cpd_exports(user_id);
CREATE INDEX idx_cpd_exports_date ON cpd_exports(created_at DESC);

ALTER TABLE cpd_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports" ON cpd_exports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exports" ON cpd_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. PLAYER DEVELOPMENT NOTES
-- ==========================================

-- Allows coaches to track individual players over time
CREATE TABLE IF NOT EXISTS player_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Player info (normalized from extracted_insights)
  player_name TEXT NOT NULL,

  -- Coach's note
  note TEXT NOT NULL,
  category TEXT CHECK (category IN ('strength', 'development', 'concern', 'goal', 'general')),

  -- Link to source reflection/conversation
  source_type TEXT CHECK (source_type IN ('reflection', 'conversation', 'manual')),
  source_id UUID, -- ID of reflection or conversation

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_player_notes_user ON player_notes(user_id);
CREATE INDEX idx_player_notes_player ON player_notes(user_id, player_name);
CREATE INDEX idx_player_notes_date ON player_notes(created_at DESC);

ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON player_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON player_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON player_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON player_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 5. ADD EMAIL LOG TABLE IF NOT EXISTS
-- ==========================================

CREATE TABLE IF NOT EXISTS email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_email_log_user ON email_log(user_id);
CREATE INDEX idx_email_log_type ON email_log(email_type, created_at DESC);

-- ==========================================
-- DONE
-- ==========================================
