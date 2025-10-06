-- ============================================
-- 옵션상품 테이블 구조 재정의 (최종 버전)
-- ============================================
-- 목적: 불필요한 자동/수동 중간값 필드 제거
-- 자동 계산은 트리거로 처리하고 최종값만 저장
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

  raw_material_cost NUMERIC(10, 2) DEFAULT 0,    -- 원물원가 (트리거로 계산됨)

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
  misc_cost NUMERIC(10, 2) DEFAULT 0,            -- 기타비용

  -- 셀러공급 여부
  is_seller_supply BOOLEAN DEFAULT false,        -- 셀러공급 Y/N

  -- 가격 정책 (셀러공급가)
  seller_margin_rate NUMERIC(5, 2) DEFAULT 10,   -- 셀러 마진율
  seller_supply_price_mode TEXT DEFAULT '자동' CHECK (seller_supply_price_mode IN ('자동', '수동')),
  seller_supply_price NUMERIC(10, 2) DEFAULT 0,  -- 셀러공급가 (자동: 계산값, 수동: 입력값)

  -- 가격 정책 (네이버)
  target_margin_rate NUMERIC(5, 2) DEFAULT 20,   -- 목표 마진율
  naver_price_mode TEXT DEFAULT '자동' CHECK (naver_price_mode IN ('자동', '수동')),
  naver_paid_shipping_price NUMERIC(10, 2) DEFAULT 0,   -- 네이버 유료배송가 (자동: 계산값, 수동: 입력값)
  naver_free_shipping_price NUMERIC(10, 2) DEFAULT 0,   -- 네이버 무료배송가 (자동: 계산값, 수동: 입력값)

  -- 가격 정책 (쿠팡)
  coupang_price_mode TEXT DEFAULT '자동' CHECK (coupang_price_mode IN ('자동', '수동')),
  coupang_paid_shipping_price NUMERIC(10, 2) DEFAULT 0, -- 쿠팡 유료배송가 (자동: 계산값, 수동: 입력값)
  coupang_free_shipping_price NUMERIC(10, 2) DEFAULT 0, -- 쿠팡 무료배송가 (자동: 계산값, 수동: 입력값)

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
  updated_by UUID REFERENCES users(id),

  -- GENERATED COLUMNS (모든 일반 컬럼 뒤에 위치해야 함)
  total_material_cost NUMERIC(10, 2) GENERATED ALWAYS AS (
    COALESCE(packaging_box_price, 0) +
    COALESCE(pack_price, 0) +
    COALESCE(bag_vinyl_price, 0) +
    COALESCE(cushioning_price, 0) +
    COALESCE(sticker_price, 0) +
    COALESCE(ice_pack_price, 0) +
    COALESCE(other_material_price, 0) +
    COALESCE(labor_cost, 0)
  ) STORED,  -- 총자재비 (위 자재들의 합계, 자동 계산)

  total_cost NUMERIC(10, 2) GENERATED ALWAYS AS (
    COALESCE(packaging_box_price, 0) +
    COALESCE(pack_price, 0) +
    COALESCE(bag_vinyl_price, 0) +
    COALESCE(cushioning_price, 0) +
    COALESCE(sticker_price, 0) +
    COALESCE(ice_pack_price, 0) +
    COALESCE(other_material_price, 0) +
    COALESCE(labor_cost, 0) +
    COALESCE(raw_material_cost, 0)
  ) STORED  -- 총원가 (자재비 + 원물원가, 자동 계산)
);

-- ============================================
-- STEP 2: 인덱스 생성
-- ============================================

DROP INDEX IF EXISTS idx_option_products_new_item_type;
DROP INDEX IF EXISTS idx_option_products_new_variety;
DROP INDEX IF EXISTS idx_option_products_new_status;
DROP INDEX IF EXISTS idx_option_products_new_vendor;
DROP INDEX IF EXISTS idx_option_products_new_supplier;
DROP INDEX IF EXISTS idx_option_products_new_created_at;

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
  raw_material_cost,
  material_cost_policy, fixed_material_cost,
  supplier_id, shipping_vendor_id, invoice_entity, vendor_id,
  shipping_location_name, shipping_location_address, shipping_location_contact, shipping_deadline,
  shipping_fee, additional_quantity, misc_cost,
  is_seller_supply,
  seller_margin_rate, seller_supply_price_mode, seller_supply_price,
  target_margin_rate,
  naver_price_mode, naver_paid_shipping_price, naver_free_shipping_price,
  coupang_price_mode, coupang_paid_shipping_price, coupang_free_shipping_price,
  status, thumbnail_url, description, notes,
  is_best, is_recommended, has_detail_page, has_images,
  option_name_1, option_name_2, option_name_3,
  is_active, created_at, updated_at, created_by, updated_by
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
  COALESCE(material_cost_policy, 'auto'),
  COALESCE(fixed_material_cost, 0),
  supplier_id, shipping_vendor_id, invoice_entity, vendor_id,
  shipping_location_name, shipping_location_address, shipping_location_contact, shipping_deadline,
  COALESCE(shipping_fee, 0),
  COALESCE(additional_quantity, 0),
  0,  -- misc_cost (new field, default to 0)
  COALESCE(is_seller_supply, false),
  COALESCE(seller_margin_rate, 10),
  COALESCE(seller_supply_price_mode, '자동'),
  COALESCE(seller_supply_price, 0),
  COALESCE(target_margin_rate, 20),
  COALESCE(naver_price_mode, '자동'),
  COALESCE(naver_paid_shipping_price, 0),
  COALESCE(naver_free_shipping_price, 0),
  COALESCE(coupang_price_mode, '자동'),
  COALESCE(coupang_paid_shipping_price, 0),
  COALESCE(coupang_free_shipping_price, 0),
  COALESCE(status, '대기중'),
  thumbnail_url, description, notes,
  COALESCE(is_best, false),
  COALESCE(is_recommended, false),
  COALESCE(has_detail_page, false),
  COALESCE(has_images, false),
  option_name_1, option_name_2, option_name_3,
  COALESCE(is_active, true),
  created_at, updated_at, created_by, updated_by
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
SELECT '✅ 옵션상품 테이블 구조 재정의 완료 (불필요한 필드 제거)!' as result;
