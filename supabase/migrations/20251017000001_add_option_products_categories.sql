-- Add category columns to option_products table
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS category_1 TEXT,
ADD COLUMN IF NOT EXISTS category_2 TEXT,
ADD COLUMN IF NOT EXISTS category_3 TEXT,
ADD COLUMN IF NOT EXISTS category_4 TEXT,
ADD COLUMN IF NOT EXISTS category_5 TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_option_products_category_4 ON option_products(category_4);
CREATE INDEX IF NOT EXISTS idx_option_products_category_5 ON option_products(category_5);

-- Add comment
COMMENT ON COLUMN option_products.category_1 IS '대분류';
COMMENT ON COLUMN option_products.category_2 IS '중분류';
COMMENT ON COLUMN option_products.category_3 IS '소분류';
COMMENT ON COLUMN option_products.category_4 IS '품목';
COMMENT ON COLUMN option_products.category_5 IS '품종';
