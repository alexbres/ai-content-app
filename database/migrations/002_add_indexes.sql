CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user_post ON interactions(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);


