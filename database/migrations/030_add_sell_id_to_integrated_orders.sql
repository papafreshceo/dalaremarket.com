-- Add sell_id column to integrated_orders table
-- This column stores the platform's seller account ID (e.g., Coupang seller ID, Naver seller ID)
-- Different from seller_id which stores the user's UUID

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS sell_id TEXT;

COMMENT ON COLUMN integrated_orders.sell_id IS '판매아이디 - 플랫폼의 판매계정 ID (쿠팡 판매자 ID, 네이버 스마트스토어 ID 등)';
