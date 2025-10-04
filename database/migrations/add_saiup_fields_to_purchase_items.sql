-- purchase_items 테이블에 사입관리 필드 추가
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- ============================================
-- 1. 필드 추가
-- ============================================

-- 출하 정보
ALTER TABLE purchase_items
ADD COLUMN IF NOT EXISTS shipper_name VARCHAR(200),  -- 출하자
ADD COLUMN IF NOT EXISTS classification VARCHAR(100);  -- 구분

-- 수수료 및 합계
ALTER TABLE purchase_items
ADD COLUMN IF NOT EXISTS commission DECIMAL(12,2) DEFAULT 0,  -- 수수료
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2) DEFAULT 0;  -- 합계 (금액 + 수수료)

-- 추가 정보
ALTER TABLE purchase_items
ADD COLUMN IF NOT EXISTS task VARCHAR(200),  -- 작업
ADD COLUMN IF NOT EXISTS taste VARCHAR(200);  -- 맛

-- ============================================
-- 2. 기존 트리거 수정 - 합계 계산 추가
-- ============================================

CREATE OR REPLACE FUNCTION record_material_price_from_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- 합계 자동 계산 (금액 + 수수료)
  NEW.total_amount = NEW.amount + COALESCE(NEW.commission, 0);

  -- 원물인 경우에만 시세 이력 기록
  IF NEW.item_type = 'raw_material' AND NEW.material_id IS NOT NULL THEN
    INSERT INTO material_price_history (
      material_id,
      supplier_id,
      price,
      unit_quantity,
      effective_date,
      price_type,
      notes,
      created_by
    )
    SELECT
      NEW.material_id,
      p.supplier_id,
      NEW.unit_price,
      NEW.quantity,
      p.purchase_date,
      'PURCHASE',
      '구매 주문번호: ' || p.purchase_number,
      p.created_by
    FROM purchases p
    WHERE p.id = NEW.purchase_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 재생성 (이미 있으면 대체됨)
DROP TRIGGER IF EXISTS trigger_record_material_price ON purchase_items;
CREATE TRIGGER trigger_record_material_price
BEFORE INSERT OR UPDATE ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION record_material_price_from_purchase();

-- ============================================
-- 3. 완료 확인
-- ============================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'purchase_items'
  AND column_name IN ('shipper_name', 'classification', 'commission', 'total_amount', 'task', 'taste')
ORDER BY column_name;
