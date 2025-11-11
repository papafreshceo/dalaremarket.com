-- tier_point_settings 테이블에 댓글 작성 점수 컬럼 추가

ALTER TABLE tier_point_settings
ADD COLUMN IF NOT EXISTS comment_points INTEGER DEFAULT 2;

-- 기본값 설정
UPDATE tier_point_settings
SET comment_points = 2
WHERE setting_key = 'default' AND comment_points IS NULL;

-- 확인
SELECT setting_key, post_points, comment_points FROM tier_point_settings;
