-- Add option_code column to integrated_orders table
-- This column stores the option code from platform orders (alternative to option_name)

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS option_code TEXT;

COMMENT ON COLUMN integrated_orders.option_code IS '옵션코드 - 플랫폼 주문의 옵션 코드 (옵션명의 대안)';
