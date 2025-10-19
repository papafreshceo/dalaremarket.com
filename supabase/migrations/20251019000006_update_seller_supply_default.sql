-- Update all existing category_settings to have seller_supply = true by default
UPDATE category_settings
SET seller_supply = true
WHERE seller_supply IS NULL;

-- Ensure the column has a default value for future inserts
ALTER TABLE category_settings
ALTER COLUMN seller_supply SET DEFAULT true;
