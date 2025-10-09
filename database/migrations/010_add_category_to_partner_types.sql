-- partner_types 테이블에 partner_category와 code_prefix 컬럼 추가

-- 1. partner_category 컬럼 추가
ALTER TABLE partner_types
ADD COLUMN IF NOT EXISTS partner_category TEXT;

-- 2. code_prefix 컬럼 추가 (거래처 코드 이니셜)
ALTER TABLE partner_types
ADD COLUMN IF NOT EXISTS code_prefix TEXT;

-- 3. 기본값 설정 (기존 데이터)
UPDATE partner_types
SET partner_category = '공급자'
WHERE partner_category IS NULL;

UPDATE partner_types
SET code_prefix = 'SUP'
WHERE code_prefix IS NULL;

-- 4. NOT NULL 제약조건 추가
ALTER TABLE partner_types
ALTER COLUMN partner_category SET NOT NULL;

ALTER TABLE partner_types
ALTER COLUMN code_prefix SET NOT NULL;

-- 5. 코멘트 추가
COMMENT ON COLUMN partner_types.partner_category IS '거래처 구분 (사용자 정의 가능)';
COMMENT ON COLUMN partner_types.code_prefix IS '거래처 코드 이니셜 (예: SUP, CUS, VEN)';
