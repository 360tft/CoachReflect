-- Add 'trialing' to the subscription_status check constraint on profiles
-- Required for Stripe trial subscriptions (status = 'trialing')
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing'));
