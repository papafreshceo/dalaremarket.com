-- tier_point_settings 테이블에 연속 미로그인 감점 컬럼 추가
ALTER TABLE tier_point_settings
ADD COLUMN IF NOT EXISTS no_login_penalties JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 코멘트
COMMENT ON COLUMN tier_point_settings.no_login_penalties IS '연속 미로그인 감점: [{days, penalty, enabled}]';

-- 기본값 설정 (이미 존재하는 레코드에 기본 감점 룰 추가)
UPDATE tier_point_settings
SET no_login_penalties = '[
  {"days": 7, "penalty": 50, "enabled": true},
  {"days": 14, "penalty": 100, "enabled": true},
  {"days": 30, "penalty": 200, "enabled": true}
]'::jsonb
WHERE setting_key = 'default' AND (no_login_penalties IS NULL OR no_login_penalties = '[]'::jsonb);
