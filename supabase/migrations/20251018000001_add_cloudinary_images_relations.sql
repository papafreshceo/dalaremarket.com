-- 품목 마스터 테이블 생성 (확장 가능한 구조)
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_1 TEXT,  -- 대분류
  category_2 TEXT,  -- 중분류
  category_3 TEXT,  -- 소분류
  category_4 TEXT NOT NULL UNIQUE,  -- 품목 (핵심)
  description TEXT,  -- 품목 설명
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 category_settings에서 품목 데이터 마이그레이션 (지출타입='사입'인 품목만)
INSERT INTO product_categories (category_1, category_2, category_3, category_4, is_active)
SELECT DISTINCT
  category_1,
  category_2,
  category_3,
  category_4,
  is_active
FROM category_settings
WHERE expense_type = '사입'
  AND category_4 IS NOT NULL
  AND category_4 != ''
  AND is_active = true
ON CONFLICT (category_4) DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_product_categories_category_4 ON product_categories(category_4);
CREATE INDEX IF NOT EXISTS idx_product_categories_is_active ON product_categories(is_active);

-- RLS 비활성화 (관리자 전용)
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE product_categories IS '품목 마스터 테이블 - 이미지, 원물, 옵션상품 간 공유 품목 정보';
COMMENT ON COLUMN product_categories.category_4 IS '품목명 (고유값)';

-- cloudinary_images 테이블에 원물, 옵션상품, 품목 관계 컬럼 추가

-- 원물 ID (특정 원물에 연결된 이미지)
ALTER TABLE cloudinary_images
ADD COLUMN IF NOT EXISTS raw_material_id UUID REFERENCES raw_materials(id) ON DELETE SET NULL;

-- 옵션상품 ID (특정 옵션상품에 연결된 이미지)
ALTER TABLE cloudinary_images
ADD COLUMN IF NOT EXISTS option_product_id UUID REFERENCES option_products(id) ON DELETE SET NULL;

-- 품목 ID (품목 단위로 그룹화된 이미지 - FK로 관리)
ALTER TABLE cloudinary_images
ADD COLUMN IF NOT EXISTS category_4_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_raw_material_id ON cloudinary_images(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_option_product_id ON cloudinary_images(option_product_id);
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_category_4_id ON cloudinary_images(category_4_id);

COMMENT ON COLUMN cloudinary_images.raw_material_id IS '특정 원물에 연결된 이미지';
COMMENT ON COLUMN cloudinary_images.option_product_id IS '특정 옵션상품에 연결된 이미지';
COMMENT ON COLUMN cloudinary_images.category_4_id IS '품목 ID - 동일 품목의 여러 원물/옵션상품이 이미지를 공유';
