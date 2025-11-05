-- 티어 누적점수 설정 테이블
CREATE TABLE IF NOT EXISTS tier_point_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE, -- 'default' 고정값 사용
  points_per_day INTEGER NOT NULL DEFAULT 10, -- 발주 1일당 점수
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb, -- 마일스톤 보너스 배열
  consecutive_bonuses JSONB NOT NULL DEFAULT '[]'::jsonb, -- 연속성 보너스 배열
  monthly_bonuses JSONB NOT NULL DEFAULT '[]'::jsonb, -- 월간 보너스 배열
  accumulated_point_criteria JSONB NOT NULL DEFAULT '[]'::jsonb, -- 등급별 필요 점수 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tier_point_settings_key ON tier_point_settings(setting_key);

-- 코멘트
COMMENT ON TABLE tier_point_settings IS '티어 등급 누적점수 시스템 설정';
COMMENT ON COLUMN tier_point_settings.points_per_day IS '발주 1일당 기본 점수';
COMMENT ON COLUMN tier_point_settings.milestones IS '마일스톤 보너스: [{days, bonus, enabled}]';
COMMENT ON COLUMN tier_point_settings.consecutive_bonuses IS '연속성 보너스: [{days, bonus, enabled}]';
COMMENT ON COLUMN tier_point_settings.monthly_bonuses IS '월간 보너스: [{minDays, bonus, enabled}]';
COMMENT ON COLUMN tier_point_settings.accumulated_point_criteria IS '등급별 필요 점수: [{tier, requiredPoints}]';

-- 기본 설정 삽입
INSERT INTO tier_point_settings (
  setting_key,
  points_per_day,
  milestones,
  consecutive_bonuses,
  monthly_bonuses,
  accumulated_point_criteria
) VALUES (
  'default',
  10,
  '[
    {"days": 30, "bonus": 100, "enabled": true},
    {"days": 90, "bonus": 300, "enabled": true},
    {"days": 180, "bonus": 600, "enabled": true},
    {"days": 365, "bonus": 1200, "enabled": true},
    {"days": 730, "bonus": 2500, "enabled": true}
  ]'::jsonb,
  '[
    {"days": 5, "bonus": 30, "enabled": true},
    {"days": 21, "bonus": 100, "enabled": true},
    {"days": 65, "bonus": 300, "enabled": true},
    {"days": 130, "bonus": 500, "enabled": true},
    {"days": 260, "bonus": 1000, "enabled": true}
  ]'::jsonb,
  '[
    {"minDays": 10, "bonus": 30, "enabled": true},
    {"minDays": 15, "bonus": 60, "enabled": true},
    {"minDays": 20, "bonus": 100, "enabled": true}
  ]'::jsonb,
  '[
    {"tier": "LIGHT", "requiredPoints": 1200},
    {"tier": "STANDARD", "requiredPoints": 3000},
    {"tier": "ADVANCE", "requiredPoints": 6000},
    {"tier": "ELITE", "requiredPoints": 9000},
    {"tier": "LEGEND", "requiredPoints": 12000}
  ]'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_tier_point_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_tier_point_settings_updated_at ON tier_point_settings;
CREATE TRIGGER trigger_tier_point_settings_updated_at
  BEFORE UPDATE ON tier_point_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_point_settings_updated_at();
