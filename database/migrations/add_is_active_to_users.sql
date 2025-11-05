-- users 테이블에 is_active 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 기존 회원들 모두 활성화 상태로 설정
UPDATE users
SET is_active = true
WHERE is_active IS NULL;

-- is_active 컬럼에 NOT NULL 제약조건 추가
ALTER TABLE users
ALTER COLUMN is_active SET NOT NULL;

-- is_active 컬럼에 인덱스 생성 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

COMMENT ON COLUMN users.is_active IS '회원 계정 활성화 상태 (true: 활성, false: 비활성)';
