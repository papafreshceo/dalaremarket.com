-- cloudinary_images 테이블의 category_4_id 외래키를 products_master로 변경

-- 1. 기존 외래키 제약조건 삭제
ALTER TABLE cloudinary_images
DROP CONSTRAINT IF EXISTS cloudinary_images_category_4_id_fkey;

-- 2. 새로운 외래키 제약조건 추가 (products_master 참조)
ALTER TABLE cloudinary_images
ADD CONSTRAINT cloudinary_images_category_4_id_fkey
FOREIGN KEY (category_4_id)
REFERENCES products_master(id)
ON DELETE SET NULL;

-- 3. 인덱스 재생성 (성능 최적화)
DROP INDEX IF EXISTS idx_cloudinary_images_category_4_id;
CREATE INDEX idx_cloudinary_images_category_4_id ON cloudinary_images(category_4_id);

-- 코멘트 업데이트
COMMENT ON COLUMN cloudinary_images.category_4_id IS '품목 마스터 ID (products_master 참조)';
