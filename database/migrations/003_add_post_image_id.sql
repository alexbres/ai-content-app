-- Add image_id column to posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS image_id UUID;

-- Optional index for filtering by image presence
CREATE INDEX IF NOT EXISTS idx_posts_image_id ON posts(image_id);


