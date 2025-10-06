-- ============================================
-- 옵션상품 테이블 구조 재정의
-- ============================================
-- 목적: option_products 테이블을 깔끔하게 정리
-- 원물 관련 정보는 option_product_materials에서 JOIN
-- ============================================

-- ============================================
-- STEP 1: 새 테이블 생성
-- ============================================

DROP TABLE IF EXISTS option_products_new CASCADE;

CREATE TABLE option_products_new (
  -- 기본 정보
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_code TEXT UNIQUE NOT NULL,
  option_name TEXT NOT NULL,

  -- 분류 정보
  item_type TEXT,  -- 품목
  variety TEXT,    -- 품종

  -- 규격
  specification_1 TEXT,  -- 규격1
  specification_2 TEXT,  -- 규격2
  specification_3 TEXT,  -- 규격3

  -- 중량 및 단위
  weight NUMERIC(10, 2),
  weight_unit TEXT DEFAULT 'kg',

  -- 자재비 (포장 관련)
  packaging_box_price NUMERIC(10, 2) DEFAULT 0,  -- 포장박스
  pack_price NUMERIC(10, 2) DEFAULT 0,           -- 팩
  bag_vinyl_price NUMERIC(10, 2) DEFAULT 0,      -- 봉지/비닐
  cushioning_price NUMERIC(10, 2) DEFAULT 0,     -- 완충재
  sticker_price NUMERIC(10, 2) DEFAULT 0,        -- 스티커
  ice_pack_price NUMERIC(10, 2) DEFAULT 0,       -- 아이스팩
  other_material_price NUMERIC(10, 2) DEFAULT 0, -- 기타자재
  labor_cost NUMERIC(10, 2) DEFAULT 0,           -- 인건비 (자재비에 포함)

  -- 원가 정보
  total_material_cost NUMERIC(10, 2) DEFAULT 0,  -- 총자재비 (위 자재들의 합)
  raw_material_cost NUMERIC(10, 2) DEFAULT 0,    -- 원물원가 (계산됨)
  total_cost NUMERIC(10, 2) DEFAULT 0,           -- 총원가 (자재비 + 원물원가)

  -- 원물가 정책
  material_cost_policy TEXT DEFAULT 'auto' CHECK (material_cost_policy IN ('auto', 'fixed')),
  fixed_material_cost NUMERIC(10, 2) DEFAULT 0,  -- 고정 원물가 (fixed 모드일 때)

  -- 거래처 및 출고 정보
  supplier_id UUID REFERENCES partners(id),      -- 원물거래처
  shipping_vendor_id UUID REFERENCES partners(id), -- 출고처
  invoice_entity TEXT,                           -- 송장주체
  vendor_id UUID REFERENCES partners(id),        -- 벤더사
  shipping_location_name TEXT,                   -- 발송지명
  shipping_location_address TEXT,                -- 발송지주소
  shipping_location_contact TEXT,                -- 발송지연락처
  shipping_deadline TEXT,                        -- 발송기한

  -- 택배비 및 부가 수량
  shipping_fee NUMERIC(10, 2) DEFAULT 0,         -- 택배비
  additional_quantity NUMERIC(10, 2) DEFAULT 0,  -- 부가수량

  -- 셀러공급 여부
  is_seller_supply BOOLEAN DEFAULT false,        -- 셀러공급 Y/N

  -- 가격 정책 (셀러공급가)
  seller_margin_rate NUMERIC(5, 2) DEFAULT 10,
  seller_supply_price_mode TEXT DEFAULT '자동' CHECK (seller_supply_price_mode IN ('자동', '수동')),
  seller_supply_auto_price NUMERIC(10, 2) DEFAULT 0,
  seller_supply_manual_price NUMERIC(10, 2) DEFAULT 0,
  seller_supply_price NUMERIC(10, 2) DEFAULT 0,

  -- 가격 정책 (네이버)
  target_margin_rate NUMERIC(5, 2) DEFAULT 20,
  naver_price_mode TEXT DEFAULT '자동' CHECK (naver_price_mode IN ('자동', '수동')),
  naver_paid_shipping_auto NUMERIC(10, 2) DEFAULT 0,
  naver_free_shipping_auto NUMERIC(10, 2) DEFAULT 0,
  naver_paid_shipping_manual NUMERIC(10, 2) DEFAULT 0,
  naver_free_shipping_manual NUMERIC(10, 2) DEFAULT 0,
  naver_paid_shipping_price NUMERIC(10, 2) DEFAULT 0,
  naver_free_shipping_price NUMERIC(10, 2) DEFAULT 0,

  -- 가격 정책 (쿠팡)
  coupang_price_mode TEXT DEFAULT '자동' CHECK (coupang_price_mode IN ('자동', '수동')),
  coupang_paid_shipping_auto NUMERIC(10, 2) DEFAULT 0,
  coupang_free_shipping_auto NUMERIC(10, 2) DEFAULT 0,
  coupang_paid_shipping_manual NUMERIC(10, 2) DEFAULT 0,
  coupang_free_shipping_manual NUMERIC(10, 2) DEFAULT 0,
  coupang_paid_shipping_price NUMERIC(10, 2) DEFAULT 0,
  coupang_free_shipping_price NUMERIC(10, 2) DEFAULT 0,

  -- 상태 및 기타
  status TEXT DEFAULT '대기중',                  -- 옵션공급상태
  thumbnail_url TEXT,                            -- 썸네일
  description TEXT,                              -- 설명
  notes TEXT,                                    -- 비고
  is_best BOOLEAN DEFAULT false,                 -- 베스트 Y/N
  is_recommended BOOLEAN DEFAULT false,          -- 추천상품 Y/N
  has_detail_page BOOLEAN DEFAULT false,         -- 상세페이지제공
  has_images BOOLEAN DEFAULT false,              -- 이미지제공

  -- 사용 옵션명 (추가 옵션)
  option_name_1 TEXT,
  option_name_2 TEXT,
  option_name_3 TEXT,

  -- 메타 정보
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================
-- STEP 2: 인덱스 생성
-- ============================================

CREATE INDEX idx_option_products_new_item_type ON option_products_new(item_type);
CREATE INDEX idx_option_products_new_variety ON option_products_new(variety);
CREATE INDEX idx_option_products_new_status ON option_products_new(status);
CREATE INDEX idx_option_products_new_vendor ON option_products_new(vendor_id);
CREATE INDEX idx_option_products_new_supplier ON option_products_new(supplier_id);
CREATE INDEX idx_option_products_new_created_at ON option_products_new(created_at DESC);

-- ============================================
-- STEP 3: 기존 데이터 마이그레이션
-- ============================================

INSERT INTO option_products_new (
  id, option_code, option_name,
  item_type, variety,
  specification_1, specification_2, specification_3,
  weight, weight_unit,
  packaging_box_price, pack_price, bag_vinyl_price,
  cushioning_price, sticker_price, ice_pack_price,
  other_material_price, labor_cost,
  raw_material_cost, total_cost,
  material_cost_policy, fixed_material_cost,
  vendor_id, shipping_fee,
  seller_margin_rate, seller_supply_price_mode,
  seller_supply_auto_price, seller_supply_manual_price, seller_supply_price,
  target_margin_rate, naver_price_mode,
  naver_paid_shipping_auto, naver_free_shipping_auto,
  naver_paid_shipping_manual, naver_free_shipping_manual,
  naver_paid_shipping_price, naver_free_shipping_price,
  coupang_price_mode,
  coupang_paid_shipping_auto, coupang_free_shipping_auto,
  coupang_paid_shipping_manual, coupang_free_shipping_manual,
  coupang_paid_shipping_price, coupang_free_shipping_price,
  status, description, notes,
  is_active, created_at, updated_at
)
SELECT
  id, option_code, option_name,
  item_type, variety,
  specification_1, specification_2, specification_3,
  weight, weight_unit,
  COALESCE(packaging_box_price, 0),
  COALESCE(pack_price, 0),
  COALESCE(bag_vinyl_price, 0),
  COALESCE(cushioning_price, 0),
  COALESCE(sticker_price, 0),
  COALESCE(ice_pack_price, 0),
  COALESCE(other_material_price, 0),
  COALESCE(labor_cost, 0),
  COALESCE(raw_material_cost, 0),
  COALESCE(total_cost, 0),
  COALESCE(material_cost_policy, 'auto'),
  COALESCE(fixed_material_cost, 0),
  vendor_id,
  COALESCE(shipping_fee, 0),
  COALESCE(seller_margin_rate, 10),
  COALESCE(seller_supply_price_mode, '자동'),
  COALESCE(seller_supply_auto_price, 0),
  COALESCE(seller_supply_manual_price, 0),
  COALESCE(seller_supply_price, 0),
  COALESCE(target_margin_rate, 20),
  COALESCE(naver_price_mode, '자동'),
  COALESCE(naver_paid_shipping_auto, 0),
  COALESCE(naver_free_shipping_auto, 0),
  COALESCE(naver_paid_shipping_manual, 0),
  COALESCE(naver_free_shipping_manual, 0),
  COALESCE(naver_paid_shipping_price, 0),
  COALESCE(naver_free_shipping_price, 0),
  COALESCE(coupang_price_mode, '자동'),
  COALESCE(coupang_paid_shipping_auto, 0),
  COALESCE(coupang_free_shipping_auto, 0),
  COALESCE(coupang_paid_shipping_manual, 0),
  COALESCE(coupang_free_shipping_manual, 0),
  COALESCE(coupang_paid_shipping_price, 0),
  COALESCE(coupang_free_shipping_price, 0),
  COALESCE(status, '대기중'),
  description,
  notes,
  COALESCE(is_active, true),
  created_at,
  updated_at
FROM option_products;

-- ============================================
-- STEP 4: 테이블 교체
-- ============================================

DROP TABLE IF EXISTS option_products CASCADE;
ALTER TABLE option_products_new RENAME TO option_products;

-- ============================================
-- STEP 5: 트리거 재생성
-- ============================================

-- updated_at 트리거
CREATE TRIGGER update_option_products_updated_at
  BEFORE UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 가격 계산 트리거는 별도 migration 파일에서 생성됨
-- refactor_option_products_pricing_v2.sql 참조

-- ============================================
-- STEP 6: RLS 정책 재생성
-- ============================================

ALTER TABLE option_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON option_products;
CREATE POLICY "Allow all for authenticated users"
  ON option_products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 완료
SELECT '✅ 옵션상품 테이블 구조 재정의 완료!' as result;
