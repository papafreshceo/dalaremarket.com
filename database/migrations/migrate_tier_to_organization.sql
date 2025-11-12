-- =====================================================
-- 티어 시스템을 조직(Organization) 단위로 전환
-- =====================================================
-- 작성일: 2025-11-12
-- 설명: 개인 단위 티어를 조직 단위로 통합
--       - 티어는 조직 단위로 부여
--       - 조직의 모든 멤버가 동일한 티어 혜택 적용
--       - 실적 기준(3개월)과 기여점수 기준 중 더 높은 등급 자동 선택
-- =====================================================

-- 1. organizations 테이블에 tier 관련 컬럼 추가
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS tier TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS is_manual_tier BOOLEAN DEFAULT FALSE;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS manual_tier_set_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS manual_tier_set_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_organizations_tier ON organizations(tier);
CREATE INDEX IF NOT EXISTS idx_organizations_is_manual_tier ON organizations(is_manual_tier);

COMMENT ON COLUMN organizations.tier IS '조직 등급 (LIGHT, STANDARD, ADVANCE, ELITE, LEGEND)';
COMMENT ON COLUMN organizations.tier_updated_at IS '등급 마지막 업데이트 시각';
COMMENT ON COLUMN organizations.is_manual_tier IS '수동 등급 설정 여부';
COMMENT ON COLUMN organizations.manual_tier_set_by IS '수동 등급 설정한 관리자 ID';
COMMENT ON COLUMN organizations.manual_tier_set_at IS '수동 등급 설정 시각';

-- 2. 조직 티어 계산 함수 (점수 + 실적 중 높은 등급 선택)
CREATE OR REPLACE FUNCTION calculate_and_update_organization_tier(p_organization_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_accumulated_points INTEGER;
  v_three_month_orders INTEGER;
  v_three_month_sales BIGINT;
  v_tier_by_points TEXT;
  v_tier_by_performance TEXT;
  v_final_tier TEXT;
  v_current_tier TEXT;
  v_is_manual BOOLEAN;
  v_tier_order TEXT[] := ARRAY['LIGHT', 'STANDARD', 'ADVANCE', 'ELITE', 'LEGEND'];
  v_points_index INTEGER;
  v_performance_index INTEGER;
  v_current_index INTEGER;
  v_final_index INTEGER;
BEGIN
  -- 1. 현재 조직 정보 조회
  SELECT
    COALESCE(accumulated_points, 0),
    tier,
    COALESCE(is_manual_tier, FALSE)
  INTO
    v_accumulated_points,
    v_current_tier,
    v_is_manual
  FROM organizations
  WHERE id = p_organization_id;

  IF NOT FOUND THEN
    RETURN 'ORGANIZATION_NOT_FOUND';
  END IF;

  -- 수동 설정이면 계산하지 않음
  IF v_is_manual = TRUE THEN
    RETURN 'MANUAL_TIER_SET';
  END IF;

  -- 2. 최근 3개월 실적 집계 (조직 기준, 한국 시간)
  SELECT
    COALESCE(SUM(order_count), 0),
    COALESCE(SUM(total_sales), 0)
  INTO
    v_three_month_orders,
    v_three_month_sales
  FROM seller_performance_daily
  WHERE organization_id = p_organization_id
    AND date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE - INTERVAL '3 months'
    AND date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE;

  -- 3. 기여점수 기준으로 등급 판정 (0점이면 등급 없음)
  IF v_accumulated_points > 0 THEN
    SELECT criteria->>'tier' INTO v_tier_by_points
    FROM tier_point_settings,
    LATERAL jsonb_array_elements(accumulated_point_criteria) AS criteria
    WHERE (criteria->>'requiredPoints')::INTEGER <= v_accumulated_points
    ORDER BY (criteria->>'requiredPoints')::INTEGER DESC
    LIMIT 1;
  ELSE
    v_tier_by_points := NULL;
  END IF;

  -- 4. 실적 기준으로 등급 판정 (3개월 누적, 실적이 0이면 등급 없음)
  IF v_three_month_orders > 0 OR v_three_month_sales > 0 THEN
    SELECT tier INTO v_tier_by_performance
    FROM tier_criteria
    WHERE min_order_count <= v_three_month_orders
      AND min_total_sales <= v_three_month_sales
      AND is_active = TRUE
    ORDER BY min_total_sales DESC, min_order_count DESC
    LIMIT 1;
  ELSE
    v_tier_by_performance := NULL;
  END IF;

  -- 5. 두 방식 중 더 높은 등급 선택
  -- 각 등급의 인덱스 조회 (NULL이면 0으로 처리)
  SELECT array_position(v_tier_order, v_tier_by_points) INTO v_points_index;
  SELECT array_position(v_tier_order, v_tier_by_performance) INTO v_performance_index;

  v_points_index := COALESCE(v_points_index, 0);
  v_performance_index := COALESCE(v_performance_index, 0);

  -- 두 방식 중 더 높은 등급 선택
  IF v_points_index >= v_performance_index THEN
    v_final_tier := v_tier_by_points;
    v_final_index := v_points_index;
  ELSE
    v_final_tier := v_tier_by_performance;
    v_final_index := v_performance_index;
  END IF;

  -- 6. 등급이 변경되었으면 업데이트
  IF (v_final_tier IS DISTINCT FROM v_current_tier) THEN
    SELECT array_position(v_tier_order, v_current_tier) INTO v_current_index;
    v_current_index := COALESCE(v_current_index, 0);

    UPDATE organizations
    SET
      tier = v_final_tier,
      tier_updated_at = NOW()
    WHERE id = p_organization_id;

    -- 승급인지 강등인지 구분
    IF v_final_index > v_current_index THEN
      RETURN 'UPGRADED:' || COALESCE(v_current_tier, 'NULL') || '->' || COALESCE(v_final_tier, 'NULL');
    ELSE
      RETURN 'DOWNGRADED:' || COALESCE(v_current_tier, 'NULL') || '->' || COALESCE(v_final_tier, 'NULL');
    END IF;
  END IF;

  RETURN 'NO_CHANGE:' || COALESCE(v_current_tier, 'NULL');
END;
$$ LANGUAGE plpgsql;

-- 3. 모든 조직 티어 재계산 함수
CREATE OR REPLACE FUNCTION recalculate_all_organization_tiers()
RETURNS TABLE(organization_id UUID, result TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    calculate_and_update_organization_tier(id)
  FROM organizations
  WHERE is_manual_tier = FALSE OR is_manual_tier IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. 수동 티어 설정 함수 (조직 기반)
CREATE OR REPLACE FUNCTION set_organization_manual_tier(
  p_organization_id UUID,
  p_tier TEXT,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_valid_tiers TEXT[] := ARRAY['LIGHT', 'STANDARD', 'ADVANCE', 'ELITE', 'LEGEND'];
BEGIN
  -- 티어 값 검증
  IF p_tier IS NOT NULL AND NOT (p_tier = ANY(v_valid_tiers)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '유효하지 않은 등급입니다.'
    );
  END IF;

  -- 조직 존재 확인
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '조직을 찾을 수 없습니다.'
    );
  END IF;

  -- 수동 티어 설정
  UPDATE organizations
  SET
    tier = p_tier,
    tier_updated_at = NOW(),
    is_manual_tier = TRUE,
    manual_tier_set_by = p_admin_id,
    manual_tier_set_at = NOW()
  WHERE id = p_organization_id;

  RETURN jsonb_build_object(
    'success', true,
    'tier', p_tier
  );
END;
$$ LANGUAGE plpgsql;

-- 5. 수동 티어 해제 함수 (자동 계산으로 복귀)
CREATE OR REPLACE FUNCTION remove_organization_manual_tier(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_new_tier TEXT;
BEGIN
  -- 조직 존재 확인
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '조직을 찾을 수 없습니다.'
    );
  END IF;

  -- 수동 설정 해제
  UPDATE organizations
  SET
    is_manual_tier = FALSE,
    manual_tier_set_by = NULL,
    manual_tier_set_at = NULL
  WHERE id = p_organization_id;

  -- 자동 계산으로 티어 재계산
  v_new_tier := calculate_and_update_organization_tier(p_organization_id);

  RETURN jsonb_build_object(
    'success', true,
    'result', v_new_tier
  );
END;
$$ LANGUAGE plpgsql;

-- 6. 사용자 기반 함수를 조직 기반으로 래핑 (하위 호환성)
-- 기존 calculate_and_update_user_tier 함수를 조직 기반으로 래핑
CREATE OR REPLACE FUNCTION calculate_and_update_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  -- 사용자의 조직 ID 조회
  SELECT primary_organization_id INTO v_organization_id
  FROM users
  WHERE id = p_user_id;

  IF v_organization_id IS NULL THEN
    RETURN 'USER_ORGANIZATION_NOT_FOUND';
  END IF;

  -- 조직 티어 계산 함수 호출
  RETURN calculate_and_update_organization_tier(v_organization_id);
END;
$$ LANGUAGE plpgsql;

-- 기존 recalculate_all_user_tiers 함수를 조직 기반으로 래핑
CREATE OR REPLACE FUNCTION recalculate_all_user_tiers()
RETURNS TABLE(user_id UUID, result TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    calculate_and_update_user_tier(u.id)
  FROM users u
  WHERE u.role = 'seller' AND u.primary_organization_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. 사용자 기반 수동 티어 함수 래핑 (하위 호환성)
CREATE OR REPLACE FUNCTION set_manual_tier(
  p_user_id UUID,
  p_tier TEXT,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  -- 사용자의 조직 ID 조회
  SELECT primary_organization_id INTO v_organization_id
  FROM users
  WHERE id = p_user_id;

  IF v_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '사용자의 조직을 찾을 수 없습니다.'
    );
  END IF;

  -- 조직 티어 설정 함수 호출
  RETURN set_organization_manual_tier(v_organization_id, p_tier, p_admin_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_manual_tier(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  -- 사용자의 조직 ID 조회
  SELECT primary_organization_id INTO v_organization_id
  FROM users
  WHERE id = p_user_id;

  IF v_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '사용자의 조직을 찾을 수 없습니다.'
    );
  END IF;

  -- 조직 티어 해제 함수 호출
  RETURN remove_organization_manual_tier(v_organization_id);
END;
$$ LANGUAGE plpgsql;

-- 8. 모든 조직의 초기 티어 계산
DO $$
DECLARE
  v_org_record RECORD;
  v_result TEXT;
  v_upgraded INTEGER := 0;
  v_downgraded INTEGER := 0;
  v_no_change INTEGER := 0;
  v_manual INTEGER := 0;
BEGIN
  RAISE NOTICE '조직 티어 초기 계산 시작...';

  FOR v_org_record IN
    SELECT id, name FROM organizations
  LOOP
    v_result := calculate_and_update_organization_tier(v_org_record.id);

    IF v_result LIKE 'UPGRADED:%' THEN
      v_upgraded := v_upgraded + 1;
      RAISE NOTICE '  ✅ [%] %', v_org_record.name, v_result;
    ELSIF v_result LIKE 'DOWNGRADED:%' THEN
      v_downgraded := v_downgraded + 1;
      RAISE NOTICE '  ⬇️  [%] %', v_org_record.name, v_result;
    ELSIF v_result = 'MANUAL_TIER_SET' THEN
      v_manual := v_manual + 1;
      RAISE NOTICE '  🔒 [%] 수동 설정', v_org_record.name;
    ELSE
      v_no_change := v_no_change + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '초기 티어 계산 완료:';
  RAISE NOTICE '  - 신규/승급: %', v_upgraded;
  RAISE NOTICE '  - 강등: %', v_downgraded;
  RAISE NOTICE '  - 변경 없음: %', v_no_change;
  RAISE NOTICE '  - 수동 설정: %', v_manual;
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
  v_org_count INTEGER;
  v_tier_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_org_count FROM organizations;
  SELECT COUNT(*) INTO v_tier_count FROM organizations WHERE tier IS NOT NULL;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '티어 시스템 조직 단위 전환 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '총 조직 수: %', v_org_count;
  RAISE NOTICE '티어 보유 조직: %', v_tier_count;
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- organizations 테이블에 tier 컬럼 추가';
  RAISE NOTICE '- 조직별 티어 자동/수동 관리 기능';
  RAISE NOTICE '- 점수 및 실적 기준 중 높은 등급 자동 선택';
  RAISE NOTICE '- 기존 함수들을 조직 기반으로 래핑 (하위 호환)';
  RAISE NOTICE '=================================================';
END $$;
