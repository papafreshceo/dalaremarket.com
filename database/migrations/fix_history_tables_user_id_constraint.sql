-- =====================================================
-- 히스토리 테이블의 user_id NOT NULL 제약조건 제거
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: organization_cash_history와 organization_credits_history의
--       user_id 컬럼을 완전히 제거
-- =====================================================

-- 1. organization_cash_history의 user_id 컬럼 삭제
ALTER TABLE organization_cash_history
DROP COLUMN IF EXISTS user_id CASCADE;

-- 2. organization_credits_history의 user_id 컬럼 삭제
ALTER TABLE organization_credits_history
DROP COLUMN IF EXISTS user_id CASCADE;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '================================================='
;
  RAISE NOTICE '히스토리 테이블 user_id 컬럼 제거 완료';
  RAISE NOTICE '================================================='
;
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- organization_cash_history.user_id 컬럼 삭제';
  RAISE NOTICE '- organization_credits_history.user_id 컬럼 삭제';
  RAISE NOTICE '================================================='
;
END $$;
