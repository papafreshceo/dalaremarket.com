-- =====================================================
-- 성능 최적화를 위한 추가 인덱스
-- =====================================================
-- 작성일: 2025-10-13
-- 설명: 주문 조회 성능 개선을 위한 복합 인덱스 추가
-- =====================================================

-- 1. seller_id 인덱스 (플랫폼주문 페이지 최적화)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_seller_id
ON integrated_orders(seller_id)
WHERE seller_id IS NOT NULL;

-- 2. is_deleted 인덱스 (모든 조회에서 삭제되지 않은 주문만 필터링)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_is_deleted
ON integrated_orders(is_deleted)
WHERE is_deleted = false;

-- 3. 날짜 + 마켓 복합 인덱스 (서치탭 최적화)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_sheet_date_market
ON integrated_orders(sheet_date DESC, market_name);

CREATE INDEX IF NOT EXISTS idx_integrated_orders_payment_date_market
ON integrated_orders(payment_date DESC, market_name)
WHERE payment_date IS NOT NULL;

-- 4. 날짜 + 상태 복합 인덱스 (상태별 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_sheet_date_status
ON integrated_orders(sheet_date DESC, shipping_status);

-- 5. 벤더 + 날짜 복합 인덱스 (벤더별 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_vendor_date
ON integrated_orders(vendor_name, sheet_date DESC)
WHERE vendor_name IS NOT NULL;

-- 6. 검색용 텍스트 인덱스 (주문번호, 수취인, 옵션명 검색)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_order_number_lower
ON integrated_orders(LOWER(order_number));

CREATE INDEX IF NOT EXISTS idx_integrated_orders_recipient_name_lower
ON integrated_orders(LOWER(recipient_name));

CREATE INDEX IF NOT EXISTS idx_integrated_orders_option_name_lower
ON integrated_orders(LOWER(option_name));

-- 7. 복합 인덱스: 날짜 범위 + is_deleted (가장 자주 사용되는 조합)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_date_not_deleted
ON integrated_orders(sheet_date DESC, is_deleted)
WHERE is_deleted = false;

-- 8. payment_confirmed_at와 refund_processed_at 인덱스
CREATE INDEX IF NOT EXISTS idx_integrated_orders_payment_confirmed
ON integrated_orders(payment_confirmed_at)
WHERE payment_confirmed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_integrated_orders_refund_processed
ON integrated_orders(refund_processed_at)
WHERE refund_processed_at IS NOT NULL;

-- =====================================================
-- 인덱스 통계 및 설명
-- =====================================================

COMMENT ON INDEX idx_integrated_orders_seller_id IS '셀러 주문 조회 최적화 (플랫폼주문 페이지)';
COMMENT ON INDEX idx_integrated_orders_is_deleted IS '삭제되지 않은 주문 필터링 최적화';
COMMENT ON INDEX idx_integrated_orders_sheet_date_market IS '날짜+마켓별 조회 최적화 (서치탭)';
COMMENT ON INDEX idx_integrated_orders_payment_date_market IS '결제일+마켓별 조회 최적화';
COMMENT ON INDEX idx_integrated_orders_sheet_date_status IS '날짜+상태별 조회 최적화';
COMMENT ON INDEX idx_integrated_orders_vendor_date IS '벤더별 주문 조회 최적화';
COMMENT ON INDEX idx_integrated_orders_date_not_deleted IS '날짜 범위 조회 시 삭제 필터링 최적화 (가장 빈번한 쿼리)';

-- =====================================================
-- 통계 업데이트
-- =====================================================
-- 참고: VACUUM은 트랜잭션 블록 안에서 실행 불가하므로 주석 처리
-- 필요시 별도로 실행: VACUUM ANALYZE integrated_orders;

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '성능 최적화 인덱스 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 인덱스:';
  RAISE NOTICE '  1. seller_id (partial index)';
  RAISE NOTICE '  2. is_deleted (partial index)';
  RAISE NOTICE '  3. sheet_date + market_name (composite)';
  RAISE NOTICE '  4. payment_date + market_name (composite)';
  RAISE NOTICE '  5. sheet_date + shipping_status (composite)';
  RAISE NOTICE '  6. vendor_name + sheet_date (composite)';
  RAISE NOTICE '  7. LOWER() text search indexes';
  RAISE NOTICE '  8. payment_confirmed_at (partial index)';
  RAISE NOTICE '  9. refund_processed_at (partial index)';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '예상 성능 향상:';
  RAISE NOTICE '  - 서치탭: 2-5배 빠른 조회';
  RAISE NOTICE '  - 플랫폼주문: 10배 이상 빠른 조회';
  RAISE NOTICE '  - 검색: 3-4배 빠른 텍스트 검색';
  RAISE NOTICE '=================================================';
END $$;
