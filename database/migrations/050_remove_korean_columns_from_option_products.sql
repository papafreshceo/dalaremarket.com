-- =====================================================
-- option_products 테이블에서 한글 컬럼 제거 (롤백)
-- =====================================================
-- 작성일: 2025-10-15
-- 설명: 049 마이그레이션 롤백 - 한글 컬럼 제거
-- =====================================================

-- 한글 컬럼 제거
ALTER TABLE option_products DROP COLUMN IF EXISTS "출고";
ALTER TABLE option_products DROP COLUMN IF EXISTS "송장";
ALTER TABLE option_products DROP COLUMN IF EXISTS "벤더사";
ALTER TABLE option_products DROP COLUMN IF EXISTS "발송지명";
ALTER TABLE option_products DROP COLUMN IF EXISTS "발송지주소";
ALTER TABLE option_products DROP COLUMN IF EXISTS "발송지연락처";
ALTER TABLE option_products DROP COLUMN IF EXISTS "출고비용";

-- 인덱스 제거
DROP INDEX IF EXISTS idx_option_products_벤더사;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '한글 컬럼 제거 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '제거된 컬럼: 출고, 송장, 벤더사, 발송지명, 발송지주소, 발송지연락처, 출고비용';
  RAISE NOTICE '기존 영문 컬럼 유지: shipping_entity, invoice_entity, 등';
  RAISE NOTICE '=================================================';
END $$;
