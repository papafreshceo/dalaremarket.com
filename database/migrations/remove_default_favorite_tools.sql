-- Remove default favorite tools from users table
-- Change default from ['margin-calculator', 'price-simulator'] to empty array

ALTER TABLE users
ALTER COLUMN favorite_tools SET DEFAULT ARRAY[]::TEXT[];

-- Update existing users who still have the default favorites to empty array
UPDATE users
SET favorite_tools = ARRAY[]::TEXT[]
WHERE favorite_tools = ARRAY['margin-calculator', 'price-simulator']::TEXT[];

-- Add comment
COMMENT ON COLUMN users.favorite_tools IS '사용자가 즐겨찾기한 도구 ID 목록 (기본값: 빈 배열)';
