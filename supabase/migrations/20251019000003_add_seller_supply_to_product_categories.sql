-- Add seller_supply column to product_categories
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS seller_supply BOOLEAN DEFAULT true;

COMMENT ON COLUMN product_categories.seller_supply IS '셀러 공급 여부 (true: 공급, false: 미공급)';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_product_categories_seller_supply
ON product_categories(seller_supply)
WHERE seller_supply = true;
