-- ============================================================
-- KARMA MAP (REDDIT-TRACK) - SUPABASE DATABASE SCHEMA
-- Paste this entire SQL into the Supabase SQL Editor and click RUN
-- ============================================================

-- 1. Create the posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  name TEXT,
  title TEXT NOT NULL,
  author TEXT,
  account_tag TEXT,
  subreddit TEXT NOT NULL,
  subreddit_prefixed TEXT,
  score INTEGER DEFAULT 0,
  ups INTEGER DEFAULT 0,
  upvote_ratio INTEGER DEFAULT 95,
  num_comments INTEGER DEFAULT 0,
  created_utc BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  permalink TEXT,
  original_url TEXT,
  content_url TEXT,
  is_self BOOLEAN DEFAULT TRUE,
  selftext TEXT DEFAULT '',
  is_crosspost BOOLEAN DEFAULT FALSE,
  crosspost_parent JSONB,
  notes TEXT DEFAULT '',
  tracked_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on score and account_tag for high performance
CREATE INDEX IF NOT EXISTS idx_posts_score ON posts(score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_account_tag ON posts(account_tag);
CREATE INDEX IF NOT EXISTS idx_posts_subreddit ON posts(subreddit);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 4. Create policy allowing read and write access for your web dashboard
DROP POLICY IF EXISTS "Public access to posts" ON posts;
CREATE POLICY "Public access to posts" ON posts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Optional: Insert initial sample posts
INSERT INTO posts (id, name, title, author, account_tag, subreddit, subreddit_prefixed, score, ups, upvote_ratio, num_comments, is_crosspost, crosspost_parent, permalink, original_url)
VALUES
  ('1xq4nbt', 't3_1xq4nbt', 'He looks like a freshly baked loaf', 'North-Draw8911', 'NorthDraw', 'NatureIsFuckingCute', 'r/NatureIsFuckingCute', 843, 843, 95, 0, true, '{"subreddit":"original","score":0,"title":"He looks like a freshly baked loaf"}', 'https://www.reddit.com/r/NatureIsFuckingCute/comments/1xq4nbt/he_looks_like_a_freshly_baked_loaf/', 'https://www.reddit.com/r/NatureIsFuckingCute/comments/1xq4nbt/he_looks_like_a_freshly_baked_loaf/'),
  ('1xphuwn', 't3_1xphuwn', 'First Breathe And First Yawn', 'frNewton', 'frNewton', 'NatureIsFuckingCute', 'r/NatureIsFuckingCute', 134, 134, 95, 0, false, null, 'https://www.reddit.com/r/NatureIsFuckingCute/comments/1xphuwn/first_breathe_and_first_yawn/', 'https://www.reddit.com/r/NatureIsFuckingCute/comments/1xphuwn/first_breathe_and_first_yawn/'),
  ('1xphs48', 't3_1xphs48', 'First Breathe And First Yawn', 'frNewton', 'frNewton', 'reptiles', 'r/reptiles', 122, 122, 95, 0, true, '{"subreddit":"original","score":0,"title":"First Breathe And First Yawn"}', 'https://www.reddit.com/r/reptiles/comments/1xphs48/first_breathe_and_first_yawn/', 'https://www.reddit.com/r/reptiles/comments/1xphs48/first_breathe_and_first_yawn/'),
  ('1xq4lwk', 't3_1xq4lwk', 'He looks like a freshly baked loaf', 'North-Draw8911', 'NorthDraw', 'AppliedBiology', 'r/AppliedBiology', 22, 22, 95, 0, false, null, 'https://www.reddit.com/r/AppliedBiology/comments/1xq4lwk/he_looks_like_a_freshly_baked_loaf/', 'https://www.reddit.com/r/AppliedBiology/comments/1xq4lwk/he_looks_like_a_freshly_baked_loaf/')
ON CONFLICT (id) DO UPDATE SET
  score = EXCLUDED.score,
  ups = EXCLUDED.ups,
  last_updated = NOW();
