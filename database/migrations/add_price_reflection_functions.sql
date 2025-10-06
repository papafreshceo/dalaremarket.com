-- ============================================
-- 시세 반영 시스템 - 3단계 선택 지원
-- ============================================
-- 1단계: 원물가 반영
-- 2단계: 셀러공급가 반영 (상품별 선택)
-- 3단계: 직접판매가 반영 (상품별 선택)
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
  '원물가 정책: auto=시세 반영 가능, fixed=고정가 (시세 무시)';
COMMENT ON COLUMN option_products.fixed_material_cost IS
  '고정 원물가';

-- 기존 데이터 초기화
UPDATE option_products
SET material_cost_policy = 'auto',
    fixed_material_cost = COALESCE(raw_material_cost, 0)
WHERE material_cost_policy IS NULL;

-- ============================================
-- STEP 2: 1단계 - 영향받는 옵션상품 조회
-- ============================================

CREATE OR REPLACE FUNCTION get_affected_option_products(
  p_material_id UUID
) RETURNS TABLE(
  option_product_id UUID,
  option_name TEXT,
  material_cost_policy TEXT,
  current_material_cost NUMERIC,
  new_material_cost NUMERIC,
  current_total_cost NUMERIC,
  new_total_cost NUMERIC,
  seller_mode TEXT,
  naver_mode TEXT,
  coupang_mode TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_price AS (
    SELECT price
    FROM material_price_history
    WHERE material_id = p_material_id
    ORDER BY effective_date DESC, created_at DESC
    LIMIT 1
  ),
  affected AS (
    SELECT DISTINCT op.id
    FROM option_products op
    JOIN option_product_materials opm ON opm.option_product_id = op.id
    WHERE opm.material_id = p_material_id
      AND op.material_cost_policy = 'auto'
  )
  SELECT
    op.id,
    op.option_name,
    op.material_cost_policy,
    op.raw_material_cost,
    -- 새 원물가 계산
    (
      SELECT SUM(
        (opm2.quantity / rm.standard_quantity) *
        COALESCE(
          (SELECT price FROM material_price_history mph
           WHERE mph.material_id = opm2.material_id
           ORDER BY effective_date DESC, created_at DESC
           LIMIT 1),
          rm.latest_price,
          0
        )
      )
      FROM option_product_materials opm2
      JOIN raw_materials rm ON rm.id = opm2.material_id
      WHERE opm2.option_product_id = op.id
    ) AS new_material_cost,
    op.total_cost,
    -- 새 총원가 계산
    (
      SELECT SUM(
        (opm2.quantity / rm.standard_quantity) *
        COALESCE(
          (SELECT price FROM material_price_history mph
           WHERE mph.material_id = opm2.material_id
           ORDER BY effective_date DESC, created_at DESC
           LIMIT 1),
          rm.latest_price,
          0
        )
      )
      FROM option_product_materials opm2
      JOIN raw_materials rm ON rm.id = opm2.material_id
      WHERE opm2.option_product_id = op.id
    ) +
    COALESCE(op.packaging_box_price, 0) +
    COALESCE(op.cushioning_price, 0) +
    COALESCE(op.labor_cost, 0) +
    COALESCE(op.pack_price, 0) +
    COALESCE(op.bag_vinyl_price, 0) +
    COALESCE(op.sticker_price, 0) +
    COALESCE(op.ice_pack_price, 0) +
    COALESCE(op.other_material_price, 0) AS new_total_cost,
    op.seller_supply_price_mode,
    op.naver_price_mode,
    op.coupang_price_mode
  FROM option_products op
  WHERE op.id IN (SELECT id FROM affected);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: 2단계 - 원가 반영 후 셀러공급가 미리보기
-- ============================================

CREATE OR REPLACE FUNCTION preview_seller_prices(
  p_option_product_ids UUID[]
) RETURNS TABLE(
  option_product_id UUID,
  option_name TEXT,
  seller_mode TEXT,
  current_seller_price NUMERIC,
  new_auto_price NUMERIC,
  can_auto_apply BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    op.id,
    op.option_name,
    op.seller_supply_price_mode,
    op.seller_supply_price,
    -- 새 자동 가격 계산 (업데이트된 total_cost 기준)
    ROUND(
      op.total_cost / (1 - COALESCE(op.seller_margin_rate, 10) / 100.0),
      0
    )::NUMERIC AS new_auto_price,
    (op.seller_supply_price_mode = '자동') AS can_auto_apply
  FROM option_products op
  WHERE op.id = ANY(p_option_product_ids);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: 3단계 - 직접판매가 미리보기
-- ============================================

CREATE OR REPLACE FUNCTION preview_direct_prices(
  p_option_product_ids UUID[]
) RETURNS TABLE(
  option_product_id UUID,
  option_name TEXT,
  naver_mode TEXT,
  current_naver_paid NUMERIC,
  new_naver_paid_auto NUMERIC,
  current_naver_free NUMERIC,
  new_naver_free_auto NUMERIC,
  coupang_mode TEXT,
  current_coupang_paid NUMERIC,
  new_coupang_paid_auto NUMERIC,
  current_coupang_free NUMERIC,
  new_coupang_free_auto NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    op.id,
    op.option_name,
    op.naver_price_mode,
    op.naver_paid_shipping_price,
    ROUND(
      op.total_cost / (1 - COALESCE(op.target_margin_rate, 20) / 100.0),
      0
    )::NUMERIC AS new_naver_paid_auto,
    op.naver_free_shipping_price,
    ROUND(
      (op.total_cost + COALESCE(op.shipping_fee, 0)) /
      (1 - COALESCE(op.target_margin_rate, 20) / 100.0),
      0
    )::NUMERIC AS new_naver_free_auto,
    op.coupang_price_mode,
    op.coupang_paid_shipping_price,
    ROUND(
      op.total_cost / (1 - COALESCE(op.target_margin_rate, 20) / 100.0),
      0
    )::NUMERIC AS new_coupang_paid_auto,
    op.coupang_free_shipping_price,
    ROUND(
      (op.total_cost + COALESCE(op.shipping_fee, 0)) /
      (1 - COALESCE(op.target_margin_rate, 20) / 100.0),
      0
    )::NUMERIC AS new_coupang_free_auto
  FROM option_products op
  WHERE op.id = ANY(p_option_product_ids);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: 실제 반영 함수들
-- ============================================

-- 5-1. 원물가만 반영
CREATE OR REPLACE FUNCTION apply_material_cost_update(
  p_option_product_ids UUID[]
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH new_costs AS (
    SELECT
      op.id,
      (
        SELECT SUM(
          (opm.quantity / rm.standard_quantity) *
          COALESCE(
            (SELECT price FROM material_price_history mph
             WHERE mph.material_id = opm.material_id
             ORDER BY effective_date DESC, created_at DESC
             LIMIT 1),
            rm.latest_price,
            0
          )
        )
        FROM option_product_materials opm
        JOIN raw_materials rm ON rm.id = opm.material_id
        WHERE opm.option_product_id = op.id
      ) AS new_material_cost
    FROM option_products op
    WHERE op.id = ANY(p_option_product_ids)
      AND op.material_cost_policy = 'auto'
  )
  UPDATE option_products op
  SET
    raw_material_cost = nc.new_material_cost,
    total_cost = nc.new_material_cost +
                 COALESCE(op.packaging_box_price, 0) +
                 COALESCE(op.cushioning_price, 0) +
                 COALESCE(op.labor_cost, 0) +
                 COALESCE(op.pack_price, 0) +
                 COALESCE(op.bag_vinyl_price, 0) +
                 COALESCE(op.sticker_price, 0) +
                 COALESCE(op.ice_pack_price, 0) +
                 COALESCE(op.other_material_price, 0),
    updated_at = NOW()
  FROM new_costs nc
  WHERE op.id = nc.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 5-2. 셀러공급가 반영
CREATE OR REPLACE FUNCTION apply_seller_price_update(
  p_updates JSONB  -- [{ id: UUID, action: 'keep' | 'auto_only' | 'switch_to_auto' }]
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_item JSONB;
  v_id UUID;
  v_action TEXT;
  v_new_auto_price NUMERIC;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_id := (v_item->>'id')::UUID;
    v_action := v_item->>'action';

    -- 새 자동 가격 계산
    SELECT ROUND(
      total_cost / (1 - COALESCE(seller_margin_rate, 10) / 100.0),
      0
    ) INTO v_new_auto_price
    FROM option_products
    WHERE id = v_id;

    CASE v_action
      WHEN 'keep' THEN
        -- 아무것도 안함
        NULL;

      WHEN 'auto_only' THEN
        -- auto 값만 업데이트, 최종가는 유지
        UPDATE option_products
        SET seller_supply_auto_price = v_new_auto_price,
            updated_at = NOW()
        WHERE id = v_id;
        v_count := v_count + 1;

      WHEN 'switch_to_auto' THEN
        -- 자동 모드로 전환하고 반영
        UPDATE option_products
        SET seller_supply_price_mode = '자동',
            seller_supply_auto_price = v_new_auto_price,
            seller_supply_price = v_new_auto_price,
            updated_at = NOW()
        WHERE id = v_id;
        v_count := v_count + 1;

      WHEN 'apply_auto' THEN
        -- 이미 자동 모드인 경우 (체크박스 선택됨)
        UPDATE option_products
        SET seller_supply_auto_price = v_new_auto_price,
            seller_supply_price = v_new_auto_price,
            updated_at = NOW()
        WHERE id = v_id;
        v_count := v_count + 1;
    END CASE;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 5-3. 직접판매가 반영
CREATE OR REPLACE FUNCTION apply_direct_price_update(
  p_updates JSONB  -- [{ id: UUID, naver_action: '...', coupang_action: '...' }]
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_item JSONB;
  v_id UUID;
  v_naver_action TEXT;
  v_coupang_action TEXT;
  v_product RECORD;
  v_naver_paid_auto NUMERIC;
  v_naver_free_auto NUMERIC;
  v_coupang_paid_auto NUMERIC;
  v_coupang_free_auto NUMERIC;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_id := (v_item->>'id')::UUID;
    v_naver_action := v_item->>'naver_action';
    v_coupang_action := v_item->>'coupang_action';

    -- 상품 정보 및 새 자동 가격 계산
    SELECT
      *,
      ROUND(total_cost / (1 - COALESCE(target_margin_rate, 20) / 100.0), 0) AS new_paid_auto,
      ROUND((total_cost + COALESCE(shipping_fee, 0)) / (1 - COALESCE(target_margin_rate, 20) / 100.0), 0) AS new_free_auto
    INTO v_product
    FROM option_products
    WHERE id = v_id;

    v_naver_paid_auto := v_product.new_paid_auto;
    v_naver_free_auto := v_product.new_free_auto;
    v_coupang_paid_auto := v_product.new_paid_auto;
    v_coupang_free_auto := v_product.new_free_auto;

    -- 네이버 처리
    CASE v_naver_action
      WHEN 'keep' THEN NULL;
      WHEN 'auto_only' THEN
        UPDATE option_products
        SET naver_paid_shipping_auto = v_naver_paid_auto,
            naver_free_shipping_auto = v_naver_free_auto,
            updated_at = NOW()
        WHERE id = v_id;
      WHEN 'switch_to_auto' THEN
        UPDATE option_products
        SET naver_price_mode = '자동',
            naver_paid_shipping_auto = v_naver_paid_auto,
            naver_free_shipping_auto = v_naver_free_auto,
            naver_paid_shipping_price = v_naver_paid_auto,
            naver_free_shipping_price = v_naver_free_auto,
            updated_at = NOW()
        WHERE id = v_id;
      WHEN 'apply_auto' THEN
        UPDATE option_products
        SET naver_paid_shipping_auto = v_naver_paid_auto,
            naver_free_shipping_auto = v_naver_free_auto,
            naver_paid_shipping_price = v_naver_paid_auto,
            naver_free_shipping_price = v_naver_free_auto,
            updated_at = NOW()
        WHERE id = v_id;
    END CASE;

    -- 쿠팡 처리
    CASE v_coupang_action
      WHEN 'keep' THEN NULL;
      WHEN 'auto_only' THEN
        UPDATE option_products
        SET coupang_paid_shipping_auto = v_coupang_paid_auto,
            coupang_free_shipping_auto = v_coupang_free_auto,
            updated_at = NOW()
        WHERE id = v_id;
      WHEN 'switch_to_auto' THEN
        UPDATE option_products
        SET coupang_price_mode = '자동',
            coupang_paid_shipping_auto = v_coupang_paid_auto,
            coupang_free_shipping_auto = v_coupang_free_auto,
            coupang_paid_shipping_price = v_coupang_paid_auto,
            coupang_free_shipping_price = v_coupang_free_auto,
            updated_at = NOW()
        WHERE id = v_id;
      WHEN 'apply_auto' THEN
        UPDATE option_products
        SET coupang_paid_shipping_auto = v_coupang_paid_auto,
            coupang_free_shipping_auto = v_coupang_free_auto,
            coupang_paid_shipping_price = v_coupang_paid_auto,
            coupang_free_shipping_price = v_coupang_free_auto,
            updated_at = NOW()
        WHERE id = v_id;
    END CASE;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 완료
SELECT '✅ 시세 반영 함수 생성 완료!' as result;
SELECT '사용법:' as usage;
SELECT '1단계: SELECT * FROM get_affected_option_products(원물ID)' as step1;
SELECT '2단계: SELECT * FROM preview_seller_prices(ARRAY[상품ID들])' as step2;
SELECT '3단계: SELECT * FROM preview_direct_prices(ARRAY[상품ID들])' as step3;
SELECT '반영: SELECT apply_material_cost_update(ARRAY[상품ID들])' as apply1;
SELECT '반영: SELECT apply_seller_price_update(''[{"id":"...","action":"..."}]''::jsonb)' as apply2;
SELECT '반영: SELECT apply_direct_price_update(''[{"id":"...","naver_action":"...","coupang_action":"..."}]''::jsonb)' as apply3;
