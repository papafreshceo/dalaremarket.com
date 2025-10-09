-- =====================================================
-- integrated_orders 테이블에서 불필요한 플래그 제거
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: order_confirmed, invoice_registered 제거
--       shipping_status로 모든 상태 관리
-- =====================================================

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_integrated_orders_order_confirmed;
DROP INDEX IF EXISTS idx_integrated_orders_invoice_registered;

-- 컬럼 삭제
ALTER TABLE integrated_orders
DROP COLUMN IF EXISTS order_confirmed;

ALTER TABLE integrated_orders
DROP COLUMN IF EXISTS invoice_registered;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '불필요한 플래그 제거 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'order_confirmed 컬럼 삭제';
  RAISE NOTICE 'invoice_registered 컬럼 삭제';
  RAISE NOTICE 'shipping_status로 모든 상태 관리';
  RAISE NOTICE '=================================================';
END $$;
