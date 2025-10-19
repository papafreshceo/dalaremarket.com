-- Add raw_material_status and seller_supply columns to category_settings
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS raw_material_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS seller_supply BOOLEAN DEFAULT true;

COMMENT ON COLUMN category_settings.raw_material_status IS '품목의 원물 공급 상태 (supply_status_settings.code 참조)';
COMMENT ON COLUMN category_settings.seller_supply IS '셀러 공급 여부 (true: 공급, false: 미공급)';

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_category_settings_raw_material_status
ON category_settings(raw_material_status)
WHERE raw_material_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_category_settings_seller_supply
ON category_settings(seller_supply)
WHERE seller_supply = true;

-- Create index for category_4 lookups
CREATE INDEX IF NOT EXISTS idx_category_settings_category_4
ON category_settings(category_4)
WHERE category_4 IS NOT NULL AND is_active = true;
