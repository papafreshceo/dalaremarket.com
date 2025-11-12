-- =====================================================
-- users 테이블에서 셀러계정 정보 컬럼 제거
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - 셀러계정 정보가 organizations 테이블로 이동됨
--   - users 테이블에서 셀러계정 관련 컬럼 제거
-- =====================================================
-- 주의: 이 마이그레이션은 다음 작업들이 완료된 후 실행해야 합니다:
--   1. add_seller_info_to_organizations.sql 실행
--   2. migrate_seller_info_to_organizations.sql 실행
--   3. 코드에서 organizations 테이블 사용하도록 수정 완료
-- =====================================================

-- users 테이블에서 셀러계정 관련 컬럼 제거
ALTER TABLE users
DROP COLUMN IF EXISTS business_name CASCADE,
DROP COLUMN IF EXISTS business_address CASCADE,
DROP COLUMN IF EXISTS business_number CASCADE,
DROP COLUMN IF EXISTS business_email CASCADE,
DROP COLUMN IF EXISTS representative_name CASCADE,
DROP COLUMN IF EXISTS representative_phone CASCADE,
DROP COLUMN IF EXISTS manager_name CASCADE,
DROP COLUMN IF EXISTS manager_phone CASCADE,
DROP COLUMN IF EXISTS bank_account CASCADE,
DROP COLUMN IF EXISTS bank_name CASCADE,
DROP COLUMN IF EXISTS account_holder CASCADE,
DROP COLUMN IF EXISTS depositor_name CASCADE,
DROP COLUMN IF EXISTS store_name CASCADE,
DROP COLUMN IF EXISTS store_phone CASCADE;

-- 테이블 주석 업데이트
COMMENT ON TABLE users IS '사용자 정보 (셀러계정 정보는 organizations 테이블에서 관리)';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ users 테이블에서 셀러계정 컬럼 제거 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '제거된 컬럼:';
  RAISE NOTICE '- business_name';
  RAISE NOTICE '- business_address';
  RAISE NOTICE '- business_number';
  RAISE NOTICE '- business_email';
  RAISE NOTICE '- representative_name';
  RAISE NOTICE '- representative_phone';
  RAISE NOTICE '- manager_name';
  RAISE NOTICE '- manager_phone';
  RAISE NOTICE '- bank_account';
  RAISE NOTICE '- bank_name';
  RAISE NOTICE '- account_holder';
  RAISE NOTICE '- depositor_name';
  RAISE NOTICE '- store_name';
  RAISE NOTICE '- store_phone';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '조직 단위로 관리:';
  RAISE NOTICE '- organizations 테이블에 모든 셀러계정 정보 저장';
  RAISE NOTICE '- users 테이블에는 개인 정보만 유지 (profile_name, name, phone)';
  RAISE NOTICE '=================================================';
END $$;
