-- Referral System for CoachReflect
-- Tracks referrals and rewards referrers with free Pro months

-- Add referral code to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS referral_credits INTEGER DEFAULT 0;

-- Create index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded')),
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  reward_type TEXT,
  reward_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Service role full access on referrals" ON referrals;
CREATE POLICY "Service role full access on referrals" ON referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Referral rewards history
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_month', 'discount', 'credits')),
  reward_value INTEGER NOT NULL,
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rewards" ON referral_rewards;
CREATE POLICY "Users can view own rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on referral_rewards" ON referral_rewards;
CREATE POLICY "Service role full access on referral_rewards" ON referral_rewards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure user has referral code
CREATE OR REPLACE FUNCTION ensure_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  -- Check if user already has a code
  SELECT referral_code INTO v_code FROM profiles WHERE user_id = p_user_id;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate unique code
  LOOP
    v_code := generate_referral_code();
    v_attempts := v_attempts + 1;

    BEGIN
      UPDATE profiles SET referral_code = v_code WHERE user_id = p_user_id;
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts > 10 THEN
        RAISE EXCEPTION 'Could not generate unique referral code';
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral signup
CREATE OR REPLACE FUNCTION process_referral_signup(p_referred_id UUID, p_referral_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find referrer by code
  SELECT user_id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = UPPER(p_referral_code);

  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Don't allow self-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN FALSE;
  END IF;

  -- Update referred user's profile
  UPDATE profiles
  SET referred_by = v_referrer_id
  WHERE user_id = p_referred_id;

  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, status, signed_up_at)
  VALUES (v_referrer_id, p_referred_id, UPPER(p_referral_code), 'signed_up', NOW())
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral conversion (when referred user upgrades to Pro)
CREATE OR REPLACE FUNCTION process_referral_conversion(p_referred_id UUID)
RETURNS VOID AS $$
DECLARE
  v_referral RECORD;
  v_reward_id UUID;
BEGIN
  -- Find the referral
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = p_referred_id
    AND status IN ('signed_up', 'pending');

  IF v_referral IS NULL THEN
    RETURN;
  END IF;

  -- Update referral status
  UPDATE referrals
  SET status = 'converted', converted_at = NOW()
  WHERE id = v_referral.id;

  -- Award referrer with 1 free month credit
  UPDATE profiles
  SET referral_credits = COALESCE(referral_credits, 0) + 1
  WHERE user_id = v_referral.referrer_id;

  -- Create reward record
  INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, status)
  VALUES (v_referral.referrer_id, v_referral.id, 'free_month', 1, 'pending')
  RETURNING id INTO v_reward_id;

  -- Mark referral as rewarded
  UPDATE referrals
  SET status = 'rewarded', rewarded_at = NOW(), reward_type = 'free_month', reward_amount = 1
  WHERE id = v_referral.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
