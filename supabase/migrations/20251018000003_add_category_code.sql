-- product_categories에 category_4_code 컬럼 추가
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS category_4_code TEXT;

-- 기존 데이터에 대해 category_4를 기반으로 코드 자동 생성
-- 품목명의 첫 2글자를 로마자로 변환 + 순번
UPDATE product_categories
SET category_4_code = UPPER(
  SUBSTRING(
    REGEXP_REPLACE(
      REGEXP_REPLACE(category_4, '[^a-zA-Z0-9가-힣]', '', 'g'),
      '(.)',
      '\1',
      'g'
    ),
    1,
    4
  )
) || '_' || SUBSTRING(MD5(category_4::text), 1, 4)
WHERE category_4_code IS NULL;

-- UNIQUE 제약조건 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_category_4_code
ON product_categories(category_4_code);

-- 트리거 함수 수정: 코드 자동 생성 포함
CREATE OR REPLACE FUNCTION sync_product_categories()
RETURNS TRIGGER AS $$
DECLARE
  generated_code TEXT;
BEGIN
  -- expense_type='사입'이고 category_4가 있는 경우만 처리
  IF NEW.expense_type = '사입'
     AND NEW.category_4 IS NOT NULL
     AND NEW.category_4 != ''
     AND NEW.is_active = true THEN

    -- 품목 코드 자동 생성
    generated_code := UPPER(
      SUBSTRING(
        REGEXP_REPLACE(
          REGEXP_REPLACE(NEW.category_4, '[^a-zA-Z0-9가-힣]', '', 'g'),
          '(.)',
          '\1',
          'g'
        ),
        1,
        4
      )
    ) || '_' || SUBSTRING(MD5(NEW.category_4::text), 1, 4);

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
      generated_code,
      NEW.is_active,
      NOW()
    )
    ON CONFLICT (category_4)
    DO UPDATE SET
      category_1 = EXCLUDED.category_1,
      category_2 = EXCLUDED.category_2,
      category_3 = EXCLUDED.category_3,
      category_4_code = EXCLUDED.category_4_code,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN product_categories.category_4_code IS '품목 영문 코드 (Cloudinary 폴더명용)';
