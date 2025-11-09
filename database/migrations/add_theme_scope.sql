-- 테마 적용 범위 구분 컬럼 추가
-- admin: 관리자 페이지 (/admin)
-- platform: 일반 플랫폼 페이지 (/platform)
-- orders: 발주 시스템 페이지 (/platform/orders)

ALTER TABLE design_themes
ADD COLUMN IF NOT EXISTS theme_scope TEXT NOT NULL DEFAULT 'admin'
CHECK (theme_scope IN ('admin', 'platform', 'orders'));

-- 기존 테마들은 모두 admin으로 설정
UPDATE design_themes
SET theme_scope = 'admin'
WHERE theme_scope IS NULL;

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_design_themes_scope_active
ON design_themes(theme_scope, is_active);

COMMENT ON COLUMN design_themes.theme_scope IS '테마 적용 범위: admin(관리자), platform(일반 플랫폼), orders(발주 시스템)';
