-- =====================================================
-- integrated_orders 테이블에서 기존 컬럼 제거 (field_X만 유지)
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: 기존 표준명 컬럼 삭제, field_1~field_43만 사용
-- =====================================================

-- 기존 중복 컬럼 삭제
ALTER TABLE integrated_orders
  DROP COLUMN IF EXISTS market_name,
  DROP COLUMN IF EXISTS order_number,
  DROP COLUMN IF EXISTS payment_date,
  DROP COLUMN IF EXISTS recipient_name,
  DROP COLUMN IF EXISTS recipient_phone,
  DROP COLUMN IF EXISTS recipient_address,
  DROP COLUMN IF EXISTS recipient_zipcode,
  DROP COLUMN IF EXISTS delivery_message,
  DROP COLUMN IF EXISTS option_name,
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS seller_supply_price,
  DROP COLUMN IF EXISTS shipping_source,
  DROP COLUMN IF EXISTS invoice_issuer,
  DROP COLUMN IF EXISTS vendor_name,
  DROP COLUMN IF EXISTS shipping_location_name,
  DROP COLUMN IF EXISTS shipping_location_address,
  DROP COLUMN IF EXISTS shipping_location_phone,
  DROP COLUMN IF EXISTS shipping_cost,
  DROP COLUMN IF EXISTS shipping_status,
  DROP COLUMN IF EXISTS tracking_number,
  DROP COLUMN IF EXISTS courier_company,
  DROP COLUMN IF EXISTS shipped_date,
  DROP COLUMN IF EXISTS cs_status,
  DROP COLUMN IF EXISTS cs_type,
  DROP COLUMN IF EXISTS cs_memo,
  DROP COLUMN IF EXISTS memo;

-- UNIQUE 제약조건도 삭제 (market_name, order_number, option_name 사용)
ALTER TABLE integrated_orders
  DROP CONSTRAINT IF EXISTS integrated_orders_unique_order;

-- 새로운 UNIQUE 제약조건 추가 (field_1, field_4, field_11 사용)
ALTER TABLE integrated_orders
  ADD CONSTRAINT integrated_orders_unique_order UNIQUE (field_1, field_4, field_11);

-- 기존 인덱스 삭제
DROP INDEX IF EXISTS idx_integrated_orders_payment_date;
DROP INDEX IF EXISTS idx_integrated_orders_market;
DROP INDEX IF EXISTS idx_integrated_orders_status;
DROP INDEX IF EXISTS idx_integrated_orders_vendor;
DROP INDEX IF EXISTS idx_integrated_orders_tracking;
DROP INDEX IF EXISTS idx_integrated_orders_order_number;
DROP INDEX IF EXISTS idx_integrated_orders_recipient;

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders 테이블 구조 변경 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '기존 표준명 컬럼 삭제 완료';
  RAISE NOTICE 'field_1~field_43 구조로 통일됨';
  RAISE NOTICE 'UNIQUE 제약: (field_1, field_4, field_11)';
  RAISE NOTICE '=================================================';
END $$;
