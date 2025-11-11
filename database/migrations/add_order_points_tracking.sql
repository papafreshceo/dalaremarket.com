-- 발주일 점수 자동 증가 기능
-- 하루 1회 주문 시 점수 증가 (중복 주문 방지)

-- 1. users 테이블에 last_order_date 컬럼 추가 (이미 있으면 무시)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_order_date DATE;

-- 2. 주문 시 발주일 점수 증가 함수
CREATE OR REPLACE FUNCTION add_order_points(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_today DATE;
  v_last_order_date DATE;
  v_order_points INTEGER;
  v_new_points INTEGER;
BEGIN
  -- 오늘 날짜 (한국 시간 기준)
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::DATE;

  -- 발주일 점수 설정 조회
  SELECT points_per_day INTO v_order_points
  FROM tier_point_settings
  WHERE setting_key = 'default'
  LIMIT 1;

  -- 기본값 설정
  v_order_points := COALESCE(v_order_points, 10);

  -- 사용자의 마지막 주문 날짜 조회
  SELECT last_order_date INTO v_last_order_date
  FROM users
  WHERE id = p_user_id;

  -- 오늘 처음 주문한 경우에만 점수 증가
  IF v_last_order_date IS NULL OR v_last_order_date < v_today THEN
    UPDATE users
    SET
      accumulated_points = COALESCE(accumulated_points, 0) + v_order_points,
      last_order_date = v_today
    WHERE id = p_user_id
    RETURNING accumulated_points INTO v_new_points;

    RETURN jsonb_build_object(
      'success', true,
      'points_added', v_order_points,
      'new_total', v_new_points,
      'message', '발주일 점수가 적용되었습니다'
    );
  ELSE
    -- 이미 오늘 주문한 경우
    SELECT accumulated_points INTO v_new_points
    FROM users
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'success', false,
      'points_added', 0,
      'new_total', v_new_points,
      'message', '오늘 이미 발주일 점수를 받았습니다'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 사용 예시:
-- SELECT add_order_points('user-id-here');
