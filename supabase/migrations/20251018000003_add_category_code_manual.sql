-- category_settings에 품목 코드 컬럼 추가 (수동 입력)
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS category_4_code TEXT;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_category_settings_category_4_code
ON category_settings(category_4_code);

COMMENT ON COLUMN category_settings.category_4_code IS '품목 코드 (영문/숫자, 사용자 입력)';

-- product_categories에 category_4_code 컬럼 추가
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS category_4_code TEXT;

-- UNIQUE 제약조건 추가 (중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_category_4_code
ON product_categories(category_4_code)
WHERE category_4_code IS NOT NULL;

COMMENT ON COLUMN product_categories.category_4_code IS '품목 코드 (Cloudinary 폴더명용, category_settings에서 복사)';

-- 트리거 함수 수정: 코드를 category_settings에서 가져오도록
CREATE OR REPLACE FUNCTION sync_product_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- expense_type='사입'이고 category_4가 있는 경우만 처리
  IF NEW.expense_type = '사입'
     AND NEW.category_4 IS NOT NULL
     AND NEW.category_4 != ''
     AND NEW.is_active = true THEN

    -- product_categories에 INSERT 또는 UPDATE
    INSERT INTO product_categories (
      category_1,
      category_2,
      category_3,
      category_4,
      category_4_code,
      is_active,
      updated_at
    )
    VALUES (
      NEW.category_1,
      NEW.category_2,
      NEW.category_3,
      NEW.category_4,
      NEW.category_4_code,  -- category_settings의 코드를 그대로 사용
      NEW.is_active,
      NOW()
    )
    ON CONFLICT (category_4)
    DO UPDATE SET
      category_1 = EXCLUDED.category_1,
      category_2 = EXCLUDED.category_2,
      category_3 = EXCLUDED.category_3,
      category_4_code = EXCLUDED.category_4_code,  -- 코드 업데이트
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_product_categories() IS 'category_settings의 사입 품목을 product_categories에 자동 동기화 (코드 포함)';
