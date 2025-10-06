-- ============================================
-- 옵션상품 가격 자동 계산 트리거
-- ============================================
-- 원물 시세 기록 → 원물비용 계산 → 판매가 자동 계산
-- ============================================

-- ============================================
-- 함수 1: 옵션상품의 원물비용 계산
-- ============================================
CREATE OR REPLACE FUNCTION calculate_raw_material_cost(p_option_product_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_cost NUMERIC := 0;
  v_material RECORD;
BEGIN
  -- option_product_materials에서 사용 원물과 수량 조회
  FOR v_material IN
    SELECT
      opm.quantity,
      rm.latest_price,
      rm.standard_quantity,
      rm.standard_unit
    FROM option_product_materials opm
    JOIN raw_materials rm ON opm.raw_material_id = rm.id
    WHERE opm.option_product_id = p_option_product_id
  LOOP
    -- 원물비용 = 최신시세 × (사용량 / 표준수량)
    -- 예: 딸기 200g 사용, 시세 5000원/kg(1000g) → 5000 × (200/1000) = 1000원
    v_total_cost := v_total_cost + (
      COALESCE(v_material.latest_price, 0) *
      (COALESCE(v_material.quantity, 0) / NULLIF(COALESCE(v_material.standard_quantity, 1), 0))
    );
  END LOOP;

  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 함수 2: 옵션상품의 판매가 자동 계산
-- ============================================
CREATE OR REPLACE FUNCTION calculate_option_product_prices()
RETURNS TRIGGER AS $$
DECLARE
  v_effective_raw_cost NUMERIC;
  v_total_cost NUMERIC;
BEGIN
  -- 1. 원물가 정책에 따른 원물비용 결정
  IF NEW.material_cost_policy = 'fixed' THEN
    v_effective_raw_cost := COALESCE(NEW.fixed_material_cost, 0);
  ELSE
    v_effective_raw_cost := COALESCE(NEW.raw_material_cost, 0);
  END IF;

  -- 2. total_cost는 GENERATED COLUMN이므로 자동 계산됨
  -- total_cost = total_material_cost + raw_material_cost

  -- 3. 셀러공급가 계산 (자동 모드일 때만)
  IF NEW.seller_supply_price_mode = '자동' THEN
    -- total_cost를 계산 (GENERATED COLUMN은 아직 계산 안됨)
    v_total_cost := COALESCE(NEW.total_material_cost, 0) + v_effective_raw_cost;

    NEW.seller_supply_price := ROUND(
      v_total_cost * (1 + COALESCE(NEW.seller_margin_rate, 10) / 100.0)
    );
  END IF;

  -- 4. 네이버 판매가 계산 (자동 모드일 때만)
  IF NEW.naver_price_mode = '자동' THEN
    NEW.naver_paid_shipping_price := ROUND(
      COALESCE(NEW.seller_supply_price, 0) * (1 + COALESCE(NEW.target_margin_rate, 20) / 100.0)
    );
    NEW.naver_free_shipping_price := ROUND(
      COALESCE(NEW.naver_paid_shipping_price, 0) + COALESCE(NEW.shipping_fee, 0)
    );
  END IF;

  -- 5. 쿠팡 판매가 계산 (자동 모드일 때만)
  IF NEW.coupang_price_mode = '자동' THEN
    NEW.coupang_paid_shipping_price := ROUND(
      COALESCE(NEW.seller_supply_price, 0) * (1 + COALESCE(NEW.target_margin_rate, 20) / 100.0)
    );
    NEW.coupang_free_shipping_price := ROUND(
      COALESCE(NEW.coupang_paid_shipping_price, 0) + COALESCE(NEW.shipping_fee, 0)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 1: 옵션상품 INSERT/UPDATE 시 가격 자동 계산
-- ============================================
DROP TRIGGER IF EXISTS trigger_calculate_prices ON option_products;
CREATE TRIGGER trigger_calculate_prices
  BEFORE INSERT OR UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_option_product_prices();

-- ============================================
-- 함수 3: 원물 구성 변경 시 원물비용 재계산
-- ============================================
CREATE OR REPLACE FUNCTION recalculate_raw_material_cost_on_materials_change()
RETURNS TRIGGER AS $$
DECLARE
  v_option_product_id UUID;
BEGIN
  -- INSERT/UPDATE의 경우 NEW, DELETE의 경우 OLD 사용
  IF TG_OP = 'DELETE' THEN
    v_option_product_id := OLD.option_product_id;
  ELSE
    v_option_product_id := NEW.option_product_id;
  END IF;

  -- 옵션상품의 원물비용 재계산 및 업데이트
  UPDATE option_products
  SET raw_material_cost = calculate_raw_material_cost(v_option_product_id)
  WHERE id = v_option_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 2: 원물 구성 변경 시 원물비용 재계산
-- ============================================
DROP TRIGGER IF EXISTS trigger_recalc_on_materials_change ON option_product_materials;
CREATE TRIGGER trigger_recalc_on_materials_change
  AFTER INSERT OR UPDATE OR DELETE ON option_product_materials
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_raw_material_cost_on_materials_change();

-- ============================================
-- 함수 4: 원물 시세 변경 시 관련 옵션상품 원물비용 재계산
-- ============================================
CREATE OR REPLACE FUNCTION recalculate_on_raw_material_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 이 원물을 사용하는 모든 옵션상품의 원물비용 재계산
  UPDATE option_products op
  SET raw_material_cost = calculate_raw_material_cost(op.id)
  WHERE op.id IN (
    SELECT DISTINCT option_product_id
    FROM option_product_materials
    WHERE raw_material_id = NEW.id
  )
  AND op.material_cost_policy = 'auto';  -- 자동 모드인 상품만

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거 3: 원물 시세 변경 시 관련 옵션상품 재계산
-- ============================================
DROP TRIGGER IF EXISTS trigger_recalc_on_price_change ON raw_materials;
CREATE TRIGGER trigger_recalc_on_price_change
  AFTER UPDATE OF latest_price ON raw_materials
  FOR EACH ROW
  WHEN (OLD.latest_price IS DISTINCT FROM NEW.latest_price)
  EXECUTE FUNCTION recalculate_on_raw_material_price_change();

-- ============================================
-- 완료
-- ============================================
SELECT '✅ 가격 자동 계산 트리거 생성 완료!' as result;
SELECT '📊 이제 원물 시세를 기록하면 자동으로 옵션상품 가격이 계산됩니다.' as info;
