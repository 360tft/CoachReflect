-- Tasks table for tracking action items from reflections and chat
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_chat', 'ai_reflection')),
  reflection_id UUID REFERENCES reflections(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_reflection_id ON tasks(reflection_id);
CREATE INDEX idx_tasks_conversation_id ON tasks(conversation_id);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for admin/cron operations
CREATE POLICY "Service role full access on tasks"
  ON tasks FOR ALL
  USING (auth.role() = 'service_role');

-- Task completion badges
INSERT INTO badges (id, name, description, emoji, category, requirement_type, requirement_value, rarity) VALUES
  ('tasks_1', 'First Action', 'Completed your first task', '1', 'milestone', 'tasks_completed', 1, 'common'),
  ('tasks_5', 'Getting Things Done', 'Completed 5 tasks', '5', 'milestone', 'tasks_completed', 5, 'common'),
  ('tasks_10', 'Action Taker', 'Completed 10 tasks', '10', 'milestone', 'tasks_completed', 10, 'uncommon'),
  ('tasks_25', 'Task Master', 'Completed 25 tasks', '25', 'milestone', 'tasks_completed', 25, 'rare'),
  ('tasks_50', 'Coaching Machine', 'Completed 50 tasks', '50', 'milestone', 'tasks_completed', 50, 'legendary')
ON CONFLICT (id) DO NOTHING;
