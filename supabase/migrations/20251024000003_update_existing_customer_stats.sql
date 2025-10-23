-- 기존 고객 데이터의 통계를 수동으로 업데이트하는 스크립트
--
-- 이 스크립트는:
-- 1. 기존 integrated_orders의 buyer_name, buyer_phone과 customers의 name, phone을 매칭
-- 2. 매칭되는 주문에 customer_id를 업데이트
-- 3. 각 고객의 통계를 재계산

-- Step 1: buyer_name과 buyer_phone으로 customer_id 연결
UPDATE integrated_orders io
SET customer_id = c.id
FROM customers c
WHERE io.buyer_name = c.name
  AND io.buyer_phone = c.phone
  AND io.customer_id IS NULL
  AND io.is_deleted = FALSE;

-- Step 2: 모든 고객의 통계 재계산
UPDATE customers c
SET
  total_orders = (
    SELECT COUNT(*)
    FROM integrated_orders io
    WHERE io.customer_id = c.id
      AND io.is_deleted = FALSE
  ),
  total_amount = (
    SELECT COALESCE(SUM(
      CASE
        WHEN io.settlement_amount IS NOT NULL AND io.settlement_amount != ''
        THEN CAST(io.settlement_amount AS NUMERIC)
        ELSE 0
      END
    ), 0)
    FROM integrated_orders io
    WHERE io.customer_id = c.id
      AND io.is_deleted = FALSE
  ),
  last_order_date = (
    SELECT MAX(io.created_at)
    FROM integrated_orders io
    WHERE io.customer_id = c.id
      AND io.is_deleted = FALSE
  );

-- 결과 확인용 쿼리 (주석 해제하여 사용)
-- SELECT
--   name,
--   phone,
--   customer_type,
--   total_orders,
--   total_amount,
--   last_order_date
-- FROM customers
-- WHERE total_orders > 0
-- ORDER BY total_orders DESC;
