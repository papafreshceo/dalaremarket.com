-- =====================================================
-- 사용자 개인 단위 컬럼 정리 (조직 단위로 전환 완료 후)
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - 캐시, 크레딧, 기여점수를 조직 단위로 전환했으므로
--   - users 테이블의 개인 단위 컬럼들을 제거
-- =====================================================

-- 1. users 테이블에서 개인 단위 포인트/활동/티어 관련 컬럼 제거
ALTER TABLE users
DROP COLUMN IF EXISTS accumulated_points CASCADE,
DROP COLUMN IF EXISTS last_login_date CASCADE,
DROP COLUMN IF EXISTS last_order_date CASCADE,
DROP COLUMN IF EXISTS last_comment_date CASCADE,
DROP COLUMN IF EXISTS tier CASCADE;

-- 2. 이제 조직 단위로 관리되므로 주석 추가
COMMENT ON TABLE users IS '사용자 정보 (캐시/크레딧/기여점수는 organizations 테이블에서 관리)';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 사용자 개인 단위 컬럼 정리 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '제거된 컬럼:';
  RAISE NOTICE '- users.accumulated_points';
  RAISE NOTICE '- users.last_login_date';
  RAISE NOTICE '- users.last_order_date';
  RAISE NOTICE '- users.last_comment_date';
  RAISE NOTICE '- users.tier';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '조직 단위로 관리:';
  RAISE NOTICE '- organizations.accumulated_points (기여점수)';
  RAISE NOTICE '- organizations.last_login_date';
  RAISE NOTICE '- organizations.last_order_date';
  RAISE NOTICE '- organizations.last_comment_date';
  RAISE NOTICE '- organizations.tier (티어)';
  RAISE NOTICE '- organization_cash (캐시)';
  RAISE NOTICE '- organization_credits (크레딧)';
  RAISE NOTICE '=================================================';
END $$;
