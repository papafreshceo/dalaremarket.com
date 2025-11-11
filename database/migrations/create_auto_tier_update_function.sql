-- 사용자 등급 자동 계산 함수
-- 실적방식(3개월 누적)과 기여점수방식(누적) 중 더 높은 등급 자동 선택

CREATE OR REPLACE FUNCTION calculate_and_update_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_accumulated_points INTEGER;
  v_three_month_orders INTEGER;
  v_three_month_sales BIGINT;
  v_tier_by_points TEXT;
  v_tier_by_performance TEXT;
  v_final_tier TEXT;
  v_current_tier TEXT;
  v_tier_order TEXT[] := ARRAY['LIGHT', 'STANDARD', 'ADVANCE', 'ELITE', 'LEGEND'];
  v_points_index INTEGER;
  v_performance_index INTEGER;
  v_current_index INTEGER;
  v_final_index INTEGER;
BEGIN
  -- 1. 현재 사용자 정보 조회
  SELECT
    COALESCE(accumulated_points, 0),
    tier
  INTO
    v_accumulated_points,
    v_current_tier
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'USER_NOT_FOUND';
  END IF;

  -- 2. 최근 3개월 실적 집계 (한국 시간 기준)
  -- date 컬럼은 KST 기준 날짜 (YYYY-MM-DD)로 저장됨
  -- 현재 시각을 한국 시간으로 변환하여 비교
  SELECT
    COALESCE(SUM(order_count), 0),
    COALESCE(SUM(total_sales), 0)
  INTO
    v_three_month_orders,
    v_three_month_sales
  FROM seller_performance_daily
  WHERE seller_id = p_user_id
    AND date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE - INTERVAL '3 months'
    AND date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE;

  -- 3. 기여점수 기준으로 등급 판정 (0점이면 등급 없음)
  IF v_accumulated_points > 0 THEN
    SELECT tier INTO v_tier_by_points
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
    ORDER BY min_total_sales DESC, min_order_count DESC
    LIMIT 1;
  ELSE
    v_tier_by_performance := NULL;
  END IF;

  -- 5. 두 방식 중 더 높은 등급 선택 (강등도 포함)
  -- 조건 미달 시 NULL(무등급)로 처리
  -- v_tier_by_points와 v_tier_by_performance 모두 NULL일 수 있음

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

  -- 6. 등급이 변경되었으면 업데이트 (NULL 비교 처리)
  IF (v_final_tier IS DISTINCT FROM v_current_tier) THEN
    SELECT array_position(v_tier_order, v_current_tier) INTO v_current_index;
    v_current_index := COALESCE(v_current_index, 0);

    UPDATE users
    SET tier = v_final_tier
    WHERE id = p_user_id;

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

-- 사용 예시:
-- SELECT calculate_and_update_user_tier('user-id-here');

-- 모든 사용자 등급 재계산 함수
CREATE OR REPLACE FUNCTION recalculate_all_user_tiers()
RETURNS TABLE(user_id UUID, result TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    calculate_and_update_user_tier(id)
  FROM users
  WHERE role = 'seller';
END;
$$ LANGUAGE plpgsql;

-- 사용 예시 (모든 셀러 재계산):
-- SELECT * FROM recalculate_all_user_tiers();
