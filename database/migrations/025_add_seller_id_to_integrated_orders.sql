-- =====================================================
-- integrated_orders 뷰 생성 (직판/셀러 구분)
-- =====================================================
-- 작성일: 2025-10-11
-- 설명: 직판 주문과 셀러 주문을 구분하는 뷰 생성
--       seller_id IS NULL: 직판 주문
--       seller_id IS NOT NULL: B2B 셀러 주문
-- =====================================================
-- NOTE: seller_id 컬럼은 028 마이그레이션에서 seller_name을 변경하여 생성됨
-- =====================================================

-- 뷰 생성: 직판 주문만 조회
-- =====================================================
CREATE OR REPLACE VIEW direct_sales_orders AS
SELECT * FROM integrated_orders
WHERE seller_id IS NULL;

COMMENT ON VIEW direct_sales_orders IS '직판 주문만 조회하는 뷰';

-- =====================================================
-- 뷰 생성: 셀러 주문만 조회
-- =====================================================
CREATE OR REPLACE VIEW seller_orders AS
SELECT * FROM integrated_orders
WHERE seller_id IS NOT NULL;

COMMENT ON VIEW seller_orders IS 'B2B 셀러 주문만 조회하는 뷰';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders 뷰 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '뷰 생성: direct_sales_orders (seller_id IS NULL)';
  RAISE NOTICE '뷰 생성: seller_orders (seller_id IS NOT NULL)';
  RAISE NOTICE '=================================================';
END $$;
