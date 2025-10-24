-- cloudinary_images 테이블에 image_type 컬럼 추가
-- 용도: 일반 이미지와 상세페이지 이미지를 구분

-- image_type 컬럼 추가
ALTER TABLE cloudinary_images
ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT 'general' CHECK (image_type IN ('general', 'detail_page'));

-- 인덱스 추가 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_image_type ON cloudinary_images(image_type);

-- 기존 데이터는 모두 general로 설정
UPDATE cloudinary_images
SET image_type = 'general'
WHERE image_type IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN cloudinary_images.image_type IS '이미지 타입: general (일반 이미지), detail_page (상세페이지 이미지)';
