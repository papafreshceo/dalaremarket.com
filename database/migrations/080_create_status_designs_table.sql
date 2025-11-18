-- 상태 디자인 설정 테이블 생성
CREATE TABLE IF NOT EXISTS status_designs (
  id BIGSERIAL PRIMARY KEY,
  status_name VARCHAR(50) UNIQUE NOT NULL,
  animation_type INTEGER NOT NULL DEFAULT 1,
  color VARCHAR(20) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 상태 디자인 삽입
INSERT INTO status_designs (status_name, animation_type, color, icon)
VALUES
  ('출하중', 1, '#10b981', 'truck'),
  ('일시품절', 1, '#ef4444', 'alert'),
  ('재고있음', 1, '#3b82f6', 'check'),
  ('대기중', 1, '#f59e0b', 'clock')
ON CONFLICT (status_name) DO NOTHING;

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_status_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS status_designs_updated_at_trigger ON status_designs;
CREATE TRIGGER status_designs_updated_at_trigger
  BEFORE UPDATE ON status_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_status_designs_updated_at();
