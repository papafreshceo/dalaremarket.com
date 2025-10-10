-- =====================================================
-- users 테이블에 정산 관련 필드 추가
-- =====================================================
-- 작성일: 2025-10-11
-- 설명: 셀러(회원) 정산 정보를 users 테이블에서 관리
--       별도 sellers 테이블 없이 users 테이블로 통합
-- =====================================================

-- users 테이블에 정산 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_number VARCHAR(20); -- 사업자번호

ALTER TABLE users
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.00; -- 수수료율 (%)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS settlement_cycle VARCHAR(20) DEFAULT '월1회'; -- 정산 주기

ALTER TABLE users
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50); -- 은행명

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50); -- 계좌번호

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_holder VARCHAR(100); -- 예금주

ALTER TABLE users
ADD COLUMN IF NOT EXISTS memo TEXT; -- 메모

-- 발주서 등록 시 필요한 사업자 정보 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_address TEXT; -- 회사 주소

ALTER TABLE users
ADD COLUMN IF NOT EXISTS representative_name VARCHAR(100); -- 대표자명

ALTER TABLE users
ADD COLUMN IF NOT EXISTS representative_phone VARCHAR(20); -- 대표 전화번호

ALTER TABLE users
ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100); -- 담당자명

ALTER TABLE users
ADD COLUMN IF NOT EXISTS manager_phone VARCHAR(20); -- 담당자 전화번호

ALTER TABLE users
ADD COLUMN IF NOT EXISTS tax_invoice_email VARCHAR(100); -- 전자계산서 수신 이메일

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_business_number ON users(business_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 코멘트 추가
COMMENT ON COLUMN users.business_number IS '사업자번호';
COMMENT ON COLUMN users.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN users.settlement_cycle IS '정산 주기 (주1회, 월1회, 월2회 등)';
COMMENT ON COLUMN users.bank_name IS '은행명';
COMMENT ON COLUMN users.account_number IS '계좌번호';
COMMENT ON COLUMN users.account_holder IS '예금주';
COMMENT ON COLUMN users.memo IS '관리자 메모';
COMMENT ON COLUMN users.role IS '역할 (seller, employee, admin, super_admin)';
COMMENT ON COLUMN users.company_address IS '회사 주소';
COMMENT ON COLUMN users.representative_name IS '대표자명';
COMMENT ON COLUMN users.representative_phone IS '대표 전화번호';
COMMENT ON COLUMN users.manager_name IS '담당자명';
COMMENT ON COLUMN users.manager_phone IS '담당자 전화번호';
COMMENT ON COLUMN users.tax_invoice_email IS '전자계산서 수신 이메일';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'users 테이블에 정산 관련 필드 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '셀러 정보는 별도 테이블 없이 users 테이블에서 관리';
  RAISE NOTICE 'role = seller: B2B 셀러';
  RAISE NOTICE '=================================================';
END $$;
