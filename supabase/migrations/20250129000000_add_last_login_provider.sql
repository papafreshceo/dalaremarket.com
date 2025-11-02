-- Add last_login_provider column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_provider TEXT CHECK (last_login_provider IN ('email', 'naver', 'kakao', 'google'));

-- Add comment
COMMENT ON COLUMN users.last_login_provider IS '최근 사용한 로그인 방법 (email, naver, kakao, google)';
