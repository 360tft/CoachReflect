-- Referral System (PRD 23)
-- Create referrals table for tracking referral codes and rewards

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type TEXT,
  reward_amount DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own referrals"
  ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
  ON referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can update referrals"
  ON referrals
  FOR UPDATE
  USING (true);

-- Add referral_code column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
    CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
  END IF;
END $$;

-- Add referred_by column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add referral_rewards_earned column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_rewards_earned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_rewards_earned INTEGER DEFAULT 0;
  END IF;
END $$;
