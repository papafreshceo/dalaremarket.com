-- =====================================================
-- integrated_orders 테이블에 발송/벤더 관련 칼럼 추가
-- =====================================================
-- 작성일: 2025-10-28
-- 설명: 옵션명 기반 자동 매핑을 위한 발송정보 칼럼 추가
-- =====================================================

-- 발송/벤더 관련 칼럼 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS shipping_source TEXT,
ADD COLUMN IF NOT EXISTS invoice_issuer TEXT,
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_location_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_location_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_location_contact TEXT,
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2);

-- 코멘트 추가
COMMENT ON COLUMN integrated_orders.shipping_source IS '출고 담당 (예: 달래팜, 아모레)';
COMMENT ON COLUMN integrated_orders.invoice_issuer IS '송장 발행 주체';
COMMENT ON COLUMN integrated_orders.vendor_name IS '벤더사명';
COMMENT ON COLUMN integrated_orders.shipping_location_name IS '발송지명';
COMMENT ON COLUMN integrated_orders.shipping_location_address IS '발송지 주소';
COMMENT ON COLUMN integrated_orders.shipping_location_contact IS '발송지 연락처';
COMMENT ON COLUMN integrated_orders.shipping_cost IS '출고 비용';

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_shipping_source ON integrated_orders(shipping_source);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_vendor_name ON integrated_orders(vendor_name);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '발송/벤더 관련 칼럼 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 칼럼:';
  RAISE NOTICE '  - shipping_source (출고 담당)';
  RAISE NOTICE '  - invoice_issuer (송장 발행 주체)';
  RAISE NOTICE '  - vendor_name (벤더사명)';
  RAISE NOTICE '  - shipping_location_name (발송지명)';
  RAISE NOTICE '  - shipping_location_address (발송지 주소)';
  RAISE NOTICE '  - shipping_location_contact (발송지 연락처)';
  RAISE NOTICE '  - shipping_cost (출고 비용)';
  RAISE NOTICE '=================================================';
END $$;
