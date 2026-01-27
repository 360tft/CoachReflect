-- Migration: Add scheduled publishing for blog posts
-- Description: Adds scheduled_publish_at column to enable pre-scheduled blog post publishing

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled
  ON blog_posts (scheduled_publish_at)
  WHERE published = false AND scheduled_publish_at IS NOT NULL;

COMMENT ON COLUMN blog_posts.scheduled_publish_at IS 'When set, the post will be auto-published by the cron job at this time';
