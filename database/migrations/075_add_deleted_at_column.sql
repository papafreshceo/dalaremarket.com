-- Migration 075: Add deleted_at column for soft delete
-- 회원 탈퇴 추적을 위한 deleted_at 칼럼 추가

-- =====================================================
-- 1. users 테이블에 deleted_at과 is_deleted 칼럼 추가
-- =====================================================
ALTER TABLE users
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;

-- deleted_at에 인덱스 추가 (필터링 성능 향상)
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- is_deleted에 인덱스 추가
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

-- =====================================================
-- 2. 활성 사용자만 조회하는 뷰 생성 (선택사항)
-- =====================================================
CREATE OR REPLACE VIEW active_users AS
SELECT *
FROM users
WHERE is_deleted = false;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 회원 탈퇴 칼럼 추가 완료';
  RAISE NOTICE '  - users.deleted_at: TIMESTAMP (탈퇴 날짜/시간)';
  RAISE NOTICE '  - users.is_deleted: BOOLEAN (탈퇴 여부)';
  RAISE NOTICE '  - active_users 뷰 생성됨';
END $$;
