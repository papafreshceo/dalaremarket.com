-- tier_point_settings 테이블에 로그인 점수 컬럼 추가
ALTER TABLE tier_point_settings
ADD COLUMN IF NOT EXISTS login_points_per_day INTEGER NOT NULL DEFAULT 1;

-- 코멘트
COMMENT ON COLUMN tier_point_settings.login_points_per_day IS '로그인 1일당 기본 점수';

-- 기본값 업데이트 (이미 존재하는 레코드)
UPDATE tier_point_settings
SET login_points_per_day = 1
WHERE setting_key = 'default' AND login_points_per_day IS NULL;
