-- category_settings에 품목이 추가/수정되면 product_categories에 자동 반영하는 트리거

-- 트리거 함수 생성
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
      is_active,
      updated_at
    )
    VALUES (
      NEW.category_1,
      NEW.category_2,
      NEW.category_3,
      NEW.category_4,
      NEW.is_active,
      NOW()
    )
    ON CONFLICT (category_4)
    DO UPDATE SET
      category_1 = EXCLUDED.category_1,
      category_2 = EXCLUDED.category_2,
      category_3 = EXCLUDED.category_3,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- INSERT 트리거 생성
CREATE TRIGGER trg_sync_product_categories_insert
AFTER INSERT ON category_settings
FOR EACH ROW
EXECUTE FUNCTION sync_product_categories();

-- UPDATE 트리거 생성
CREATE TRIGGER trg_sync_product_categories_update
AFTER UPDATE ON category_settings
FOR EACH ROW
EXECUTE FUNCTION sync_product_categories();

COMMENT ON FUNCTION sync_product_categories() IS 'category_settings의 사입 품목을 product_categories에 자동 동기화';
