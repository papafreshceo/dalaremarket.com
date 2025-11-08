-- Add favorite_tools column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS favorite_tools TEXT[] DEFAULT ARRAY['margin-calculator', 'price-simulator'];

-- Add comment
COMMENT ON COLUMN users.favorite_tools IS '사용자가 즐겨찾기한 도구 ID 목록';
