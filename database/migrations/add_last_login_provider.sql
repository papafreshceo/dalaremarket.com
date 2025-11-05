-- users 테이블에 last_login_provider 컬럼 추가
-- 사용자가 마지막으로 로그인한 제공자 (email, kakao, naver, google 등)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_provider VARCHAR(50) DEFAULT 'email';

-- 기존 사용자들의 provider를 email로 설정
UPDATE users
SET last_login_provider = 'email'
WHERE last_login_provider IS NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_last_login_provider ON users(last_login_provider);

-- 코멘트 추가
COMMENT ON COLUMN users.last_login_provider IS '마지막 로그인 제공자 (email, kakao, naver, google)';
