-- 랭킹 참여 설정 테이블
CREATE TABLE IF NOT EXISTS ranking_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_participating BOOLEAN NOT NULL DEFAULT false,
  show_score BOOLEAN NOT NULL DEFAULT false,
  show_sales_performance BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ranking_participation_user_id ON ranking_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_participation_is_participating ON ranking_participation(is_participating);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_ranking_participation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ranking_participation_updated_at
  BEFORE UPDATE ON ranking_participation
  FOR EACH ROW
  EXECUTE FUNCTION update_ranking_participation_updated_at();

-- RLS 정책
ALTER TABLE ranking_participation ENABLE ROW LEVEL SECURITY;

-- 자신의 설정만 조회 가능
CREATE POLICY "Users can view own participation settings"
  ON ranking_participation FOR SELECT
  USING (auth.uid() = user_id);

-- 자신의 설정만 삽입 가능
CREATE POLICY "Users can insert own participation settings"
  ON ranking_participation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 자신의 설정만 수정 가능
CREATE POLICY "Users can update own participation settings"
  ON ranking_participation FOR UPDATE
  USING (auth.uid() = user_id);

-- 자신의 설정만 삭제 가능
CREATE POLICY "Users can delete own participation settings"
  ON ranking_participation FOR DELETE
  USING (auth.uid() = user_id);
