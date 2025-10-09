-- =====================================================
-- shipping_status 기본값 변경 및 기존 데이터 업데이트
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: '미발송' -> '결제완료'로 변경
-- =====================================================

-- 기존 '미발송' 상태를 '결제완료'로 변경
UPDATE integrated_orders
SET shipping_status = '결제완료'
WHERE shipping_status = '미발송' OR shipping_status IS NULL OR shipping_status = '';

-- 기본값 변경
ALTER TABLE integrated_orders
ALTER COLUMN shipping_status SET DEFAULT '결제완료';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'shipping_status 기본값 변경 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '기존 데이터: 미발송 -> 결제완료';
  RAISE NOTICE '기본값: 결제완료';
  RAISE NOTICE '상태 흐름: 결제완료 -> 상품준비중 -> 배송중 -> 배송완료';
  RAISE NOTICE '=================================================';
END $$;
