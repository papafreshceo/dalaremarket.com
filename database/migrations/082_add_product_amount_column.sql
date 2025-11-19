-- 082_add_product_amount_column.sql
-- 원공급가(공급단가 × 수량) 칼럼 추가

-- integrated_orders 테이블에 product_amount 칼럼 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS product_amount DECIMAL(12, 2);

-- 기존 데이터 마이그레이션: settlement_amount 값을 product_amount로 복사
UPDATE integrated_orders
SET product_amount = settlement_amount
WHERE product_amount IS NULL;

-- 칼럼 설명 추가
COMMENT ON COLUMN integrated_orders.product_amount IS '원공급가 (공급단가 × 수량, 할인 전)';
COMMENT ON COLUMN integrated_orders.settlement_amount IS '정산금액 (할인 적용 후 최종 금액)';
