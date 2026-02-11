-- Enable RLS on generated_drills (was missing from initial migration)
-- This table is written by adminClient (service role) and read by admins only
ALTER TABLE generated_drills ENABLE ROW LEVEL SECURITY;

-- Users can view their own generated drills
CREATE POLICY "Users read own generated drills" ON generated_drills
  FOR SELECT USING (auth.uid() = user_id);

-- No direct insert/update/delete via anon key — only service role (adminClient)
