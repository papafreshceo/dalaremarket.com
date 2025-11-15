-- =====================================================
-- integrated_orders 테이블에 CS 관련 필드 추가
-- =====================================================
-- 작성일: 2025-01-15
-- 설명: 플랫폼 주문에도 CS 접수 정보를 저장하기 위한 필드 추가
-- =====================================================

-- =====================================================
-- 1. CS 정보 필드 추가
-- =====================================================

-- CS 구분 (파손, 썩음/상함, 맛 불만족, 분실, 기타)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'cs_type'
  ) THEN
    ALTER TABLE integrated_orders ADD COLUMN cs_type text;
    RAISE NOTICE '✅ integrated_orders.cs_type 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  integrated_orders.cs_type 칼럼이 이미 존재함';
  END IF;
END $$;

-- CS 내용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'cs_content'
  ) THEN
    ALTER TABLE integrated_orders ADD COLUMN cs_content text;
    RAISE NOTICE '✅ integrated_orders.cs_content 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  integrated_orders.cs_content 칼럼이 이미 존재함';
  END IF;
END $$;

-- 해결방법 (교환, 반품, 전체환불, 부분환불, 전체재발송, 부분재발송, 기타조치)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'cs_resolution_method'
  ) THEN
    ALTER TABLE integrated_orders ADD COLUMN cs_resolution_method text;
    RAISE NOTICE '✅ integrated_orders.cs_resolution_method 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  integrated_orders.cs_resolution_method 칼럼이 이미 존재함';
  END IF;
END $$;

-- 환불 비율 (%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'refund_ratio'
  ) THEN
    ALTER TABLE integrated_orders ADD COLUMN refund_ratio numeric(5, 2);
    RAISE NOTICE '✅ integrated_orders.refund_ratio 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  integrated_orders.refund_ratio 칼럼이 이미 존재함';
  END IF;
END $$;

-- CS 기록 ID (cs_records 테이블 참조)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'cs_record_id'
  ) THEN
    ALTER TABLE integrated_orders ADD COLUMN cs_record_id bigint;

    -- cs_records 테이블 존재 여부 확인 후 외래키 추가
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'cs_records'
    ) THEN
      ALTER TABLE integrated_orders
      ADD CONSTRAINT fk_integrated_orders_cs_record
      FOREIGN KEY (cs_record_id) REFERENCES cs_records(id) ON DELETE SET NULL;
      RAISE NOTICE '✅ integrated_orders.cs_record_id 칼럼 및 외래키 추가 완료';
    ELSE
      RAISE NOTICE '✅ integrated_orders.cs_record_id 칼럼 추가 완료 (cs_records 테이블 없음)';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  integrated_orders.cs_record_id 칼럼이 이미 존재함';
  END IF;
END $$;

-- =====================================================
-- 2. 칼럼 코멘트 추가
-- =====================================================

COMMENT ON COLUMN integrated_orders.cs_type IS 'CS 구분 (파손, 썩음/상함, 맛 불만족, 분실, 기타)';
COMMENT ON COLUMN integrated_orders.cs_content IS 'CS 상세 내용';
COMMENT ON COLUMN integrated_orders.cs_resolution_method IS 'CS 해결방법 (교환, 반품, 전체환불, 부분환불, 재발송, 기타조치)';
COMMENT ON COLUMN integrated_orders.refund_ratio IS 'CS 환불 비율 (%)';
COMMENT ON COLUMN integrated_orders.cs_record_id IS '연결된 CS 기록 ID (cs_records 테이블 참조)';

-- =====================================================
-- 3. 인덱스 추가
-- =====================================================

-- CS 기록 ID 인덱스 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_cs_record_id
  ON integrated_orders(cs_record_id)
  WHERE cs_record_id IS NOT NULL;

-- CS 구분 인덱스 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_cs_type
  ON integrated_orders(cs_type)
  WHERE cs_type IS NOT NULL;

-- =====================================================
-- 4. 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ integrated_orders 테이블 CS 필드 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 칼럼:';
  RAISE NOTICE '  - cs_type (CS 구분)';
  RAISE NOTICE '  - cs_content (CS 내용)';
  RAISE NOTICE '  - cs_resolution_method (해결방법)';
  RAISE NOTICE '  - refund_ratio (환불 비율)';
  RAISE NOTICE '  - cs_record_id (CS 기록 ID)';
  RAISE NOTICE '';
  RAISE NOTICE '추가된 인덱스:';
  RAISE NOTICE '  - idx_integrated_orders_cs_record_id';
  RAISE NOTICE '  - idx_integrated_orders_cs_type';
  RAISE NOTICE '';
  RAISE NOTICE 'SearchTab에서 플랫폼 주문에 대한 CS 접수가 가능합니다.';
  RAISE NOTICE 'CS 정보는 환불 정산 시 refund_settlements에 함께 저장됩니다.';
  RAISE NOTICE '=================================================';
END $$;
