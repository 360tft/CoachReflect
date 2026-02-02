-- Split voice note limits into short (<5 min) and full (5+ min) categories
-- Migration: 20260202_split_voice_limits.sql

-- Add split voice note tracking columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS short_voice_notes_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS full_recordings_used_this_month INTEGER DEFAULT 0;

-- Migrate existing data: treat all existing voice notes as short
UPDATE profiles
SET short_voice_notes_used_this_month = COALESCE(voice_notes_used_this_month, 0)
WHERE voice_notes_used_this_month > 0;

-- Drop old get_voice_note_limit (return type changed from INTEGER to TABLE)
DROP FUNCTION IF EXISTS get_voice_note_limit(TEXT);

-- Recreate get_voice_note_limit to return short and full limits
-- Returns: short_limit, full_limit, is_shared_pool
CREATE OR REPLACE FUNCTION get_voice_note_limit(p_subscription_tier TEXT)
RETURNS TABLE (
  short_limit INTEGER,
  full_limit INTEGER,
  is_shared_pool BOOLEAN
) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE p_subscription_tier
      WHEN 'free' THEN 0
      WHEN 'pro' THEN 4        -- 4 total (shared pool)
      WHEN 'pro_plus' THEN -1  -- unlimited
      ELSE -1                   -- club members get Pro+ equivalent
    END AS short_limit,
    CASE p_subscription_tier
      WHEN 'free' THEN 0
      WHEN 'pro' THEN 4        -- 4 total (shared pool)
      WHEN 'pro_plus' THEN 12
      ELSE 12                   -- club members get Pro+ equivalent
    END AS full_limit,
    CASE p_subscription_tier
      WHEN 'pro' THEN TRUE
      ELSE FALSE
    END AS is_shared_pool;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Drop old check_voice_note_limit (signature changed, adding p_duration_seconds)
DROP FUNCTION IF EXISTS check_voice_note_limit(UUID);

-- Recreate check_voice_note_limit to accept duration and check correct limit
CREATE OR REPLACE FUNCTION check_voice_note_limit(p_user_id UUID, p_duration_seconds INTEGER DEFAULT 0)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  is_pro BOOLEAN
) AS $$
DECLARE
  v_subscription_tier TEXT;
  v_short_count INTEGER;
  v_full_count INTEGER;
  v_old_count INTEGER;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_is_club_member BOOLEAN;
  v_is_short BOOLEAN;
  v_is_shared_pool BOOLEAN;
BEGIN
  -- Determine if this is a short voice note (< 5 min)
  v_is_short := (p_duration_seconds < 300);

  -- Get user's subscription tier and current counts
  SELECT
    p.subscription_tier,
    COALESCE(p.short_voice_notes_used_this_month, 0),
    COALESCE(p.full_recordings_used_this_month, 0),
    COALESCE(p.voice_notes_used_this_month, 0)
  INTO v_subscription_tier, v_short_count, v_full_count, v_old_count
  FROM profiles p
  WHERE p.user_id = p_user_id;

  -- Reset counts if it's a new month
  IF (SELECT voice_notes_reset_date FROM profiles WHERE user_id = p_user_id) < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE profiles
    SET
      voice_notes_used_this_month = 0,
      short_voice_notes_used_this_month = 0,
      full_recordings_used_this_month = 0,
      voice_notes_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_short_count := 0;
    v_full_count := 0;
    v_old_count := 0;
  END IF;

  -- Check if user is a club member (gets Pro+ equivalent)
  SELECT EXISTS(
    SELECT 1 FROM club_memberships cm
    JOIN clubs c ON cm.club_id = c.id
    WHERE cm.user_id = p_user_id AND c.subscription_status = 'active'
  ) INTO v_is_club_member;

  -- Override tier for club members
  IF v_is_club_member THEN
    v_subscription_tier := 'pro_plus';
  END IF;

  -- Determine if this tier uses a shared pool
  v_is_shared_pool := (v_subscription_tier = 'pro');

  -- Determine the relevant count and limit
  IF v_subscription_tier = 'free' THEN
    v_current_count := v_short_count + v_full_count;
    v_limit := 0;
  ELSIF v_is_shared_pool THEN
    -- Pro: shared pool of 4 regardless of length
    v_current_count := v_short_count + v_full_count;
    v_limit := 4;
  ELSIF v_is_short THEN
    -- Pro+: unlimited short notes
    v_current_count := v_short_count;
    v_limit := -1; -- unlimited
  ELSE
    -- Pro+: 12 full recordings
    v_current_count := v_full_count;
    v_limit := 12;
  END IF;

  -- Return results (-1 limit means unlimited, always allowed)
  RETURN QUERY SELECT
    (v_limit = -1 OR v_current_count < v_limit) AS allowed,
    v_current_count AS current_count,
    v_limit AS limit_count,
    (v_subscription_tier != 'free') AS is_pro;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old increment_voice_note_count (signature changed, adding p_duration_seconds)
DROP FUNCTION IF EXISTS increment_voice_note_count(UUID);

-- Recreate increment_voice_note_count to accept duration and increment correct counter
CREATE OR REPLACE FUNCTION increment_voice_note_count(p_user_id UUID, p_duration_seconds INTEGER DEFAULT 0)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
  v_is_short BOOLEAN;
BEGIN
  v_is_short := (p_duration_seconds < 300);

  -- Reset if needed
  UPDATE profiles
  SET
    voice_notes_used_this_month = 0,
    short_voice_notes_used_this_month = 0,
    full_recordings_used_this_month = 0,
    voice_notes_reset_date = CURRENT_DATE
  WHERE user_id = p_user_id
    AND voice_notes_reset_date < DATE_TRUNC('month', CURRENT_DATE);

  -- Increment the appropriate counter and the legacy counter
  IF v_is_short THEN
    UPDATE profiles
    SET
      short_voice_notes_used_this_month = short_voice_notes_used_this_month + 1,
      voice_notes_used_this_month = voice_notes_used_this_month + 1
    WHERE user_id = p_user_id
    RETURNING short_voice_notes_used_this_month INTO new_count;
  ELSE
    UPDATE profiles
    SET
      full_recordings_used_this_month = full_recordings_used_this_month + 1,
      voice_notes_used_this_month = voice_notes_used_this_month + 1
    WHERE user_id = p_user_id
    RETURNING full_recordings_used_this_month INTO new_count;
  END IF;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update reset function to reset all three columns
CREATE OR REPLACE FUNCTION reset_voice_note_counts()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    voice_notes_used_this_month = 0,
    short_voice_notes_used_this_month = 0,
    full_recordings_used_this_month = 0,
    voice_notes_reset_date = CURRENT_DATE
  WHERE voice_notes_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
