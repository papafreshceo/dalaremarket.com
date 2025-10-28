-- Migration: Add seller_market_name column to integrated_orders
-- Description: 플랫폼 셀러가 업로드한 마켓명을 저장하는 칼럼 추가

-- Add seller_market_name column
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS seller_market_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN integrated_orders.seller_market_name IS '플랫폼 셀러가 업로드한 마켓파일에서 감지된 마켓명 (예: 쿠팡, 11번가)';
