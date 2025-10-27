-- users 테이블에 판매자 정보 컬럼 추가

-- 기본 정보 (회원가입 시 입력되는 정보는 이미 존재: name, email, phone)

-- 사업자 정보 컬럼
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT;  -- 사업자명
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_address TEXT;  -- 주소
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_number TEXT;  -- 사업자등록번호
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_email TEXT;  -- 이메일 (계산서발행용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS representative_name TEXT;  -- 대표자명
ALTER TABLE users ADD COLUMN IF NOT EXISTS representative_phone TEXT;  -- 대표전화번호

-- 담당자 정보 컬럼
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_name TEXT;  -- 담당자명
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_phone TEXT;  -- 담당자전화번호

-- 정산 계좌 정보 컬럼
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account TEXT;  -- 정산계좌번호
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT;  -- 은행명
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_holder TEXT;  -- 예금주

-- 송장출력 정보
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_name TEXT;  -- 업체명
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_phone TEXT;  -- 전화번호

-- 다크모드 설정 (사용자별)
ALTER TABLE users ADD COLUMN IF NOT EXISTS orders_theme TEXT DEFAULT 'light';  -- 발주관리 페이지 테마 설정

-- 컬럼 코멘트 추가
COMMENT ON COLUMN users.business_name IS '사업자명';
COMMENT ON COLUMN users.business_address IS '주소';
COMMENT ON COLUMN users.business_number IS '사업자등록번호';
COMMENT ON COLUMN users.business_email IS '이메일 (계산서발행용)';
COMMENT ON COLUMN users.representative_name IS '대표자명';
COMMENT ON COLUMN users.representative_phone IS '대표전화번호';
COMMENT ON COLUMN users.manager_name IS '담당자명';
COMMENT ON COLUMN users.manager_phone IS '담당자전화번호';
COMMENT ON COLUMN users.bank_account IS '정산계좌번호';
COMMENT ON COLUMN users.bank_name IS '은행명';
COMMENT ON COLUMN users.account_holder IS '예금주';
COMMENT ON COLUMN users.store_name IS '송장출력 업체명';
COMMENT ON COLUMN users.store_phone IS '송장출력 전화번호';
COMMENT ON COLUMN users.orders_theme IS '발주관리 페이지 테마 설정 (light/dark)';
