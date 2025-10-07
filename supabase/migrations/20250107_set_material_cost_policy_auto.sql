-- Set material_cost_policy to always be 'auto' for option_products
-- Update existing records
UPDATE option_products
SET material_cost_policy = 'auto'
WHERE material_cost_policy IS NULL OR material_cost_policy != 'auto';

-- Set default value
ALTER TABLE option_products
ALTER COLUMN material_cost_policy SET DEFAULT 'auto';

-- Add check constraint to ensure only 'auto' is allowed
ALTER TABLE option_products
DROP CONSTRAINT IF EXISTS option_products_material_cost_policy_check;

ALTER TABLE option_products
ADD CONSTRAINT option_products_material_cost_policy_check
CHECK (material_cost_policy = 'auto');
