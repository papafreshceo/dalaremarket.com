-- Add animation_style column to supply_status_settings table
ALTER TABLE supply_status_settings
ADD COLUMN IF NOT EXISTS animation_style TEXT DEFAULT 'minimal_dot'
CHECK (animation_style IN (
  'pulse_dot',           -- 옵션 1: 펄스 도트
  'rotating_ring',       -- 옵션 2: 회전 링
  'slide_bar',           -- 옵션 3: 슬라이드 바
  'pulse_icon',          -- 옵션 4: 펄스 아이콘
  'wave_effect',         -- 옵션 5: 파동 효과
  'bouncing_dots',       -- 옵션 6: 깜박이는 도트 3개
  'icon_only',           -- 옵션 7: 아이콘만
  'pulse_background',    -- 옵션 8: 펄스 배경
  'spinner',             -- 옵션 9: 스피너
  'minimal_dot',         -- 옵션 10: 미니멀 도트 (기본값)
  'arrow_flow',          -- 옵션 11: 화살표 이동
  'icon_with_dot'        -- 옵션 12: 아이콘+도트
));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_supply_status_animation_style
ON supply_status_settings(animation_style);

-- Update existing records to use default animation style
UPDATE supply_status_settings
SET animation_style = 'minimal_dot'
WHERE animation_style IS NULL;

COMMENT ON COLUMN supply_status_settings.animation_style IS '상태 표시 애니메이션 스타일: pulse_dot, rotating_ring, slide_bar, pulse_icon, wave_effect, bouncing_dots, icon_only, pulse_background, spinner, minimal_dot, arrow_flow, icon_with_dot';
