-- =====================================================
-- refund_settlements 테이블에 캐시 환불액 칼럼 추가
-- =====================================================
-- 작성일: 2025-01-15
-- 설명: 환불 정산 시 캐시로 환불된 금액도 함께 기록
-- =====================================================

-- cash_refund_amount 칼럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_settlements' AND column_name = 'cash_refund_amount'
  ) THEN
    ALTER TABLE refund_settlements
    ADD COLUMN cash_refund_amount numeric(12, 2) DEFAULT 0;

    RAISE NOTICE '✅ refund_settlements.cash_refund_amount 칼럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  refund_settlements.cash_refund_amount 칼럼이 이미 존재함';
  END IF;
END $$;

-- 칼럼 코멘트 추가
COMMENT ON COLUMN refund_settlements.cash_refund_amount IS '캐시로 환불된 금액';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ refund_settlements 테이블 업데이트 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 칼럼:';
  RAISE NOTICE '  - cash_refund_amount: 캐시로 환불된 금액';
  RAISE NOTICE '';
  RAISE NOTICE '환불 정산 데이터에 다음 정보가 저장됩니다:';
  RAISE NOTICE '  - refund_amount: 총 환불 금액 (계좌 환불)';
  RAISE NOTICE '  - cash_refund_amount: 캐시 환불 금액';
  RAISE NOTICE '=================================================';
END $$;
