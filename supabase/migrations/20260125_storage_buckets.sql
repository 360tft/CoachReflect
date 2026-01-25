-- Create storage buckets for CoachReflect
-- Run this in Supabase SQL editor

-- Create voice-notes bucket (private - accessed via signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-notes',
  'voice-notes',
  false,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create session-plans bucket (public - for image display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'session-plans',
  'session-plans',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for voice-notes (private bucket)
DROP POLICY IF EXISTS "Users can upload own voice notes" ON storage.objects;
CREATE POLICY "Users can upload own voice notes" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view own voice notes" ON storage.objects;
CREATE POLICY "Users can view own voice notes" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own voice notes" ON storage.objects;
CREATE POLICY "Users can delete own voice notes" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Service role full access on voice-notes" ON storage.objects;
CREATE POLICY "Service role full access on voice-notes" ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'voice-notes')
  WITH CHECK (bucket_id = 'voice-notes');

-- Storage policies for session-plans (public bucket)
DROP POLICY IF EXISTS "Users can upload own session plans" ON storage.objects;
CREATE POLICY "Users can upload own session plans" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'session-plans' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Anyone can view session plans" ON storage.objects;
CREATE POLICY "Anyone can view session plans" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'session-plans');

DROP POLICY IF EXISTS "Users can delete own session plans" ON storage.objects;
CREATE POLICY "Users can delete own session plans" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'session-plans' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Service role full access on session-plans" ON storage.objects;
CREATE POLICY "Service role full access on session-plans" ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'session-plans')
  WITH CHECK (bucket_id = 'session-plans');
