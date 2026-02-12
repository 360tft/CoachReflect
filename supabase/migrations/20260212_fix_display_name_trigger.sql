-- Fix handle_new_user to extract display_name from Google OAuth metadata
-- Google provides 'name' and 'full_name', not 'display_name'

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile (try display_name, then full_name, then name)
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )
  );

  -- Create streak record
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES (NEW.id, 0, 0, CURRENT_DATE);

  -- Start onboarding email sequence
  INSERT INTO public.email_sequences (user_id, sequence_name, current_step, next_send_at)
  VALUES (NEW.id, 'onboarding', 0, NOW() + INTERVAL '5 minutes');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: update existing profiles with NULL display_name from auth metadata
UPDATE public.profiles p
SET display_name = COALESCE(
  u.raw_user_meta_data->>'display_name',
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name'
)
FROM auth.users u
WHERE p.user_id = u.id
  AND p.display_name IS NULL
  AND (
    u.raw_user_meta_data->>'display_name' IS NOT NULL
    OR u.raw_user_meta_data->>'full_name' IS NOT NULL
    OR u.raw_user_meta_data->>'name' IS NOT NULL
  );
