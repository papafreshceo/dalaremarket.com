-- Add display_order column to courier_settings table
ALTER TABLE courier_settings ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Set initial display_order based on current id
UPDATE courier_settings SET display_order = id WHERE display_order IS NULL;

-- Create index for display_order
CREATE INDEX IF NOT EXISTS idx_courier_settings_display_order ON courier_settings(display_order);
