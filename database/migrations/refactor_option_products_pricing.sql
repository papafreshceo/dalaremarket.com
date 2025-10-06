-- ============================================
-- 옵션상품 가격 구조 리팩토링
-- ============================================
-- 목적:
-- 1. 가격 정책을 단순화하고 확장 가능하게 개선
-- 2. 원물가 정책 분리 (auto/fixed)
-- 3. 판매 채널별 가격을 별도 테이블로 분리
-- ============================================

-- ============================================
-- STEP 1: 옵션상품 핵심 가격 정책 필드만 남기기
-- ============================================

-- 1-1. 원물가 정책 관련 컬럼 추가
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS material_cost_policy TEXT DEFAULT 'auto' CHECK (material_cost_policy IN ('auto', 'fixed'));

ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS fixed_material_cost NUMERIC(10, 2) DEFAULT 0;

-- 기존 raw_material_cost는 유지 (계산된 최종 원물가)

-- 1-2. 기존 데이터 마이그레이션
-- seller_supply_price_mode가 '수동'이면 fixed로, 아니면 auto로 설정
UPDATE option_products
SET
  material_cost_policy = CASE
    WHEN seller_supply_price_mode = '수동' THEN 'fixed'
    ELSE 'auto'
  END,
  fixed_material_cost = CASE
    WHEN seller_supply_price_mode = '수동' THEN raw_material_cost
    ELSE 0
  END
WHERE material_cost_policy IS NULL;

-- ============================================
-- STEP 2: 판매 채널별 가격 테이블 생성 (선택사항)
-- ============================================
-- 현재는 컬럼 방식 유지하되, 향후 확장성을 위해 주석으로 남김

/*
CREATE TABLE IF NOT EXISTS option_product_channel_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_product_id UUID NOT NULL REFERENCES option_products(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('seller', 'naver', 'coupang', '11st', 'wemakeprice')),
  shipping_type TEXT CHECK (shipping_type IN ('paid', 'free')),
  price_mode TEXT DEFAULT 'auto' CHECK (price_mode IN ('auto', 'manual')),
  auto_price NUMERIC(10, 2) DEFAULT 0,
  manual_price NUMERIC(10, 2) DEFAULT 0,
  final_price NUMERIC(10, 2) DEFAULT 0,
  margin_rate NUMERIC(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(option_product_id, channel_type, shipping_type)
);

CREATE INDEX idx_channel_prices_option_id ON option_product_channel_prices(option_product_id);
CREATE INDEX idx_channel_prices_channel ON option_product_channel_prices(channel_type);
*/

-- ============================================
-- STEP 3: 컬럼 설명 추가
-- ============================================

COMMENT ON COLUMN option_products.material_cost_policy IS '원물가 정책 (auto: 최신시세 자동반영, fixed: 고정가 사용)';
COMMENT ON COLUMN option_products.fixed_material_cost IS '고정 원물가 (material_cost_policy=fixed일 때 사용)';
COMMENT ON COLUMN option_products.raw_material_cost IS '계산된 최종 원물가 (정책에 따라 자동 또는 고정값)';

-- 기존 컬럼 설명
COMMENT ON COLUMN option_products.seller_supply_price_mode IS '셀러공급가 모드 (자동/수동)';
COMMENT ON COLUMN option_products.seller_supply_auto_price IS '셀러공급가 자동계산값 (마진율 기반)';
COMMENT ON COLUMN option_products.seller_supply_manual_price IS '셀러공급가 수동입력값';
COMMENT ON COLUMN option_products.seller_supply_price IS '최종 셀러공급가 (모드에 따라 자동 또는 수동값)';

-- ============================================
-- STEP 4: 가격 자동 계산 함수 생성
-- ============================================

-- 원물가 계산 함수
CREATE OR REPLACE FUNCTION calculate_material_cost(
  p_option_product_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_policy TEXT;
  v_fixed_cost NUMERIC;
  v_calculated_cost NUMERIC := 0;
  v_material RECORD;
BEGIN
  -- 정책 가져오기
  SELECT material_cost_policy, fixed_material_cost
  INTO v_policy, v_fixed_cost
  FROM option_products
  WHERE id = p_option_product_id;

  -- fixed 정책이면 고정가 반환
  IF v_policy = 'fixed' THEN
    RETURN v_fixed_cost;
  END IF;

  -- auto 정책이면 최신 시세로 계산
  FOR v_material IN
    SELECT
      opm.quantity,
      opm.material_id,
      rm.standard_quantity
    FROM option_product_materials opm
    JOIN raw_materials rm ON rm.id = opm.material_id
    WHERE opm.option_product_id = p_option_product_id
  LOOP
    -- 최신 시세 가져오기
    DECLARE
      v_latest_price NUMERIC;
    BEGIN
      SELECT price INTO v_latest_price
      FROM material_price_history
      WHERE material_id = v_material.material_id
      ORDER BY effective_date DESC, created_at DESC
      LIMIT 1;

      -- 최신 시세가 없으면 raw_materials.latest_price 사용
      IF v_latest_price IS NULL THEN
        SELECT latest_price INTO v_latest_price
        FROM raw_materials
        WHERE id = v_material.material_id;
      END IF;

      -- 비례 계산
      IF v_latest_price IS NOT NULL AND v_material.standard_quantity > 0 THEN
        v_calculated_cost := v_calculated_cost +
          (v_material.quantity / v_material.standard_quantity * v_latest_price);
      END IF;
    END;
  END LOOP;

  RETURN v_calculated_cost;
END;
$$ LANGUAGE plpgsql;

-- 판매가 자동 계산 함수 (원가 + 마진율)
CREATE OR REPLACE FUNCTION calculate_auto_price(
  p_total_cost NUMERIC,
  p_margin_rate NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_margin_rate = 0 THEN
    RETURN p_total_cost;
  END IF;

  -- 마진율 = (판매가 - 원가) / 판매가 * 100
  -- 판매가 = 원가 / (1 - 마진율/100)
  RETURN ROUND(p_total_cost / (1 - p_margin_rate / 100), 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: 트리거 함수 (옵션상품 저장 시 자동 계산)
-- ============================================

CREATE OR REPLACE FUNCTION update_option_product_prices()
RETURNS TRIGGER AS $$
DECLARE
  v_material_cost NUMERIC;
  v_total_cost NUMERIC;
BEGIN
  -- 1. 원물가 계산 (정책에 따라)
  v_material_cost := calculate_material_cost(NEW.id);
  NEW.raw_material_cost := v_material_cost;

  -- 2. 총 원가 계산
  v_total_cost := v_material_cost +
                  COALESCE(NEW.packaging_box_price, 0) +
                  COALESCE(NEW.cushioning_price, 0) +
                  COALESCE(NEW.labor_cost, 0) +
                  COALESCE(NEW.pack_price, 0) +
                  COALESCE(NEW.bag_vinyl_price, 0) +
                  COALESCE(NEW.sticker_price, 0) +
                  COALESCE(NEW.ice_pack_price, 0) +
                  COALESCE(NEW.other_material_price, 0);

  NEW.total_cost := v_total_cost;

  -- 3. 자동 가격 계산 (마진율 기반)
  -- 셀러공급가
  IF NEW.seller_supply_price_mode = '자동' THEN
    NEW.seller_supply_auto_price := calculate_auto_price(v_total_cost, COALESCE(NEW.seller_margin_rate, 10));
    NEW.seller_supply_price := NEW.seller_supply_auto_price;
  ELSE
    NEW.seller_supply_price := COALESCE(NEW.seller_supply_manual_price, 0);
  END IF;

  -- 네이버 가격
  IF NEW.naver_price_mode = '자동' THEN
    NEW.naver_paid_shipping_auto := calculate_auto_price(v_total_cost, COALESCE(NEW.target_margin_rate, 20));
    NEW.naver_free_shipping_auto := calculate_auto_price(v_total_cost + COALESCE(NEW.shipping_fee, 0), COALESCE(NEW.target_margin_rate, 20));
    NEW.naver_paid_shipping_price := NEW.naver_paid_shipping_auto;
    NEW.naver_free_shipping_price := NEW.naver_free_shipping_auto;
  ELSE
    NEW.naver_paid_shipping_price := COALESCE(NEW.naver_paid_shipping_manual, 0);
    NEW.naver_free_shipping_price := COALESCE(NEW.naver_free_shipping_manual, 0);
  END IF;

  -- 쿠팡 가격
  IF NEW.coupang_price_mode = '자동' THEN
    NEW.coupang_paid_shipping_auto := calculate_auto_price(v_total_cost, COALESCE(NEW.target_margin_rate, 20));
    NEW.coupang_free_shipping_auto := calculate_auto_price(v_total_cost + COALESCE(NEW.shipping_fee, 0), COALESCE(NEW.target_margin_rate, 20));
    NEW.coupang_paid_shipping_price := NEW.coupang_paid_shipping_auto;
    NEW.coupang_free_shipping_price := NEW.coupang_free_shipping_auto;
  ELSE
    NEW.coupang_paid_shipping_price := COALESCE(NEW.coupang_paid_shipping_manual, 0);
    NEW.coupang_free_shipping_price := COALESCE(NEW.coupang_free_shipping_manual, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (INSERT/UPDATE 시 자동 계산)
DROP TRIGGER IF EXISTS trigger_update_option_product_prices ON option_products;
CREATE TRIGGER trigger_update_option_product_prices
  BEFORE INSERT OR UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION update_option_product_prices();

-- ============================================
-- STEP 6: 시세 변경 시 옵션상품 가격 일괄 업데이트 함수
-- ============================================

CREATE OR REPLACE FUNCTION update_option_prices_by_material(
  p_material_id UUID
) RETURNS TABLE(
  updated_count INTEGER,
  option_product_ids UUID[]
) AS $$
DECLARE
  v_option_ids UUID[];
  v_count INTEGER;
BEGIN
  -- 해당 원물을 사용하며 auto 정책인 옵션상품 찾기
  SELECT ARRAY_AGG(DISTINCT op.id)
  INTO v_option_ids
  FROM option_products op
  JOIN option_product_materials opm ON opm.option_product_id = op.id
  WHERE opm.material_id = p_material_id
    AND op.material_cost_policy = 'auto';

  -- 가격 재계산 (트리거가 자동 실행됨)
  UPDATE option_products
  SET updated_at = NOW()
  WHERE id = ANY(v_option_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count, v_option_ids;
END;
$$ LANGUAGE plpgsql;

-- 완료
SELECT '✅ 옵션상품 가격 구조 리팩토링 완료!' as result;
SELECT '- material_cost_policy 컬럼 추가 (auto/fixed)' as step_1;
SELECT '- 가격 자동 계산 함수 및 트리거 생성' as step_2;
SELECT '- 시세 변경 시 일괄 업데이트 함수 생성' as step_3;
