-- =====================================================
-- refund_settlements 테이블에 order_id UNIQUE 제약조건 추가
-- =====================================================
-- 작성일: 2025-01-18
-- 설명: 동일 주문에 대한 중복 환불 방지
-- =====================================================

-- 1. 기존 중복 데이터 확인 및 정리
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- 중복 order_id 확인
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT order_id, COUNT(*) as cnt
    FROM refund_settlements
    GROUP BY order_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE '⚠️  중복된 환불 데이터 발견: % 건', duplicate_count;
    RAISE NOTICE '각 order_id당 가장 최근 레코드만 유지합니다...';

    -- 각 order_id당 가장 최근 것만 남기고 나머지 삭제
    DELETE FROM refund_settlements
    WHERE id IN (
      SELECT id
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC, id DESC) as rn
        FROM refund_settlements
      ) ranked
      WHERE rn > 1
    );

    RAISE NOTICE '✅ 중복 데이터 정리 완료';
  ELSE
    RAISE NOTICE 'ℹ️  중복 데이터 없음';
  END IF;
END $$;

-- 2. UNIQUE 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'refund_settlements_order_id_key'
  ) THEN
    ALTER TABLE refund_settlements
    ADD CONSTRAINT refund_settlements_order_id_key UNIQUE (order_id);
    RAISE NOTICE '✅ refund_settlements.order_id에 UNIQUE 제약조건 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  UNIQUE 제약조건이 이미 존재함';
  END IF;
END $$;

-- 3. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 중복 환불 방지 제약조건 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '이제 동일 주문에 대해 중복 환불이 불가능합니다.';
  RAISE NOTICE 'DB 레벨에서 무결성이 보장됩니다.';
  RAISE NOTICE '=================================================';
END $$;
