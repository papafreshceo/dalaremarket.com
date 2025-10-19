-- Add is_representative column to cloudinary_images table
ALTER TABLE cloudinary_images
ADD COLUMN IF NOT EXISTS is_representative BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_is_representative
ON cloudinary_images(is_representative)
WHERE is_representative = true;

-- Add comment to explain the column
COMMENT ON COLUMN cloudinary_images.is_representative IS '해당 품목/원물/옵션상품의 대표 이미지 여부';
