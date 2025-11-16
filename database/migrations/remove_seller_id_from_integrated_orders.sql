-- =====================================================
-- integrated_orders에서 seller_id 컬럼 완전 제거
-- =====================================================
-- 작성일: 2025-01-16
-- 설명:
--   시스템이 완전히 organization 기반으로 전환됨에 따라
--   seller_id 컬럼을 제거하고 organization_id만 사용
-- =====================================================

-- =====================================================
-- 1. seller_id 관련 뷰 삭제
-- =====================================================
DROP VIEW IF EXISTS seller_orders;
DROP VIEW IF EXISTS direct_sales_orders;

-- =====================================================
-- 2. seller_id 인덱스 삭제
-- =====================================================
DROP INDEX IF EXISTS idx_integrated_orders_seller_id;
DROP INDEX IF EXISTS idx_orders_seller_id;
DROP INDEX IF EXISTS idx_integrated_orders_seller_created;
DROP INDEX IF EXISTS idx_integrated_orders_seller_status;

-- =====================================================
-- 3. seller_id 외래키 제약조건 삭제
-- =====================================================
ALTER TABLE integrated_orders
DROP CONSTRAINT IF EXISTS fk_integrated_orders_seller;

-- =====================================================
-- 4. seller_id 컬럼 삭제
-- =====================================================
ALTER TABLE integrated_orders
DROP COLUMN IF EXISTS seller_id;

-- =====================================================
-- 5. seller_performance_daily 테이블에서 seller_id 제거
-- =====================================================
DROP INDEX IF EXISTS idx_seller_performance_daily_seller;
DROP INDEX IF EXISTS idx_seller_performance_daily_seller_date;

ALTER TABLE seller_performance_daily
DROP COLUMN IF EXISTS seller_id;

-- =====================================================
-- 6. seller_rankings 테이블에서 seller_id 제거
-- =====================================================
DROP INDEX IF EXISTS idx_seller_rankings_seller;
DROP INDEX IF EXISTS idx_seller_rankings_seller_period;

ALTER TABLE seller_rankings
DROP COLUMN IF EXISTS seller_id;

-- =====================================================
-- 7. 뷰 재생성 (organization_id 기준)
-- =====================================================
CREATE OR REPLACE VIEW organization_orders AS
SELECT * FROM integrated_orders
WHERE organization_id IS NOT NULL;

COMMENT ON VIEW organization_orders IS '조직 기반 주문 뷰';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'seller_id 컬럼 제거 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '제거된 항목:';
  RAISE NOTICE '  ✓ integrated_orders.seller_id 컬럼';
  RAISE NOTICE '  ✓ seller_performance_daily.seller_id 컬럼';
  RAISE NOTICE '  ✓ seller_rankings.seller_id 컬럼';
  RAISE NOTICE '  ✓ seller_id 인덱스 8개';
  RAISE NOTICE '  ✓ seller_id 외래키';
  RAISE NOTICE '  ✓ seller_orders 뷰';
  RAISE NOTICE '  ✓ direct_sales_orders 뷰';
  RAISE NOTICE '';
  RAISE NOTICE '새로 생성된 항목:';
  RAISE NOTICE '  ✓ organization_orders 뷰 (organization_id 기준)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 시스템이 완전히 조직 기반으로 전환되었습니다.';
  RAISE NOTICE '========================================';
END $$;
