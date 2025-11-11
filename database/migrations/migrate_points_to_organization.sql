-- =====================================================
-- 기여점수를 조직(Organization) 단위로 전환
-- =====================================================
-- 작성일: 2025-11-12
-- 설명: 개인 단위 기여점수를 조직 단위로 통합
--       - 조직의 모든 멤버 활동이 조직 점수로 적립
--       - 로그인, 주문, 댓글 등 모든 활동
-- =====================================================

-- 1. organizations 테이블에 accumulated_points 추가
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS accumulated_points INTEGER DEFAULT 0;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS last_login_date DATE;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS last_order_date DATE;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS last_comment_date DATE;

CREATE INDEX IF NOT EXISTS idx_organizations_accumulated_points
  ON organizations(accumulated_points DESC);

COMMENT ON COLUMN organizations.accumulated_points IS '조직 누적 기여 점수';
COMMENT ON COLUMN organizations.last_login_date IS '조직 마지막 로그인 날짜';
COMMENT ON COLUMN organizations.last_order_date IS '조직 마지막 주문 날짜';
COMMENT ON COLUMN organizations.last_comment_date IS '조직 마지막 댓글 날짜';

-- 2. 기존 사용자 점수를 조직 점수로 통합
DO $$
DECLARE
  v_org RECORD;
  v_total_points INTEGER;
  v_earliest_login_date DATE;
  v_earliest_order_date DATE;
BEGIN
  FOR v_org IN
    SELECT id FROM organizations
  LOOP
    -- 조직 소속 멤버들의 총 점수 합산
    SELECT COALESCE(SUM(accumulated_points), 0) INTO v_total_points
    FROM users
    WHERE primary_organization_id = v_org.id;

    -- 가장 빠른 활동 날짜 찾기
    SELECT MIN(last_login_date) INTO v_earliest_login_date
    FROM users
    WHERE primary_organization_id = v_org.id;

    SELECT MIN(last_order_date) INTO v_earliest_order_date
    FROM users
    WHERE primary_organization_id = v_org.id;

    -- 조직에 점수 적용
    UPDATE organizations
    SET
      accumulated_points = v_total_points,
      last_login_date = v_earliest_login_date,
      last_order_date = v_earliest_order_date
    WHERE id = v_org.id;
  END LOOP;
END $$;

-- 3. 로그인 점수 함수를 조직 기반으로 수정
CREATE OR REPLACE FUNCTION add_login_points(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_today DATE;
  v_last_login_date DATE;
  v_login_points INTEGER;
  v_new_points INTEGER;
  v_organization_id UUID;
BEGIN
  -- 오늘 날짜 (한국 시간 기준)
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE;

  -- 사용자의 조직 ID 조회
  SELECT primary_organization_id INTO v_organization_id
  FROM users
  WHERE id = p_user_id;

  IF v_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'points_added', 0,
      'new_total', 0,
      'message', '조직 정보를 찾을 수 없습니다'
    );
  END IF;

  -- 로그인 점수 설정 조회
  SELECT login_points_per_day INTO v_login_points
  FROM tier_point_settings
  WHERE setting_key = 'default'
  LIMIT 1;

  -- 기본값 설정
  v_login_points := COALESCE(v_login_points, 1);

  -- 조직의 마지막 로그인 날짜 조회
  SELECT last_login_date INTO v_last_login_date
  FROM organizations
  WHERE id = v_organization_id;

  -- 오늘 처음 로그인한 경우에만 점수 증가
  IF v_last_login_date IS NULL OR v_last_login_date < v_today THEN
    UPDATE organizations
    SET
      accumulated_points = COALESCE(accumulated_points, 0) + v_login_points,
      last_login_date = v_today
    WHERE id = v_organization_id
    RETURNING accumulated_points INTO v_new_points;

    RETURN jsonb_build_object(
      'success', true,
      'points_added', v_login_points,
      'new_total', v_new_points,
      'message', '로그인 점수가 조직에 적용되었습니다'
    );
  ELSE
    -- 이미 오늘 로그인한 경우
    SELECT accumulated_points INTO v_new_points
    FROM organizations
    WHERE id = v_organization_id;

    RETURN jsonb_build_object(
      'success', false,
      'points_added', 0,
      'new_total', v_new_points,
      'message', '오늘 이미 조직에서 로그인 점수를 받았습니다'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 주문 점수 함수를 조직 기반으로 수정
CREATE OR REPLACE FUNCTION add_order_points(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_today DATE;
  v_last_order_date DATE;
  v_order_points INTEGER;
  v_new_points INTEGER;
  v_organization_id UUID;
BEGIN
  -- 오늘 날짜 (한국 시간 기준)
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE;

  -- 사용자의 조직 ID 조회
  SELECT primary_organization_id INTO v_organization_id
  FROM users
  WHERE id = p_user_id;

  IF v_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'points_added', 0,
      'new_total', 0,
      'message', '조직 정보를 찾을 수 없습니다'
    );
  END IF;

  -- 발주일 점수 설정 조회
  SELECT points_per_day INTO v_order_points
  FROM tier_point_settings
  WHERE setting_key = 'default'
  LIMIT 1;

  -- 기본값 설정
  v_order_points := COALESCE(v_order_points, 10);

  -- 조직의 마지막 주문 날짜 조회
  SELECT last_order_date INTO v_last_order_date
  FROM organizations
  WHERE id = v_organization_id;

  -- 오늘 처음 주문한 경우에만 점수 증가
  IF v_last_order_date IS NULL OR v_last_order_date < v_today THEN
    UPDATE organizations
    SET
      accumulated_points = COALESCE(accumulated_points, 0) + v_order_points,
      last_order_date = v_today
    WHERE id = v_organization_id
    RETURNING accumulated_points INTO v_new_points;

    RETURN jsonb_build_object(
      'success', true,
      'points_added', v_order_points,
      'new_total', v_new_points,
      'message', '발주일 점수가 조직에 적용되었습니다'
    );
  ELSE
    -- 이미 오늘 주문한 경우
    SELECT accumulated_points INTO v_new_points
    FROM organizations
    WHERE id = v_organization_id;

    RETURN jsonb_build_object(
      'success', false,
      'points_added', 0,
      'new_total', v_new_points,
      'message', '오늘 이미 조직에서 발주일 점수를 받았습니다'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 댓글 점수 함수가 있다면 조직 기반으로 수정 (add_comment_points)
CREATE OR REPLACE FUNCTION add_comment_points(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_today DATE;
  v_last_comment_date DATE;
  v_comment_points INTEGER;
  v_new_points INTEGER;
  v_organization_id UUID;
BEGIN
  -- 오늘 날짜 (한국 시간 기준)
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE;

  -- 사용자의 조직 ID 조회
  SELECT primary_organization_id INTO v_organization_id
  FROM users
  WHERE id = p_user_id;

  IF v_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'points_added', 0,
      'new_total', 0,
      'message', '조직 정보를 찾을 수 없습니다'
    );
  END IF;

  -- 댓글 점수 설정 조회
  SELECT comment_points_per_day INTO v_comment_points
  FROM tier_point_settings
  WHERE setting_key = 'default'
  LIMIT 1;

  -- 기본값 설정
  v_comment_points := COALESCE(v_comment_points, 5);

  -- 조직의 마지막 댓글 날짜 조회
  SELECT last_comment_date INTO v_last_comment_date
  FROM organizations
  WHERE id = v_organization_id;

  -- 오늘 처음 댓글 작성한 경우에만 점수 증가
  IF v_last_comment_date IS NULL OR v_last_comment_date < v_today THEN
    UPDATE organizations
    SET
      accumulated_points = COALESCE(accumulated_points, 0) + v_comment_points,
      last_comment_date = v_today
    WHERE id = v_organization_id
    RETURNING accumulated_points INTO v_new_points;

    RETURN jsonb_build_object(
      'success', true,
      'points_added', v_comment_points,
      'new_total', v_new_points,
      'message', '댓글 점수가 조직에 적용되었습니다'
    );
  ELSE
    -- 이미 오늘 댓글 작성한 경우
    SELECT accumulated_points INTO v_new_points
    FROM organizations
    WHERE id = v_organization_id;

    RETURN jsonb_build_object(
      'success', false,
      'points_added', 0,
      'new_total', v_new_points,
      'message', '오늘 이미 조직에서 댓글 점수를 받았습니다'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. 등급 자동 업데이트 함수도 조직 기반으로 수정 (있다면)
-- update_user_tier 함수를 organization 기반으로 수정
CREATE OR REPLACE FUNCTION update_organization_tier()
RETURNS void AS $$
DECLARE
  v_org RECORD;
  v_new_tier TEXT;
  v_tier_thresholds RECORD;
BEGIN
  -- 등급 기준 조회
  SELECT
    diamond_min_points,
    platinum_min_points,
    gold_min_points,
    silver_min_points,
    bronze_min_points
  INTO v_tier_thresholds
  FROM tier_point_settings
  WHERE setting_key = 'default'
  LIMIT 1;

  -- 각 조직별로 등급 계산
  FOR v_org IN
    SELECT id, accumulated_points
    FROM organizations
  LOOP
    -- 점수에 따른 등급 결정
    IF v_org.accumulated_points >= v_tier_thresholds.diamond_min_points THEN
      v_new_tier := 'diamond';
    ELSIF v_org.accumulated_points >= v_tier_thresholds.platinum_min_points THEN
      v_new_tier := 'platinum';
    ELSIF v_org.accumulated_points >= v_tier_thresholds.gold_min_points THEN
      v_new_tier := 'gold';
    ELSIF v_org.accumulated_points >= v_tier_thresholds.silver_min_points THEN
      v_new_tier := 'silver';
    ELSIF v_org.accumulated_points >= v_tier_thresholds.bronze_min_points THEN
      v_new_tier := 'bronze';
    ELSE
      v_new_tier := 'light';
    END IF;

    -- 조직의 tier 필드가 있다면 업데이트 (없으면 users 테이블의 owner tier 업데이트)
    UPDATE users
    SET tier = v_new_tier
    WHERE id IN (
      SELECT owner_id FROM organizations WHERE id = v_org.id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
  v_org_count INTEGER;
  v_total_points BIGINT;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(accumulated_points), 0)
  INTO v_org_count, v_total_points
  FROM organizations;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '기여점수 조직 단위 전환 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '조직 수: %', v_org_count;
  RAISE NOTICE '총 누적 점수: %', v_total_points;
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- 조직별 accumulated_points 컬럼 추가';
  RAISE NOTICE '- 로그인/주문/댓글 점수 함수를 조직 기반으로 수정';
  RAISE NOTICE '- 조직 멤버 누구라도 활동하면 조직 점수 증가';
  RAISE NOTICE '=================================================';
END $$;
