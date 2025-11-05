-- ranking_score_settings 테이블에 UI 표시용 컬럼 추가
-- "X원당 Y점", "X건당 Y점" 형식의 입력값을 그대로 저장

-- 발주 금액 UI 표시용 컬럼 추가
ALTER TABLE ranking_score_settings
ADD COLUMN IF NOT EXISTS sales_amount INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN IF NOT EXISTS sales_points INTEGER NOT NULL DEFAULT 1;

-- 발주 건수 UI 표시용 컬럼 추가
ALTER TABLE ranking_score_settings
ADD COLUMN IF NOT EXISTS orders_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS orders_points_input INTEGER NOT NULL DEFAULT 10;

-- 활동 점수 UI 표시용 컬럼 추가
ALTER TABLE ranking_score_settings
ADD COLUMN IF NOT EXISTS post_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS post_points_input INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS comment_points_input INTEGER NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS login_points_input INTEGER NOT NULL DEFAULT 3;

-- 기존 데이터 초기화 (기존 값 기준으로)
UPDATE ranking_score_settings
SET
  sales_amount = sales_per_point,
  sales_points = 1,
  orders_count = 1,
  orders_points_input = orders_per_point,
  post_count = 1,
  post_points_input = post_score,
  comment_count = 1,
  comment_points_input = comment_score,
  login_count = 1,
  login_points_input = login_score
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 코멘트
COMMENT ON COLUMN ranking_score_settings.sales_amount IS 'UI 표시: X원당 (입력값)';
COMMENT ON COLUMN ranking_score_settings.sales_points IS 'UI 표시: Y점 (입력값)';
COMMENT ON COLUMN ranking_score_settings.orders_count IS 'UI 표시: X건당 (입력값)';
COMMENT ON COLUMN ranking_score_settings.orders_points_input IS 'UI 표시: Y점 (입력값)';
COMMENT ON COLUMN ranking_score_settings.post_count IS 'UI 표시: X개당 (입력값)';
COMMENT ON COLUMN ranking_score_settings.post_points_input IS 'UI 표시: Y점 (입력값)';
COMMENT ON COLUMN ranking_score_settings.comment_count IS 'UI 표시: X개당 (입력값)';
COMMENT ON COLUMN ranking_score_settings.comment_points_input IS 'UI 표시: Y점 (입력값)';
COMMENT ON COLUMN ranking_score_settings.login_count IS 'UI 표시: X회당 (입력값)';
COMMENT ON COLUMN ranking_score_settings.login_points_input IS 'UI 표시: Y점 (입력값)';
