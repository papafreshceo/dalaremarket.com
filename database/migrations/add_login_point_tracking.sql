-- 로그인 점수 자동 증가 기능
-- 하루 1회 로그인 시 점수 증가 (중복 로그인 방지)

-- 1. users 테이블에 last_login_date 컬럼 추가 (이미 있으면 무시)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- 2. 로그인 시 점수 증가 함수
CREATE OR REPLACE FUNCTION add_login_points(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_today DATE;
  v_last_login_date DATE;
  v_login_points INTEGER;
  v_new_points INTEGER;
BEGIN
  -- 오늘 날짜 (한국 시간 기준)
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE;

  -- 로그인 점수 설정 조회
  SELECT login_points_per_day INTO v_login_points
  FROM tier_point_settings
  WHERE setting_key = 'default'
  LIMIT 1;

  -- 기본값 설정
  v_login_points := COALESCE(v_login_points, 1);

  -- 사용자의 마지막 로그인 날짜 조회
  SELECT last_login_date INTO v_last_login_date
  FROM users
  WHERE id = p_user_id;

  -- 오늘 처음 로그인한 경우에만 점수 증가
  IF v_last_login_date IS NULL OR v_last_login_date < v_today THEN
    UPDATE users
    SET
      accumulated_points = COALESCE(accumulated_points, 0) + v_login_points,
      last_login_date = v_today
    WHERE id = p_user_id
    RETURNING accumulated_points INTO v_new_points;

    RETURN jsonb_build_object(
      'success', true,
      'points_added', v_login_points,
      'new_total', v_new_points,
      'message', '로그인 점수가 적용되었습니다'
    );
  ELSE
    -- 이미 오늘 로그인한 경우
    SELECT accumulated_points INTO v_new_points
    FROM users
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'success', false,
      'points_added', 0,
      'new_total', v_new_points,
      'message', '오늘 이미 로그인 점수를 받았습니다'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 사용 예시:
-- SELECT add_login_points('user-id-here');
