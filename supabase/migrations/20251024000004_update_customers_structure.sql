-- 이메일 컬럼 삭제 및 주문상품 컬럼 추가

-- 1. 이메일 컬럼 삭제
ALTER TABLE customers
DROP COLUMN IF EXISTS email;

-- 2. 주문상품 컬럼 추가 (콤마로 구분된 상품명 목록)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS ordered_products TEXT DEFAULT '';

-- 3. 고객 통계 및 주문상품 업데이트 함수 수정
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_customer_id UUID;
  existing_products TEXT;
  new_product TEXT;
  products_array TEXT[];
BEGIN
  -- customer_id 결정 (INSERT, UPDATE, DELETE에 따라)
  IF TG_OP = 'DELETE' THEN
    target_customer_id := OLD.customer_id;
  ELSE
    target_customer_id := NEW.customer_id;
  END IF;

  -- customer_id가 없으면 종료
  IF target_customer_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- 통계 업데이트
  UPDATE customers
  SET
    total_orders = (
      SELECT COUNT(*)
      FROM integrated_orders
      WHERE customer_id = target_customer_id
        AND is_deleted = FALSE
    ),
    total_amount = (
      SELECT COALESCE(SUM(
        CASE
          WHEN settlement_amount IS NOT NULL AND settlement_amount != ''
          THEN CAST(settlement_amount AS NUMERIC)
          ELSE 0
        END
      ), 0)
      FROM integrated_orders
      WHERE customer_id = target_customer_id
        AND is_deleted = FALSE
    ),
    last_order_date = (
      SELECT MAX(created_at)
      FROM integrated_orders
      WHERE customer_id = target_customer_id
        AND is_deleted = FALSE
    ),
    -- 주문상품 목록 업데이트 (중복 제거)
    ordered_products = (
      SELECT STRING_AGG(DISTINCT option_name, ', ' ORDER BY option_name)
      FROM integrated_orders
      WHERE customer_id = target_customer_id
        AND is_deleted = FALSE
        AND option_name IS NOT NULL
        AND option_name != ''
    )
  WHERE id = target_customer_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 기존 고객 데이터에 주문상품 정보 업데이트
UPDATE customers c
SET ordered_products = (
  SELECT STRING_AGG(DISTINCT io.option_name, ', ' ORDER BY io.option_name)
  FROM integrated_orders io
  WHERE io.customer_id = c.id
    AND io.is_deleted = FALSE
    AND io.option_name IS NOT NULL
    AND io.option_name != ''
)
WHERE EXISTS (
  SELECT 1 FROM integrated_orders io
  WHERE io.customer_id = c.id
    AND io.is_deleted = FALSE
);
