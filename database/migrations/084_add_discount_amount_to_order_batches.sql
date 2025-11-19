-- order_batches 테이블에 discount_amount 칼럼 추가
-- 배치별 등급할인 금액을 저장하여 최종입금액 계산을 명확히 함

ALTER TABLE order_batches
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC NOT NULL DEFAULT 0;

-- 코멘트 추가
COMMENT ON COLUMN order_batches.discount_amount IS '배치 내 등급할인 금액 합계';

-- 기존 코멘트 업데이트
COMMENT ON COLUMN order_batches.total_amount IS '캐시 및 할인 적용 전 총 금액 (원공급가 합계)';
COMMENT ON COLUMN order_batches.final_deposit_amount IS '최종 입금 금액 (총금액 - 등급할인 - 캐시사용금액)';
