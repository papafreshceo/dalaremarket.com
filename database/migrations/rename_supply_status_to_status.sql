-- Rename supply_status column to status in option_products table
ALTER TABLE option_products
RENAME COLUMN supply_status TO status;

-- Update the constraint name to match
ALTER TABLE option_products
DROP CONSTRAINT IF EXISTS product_options_supply_status_check;

ALTER TABLE option_products
ADD CONSTRAINT option_products_status_check
CHECK (status IN ('PREPARING', 'SUPPLYING', 'PAUSED', 'STOPPED', 'SEASON_END'));

-- Add comment to explain the column
COMMENT ON COLUMN option_products.status IS 'Product status: PREPARING (준비중), SUPPLYING (공급중), PAUSED (일시중지), STOPPED (중단), SEASON_END (시즌종료)';
