-- Add section column to promotional_images for organizing different page sections
ALTER TABLE promotional_images
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'tab1';

-- Add index for section queries
CREATE INDEX IF NOT EXISTS idx_promotional_images_section
ON promotional_images(section);

-- Update existing records to tab1 (한눈에 보는 상품)
UPDATE promotional_images
SET section = 'tab1'
WHERE section IS NULL OR section = '';

-- Add comment
COMMENT ON COLUMN promotional_images.section IS '이미지 섹션 (hero: 히어로, tab1: 한눈에 보는 상품, tab2: 간편 발주시스템, tab3: 셀러 업무도구, tab4: 다양한 서비스)';

-- Update display_order to allow duplicates across different sections
-- Remove unique constraint on display_order
ALTER TABLE promotional_images
DROP CONSTRAINT IF EXISTS promotional_images_display_order_key;

-- Add composite unique constraint for section + display_order
ALTER TABLE promotional_images
ADD CONSTRAINT promotional_images_section_display_order_key
UNIQUE (section, display_order);

COMMENT ON TABLE promotional_images IS '플랫폼 메인 페이지 프로모션 이미지 관리 (섹션별로 구분)';
