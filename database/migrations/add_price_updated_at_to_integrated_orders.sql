-- Add price_updated_at column to integrated_orders table
-- This column tracks when the supply price was last updated

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMP WITH TIME ZONE;

-- Add comment to describe the column
COMMENT ON COLUMN integrated_orders.price_updated_at IS '공급가 갱신 일시 - 최신 공급단가로 갱신된 시각';
