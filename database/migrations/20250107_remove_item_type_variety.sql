-- ============================================
-- 옵션상품에서 item_type, variety 칼럼 제거
-- ============================================
-- 목적: 원물의 카테고리를 상속받도록 변경
-- 카테고리는 option_product_materials를 통해 조회
-- ============================================

-- STEP 1: 기존 칼럼 제거
ALTER TABLE option_products
DROP COLUMN IF EXISTS item_type,
DROP COLUMN IF EXISTS variety;

-- STEP 2: 카테고리 조회를 위한 뷰 생성
CREATE OR REPLACE VIEW option_products_with_categories AS
SELECT
  op.*,
  -- 첫 번째 연결된 원물의 카테고리 정보
  rm.category_1,
  rm.category_2,
  rm.category_3,
  rm.category_4 as item_type,  -- category_4를 item_type으로
  rm.category_5 as variety       -- category_5를 variety로
FROM option_products op
LEFT JOIN LATERAL (
  SELECT
    opm.option_product_id,
    rm2.category_1,
    rm2.category_2,
    rm2.category_3,
    rm2.category_4,
    rm2.category_5
  FROM option_product_materials opm
  JOIN raw_materials rm2 ON opm.raw_material_id = rm2.id
  WHERE opm.option_product_id = op.id
  ORDER BY opm.quantity DESC, opm.display_order ASC
  LIMIT 1
) rm ON true;

-- STEP 3: 뷰에 대한 권한 설정
GRANT SELECT ON option_products_with_categories TO authenticated;

-- 완료
SELECT '✅ item_type, variety 칼럼 제거 및 카테고리 뷰 생성 완료!' as result;
SELECT '📊 이제 옵션상품의 카테고리는 연결된 원물에서 상속받습니다.' as info;
