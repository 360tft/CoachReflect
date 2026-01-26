-- Voice note limits and Club Syllabus feature
-- Migration: 20260126_voice_limits_and_syllabi.sql

-- Add voice note tracking columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS voice_notes_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS voice_notes_reset_date DATE DEFAULT CURRENT_DATE;

-- Create syllabi table for storing club/personal syllabi
CREATE TABLE IF NOT EXISTS syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL DEFAULT 'Club Syllabus',
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'audio', 'document')),
  original_filename TEXT,
  file_size_bytes INTEGER,

  -- Processed content
  transcription TEXT, -- For audio files
  extracted_text TEXT, -- For PDFs/images (OCR)
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: must belong to either a user OR a club, not both
  CONSTRAINT syllabus_owner_check CHECK (
    (user_id IS NOT NULL AND club_id IS NULL) OR
    (user_id IS NULL AND club_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;

-- RLS Policies for syllabi
-- Users can view their own syllabus
CREATE POLICY "Users can view own syllabus" ON syllabi
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own syllabus
CREATE POLICY "Users can insert own syllabus" ON syllabi
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own syllabus
CREATE POLICY "Users can update own syllabus" ON syllabi
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own syllabus
CREATE POLICY "Users can delete own syllabus" ON syllabi
  FOR DELETE USING (auth.uid() = user_id);

-- Club members can view their club's syllabus
CREATE POLICY "Club members can view club syllabus" ON syllabi
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_memberships WHERE user_id = auth.uid()
    )
  );

-- Club admins can manage club syllabus
CREATE POLICY "Club admins can insert club syllabus" ON syllabi
  FOR INSERT WITH CHECK (
    club_id IN (
      SELECT club_id FROM club_memberships WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Club admins can update club syllabus" ON syllabi
  FOR UPDATE USING (
    club_id IN (
      SELECT club_id FROM club_memberships WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Club admins can delete club syllabus" ON syllabi
  FOR DELETE USING (
    club_id IN (
      SELECT club_id FROM club_memberships WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_syllabi_user_id ON syllabi(user_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_club_id ON syllabi(club_id);

-- Function to reset voice note counts monthly
CREATE OR REPLACE FUNCTION reset_voice_note_counts()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    voice_notes_used_this_month = 0,
    voice_notes_reset_date = CURRENT_DATE
  WHERE voice_notes_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment voice note count
CREATE OR REPLACE FUNCTION increment_voice_note_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Reset if needed
  UPDATE profiles
  SET
    voice_notes_used_this_month = 0,
    voice_notes_reset_date = CURRENT_DATE
  WHERE user_id = p_user_id
    AND voice_notes_reset_date < DATE_TRUNC('month', CURRENT_DATE);

  -- Increment and return new count
  UPDATE profiles
  SET voice_notes_used_this_month = voice_notes_used_this_month + 1
  WHERE user_id = p_user_id
  RETURNING voice_notes_used_this_month INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get voice note limit based on subscription tier
CREATE OR REPLACE FUNCTION get_voice_note_limit(p_subscription_tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_subscription_tier
    WHEN 'free' THEN 0
    WHEN 'pro' THEN 4
    WHEN 'pro_plus' THEN 12
    ELSE 12 -- Club members get Pro+ equivalent
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user can upload a voice note (checks limit)
CREATE OR REPLACE FUNCTION check_voice_note_limit(p_user_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  is_pro BOOLEAN
) AS $$
DECLARE
  v_subscription_tier TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_is_club_member BOOLEAN;
BEGIN
  -- Get user's subscription tier and current count
  SELECT
    p.subscription_tier,
    p.voice_notes_used_this_month
  INTO v_subscription_tier, v_current_count
  FROM profiles p
  WHERE p.user_id = p_user_id;

  -- Reset count if it's a new month
  IF (SELECT voice_notes_reset_date FROM profiles WHERE user_id = p_user_id) < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE profiles
    SET voice_notes_used_this_month = 0, voice_notes_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_current_count := 0;
  END IF;

  -- Check if user is a club member (gets Pro+ equivalent)
  SELECT EXISTS(
    SELECT 1 FROM club_memberships cm
    JOIN clubs c ON cm.club_id = c.id
    WHERE cm.user_id = p_user_id AND c.subscription_status = 'active'
  ) INTO v_is_club_member;

  -- Determine limit
  IF v_is_club_member THEN
    v_limit := 12; -- Club members get Pro+ equivalent
  ELSE
    v_limit := get_voice_note_limit(v_subscription_tier);
  END IF;

  -- Return results
  RETURN QUERY SELECT
    v_current_count < v_limit AS allowed,
    v_current_count AS current_count,
    v_limit AS limit_count,
    (v_subscription_tier != 'free' OR v_is_club_member) AS is_pro;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for syllabi if not exists
-- Note: This needs to be run via Supabase dashboard or storage API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('syllabi', 'syllabi', false)
-- ON CONFLICT DO NOTHING;
