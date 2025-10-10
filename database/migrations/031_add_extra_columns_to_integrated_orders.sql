-- Add extra_columns JSONB field to integrated_orders table
-- This allows users to dynamically add custom columns without DB schema changes

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS extra_columns JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN integrated_orders.extra_columns IS '사용자 정의 추가 칼럼 (JSON 형식)';

-- Create index for better JSON query performance
CREATE INDEX IF NOT EXISTS idx_integrated_orders_extra_columns
ON integrated_orders USING GIN (extra_columns);
