-- ============================================
-- 옵션상품 관리 시스템 테이블 생성
-- 작성일: 2025-10-05
-- ============================================

-- ============================================
-- 1. 포장자재 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS packaging_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  material_type VARCHAR(50) CHECK (material_type IN ('포장박스', '팩', '봉지/비닐', '완충재', '스티커', '아이스팩', '기타')),
  unit_price DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(20) DEFAULT '개',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE packaging_materials IS '포장자재 마스터';
COMMENT ON COLUMN packaging_materials.material_type IS '포장박스, 팩, 봉지/비닐, 완충재, 스티커, 아이스팩, 기타';

-- ============================================
-- 2. 옵션상품 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_code VARCHAR(50) UNIQUE NOT NULL,
  option_name VARCHAR(200) NOT NULL,

  -- 상품 기본 정보
  item_type VARCHAR(100),           -- 품목 (복숭아)
  variety VARCHAR(100),              -- 품종 (딱딱이)
  specification_1 VARCHAR(50),       -- 규격1 (1.3kg)
  specification_2 VARCHAR(50),       -- 규격2 (소과)
  specification_3 VARCHAR(50),       -- 규격3 (8과)

  -- 중량/단위
  weight DECIMAL(10,3),              -- 중량
  weight_unit VARCHAR(20) DEFAULT 'kg',  -- 사용단위

  -- 포장자재 정보
  packaging_box_price DECIMAL(10,2) DEFAULT 0,      -- 포장박스
  pack_price DECIMAL(10,2) DEFAULT 0,               -- 팩
  bag_vinyl_price DECIMAL(10,2) DEFAULT 0,          -- 봉지/비닐
  cushioning_price DECIMAL(10,2) DEFAULT 0,         -- 완충재
  sticker_price DECIMAL(10,2) DEFAULT 0,            -- 스티커
  ice_pack_price DECIMAL(10,2) DEFAULT 0,           -- 아이스팩
  other_material_price DECIMAL(10,2) DEFAULT 0,     -- 기타자재
  total_material_cost DECIMAL(10,2) GENERATED ALWAYS AS (
    COALESCE(packaging_box_price, 0) +
    COALESCE(pack_price, 0) +
    COALESCE(bag_vinyl_price, 0) +
    COALESCE(cushioning_price, 0) +
    COALESCE(sticker_price, 0) +
    COALESCE(ice_pack_price, 0) +
    COALESCE(other_material_price, 0)
  ) STORED,

  -- 원가 정보
  raw_material_cost DECIMAL(10,2) DEFAULT 0,        -- 원물원가
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (
    COALESCE(raw_material_cost, 0) +
    COALESCE(packaging_box_price, 0) +
    COALESCE(pack_price, 0) +
    COALESCE(bag_vinyl_price, 0) +
    COALESCE(cushioning_price, 0) +
    COALESCE(sticker_price, 0) +
    COALESCE(ice_pack_price, 0) +
    COALESCE(other_material_price, 0)
  ) STORED,

  -- 배송 정보
  vendor_id UUID REFERENCES partners(id),           -- 벤더사 (발송업체)
  shipping_type VARCHAR(50) CHECK (shipping_type IN ('직접발송', '벤더발송')),
  shipping_address TEXT,                            -- 발송지주소
  shipping_contact VARCHAR(100),                    -- 발송지연락처
  shipping_deadline INTEGER DEFAULT 1,              -- 발송기한
  shipping_fee DECIMAL(10,2) DEFAULT 3000,          -- 택배비
  additional_quantity INTEGER DEFAULT 0,            -- 택배비 부가수량

  -- 운영 정보
  supply_status VARCHAR(50) DEFAULT '대기중' CHECK (supply_status IN ('대기중', '셀러공급상품', '시즌종료', '품절')),
  season VARCHAR(20) CHECK (season IN ('봄', '여름', '가을', '겨울', '연중', NULL)),
  season_start_date DATE,                           -- 시즌 시작일
  season_peak_date DATE,                            -- 피크 시기
  season_end_date DATE,                             -- 시즌 종료일

  -- 가격 정책
  labor_cost DECIMAL(10,2) DEFAULT 1000,            -- 인건비
  target_margin_rate DECIMAL(5,2) DEFAULT 20,       -- 목표마진율(%)
  seller_margin_rate DECIMAL(5,2) DEFAULT 10,       -- 셀러공급마진(%)

  -- 셀러공급가
  seller_supply_price_mode VARCHAR(20) DEFAULT '자동' CHECK (seller_supply_price_mode IN ('자동', '수동')),
  seller_supply_auto_price DECIMAL(10,2),           -- 자동공급가
  seller_supply_manual_price DECIMAL(10,2),         -- 수동공급가
  seller_supply_price DECIMAL(10,2),                -- 실제 셀러공급가 (자동/수동 선택값)

  -- 네이버 직판가
  naver_price_mode VARCHAR(20) DEFAULT '자동' CHECK (naver_price_mode IN ('자동', '수동')),
  naver_paid_shipping_auto DECIMAL(10,2),           -- N유료판매가 (자동)
  naver_free_shipping_auto DECIMAL(10,2),           -- N무료판매가 (자동)
  naver_paid_shipping_manual DECIMAL(10,2),         -- N유료판매가 (수동)
  naver_free_shipping_manual DECIMAL(10,2),         -- N무료판매가 (수동)
  naver_paid_shipping_price DECIMAL(10,2),          -- N유료판매가 (실제)
  naver_free_shipping_price DECIMAL(10,2),          -- N무료판매가 (실제)

  -- 쿠팡 직판가
  coupang_price_mode VARCHAR(20) DEFAULT '자동' CHECK (coupang_price_mode IN ('자동', '수동')),
  coupang_paid_shipping_auto DECIMAL(10,2),         -- C유료판매가 (자동)
  coupang_free_shipping_auto DECIMAL(10,2),         -- C무료판매가 (자동)
  coupang_paid_shipping_manual DECIMAL(10,2),       -- C유료판매가 (수동)
  coupang_free_shipping_manual DECIMAL(10,2),       -- C무료판매가 (수동)
  coupang_paid_shipping_price DECIMAL(10,2),        -- C유료판매가 (실제)
  coupang_free_shipping_price DECIMAL(10,2),        -- C무료판매가 (실제)

  -- 이미지 및 상세페이지
  thumbnail_url TEXT,                               -- 썸네일
  detail_page_url TEXT,                             -- 상세페이지
  has_detail_page BOOLEAN DEFAULT false,            -- 상세페이지제공
  has_images BOOLEAN DEFAULT false,                 -- 이미지제공

  -- 추천/베스트
  is_best BOOLEAN DEFAULT false,                    -- 베스트Y/N
  is_recommended BOOLEAN DEFAULT false,             -- 추천상품Y/N

  -- 기타
  description TEXT,                                 -- 설명
  notes TEXT,                                       -- 비고
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE product_options IS '옵션상품 마스터';
COMMENT ON COLUMN product_options.shipping_type IS '직접발송: 자사에서 포장/발송, 벤더발송: 벤더사에서 포장/발송';
COMMENT ON COLUMN product_options.seller_supply_price IS '자동/수동 모드에 따라 실제 적용되는 셀러공급가';

-- ============================================
-- 3. 옵션상품-원물 매핑 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS product_option_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES raw_materials(id),
  material_order INTEGER DEFAULT 1,                 -- 사용원물1, 2, 3 구분
  quantity DECIMAL(10,3) NOT NULL,                  -- 필요 원물량
  unit VARCHAR(20) DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(option_id, material_id, material_order)
);

COMMENT ON TABLE product_option_materials IS '옵션상품에 사용되는 원물 매핑';
COMMENT ON COLUMN product_option_materials.material_order IS '1: 사용원물1, 2: 사용원물2, 3: 사용원물3';

-- ============================================
-- 4. 옵션상품 가격 변동 이력 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS product_option_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,

  -- 가격 종류
  price_type VARCHAR(50) NOT NULL CHECK (price_type IN (
    'seller_supply',           -- 셀러공급가
    'naver_paid_shipping',     -- 네이버 유료배송
    'naver_free_shipping',     -- 네이버 무료배송
    'coupang_paid_shipping',   -- 쿠팡 유료배송
    'coupang_free_shipping'    -- 쿠팡 무료배송
  )),

  -- 가격 정보
  price DECIMAL(10,2) NOT NULL,
  price_mode VARCHAR(20) CHECK (price_mode IN ('자동', '수동')),
  margin_rate DECIMAL(5,2),                         -- 마진율(%)
  margin_amount DECIMAL(10,2),                      -- 마진액(원)

  -- 원가 정보 (스냅샷)
  raw_material_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  shipping_fee DECIMAL(10,2),

  -- 변경 정보
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,                               -- 변경 사유
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE product_option_price_history IS '옵션상품 가격 변동 이력';

-- ============================================
-- 5. 플랫폼별 가격 제약 설정 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS platform_price_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) UNIQUE NOT NULL CHECK (platform IN ('네이버', '쿠팡', '11번가', '기타')),

  -- 옵션 가격 제약
  max_option_price_diff_percent DECIMAL(5,2),       -- 최대 옵션 가격 차이 (%)
  max_option_price_diff_amount DECIMAL(10,2),       -- 최대 옵션 가격 차이 (원)
  min_option_price DECIMAL(10,2),                   -- 최소 옵션 가격
  max_option_price DECIMAL(10,2),                   -- 최대 옵션 가격

  -- 기타 제약
  max_options_per_product INTEGER,                  -- 상품당 최대 옵션 수
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE platform_price_constraints IS '플랫폼별 판매 가격 제약 설정';
COMMENT ON COLUMN platform_price_constraints.max_option_price_diff_percent IS '예: 50 = 기준가의 ±50% 이내 옵션만 등록 가능';

-- ============================================
-- 6. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_options_option_code ON product_options(option_code);
CREATE INDEX IF NOT EXISTS idx_product_options_vendor_id ON product_options(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_options_supply_status ON product_options(supply_status);
CREATE INDEX IF NOT EXISTS idx_product_options_season ON product_options(season);
CREATE INDEX IF NOT EXISTS idx_product_options_is_best ON product_options(is_best);
CREATE INDEX IF NOT EXISTS idx_product_options_is_recommended ON product_options(is_recommended);

CREATE INDEX IF NOT EXISTS idx_product_option_materials_option_id ON product_option_materials(option_id);
CREATE INDEX IF NOT EXISTS idx_product_option_materials_material_id ON product_option_materials(material_id);

CREATE INDEX IF NOT EXISTS idx_product_option_price_history_option_id ON product_option_price_history(option_id);
CREATE INDEX IF NOT EXISTS idx_product_option_price_history_price_type ON product_option_price_history(price_type);
CREATE INDEX IF NOT EXISTS idx_product_option_price_history_effective_date ON product_option_price_history(effective_date DESC);

CREATE INDEX IF NOT EXISTS idx_packaging_materials_material_type ON packaging_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_packaging_materials_is_active ON packaging_materials(is_active);

-- ============================================
-- 7. RLS (Row Level Security) 설정
-- ============================================
ALTER TABLE packaging_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_price_constraints ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY "admin_all_packaging_materials"
ON packaging_materials FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('super_admin', 'admin', 'employee')));

CREATE POLICY "admin_all_product_options"
ON product_options FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('super_admin', 'admin', 'employee')));

CREATE POLICY "admin_all_product_option_materials"
ON product_option_materials FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('super_admin', 'admin', 'employee')));

CREATE POLICY "admin_all_product_option_price_history"
ON product_option_price_history FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('super_admin', 'admin', 'employee')));

CREATE POLICY "admin_all_platform_price_constraints"
ON platform_price_constraints FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('super_admin', 'admin', 'employee')));

-- ============================================
-- 8. 트리거: updated_at 자동 업데이트
-- ============================================
CREATE TRIGGER trigger_update_packaging_materials_updated_at
BEFORE UPDATE ON packaging_materials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_product_options_updated_at
BEFORE UPDATE ON product_options
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_platform_price_constraints_updated_at
BEFORE UPDATE ON platform_price_constraints
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 뷰(View) 생성
-- ============================================
-- 옵션상품 전체 정보 뷰 (원물 정보 포함)
CREATE OR REPLACE VIEW v_product_options_full AS
SELECT
  po.*,
  p.name as vendor_name,
  p.code as vendor_code,
  p.address as vendor_address,
  p.phone as vendor_phone,
  -- 원물 정보 (JSON 배열로 집계)
  COALESCE(
    json_agg(
      json_build_object(
        'material_id', pom.material_id,
        'material_code', rm.material_code,
        'material_name', rm.material_name,
        'quantity', pom.quantity,
        'unit', pom.unit,
        'material_order', pom.material_order,
        'latest_price', rm.latest_price,
        'supply_status', rm.supply_status
      ) ORDER BY pom.material_order
    ) FILTER (WHERE pom.id IS NOT NULL),
    '[]'::json
  ) as materials
FROM product_options po
LEFT JOIN partners p ON po.vendor_id = p.id
LEFT JOIN product_option_materials pom ON po.id = pom.option_id
LEFT JOIN raw_materials rm ON pom.material_id = rm.id
GROUP BY po.id, p.name, p.code, p.address, p.phone;

COMMENT ON VIEW v_product_options_full IS '옵션상품 전체 정보 (벤더, 원물 포함)';

-- ============================================
-- 10. 플랫폼 제약 기본 데이터 삽입
-- ============================================
INSERT INTO platform_price_constraints (platform, max_option_price_diff_percent, notes) VALUES
('네이버', 50, '네이버 스마트스토어 옵션 가격 차이 제한: 기준가의 ±50% 이내'),
('쿠팡', 50, '쿠팡 옵션 가격 차이 제한: 기준가의 ±50% 이내')
ON CONFLICT (platform) DO NOTHING;

-- ============================================
-- 완료
-- ============================================
SELECT '옵션상품 관리 시스템 테이블 생성 완료' as status;
