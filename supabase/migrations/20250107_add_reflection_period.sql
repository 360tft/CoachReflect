-- Add column to track which month the reflection count is for
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reflection_count_period TEXT;

-- Initialize existing profiles with current month
UPDATE profiles SET reflection_count_period = TO_CHAR(NOW(), 'YYYY-MM') WHERE reflection_count_period IS NULL;
