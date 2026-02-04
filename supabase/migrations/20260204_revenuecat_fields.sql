-- Add RevenueCat fields to profiles table for IAP subscription tracking
-- subscription_source tracks where the subscription came from (stripe, apple, google)
-- revenuecat_app_user_id stores the RevenueCat user ID for webhook matching

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_source TEXT CHECK (subscription_source IN ('stripe', 'apple', 'google'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenuecat_app_user_id TEXT;

-- Index for webhook lookups by RevenueCat user ID
CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat_user_id ON profiles(revenuecat_app_user_id) WHERE revenuecat_app_user_id IS NOT NULL;

-- Update the subscription_status check constraint to include all possible states
-- (ensuring 'inactive' and 'canceled' are both allowed, which they should be already)
DO $$
BEGIN
  -- Only alter if the constraint exists and needs updating
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled'));
  END IF;
END $$;
