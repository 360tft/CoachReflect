-- Add Pro trial tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_trial_used BOOLEAN DEFAULT false;
