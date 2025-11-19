-- order_batches 테이블의 final_payment_amount 칼럼을 final_deposit_amount로 변경
-- integrated_orders 테이블과 칼럼명 통일

ALTER TABLE order_batches
RENAME COLUMN final_payment_amount TO final_deposit_amount;

-- 코멘트 업데이트
COMMENT ON COLUMN order_batches.final_deposit_amount IS '최종 입금 금액 (총금액 - 등급할인 - 캐시사용금액)';
