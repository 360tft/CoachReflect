-- Multi-sport support for CoachReflect
-- Add sport column to profiles

-- Add sport column with football as default (existing users are football coaches)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'football';

-- Create index for sport-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_sport ON profiles(sport);

-- Add sport-specific coaching levels that work across sports
COMMENT ON COLUMN profiles.coaching_level IS 'Coaching level: grassroots, academy, semi-pro, professional - applies to all sports';

-- Update the coaching_level check to be more inclusive
-- (The existing values work for all sports, no change needed)

-- Create a reference table for supported sports (optional, for UI dropdowns)
CREATE TABLE IF NOT EXISTS supported_sports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  terminology JSONB DEFAULT '{}', -- sport-specific terms
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert supported sports
INSERT INTO supported_sports (id, name, icon, terminology) VALUES
  ('football', 'Football (Soccer)', '⚽', '{"session": "training session", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('rugby', 'Rugby', '🏉', '{"session": "training session", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('basketball', 'Basketball', '🏀', '{"session": "practice", "player": "player", "team": "team", "match": "game", "drill": "drill"}'),
  ('hockey', 'Hockey', '🏑', '{"session": "training session", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('tennis', 'Tennis', '🎾', '{"session": "practice session", "player": "player", "team": "doubles pair", "match": "match", "drill": "drill"}'),
  ('cricket', 'Cricket', '🏏', '{"session": "nets session", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('volleyball', 'Volleyball', '🏐', '{"session": "practice", "player": "player", "team": "team", "match": "match", "drill": "drill"}'),
  ('baseball', 'Baseball', '⚾', '{"session": "practice", "player": "player", "team": "team", "match": "game", "drill": "drill"}'),
  ('american_football', 'American Football', '🏈', '{"session": "practice", "player": "player", "team": "team", "match": "game", "drill": "drill"}'),
  ('swimming', 'Swimming', '🏊', '{"session": "training session", "player": "swimmer", "team": "squad", "match": "meet", "drill": "set"}'),
  ('athletics', 'Athletics/Track & Field', '🏃', '{"session": "training session", "player": "athlete", "team": "squad", "match": "competition", "drill": "exercise"}'),
  ('gymnastics', 'Gymnastics', '🤸', '{"session": "training session", "player": "gymnast", "team": "squad", "match": "competition", "drill": "routine"}'),
  ('martial_arts', 'Martial Arts', '🥋', '{"session": "training session", "player": "student", "team": "class", "match": "bout", "drill": "technique"}'),
  ('other', 'Other Sport', '🏆', '{"session": "training session", "player": "athlete", "team": "team", "match": "competition", "drill": "drill"}')
ON CONFLICT (id) DO NOTHING;

-- RLS for supported_sports (public read)
ALTER TABLE supported_sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view supported sports" ON supported_sports FOR SELECT USING (true);
