-- integrated_orders 테이블 성능 최적화를 위한 인덱스 추가
-- platform/orders 페이지 로딩 속도 개선

-- 1. seller_id + created_at 복합 인덱스 (가장 중요)
-- 용도: seller별 주문 조회 시 created_at 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_integrated_orders_seller_created
ON public.integrated_orders(seller_id, created_at DESC)
WHERE is_deleted = false;

-- 2. seller_id + shipping_status 복합 인덱스
-- 용도: 상태별 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_integrated_orders_seller_status
ON public.integrated_orders(seller_id, shipping_status)
WHERE is_deleted = false;

-- 3. option_name 인덱스
-- 용도: 검색 기능 최적화
CREATE INDEX IF NOT EXISTS idx_integrated_orders_option_name
ON public.integrated_orders(option_name)
WHERE is_deleted = false;

-- 4. order_number 인덱스
-- 용도: 주문번호 검색 최적화
CREATE INDEX IF NOT EXISTS idx_integrated_orders_order_number
ON public.integrated_orders(order_number)
WHERE is_deleted = false;

-- 인덱스 설명
COMMENT ON INDEX idx_integrated_orders_seller_created IS 'seller별 주문 조회 및 날짜 정렬 최적화';
COMMENT ON INDEX idx_integrated_orders_seller_status IS 'seller별 상태 필터링 최적화';
COMMENT ON INDEX idx_integrated_orders_option_name IS '옵션명 검색 최적화';
COMMENT ON INDEX idx_integrated_orders_order_number IS '주문번호 검색 최적화';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders 인덱스 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 인덱스:';
  RAISE NOTICE '  1. idx_integrated_orders_seller_created';
  RAISE NOTICE '  2. idx_integrated_orders_seller_status';
  RAISE NOTICE '  3. idx_integrated_orders_option_name';
  RAISE NOTICE '  4. idx_integrated_orders_order_number';
  RAISE NOTICE '=================================================';
END $$;
