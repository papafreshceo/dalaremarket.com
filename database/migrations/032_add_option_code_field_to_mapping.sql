-- Add field_44 (option_code) to mapping_settings_standard_fields table

-- 1. Add field_44 column
ALTER TABLE mapping_settings_standard_fields
ADD COLUMN IF NOT EXISTS field_44 VARCHAR(200);

COMMENT ON COLUMN mapping_settings_standard_fields.field_44 IS '옵션코드';

-- 2. Update '표준필드' row to include the Korean label
UPDATE mapping_settings_standard_fields
SET field_44 = '옵션코드'
WHERE market_name = '표준필드';
