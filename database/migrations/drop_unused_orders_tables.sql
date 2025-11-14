-- =====================================================
-- 사용하지 않는 orders 관련 테이블 삭제
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: orders와 order_items 테이블은 더 이상 사용하지 않음
--       integrated_orders 테이블을 사용하는 것으로 전환됨
-- =====================================================

-- order_items 테이블 삭제 (외래키 관계로 인해 먼저 삭제)
DROP TABLE IF EXISTS order_items CASCADE;

-- orders 테이블 삭제
DROP TABLE IF EXISTS orders CASCADE;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 사용하지 않는 테이블 삭제 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '삭제된 테이블:';
  RAISE NOTICE '1. order_items';
  RAISE NOTICE '2. orders';
  RAISE NOTICE '';
  RAISE NOTICE '참고: integrated_orders 테이블을 사용합니다';
  RAISE NOTICE '=================================================';
END $$;
