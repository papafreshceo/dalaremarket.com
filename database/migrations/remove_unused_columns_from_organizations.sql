-- =====================================================
-- organizations 테이블에서 사용하지 않는 컬럼 삭제
-- =====================================================
-- 작성일: 2025-01-13
-- 설명:
--   - name: business_name으로 대체됨
--   - address: business_address로 대체됨
--   - phone: representative_phone, manager_phone으로 대체됨
--   - fax: 사용하지 않음
--   - email: business_email로 대체됨
--   - bank_name, account_number, account_holder: bank_account, depositor_name으로 대체됨
--   - tax_invoice_email: business_email로 대체됨
--   - commission_rate: 필요 없음
--   - settlement_cycle: 필요 없음
--   - max_members: 필요 없음
--   - representative_name은 유지 (대표자명)
-- =====================================================

-- 1. 중복/미사용 컬럼 삭제
ALTER TABLE organizations DROP COLUMN IF EXISTS name CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS address CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS phone CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS fax CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS email CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS bank_name CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS account_number CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS account_holder CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS tax_invoice_email CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS commission_rate CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS settlement_cycle CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS max_members CASCADE;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organizations 테이블에서 중복/미사용 컬럼 삭제 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '삭제된 컬럼 (12개):';
  RAISE NOTICE '- name → business_name으로 대체';
  RAISE NOTICE '- address → business_address로 대체';
  RAISE NOTICE '- phone → representative_phone/manager_phone으로 대체';
  RAISE NOTICE '- fax → 미사용';
  RAISE NOTICE '- email → business_email로 대체';
  RAISE NOTICE '- bank_name → bank_account로 통합';
  RAISE NOTICE '- account_number → bank_account로 통합';
  RAISE NOTICE '- account_holder → depositor_name으로 대체';
  RAISE NOTICE '- tax_invoice_email → business_email로 대체';
  RAISE NOTICE '- commission_rate → 필요 없음';
  RAISE NOTICE '- settlement_cycle → 필요 없음';
  RAISE NOTICE '- max_members → 필요 없음';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '유지된 컬럼:';
  RAISE NOTICE '- representative_name (대표자명)';
  RAISE NOTICE '- bank_account (계좌번호)';
  RAISE NOTICE '- depositor_name (예금주명)';
  RAISE NOTICE '=================================================';
END $$;
