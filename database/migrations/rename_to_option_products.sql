-- ============================================
-- 테이블명 변경: product_options → option_products
-- 작성일: 2025-10-05
-- ============================================

-- ============================================
-- 1. 테이블 이름 변경
-- ============================================

-- product_options → option_products
ALTER TABLE IF EXISTS product_options RENAME TO option_products;

-- product_option_materials → option_product_materials
ALTER TABLE IF EXISTS product_option_materials RENAME TO option_product_materials;

-- product_option_price_history → option_product_price_history
ALTER TABLE IF EXISTS product_option_price_history RENAME TO option_product_price_history;

-- ============================================
-- 2. 인덱스 이름 변경
-- ============================================

-- option_products 인덱스
ALTER INDEX IF EXISTS idx_product_options_option_code RENAME TO idx_option_products_option_code;
ALTER INDEX IF EXISTS idx_product_options_vendor_id RENAME TO idx_option_products_vendor_id;
ALTER INDEX IF EXISTS idx_product_options_supply_status RENAME TO idx_option_products_supply_status;
ALTER INDEX IF EXISTS idx_product_options_season RENAME TO idx_option_products_season;
ALTER INDEX IF EXISTS idx_product_options_is_best RENAME TO idx_option_products_is_best;
ALTER INDEX IF EXISTS idx_product_options_is_recommended RENAME TO idx_option_products_is_recommended;

-- option_product_materials 인덱스
ALTER INDEX IF EXISTS idx_product_option_materials_option_id RENAME TO idx_option_product_materials_option_id;
ALTER INDEX IF EXISTS idx_product_option_materials_material_id RENAME TO idx_option_product_materials_material_id;

-- option_product_price_history 인덱스
ALTER INDEX IF EXISTS idx_product_option_price_history_option_id RENAME TO idx_option_product_price_history_option_id;
ALTER INDEX IF EXISTS idx_product_option_price_history_price_type RENAME TO idx_option_product_price_history_price_type;
ALTER INDEX IF EXISTS idx_product_option_price_history_effective_date RENAME TO idx_option_product_price_history_effective_date;

-- ============================================
-- 3. 트리거 이름 변경
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_product_options_updated_at'
  ) THEN
    EXECUTE 'ALTER TRIGGER trigger_update_product_options_updated_at ON option_products RENAME TO trigger_update_option_products_updated_at';
  END IF;
END $$;

-- ============================================
-- 4. RLS 정책 이름 변경
-- ============================================

-- option_products
DROP POLICY IF EXISTS "admin_all_product_options" ON option_products;
CREATE POLICY "admin_all_option_products"
ON option_products FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('super_admin', 'admin', 'employee')));

-- option_product_materials
DROP POLICY IF EXISTS "admin_all_product_option_materials" ON option_product_materials;
CREATE POLICY "admin_all_option_product_materials"
ON option_product_materials FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('super_admin', 'admin', 'employee')));

-- option_product_price_history
DROP POLICY IF EXISTS "admin_all_product_option_price_history" ON option_product_price_history;
CREATE POLICY "admin_all_option_product_price_history"
ON option_product_price_history FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('super_admin', 'admin', 'employee')));

-- ============================================
-- 5. 뷰 재생성
-- ============================================

DROP VIEW IF EXISTS v_product_options_full;

CREATE OR REPLACE VIEW v_option_products_full AS
SELECT
  op.*,
  p.name as vendor_name,
  p.code as vendor_code,
  p.address as vendor_address,
  p.phone as vendor_phone,
  -- 원물 정보 (JSON 배열로 집계)
  COALESCE(
    json_agg(
      json_build_object(
        'material_id', opm.material_id,
        'material_code', rm.material_code,
        'material_name', rm.material_name,
        'quantity', opm.quantity,
        'unit', opm.unit,
        'material_order', opm.material_order,
        'latest_price', rm.latest_price,
        'supply_status', rm.supply_status
      ) ORDER BY opm.material_order
    ) FILTER (WHERE opm.id IS NOT NULL),
    '[]'::json
  ) as materials
FROM option_products op
LEFT JOIN partners p ON op.vendor_id = p.id
LEFT JOIN option_product_materials opm ON op.id = opm.option_id
LEFT JOIN raw_materials rm ON opm.material_id = rm.id
GROUP BY op.id, p.name, p.code, p.address, p.phone;

COMMENT ON VIEW v_option_products_full IS '옵션상품 전체 정보 (벤더, 원물 포함)';

-- ============================================
-- 6. 테이블 코멘트 업데이트
-- ============================================

COMMENT ON TABLE option_products IS '옵션상품 마스터';
COMMENT ON TABLE option_product_materials IS '옵션상품에 사용되는 원물 매핑';
COMMENT ON TABLE option_product_price_history IS '옵션상품 가격 변동 이력';

COMMENT ON COLUMN option_products.shipping_type IS '직접발송: 자사에서 포장/발송, 벤더발송: 벤더사에서 포장/발송';
COMMENT ON COLUMN option_products.seller_supply_price IS '자동/수동 모드에 따라 실제 적용되는 셀러공급가';
COMMENT ON COLUMN option_product_materials.material_order IS '1: 사용원물1, 2: 사용원물2, 3: 사용원물3';

-- ============================================
-- 완료
-- ============================================
SELECT '테이블명 변경 완료: product_options → option_products' as status;
