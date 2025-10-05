-- ============================================
-- 옵션상품-원물 연결 테이블 생성/수정
-- ============================================

-- unit_price 컬럼 추가 (없으면 추가)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'option_product_materials'
    AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE option_product_materials
    ADD COLUMN unit_price DECIMAL(10,2);

    COMMENT ON COLUMN option_product_materials.unit_price IS '해당 원물의 단가 (스냅샷)';
  END IF;
END $$;

-- quantity 컬럼이 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'option_product_materials'
    AND column_name = 'quantity'
  ) THEN
    ALTER TABLE option_product_materials
    ADD COLUMN quantity DECIMAL(10,3) NOT NULL DEFAULT 1;

    COMMENT ON COLUMN option_product_materials.quantity IS '옵션상품 1개당 필요한 원물 수량';
  END IF;
END $$;

SELECT 'option_product_materials 테이블 수정 완료' as status;
