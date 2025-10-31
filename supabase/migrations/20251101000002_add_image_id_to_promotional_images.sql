-- Add image_id column to promotional_images table for Cloudinary integration
ALTER TABLE promotional_images
ADD COLUMN IF NOT EXISTS image_id UUID REFERENCES cloudinary_images(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_promotional_images_image_id
ON promotional_images(image_id);

-- Update comment
COMMENT ON COLUMN promotional_images.image_id IS 'Cloudinary 이미지 ID (cloudinary_images 테이블 참조)';

-- Make image_url nullable since we'll use cloudinary_images instead
ALTER TABLE promotional_images
ALTER COLUMN image_url DROP NOT NULL;

COMMENT ON TABLE promotional_images IS '플랫폼 메인 페이지 프로모션 이미지 슬롯 관리 (4개 고정)';
