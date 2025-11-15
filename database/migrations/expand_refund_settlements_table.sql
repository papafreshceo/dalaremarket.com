-- =====================================================
-- refund_settlements 테이블 확장 - 주문 상세 및 CS 정보 추가
-- =====================================================
-- 작성일: 2025-01-15
-- 설명: 환불 정산 데이터에 주문자, 수령인, 셀러공급가, CS 정보 추가
-- =====================================================

-- =====================================================
-- 1. 주문자 정보 필드 추가
-- =====================================================

-- 주문자명
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'orderer_name'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN orderer_name text;
    RAISE NOTICE '✅ refund_settlements.orderer_name 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.orderer_name 칼럼이 이미 존재함';
  END IF;
END $$;

-- 주문자 전화번호
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'orderer_phone'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN orderer_phone text;
    RAISE NOTICE '✅ refund_settlements.orderer_phone 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.orderer_phone 칼럼이 이미 존재함';
  END IF;
END $$;

-- =====================================================
-- 2. 수령인 정보 필드 추가
-- =====================================================

-- 수령인명
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'recipient_name'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN recipient_name text;
    RAISE NOTICE '✅ refund_settlements.recipient_name 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.recipient_name 칼럼이 이미 존재함';
  END IF;
END $$;

-- 수령인 전화번호
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'recipient_phone'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN recipient_phone text;
    RAISE NOTICE '✅ refund_settlements.recipient_phone 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.recipient_phone 칼럼이 이미 존재함';
  END IF;
END $$;

-- 배송 주소
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'recipient_address'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN recipient_address text;
    RAISE NOTICE '✅ refund_settlements.recipient_address 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.recipient_address 칼럼이 이미 존재함';
  END IF;
END $$;

-- =====================================================
-- 3. 셀러 공급가 필드 추가
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'seller_supply_price'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN seller_supply_price numeric(12, 2);
    RAISE NOTICE '✅ refund_settlements.seller_supply_price 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.seller_supply_price 칼럼이 이미 존재함';
  END IF;
END $$;

-- =====================================================
-- 4. CS 정보 필드 추가
-- =====================================================

-- CS 구분 (파손, 썩음/상함, 맛 불만족, 분실, 기타)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'cs_type'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN cs_type text;
    RAISE NOTICE '✅ refund_settlements.cs_type 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.cs_type 칼럼이 이미 존재함';
  END IF;
END $$;

-- CS 내용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'cs_content'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN cs_content text;
    RAISE NOTICE '✅ refund_settlements.cs_content 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.cs_content 칼럼이 이미 존재함';
  END IF;
END $$;

-- 해결방법 (교환, 반품, 전체환불, 부분환불, 전체재발송, 부분재발송, 기타조치)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'resolution_method'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN resolution_method text;
    RAISE NOTICE '✅ refund_settlements.resolution_method 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.resolution_method 칼럼이 이미 존재함';
  END IF;
END $$;

-- 환불 비율 (%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'refund_ratio'
  ) THEN
    ALTER TABLE refund_settlements ADD COLUMN refund_ratio numeric(5, 2);
    RAISE NOTICE '✅ refund_settlements.refund_ratio 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.refund_ratio 칼럼이 이미 존재함';
  END IF;
END $$;

-- =====================================================
-- 5. 칼럼 코멘트 추가
-- =====================================================

COMMENT ON COLUMN refund_settlements.orderer_name IS '주문자명';
COMMENT ON COLUMN refund_settlements.orderer_phone IS '주문자 전화번호';
COMMENT ON COLUMN refund_settlements.recipient_name IS '수령인명';
COMMENT ON COLUMN refund_settlements.recipient_phone IS '수령인 전화번호';
COMMENT ON COLUMN refund_settlements.recipient_address IS '배송 주소';
COMMENT ON COLUMN refund_settlements.seller_supply_price IS '셀러 공급가';
COMMENT ON COLUMN refund_settlements.cs_type IS 'CS 구분 (파손, 썩음/상함, 맛 불만족, 분실, 기타)';
COMMENT ON COLUMN refund_settlements.cs_content IS 'CS 상세 내용';
COMMENT ON COLUMN refund_settlements.resolution_method IS '해결방법 (교환, 반품, 전체환불, 부분환불, 재발송, 기타조치)';
COMMENT ON COLUMN refund_settlements.refund_ratio IS '환불 비율 (%)';

-- =====================================================
-- 6. 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ refund_settlements 테이블 확장 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 칼럼:';
  RAISE NOTICE '  [주문자 정보]';
  RAISE NOTICE '    - orderer_name (주문자명)';
  RAISE NOTICE '    - orderer_phone (주문자 전화번호)';
  RAISE NOTICE '  [수령인 정보]';
  RAISE NOTICE '    - recipient_name (수령인명)';
  RAISE NOTICE '    - recipient_phone (수령인 전화번호)';
  RAISE NOTICE '    - recipient_address (배송 주소)';
  RAISE NOTICE '  [가격 정보]';
  RAISE NOTICE '    - seller_supply_price (셀러 공급가)';
  RAISE NOTICE '  [CS 정보]';
  RAISE NOTICE '    - cs_type (CS 구분)';
  RAISE NOTICE '    - cs_content (CS 내용)';
  RAISE NOTICE '    - resolution_method (해결방법)';
  RAISE NOTICE '    - refund_ratio (환불 비율)';
  RAISE NOTICE '';
  RAISE NOTICE '환불 정산 데이터에 주문 상세 및 CS 정보가 함께 저장됩니다.';
  RAISE NOTICE '  - 발주단계 환불: CS 정보는 NULL';
  RAISE NOTICE '  - 발송완료 후 환불: CS 정보 포함';
  RAISE NOTICE '=================================================';
END $$;
