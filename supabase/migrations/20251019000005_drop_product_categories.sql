-- Drop product_categories table (replaced by category_settings)
-- category_settings is now the single source of truth for all categories

-- Drop indexes first
DROP INDEX IF EXISTS idx_product_categories_raw_material_status;
DROP INDEX IF EXISTS idx_product_categories_seller_supply;

-- Drop the table
DROP TABLE IF EXISTS product_categories CASCADE;

-- Note: This migration removes product_categories as it has been replaced by category_settings
-- All category management is now done through category_settings table
