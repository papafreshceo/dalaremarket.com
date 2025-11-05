-- Add nickname column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- Add comment
COMMENT ON COLUMN users.nickname IS '사용자 닉네임 (셀러피드 등에서 표시)';
