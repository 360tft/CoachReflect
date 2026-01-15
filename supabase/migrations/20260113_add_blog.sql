-- Migration: Add Blog system
-- Description: Tracks user questions and generates blog posts from popular coaching questions

-- =============================================
-- Table: question_tracking
-- Tracks coaching questions users ask in chat
-- =============================================
CREATE TABLE IF NOT EXISTS question_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  normalized_question TEXT NOT NULL,  -- Lowercase, trimmed for matching
  question_group TEXT,                -- Groups similar questions (e.g., "session_planning_u12")
  category TEXT,                      -- 'session_planning', 'player_development', 'tactics', 'reflection', etc.
  topics TEXT[],                      -- Detected topics (finishing, defending, age groups, etc.)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID,
  ask_count INTEGER DEFAULT 1,
  first_asked_at TIMESTAMPTZ DEFAULT NOW(),
  last_asked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for question_tracking
CREATE INDEX IF NOT EXISTS idx_question_tracking_normalized ON question_tracking(normalized_question);
CREATE INDEX IF NOT EXISTS idx_question_tracking_group ON question_tracking(question_group);
CREATE INDEX IF NOT EXISTS idx_question_tracking_category ON question_tracking(category);
CREATE INDEX IF NOT EXISTS idx_question_tracking_last_asked ON question_tracking(last_asked_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_tracking_user ON question_tracking(user_id);

-- =============================================
-- Table: blog_posts
-- Stores generated blog posts
-- =============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,              -- Short description/excerpt
  content TEXT NOT NULL,              -- Markdown content
  category TEXT,
  question_group TEXT,                -- Links to question_tracking.question_group
  source_questions UUID[],            -- Array of question_tracking IDs used
  topics TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  featured_image TEXT,
  word_count INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_question_group ON blog_posts(question_group);

-- =============================================
-- Table: blog_generation_queue
-- Tracks blog post generation requests
-- =============================================
CREATE TABLE IF NOT EXISTS blog_generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,                -- The question to generate a post from
  count INTEGER DEFAULT 1,            -- Number of times this query was asked
  status TEXT DEFAULT 'pending',      -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blog_generation_queue_status ON blog_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_blog_generation_queue_created ON blog_generation_queue(created_at DESC);

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE question_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_generation_queue ENABLE ROW LEVEL SECURITY;

-- question_tracking: Users can see their own questions, service role can see all
CREATE POLICY "Users can view own questions"
  ON question_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all questions"
  ON question_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- blog_posts: Everyone can read published posts
CREATE POLICY "Anyone can view published posts"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Service role can manage all posts"
  ON blog_posts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- blog_generation_queue: Service role only
CREATE POLICY "Service role can manage generation queue"
  ON blog_generation_queue FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================
-- Functions
-- =============================================

-- Function to upsert question tracking
CREATE OR REPLACE FUNCTION upsert_question_tracking(
  p_question_text TEXT,
  p_normalized_question TEXT,
  p_question_group TEXT,
  p_category TEXT,
  p_topics TEXT[],
  p_user_id UUID,
  p_conversation_id UUID
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Check if similar question exists (by question_group)
  SELECT id INTO v_id
  FROM question_tracking
  WHERE question_group = p_question_group
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    -- Update existing question
    UPDATE question_tracking
    SET
      ask_count = ask_count + 1,
      last_asked_at = NOW()
    WHERE id = v_id;
    RETURN v_id;
  ELSE
    -- Insert new question
    INSERT INTO question_tracking (
      question_text,
      normalized_question,
      question_group,
      category,
      topics,
      user_id,
      conversation_id
    ) VALUES (
      p_question_text,
      p_normalized_question,
      p_question_group,
      p_category,
      p_topics,
      p_user_id,
      p_conversation_id
    )
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top questions for blog generation
CREATE OR REPLACE FUNCTION get_top_questions_for_blog(
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  question_group TEXT,
  category TEXT,
  topics TEXT[],
  total_asks BIGINT,
  sample_question TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qt.question_group,
    qt.category,
    qt.topics,
    SUM(qt.ask_count) as total_asks,
    (ARRAY_AGG(qt.question_text ORDER BY qt.ask_count DESC))[1] as sample_question
  FROM question_tracking qt
  WHERE
    qt.last_asked_at > NOW() - (p_days || ' days')::INTERVAL
    AND qt.question_group IS NOT NULL
    AND NOT EXISTS (
      -- Exclude questions that already have blog posts
      SELECT 1 FROM blog_posts bp
      WHERE bp.question_group = qt.question_group
    )
  GROUP BY qt.question_group, qt.category, qt.topics
  ORDER BY total_asks DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Trigger: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- =============================================
-- Function: Increment blog post view count
-- =============================================
CREATE OR REPLACE FUNCTION increment_blog_view(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE question_tracking IS 'Tracks coaching questions users ask for blog content generation';
COMMENT ON TABLE blog_posts IS 'AI-generated blog posts based on popular coaching questions';
COMMENT ON TABLE blog_generation_queue IS 'Queue for processing blog post generation requests';
COMMENT ON COLUMN question_tracking.question_group IS 'Groups similar questions together';
COMMENT ON COLUMN question_tracking.normalized_question IS 'Lowercase, trimmed version for exact duplicate detection';
COMMENT ON COLUMN blog_posts.question_group IS 'Links to the question_tracking.question_group this post answers';
