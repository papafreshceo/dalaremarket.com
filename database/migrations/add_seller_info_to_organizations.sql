-- =====================================================
-- 셀러계정 정보를 조직(Organization) 테이블로 이동
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - users 테이블의 셀러계정 관련 컬럼을 organizations 테이블로 이동
--   - 조직 단위로 셀러계정 정보 관리
-- =====================================================

-- 1. organizations 테이블에 셀러계정 관련 컬럼 추가
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_number TEXT,
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS representative_name TEXT,
ADD COLUMN IF NOT EXISTS representative_phone TEXT,
ADD COLUMN IF NOT EXISTS manager_name TEXT,
ADD COLUMN IF NOT EXISTS manager_phone TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS depositor_name TEXT,
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS store_phone TEXT;

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_organizations_business_number ON organizations(business_number);
CREATE INDEX IF NOT EXISTS idx_organizations_business_name ON organizations(business_name);

-- 3. 컬럼 주석 추가
COMMENT ON COLUMN organizations.business_name IS '사업자명 (셀러계정명)';
COMMENT ON COLUMN organizations.business_address IS '사업장 주소';
COMMENT ON COLUMN organizations.business_number IS '사업자등록번호';
COMMENT ON COLUMN organizations.business_email IS '사업자 이메일';
COMMENT ON COLUMN organizations.representative_name IS '대표자명';
COMMENT ON COLUMN organizations.representative_phone IS '대표자 연락처';
COMMENT ON COLUMN organizations.manager_name IS '담당자명';
COMMENT ON COLUMN organizations.manager_phone IS '담당자 연락처';
COMMENT ON COLUMN organizations.bank_account IS '계좌번호';
COMMENT ON COLUMN organizations.bank_name IS '은행명';
COMMENT ON COLUMN organizations.account_holder IS '예금주';
COMMENT ON COLUMN organizations.depositor_name IS '입금자명';
COMMENT ON COLUMN organizations.store_name IS '상호명';
COMMENT ON COLUMN organizations.store_phone IS '매장 전화번호';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 조직 테이블에 셀러계정 컬럼 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 컬럼:';
  RAISE NOTICE '- business_name (사업자명)';
  RAISE NOTICE '- business_address (사업장 주소)';
  RAISE NOTICE '- business_number (사업자등록번호)';
  RAISE NOTICE '- business_email (사업자 이메일)';
  RAISE NOTICE '- representative_name (대표자명)';
  RAISE NOTICE '- representative_phone (대표자 연락처)';
  RAISE NOTICE '- manager_name (담당자명)';
  RAISE NOTICE '- manager_phone (담당자 연락처)';
  RAISE NOTICE '- bank_account (계좌번호)';
  RAISE NOTICE '- bank_name (은행명)';
  RAISE NOTICE '- account_holder (예금주)';
  RAISE NOTICE '- depositor_name (입금자명)';
  RAISE NOTICE '- store_name (상호명)';
  RAISE NOTICE '- store_phone (매장 전화번호)';
  RAISE NOTICE '=================================================';
END $$;
