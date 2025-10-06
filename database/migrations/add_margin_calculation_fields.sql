-- Add margin calculation fields to option_products table
-- Migration: add_margin_calculation_fields
-- Created: 2025-10-06

-- Add target_seller_margin_rate column
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS target_seller_margin_rate NUMERIC(5,2);

-- Add seller_margin_amount column
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS seller_margin_amount INTEGER;

-- Add target_margin_amount column
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS target_margin_amount INTEGER;

-- Add margin_calculation_type column
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS margin_calculation_type TEXT DEFAULT 'rate' CHECK (margin_calculation_type IN ('rate', 'amount'));

-- Add comments for documentation
COMMENT ON COLUMN option_products.target_seller_margin_rate IS '목표 셀러마진율 (%) - 셀러공급가 자동 계산 시 사용';
COMMENT ON COLUMN option_products.seller_margin_rate IS '실제 셀러마진율 (%) - 계산값: (셀러공급가 - 총원가) / 셀러공급가 * 100';
COMMENT ON COLUMN option_products.seller_margin_amount IS '실제 셀러마진액 (원) - 계산값: 셀러공급가 - 총원가';
COMMENT ON COLUMN option_products.target_margin_amount IS '목표마진액 (원) - 직판가 계산 시 사용';
COMMENT ON COLUMN option_products.margin_calculation_type IS '마진 계산 방식: rate(마진율) 또는 amount(마진액)';
COMMENT ON COLUMN option_products.target_margin_rate IS '목표 직판마진율 (%) - 직판가 계산 시 사용';
