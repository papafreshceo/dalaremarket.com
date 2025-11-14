-- =====================================================
-- users 테이블에서 사업자 관련 필드 삭제
-- =====================================================
-- 작성일: 2025-01-13
-- 설명:
--   - 사업자 정보는 이제 organizations 테이블에서 관리
--   - users 테이블의 중복된 사업자 필드 제거
-- =====================================================

-- 1. 사업자 관련 컬럼 삭제
ALTER TABLE users DROP COLUMN IF EXISTS company_name CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS company_id CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS company_address CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS commission_rate CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS settlement_cycle CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS account_number CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS tax_invoice_email CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS business_number CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS representative_phone CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS representative_name CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS bank_name CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS account_holder CASCADE;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ users 테이블에서 사업자 관련 필드 삭제 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '삭제된 컬럼:';
  RAISE NOTICE '- company_name';
  RAISE NOTICE '- company_id';
  RAISE NOTICE '- company_address';
  RAISE NOTICE '- commission_rate';
  RAISE NOTICE '- settlement_cycle';
  RAISE NOTICE '- account_number';
  RAISE NOTICE '- tax_invoice_email';
  RAISE NOTICE '- business_number';
  RAISE NOTICE '- representative_phone';
  RAISE NOTICE '- representative_name';
  RAISE NOTICE '- bank_name';
  RAISE NOTICE '- account_holder';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '사업자 정보는 organizations 테이블에서 관리됩니다.';
  RAISE NOTICE '=================================================';
END $$;
