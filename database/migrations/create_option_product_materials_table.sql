-- ============================================
-- 옵션상품-원물 연결 테이블 생성
-- ============================================
-- 목적: 옵션상품과 원물의 다대다 관계 관리
-- ============================================

-- 기존 테이블이 있으면 삭제
DROP TABLE IF EXISTS option_product_materials CASCADE;

-- 테이블 생성
CREATE TABLE option_product_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_product_id UUID NOT NULL REFERENCES option_products(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,  -- 사용량
  unit_price NUMERIC(10, 2),                    -- 단가 (스냅샷)
  display_order INTEGER DEFAULT 0,              -- 표시 순서
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 중복 방지를 위한 유니크 제약
  UNIQUE(option_product_id, raw_material_id)
);

-- 인덱스 생성
CREATE INDEX idx_option_product_materials_product ON option_product_materials(option_product_id);
CREATE INDEX idx_option_product_materials_material ON option_product_materials(raw_material_id);
CREATE INDEX idx_option_product_materials_order ON option_product_materials(option_product_id, display_order);

-- updated_at 트리거
CREATE TRIGGER update_option_product_materials_updated_at
  BEFORE UPDATE ON option_product_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE option_product_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON option_product_materials;
CREATE POLICY "Allow all for authenticated users"
  ON option_product_materials FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 완료
SELECT '✅ option_product_materials 테이블 생성 완료!' as result;
