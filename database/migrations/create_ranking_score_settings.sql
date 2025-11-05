-- 랭킹 점수 산정 설정 테이블
CREATE TABLE IF NOT EXISTS ranking_score_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 발주 점수 설정
  sales_per_point INTEGER NOT NULL DEFAULT 10000, -- 발주금액당 1점 (만원 단위)
  orders_per_point INTEGER NOT NULL DEFAULT 10,   -- 발주건수당 점수 (1건 = 10점)

  -- 연속 발주 보너스
  consecutive_7_days INTEGER NOT NULL DEFAULT 50,
  consecutive_14_days INTEGER NOT NULL DEFAULT 150,
  consecutive_30_days INTEGER NOT NULL DEFAULT 500,

  -- 활동 점수
  post_score INTEGER NOT NULL DEFAULT 5,    -- 게시글 작성 점수
  comment_score INTEGER NOT NULL DEFAULT 2, -- 답글 작성 점수
  login_score INTEGER NOT NULL DEFAULT 3,   -- 로그인 점수

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 설정은 1개의 레코드만 존재
INSERT INTO ranking_score_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_ranking_score_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ranking_score_settings_updated_at
  BEFORE UPDATE ON ranking_score_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ranking_score_settings_updated_at();

-- 코멘트
COMMENT ON TABLE ranking_score_settings IS '랭킹 점수 산정 설정';
COMMENT ON COLUMN ranking_score_settings.sales_per_point IS '발주금액당 1점 기준 (만원)';
COMMENT ON COLUMN ranking_score_settings.orders_per_point IS '발주건수당 점수';
COMMENT ON COLUMN ranking_score_settings.consecutive_7_days IS '7일 연속 발주 보너스';
COMMENT ON COLUMN ranking_score_settings.consecutive_14_days IS '14일 연속 발주 보너스';
COMMENT ON COLUMN ranking_score_settings.consecutive_30_days IS '30일 연속 발주 보너스';
COMMENT ON COLUMN ranking_score_settings.post_score IS '게시글 작성 점수';
COMMENT ON COLUMN ranking_score_settings.comment_score IS '답글 작성 점수';
COMMENT ON COLUMN ranking_score_settings.login_score IS '로그인 점수';
