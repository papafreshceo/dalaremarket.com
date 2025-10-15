-- =====================================================
-- option_products 테이블에 한글 컬럼 추가
-- =====================================================
-- 작성일: 2025-10-15
-- 설명: 옵션 상품 정보 자동 매핑을 위한 한글 컬럼 추가
-- =====================================================

-- 한글 컬럼 추가 (기존 영문 컬럼은 유지)
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS "출고" VARCHAR(100);
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS "송장" VARCHAR(100);
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS "벤더사" VARCHAR(100);
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS "발송지명" VARCHAR(100);
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS "발송지주소" TEXT;
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS "발송지연락처" VARCHAR(50);
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS "출고비용" NUMERIC;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_option_products_벤더사 ON option_products("벤더사");

-- 코멘트 추가
COMMENT ON COLUMN option_products."출고" IS '출고 정보 (당일출고, 익일출고 등)';
COMMENT ON COLUMN option_products."송장" IS '송장 담당 택배사';
COMMENT ON COLUMN option_products."벤더사" IS '벤더사명';
COMMENT ON COLUMN option_products."발송지명" IS '발송지명';
COMMENT ON COLUMN option_products."발송지주소" IS '발송지 주소';
COMMENT ON COLUMN option_products."발송지연락처" IS '발송지 연락처';
COMMENT ON COLUMN option_products."출고비용" IS '출고비용';
