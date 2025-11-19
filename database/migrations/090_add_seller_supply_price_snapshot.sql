-- 090: seller_supply_price_snapshot 칼럼 추가
-- 발주확정 시점의 공급단가를 스냅샷으로 저장

ALTER TABLE integrated_orders
  ADD COLUMN IF NOT EXISTS seller_supply_price_snapshot NUMERIC(10, 2);

COMMENT ON COLUMN integrated_orders.seller_supply_price_snapshot
  IS '발주확정 시점의 공급단가 스냅샷 (입금완료 및 발주확정 버튼 실행 시 seller_supply_price 값 저장)';
