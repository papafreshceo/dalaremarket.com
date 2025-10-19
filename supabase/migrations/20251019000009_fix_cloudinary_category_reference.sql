-- cloudinary_images의 category_4_id 외래키를 category_settings로 변경

-- 1. 기존 외래키 제약조건 삭제
ALTER TABLE cloudinary_images
DROP CONSTRAINT IF EXISTS cloudinary_images_category_4_id_fkey;

-- 2. 존재하지 않는 category_4_id 참조를 NULL로 설정
UPDATE cloudinary_images
SET category_4_id = NULL
WHERE category_4_id IS NOT NULL
  AND category_4_id NOT IN (SELECT id FROM category_settings);

-- 3. category_settings를 참조하는 새로운 외래키 생성
ALTER TABLE cloudinary_images
ADD CONSTRAINT cloudinary_images_category_4_id_fkey
FOREIGN KEY (category_4_id) REFERENCES category_settings(id) ON DELETE SET NULL;

COMMENT ON COLUMN cloudinary_images.category_4_id IS '품목 ID - category_settings 테이블 참조';
