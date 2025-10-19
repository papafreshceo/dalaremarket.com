-- Add badge columns to category_settings
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS is_best BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_detail_page BOOLEAN DEFAULT false;

COMMENT ON COLUMN category_settings.is_best IS '베스트 품목 여부';
COMMENT ON COLUMN category_settings.is_recommended IS '추천 상품 여부';
COMMENT ON COLUMN category_settings.has_image IS '이미지 제공 여부';
COMMENT ON COLUMN category_settings.has_detail_page IS '상세페이지 제공 여부';

-- Create index for badge queries
CREATE INDEX IF NOT EXISTS idx_category_settings_is_best ON category_settings(is_best) WHERE is_best = true;
CREATE INDEX IF NOT EXISTS idx_category_settings_is_recommended ON category_settings(is_recommended) WHERE is_recommended = true;
