-- Add theme_preference column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark'));

-- Add comment
COMMENT ON COLUMN users.theme_preference IS '사용자 테마 설정 (light/dark)';
