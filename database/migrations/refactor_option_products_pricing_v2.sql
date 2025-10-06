-- ============================================
-- 옵션상품 가격 구조 리팩토링 v2
-- ============================================
-- 핵심 원칙:
-- 1. 시세 기록과 판매가 반영은 완전히 분리
-- 2. 시세는 material_price_history에 계속 기록 (자동)
-- 3. 판매가 반영은 사용자가 명시적으로 선택 (수동)
-- ============================================

-- ============================================
-- STEP 1: 원물가 정책 컬럼 추가
-- ============================================

ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS material_cost_policy TEXT DEFAULT 'auto'
  CHECK (material_cost_policy IN ('auto', 'fixed'));

ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS fixed_material_cost NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN option_products.material_cost_policy IS
  '원물가 정책: auto=최신시세 사용 가능, fixed=고정가만 사용 (시세 변경시 자동 반영 안됨)';
COMMENT ON COLUMN option_products.fixed_material_cost IS
  '고정 원물가 (material_cost_policy=fixed일 때 사용)';

-- ============================================
-- STEP 2: 기존 데이터 마이그레이션
-- ============================================

UPDATE option_products
SET
  material_cost_policy = CASE
    WHEN seller_supply_price_mode = '수동' THEN 'fixed'
    ELSE 'auto'
  END,
  fixed_material_cost = COALESCE(raw_material_cost, 0)
WHERE material_cost_policy IS NULL;

-- ============================================
-- STEP 3: 원물가 계산 함수
-- ============================================

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

  -- fixed 정책이면 고정가 반환 (시세 무시)
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
    DECLARE
      v_latest_price NUMERIC;
    BEGIN
      -- 최신 시세 조회 (material_price_history에서)
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

-- ============================================
-- STEP 4: 판매가 자동 계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION calculate_auto_price(
  p_total_cost NUMERIC,
  p_margin_rate NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_margin_rate = 0 THEN
    RETURN p_total_cost;
  END IF;

  -- 마진율 공식: 판매가 = 원가 / (1 - 마진율/100)
  RETURN ROUND(p_total_cost / (1 - p_margin_rate / 100), 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: 옵션상품 가격 재계산 함수 (수동 호출용)
-- ============================================
-- 이 함수는 사용자가 명시적으로 "시세 반영" 버튼을 눌렀을 때만 실행

CREATE OR REPLACE FUNCTION recalculate_option_product_price(
  p_option_product_id UUID
) RETURNS TABLE(
  old_material_cost NUMERIC,
  new_material_cost NUMERIC,
  old_total_cost NUMERIC,
  new_total_cost NUMERIC,
  old_seller_price NUMERIC,
  new_seller_price NUMERIC
) AS $$
DECLARE
  v_product RECORD;
  v_new_material_cost NUMERIC;
  v_new_total_cost NUMERIC;
  v_new_seller_auto NUMERIC;
  v_new_naver_paid_auto NUMERIC;
  v_new_naver_free_auto NUMERIC;
  v_new_coupang_paid_auto NUMERIC;
  v_new_coupang_free_auto NUMERIC;
BEGIN
  -- 기존 값 조회
  SELECT * INTO v_product
  FROM option_products
  WHERE id = p_option_product_id;

  -- material_cost_policy가 'fixed'면 재계산 안함
  IF v_product.material_cost_policy = 'fixed' THEN
    RETURN QUERY SELECT
      v_product.raw_material_cost,
      v_product.raw_material_cost,
      v_product.total_cost,
      v_product.total_cost,
      v_product.seller_supply_price,
      v_product.seller_supply_price;
    RETURN;
  END IF;

  -- 새로운 원물가 계산 (최신 시세 기준)
  v_new_material_cost := calculate_material_cost(p_option_product_id);

  -- 새로운 총 원가 계산
  v_new_total_cost := v_new_material_cost +
                      COALESCE(v_product.packaging_box_price, 0) +
                      COALESCE(v_product.cushioning_price, 0) +
                      COALESCE(v_product.labor_cost, 0) +
                      COALESCE(v_product.pack_price, 0) +
                      COALESCE(v_product.bag_vinyl_price, 0) +
                      COALESCE(v_product.sticker_price, 0) +
                      COALESCE(v_product.ice_pack_price, 0) +
                      COALESCE(v_product.other_material_price, 0);

  -- 자동 가격들 재계산
  v_new_seller_auto := calculate_auto_price(v_new_total_cost, COALESCE(v_product.seller_margin_rate, 10));
  v_new_naver_paid_auto := calculate_auto_price(v_new_total_cost, COALESCE(v_product.target_margin_rate, 20));
  v_new_naver_free_auto := calculate_auto_price(v_new_total_cost + COALESCE(v_product.shipping_fee, 0), COALESCE(v_product.target_margin_rate, 20));
  v_new_coupang_paid_auto := calculate_auto_price(v_new_total_cost, COALESCE(v_product.target_margin_rate, 20));
  v_new_coupang_free_auto := calculate_auto_price(v_new_total_cost + COALESCE(v_product.shipping_fee, 0), COALESCE(v_product.target_margin_rate, 20));

  -- 업데이트
  UPDATE option_products SET
    raw_material_cost = v_new_material_cost,
    total_cost = v_new_total_cost,
    seller_supply_auto_price = v_new_seller_auto,
    seller_supply_price = CASE
      WHEN seller_supply_price_mode = '자동' THEN v_new_seller_auto
      ELSE seller_supply_price  -- 수동 모드면 기존 가격 유지
    END,
    naver_paid_shipping_auto = v_new_naver_paid_auto,
    naver_free_shipping_auto = v_new_naver_free_auto,
    naver_paid_shipping_price = CASE
      WHEN naver_price_mode = '자동' THEN v_new_naver_paid_auto
      ELSE naver_paid_shipping_price
    END,
    naver_free_shipping_price = CASE
      WHEN naver_price_mode = '자동' THEN v_new_naver_free_auto
      ELSE naver_free_shipping_price
    END,
    coupang_paid_shipping_auto = v_new_coupang_paid_auto,
    coupang_free_shipping_auto = v_new_coupang_free_auto,
    coupang_paid_shipping_price = CASE
      WHEN coupang_price_mode = '자동' THEN v_new_coupang_paid_auto
      ELSE coupang_paid_shipping_price
    END,
    coupang_free_shipping_price = CASE
      WHEN coupang_price_mode = '자동' THEN v_new_coupang_free_auto
      ELSE coupang_free_shipping_price
    END,
    updated_at = NOW()
  WHERE id = p_option_product_id;

  -- 결과 반환
  RETURN QUERY SELECT
    v_product.raw_material_cost AS old_material_cost,
    v_new_material_cost AS new_material_cost,
    v_product.total_cost AS old_total_cost,
    v_new_total_cost AS new_total_cost,
    v_product.seller_supply_price AS old_seller_price,
    CASE
      WHEN v_product.seller_supply_price_mode = '자동' THEN v_new_seller_auto
      ELSE v_product.seller_supply_price
    END AS new_seller_price;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: 특정 원물 사용 옵션상품 일괄 재계산
-- ============================================
-- 원물관리 페이지에서 "이 시세를 옵션상품에 반영" 버튼 클릭 시 사용

CREATE OR REPLACE FUNCTION recalculate_option_prices_by_material(
  p_material_id UUID,
  p_apply_filter TEXT DEFAULT 'auto_only'  -- 'auto_only' or 'all'
) RETURNS TABLE(
  option_product_id UUID,
  option_name TEXT,
  old_material_cost NUMERIC,
  new_material_cost NUMERIC,
  price_changed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH affected_products AS (
    SELECT DISTINCT op.id, op.option_name, op.material_cost_policy
    FROM option_products op
    JOIN option_product_materials opm ON opm.option_product_id = op.id
    WHERE opm.material_id = p_material_id
      AND (p_apply_filter = 'all' OR op.material_cost_policy = 'auto')
  ),
  recalculated AS (
    SELECT
      ap.id,
      ap.option_name,
      r.*
    FROM affected_products ap
    CROSS JOIN LATERAL recalculate_option_product_price(ap.id) r
    WHERE ap.material_cost_policy = 'auto'  -- fixed는 재계산 안함
  )
  SELECT
    id AS option_product_id,
    option_name,
    recalculated.old_material_cost,
    recalculated.new_material_cost,
    (recalculated.old_material_cost != recalculated.new_material_cost) AS price_changed
  FROM recalculated;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: 트리거 함수 (INSERT/UPDATE 시에만)
-- ============================================
-- 주의: 시세 변경으로는 트리거 실행 안됨!
-- 오직 옵션상품 자체를 수정할 때만 실행

CREATE OR REPLACE FUNCTION trigger_calculate_option_prices()
RETURNS TRIGGER AS $$
DECLARE
  v_material_cost NUMERIC;
  v_total_cost NUMERIC;
BEGIN
  -- 원물가 계산
  v_material_cost := calculate_material_cost(NEW.id);
  NEW.raw_material_cost := v_material_cost;

  -- 총 원가 계산
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

  -- 자동 가격 계산
  NEW.seller_supply_auto_price := calculate_auto_price(v_total_cost, COALESCE(NEW.seller_margin_rate, 10));
  NEW.naver_paid_shipping_auto := calculate_auto_price(v_total_cost, COALESCE(NEW.target_margin_rate, 20));
  NEW.naver_free_shipping_auto := calculate_auto_price(v_total_cost + COALESCE(NEW.shipping_fee, 0), COALESCE(NEW.target_margin_rate, 20));
  NEW.coupang_paid_shipping_auto := calculate_auto_price(v_total_cost, COALESCE(NEW.target_margin_rate, 20));
  NEW.coupang_free_shipping_auto := calculate_auto_price(v_total_cost + COALESCE(NEW.shipping_fee, 0), COALESCE(NEW.target_margin_rate, 20));

  -- 최종 가격 설정 (모드에 따라)
  IF NEW.seller_supply_price_mode = '자동' THEN
    NEW.seller_supply_price := NEW.seller_supply_auto_price;
  ELSE
    NEW.seller_supply_price := COALESCE(NEW.seller_supply_manual_price, 0);
  END IF;

  IF NEW.naver_price_mode = '자동' THEN
    NEW.naver_paid_shipping_price := NEW.naver_paid_shipping_auto;
    NEW.naver_free_shipping_price := NEW.naver_free_shipping_auto;
  ELSE
    NEW.naver_paid_shipping_price := COALESCE(NEW.naver_paid_shipping_manual, 0);
    NEW.naver_free_shipping_price := COALESCE(NEW.naver_free_shipping_manual, 0);
  END IF;

  IF NEW.coupang_price_mode = '자동' THEN
    NEW.coupang_paid_shipping_price := NEW.coupang_paid_shipping_auto;
    NEW.coupang_free_shipping_price := NEW.coupang_free_shipping_auto;
  ELSE
    NEW.coupang_paid_shipping_price := COALESCE(NEW.coupang_paid_shipping_manual, 0);
    NEW.coupang_free_shipping_price := COALESCE(NEW.coupang_free_shipping_manual, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_option_product_prices ON option_products;
CREATE TRIGGER trigger_update_option_product_prices
  BEFORE INSERT OR UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_option_prices();

-- 완료
SELECT '✅ 옵션상품 가격 구조 리팩토링 v2 완료!' as result;
SELECT '📌 핵심 변경사항:' as notice;
SELECT '  1. 시세 기록과 판매가 반영 완전 분리' as change_1;
SELECT '  2. 시세 반영은 사용자가 명시적으로 선택' as change_2;
SELECT '  3. recalculate_option_prices_by_material() 함수로 일괄 반영 가능' as change_3;
