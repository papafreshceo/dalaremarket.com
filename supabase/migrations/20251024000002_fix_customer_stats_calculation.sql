-- 고객 통계 업데이트 함수 수정
-- settlement_amount (정산예정금액) 컬럼 사용
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_customer_id UUID;
BEGIN
  -- NEW 또는 OLD에서 customer_id 가져오기
  IF TG_OP = 'DELETE' THEN
    target_customer_id := OLD.customer_id;
  ELSE
    target_customer_id := NEW.customer_id;
  END IF;

  -- customer_id가 있을 때만 업데이트
  IF target_customer_id IS NOT NULL THEN
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
      )
    WHERE id = target_customer_id;
  END IF;

  -- UPDATE 트리거에서 customer_id가 변경된 경우, 이전 customer_id도 업데이트
  IF TG_OP = 'UPDATE' AND OLD.customer_id IS DISTINCT FROM NEW.customer_id AND OLD.customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      total_orders = (
        SELECT COUNT(*)
        FROM integrated_orders
        WHERE customer_id = OLD.customer_id
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
        WHERE customer_id = OLD.customer_id
          AND is_deleted = FALSE
      ),
      last_order_date = (
        SELECT MAX(created_at)
        FROM integrated_orders
        WHERE customer_id = OLD.customer_id
          AND is_deleted = FALSE
      )
    WHERE id = OLD.customer_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_update_customer_stats_on_insert ON integrated_orders;
DROP TRIGGER IF EXISTS trigger_update_customer_stats_on_update ON integrated_orders;
DROP TRIGGER IF EXISTS trigger_update_customer_stats_on_delete ON integrated_orders;

CREATE TRIGGER trigger_update_customer_stats_on_insert
  AFTER INSERT ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

CREATE TRIGGER trigger_update_customer_stats_on_update
  AFTER UPDATE ON integrated_orders
  FOR EACH ROW
  WHEN (OLD.customer_id IS DISTINCT FROM NEW.customer_id OR OLD.is_deleted IS DISTINCT FROM NEW.is_deleted OR OLD.settlement_amount IS DISTINCT FROM NEW.settlement_amount)
  EXECUTE FUNCTION update_customer_stats();

CREATE TRIGGER trigger_update_customer_stats_on_delete
  AFTER DELETE ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();
