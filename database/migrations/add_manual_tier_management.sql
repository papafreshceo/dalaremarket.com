-- 관리자 수동 등급 부여 시스템
-- manual_tier가 설정되어 있으면 자동 계산 무시

-- 1. users 테이블에 수동 등급 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS manual_tier TEXT,
ADD COLUMN IF NOT EXISTS manual_tier_set_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS manual_tier_set_by UUID;

-- 2. manual_tier에 대한 체크 제약 추가
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_manual_tier_check;

ALTER TABLE users
ADD CONSTRAINT users_manual_tier_check
CHECK (manual_tier IS NULL OR manual_tier IN ('light', 'standard', 'advance', 'elite', 'legend'));

-- 3. 등급 계산 함수 수정 (manual_tier 우선 적용)
-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS calculate_and_update_user_tier(UUID);

CREATE OR REPLACE FUNCTION calculate_and_update_user_tier(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_accumulated_points INTEGER;
  v_three_month_orders INTEGER;
  v_three_month_sales NUMERIC;
  v_tier_by_points TEXT;
  v_tier_by_performance TEXT;
  v_final_tier TEXT;
  v_manual_tier TEXT;
  v_tier_method TEXT;
BEGIN
  -- 수동 등급이 설정되어 있는지 확인
  SELECT manual_tier INTO v_manual_tier
  FROM users
  WHERE id = p_user_id;

  -- 수동 등급이 있으면 그대로 사용
  IF v_manual_tier IS NOT NULL THEN
    RETURN jsonb_build_object(
      'user_id', p_user_id,
      'tier', v_manual_tier,
      'method', 'manual',
      'message', '관리자가 직접 부여한 등급입니다'
    );
  END IF;

  -- 이하 기존 자동 계산 로직
  -- 1. 사용자 정보 조회
  SELECT accumulated_points INTO v_accumulated_points
  FROM users
  WHERE id = p_user_id;

  -- 2. 최근 3개월 주문 실적 계산
  SELECT
    COUNT(*) AS order_count,
    COALESCE(SUM(total_price), 0) AS total_sales
  INTO v_three_month_orders, v_three_month_sales
  FROM integrated_orders
  WHERE seller_id = p_user_id
    AND is_deleted = false
    AND order_date >= (CURRENT_DATE - INTERVAL '3 months');

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

  -- 5. 최종 등급 결정 (둘 중 높은 등급 선택)
  v_final_tier := CASE
    WHEN v_tier_by_points IS NULL AND v_tier_by_performance IS NULL THEN NULL
    WHEN v_tier_by_points IS NULL THEN v_tier_by_performance
    WHEN v_tier_by_performance IS NULL THEN v_tier_by_points
    WHEN v_tier_by_points = 'legend' OR v_tier_by_performance = 'legend' THEN 'legend'
    WHEN v_tier_by_points = 'elite' OR v_tier_by_performance = 'elite' THEN 'elite'
    WHEN v_tier_by_points = 'advance' OR v_tier_by_performance = 'advance' THEN 'advance'
    WHEN v_tier_by_points = 'standard' OR v_tier_by_performance = 'standard' THEN 'standard'
    ELSE 'light'
  END;

  -- 등급 결정 방식
  IF v_tier_by_points = v_final_tier AND v_tier_by_performance = v_final_tier THEN
    v_tier_method := 'both';
  ELSIF v_tier_by_points = v_final_tier THEN
    v_tier_method := 'points';
  ELSE
    v_tier_method := 'performance';
  END IF;

  -- 6. users 테이블 업데이트 (tier만 업데이트, manual_tier는 건드리지 않음)
  UPDATE users
  SET tier = v_final_tier
  WHERE id = p_user_id;

  -- 7. 결과 반환
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'tier', v_final_tier,
    'tier_by_points', v_tier_by_points,
    'tier_by_performance', v_tier_by_performance,
    'method', v_tier_method,
    'accumulated_points', v_accumulated_points,
    'three_month_orders', v_three_month_orders,
    'three_month_sales', v_three_month_sales
  );
END;
$$ LANGUAGE plpgsql;

-- 4. 수동 등급 부여 함수
CREATE OR REPLACE FUNCTION set_manual_tier(
  p_user_id UUID,
  p_tier TEXT,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 등급 값 검증
  IF p_tier IS NOT NULL AND p_tier NOT IN ('light', 'standard', 'advance', 'elite', 'legend') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '유효하지 않은 등급입니다'
    );
  END IF;

  -- 수동 등급 설정
  UPDATE users
  SET
    manual_tier = p_tier,
    tier = p_tier,  -- 실제 tier도 같이 업데이트
    manual_tier_set_at = CURRENT_TIMESTAMP,
    manual_tier_set_by = p_admin_id
  WHERE id = p_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'user_id', p_user_id,
      'tier', p_tier,
      'message', CASE
        WHEN p_tier IS NULL THEN '자동 등급 계산으로 전환되었습니다'
        ELSE '등급이 수동으로 설정되었습니다'
      END
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', '사용자를 찾을 수 없습니다'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 수동 등급 해제 함수 (자동 계산으로 복귀)
CREATE OR REPLACE FUNCTION remove_manual_tier(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  -- manual_tier 제거
  UPDATE users
  SET
    manual_tier = NULL,
    manual_tier_set_at = NULL,
    manual_tier_set_by = NULL
  WHERE id = p_user_id;

  -- 자동 등급 계산 수행
  RETURN calculate_and_update_user_tier(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- 사용 예시:
-- 수동 등급 부여: SELECT set_manual_tier('user-id', 'elite', 'admin-id');
-- 수동 등급 해제: SELECT remove_manual_tier('user-id');
-- 등급 계산 (수동 등급이 있으면 무시): SELECT calculate_and_update_user_tier('user-id');
