-- Migration 066: css_variables 컬럼 추가 및 Trigger 수정
-- 1. css_variables 컬럼 추가
-- 2. theme_scope별로 독립적인 활성 테마 관리

-- Step 1: css_variables 컬럼 추가
ALTER TABLE design_themes
ADD COLUMN IF NOT EXISTS css_variables JSONB DEFAULT '{}'::jsonb;

-- 기본값으로 빈 객체 대신 기본 CSS 변수 설정
UPDATE design_themes
SET css_variables = '{
  "--color-primary": "#2563eb",
  "--color-background": "#ffffff",
  "--color-text": "#111827",
  "--radius": "0.5rem"
}'::jsonb
WHERE css_variables IS NULL OR css_variables = '{}'::jsonb;

-- Step 2: Trigger 함수 수정 (theme_scope별로 활성 테마 관리)
CREATE OR REPLACE FUNCTION ensure_single_active_theme()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    -- 같은 theme_scope 내에서만 다른 테마를 비활성화
    UPDATE design_themes
    SET is_active = FALSE
    WHERE id != NEW.id
      AND is_active = TRUE
      AND theme_scope = NEW.theme_scope;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 생성 (이미 존재하면 무시됨)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_single_active_theme'
  ) THEN
    CREATE TRIGGER trigger_single_active_theme
    BEFORE INSERT OR UPDATE ON design_themes
    FOR EACH ROW
    WHEN (NEW.is_active = TRUE)
    EXECUTE FUNCTION ensure_single_active_theme();
  END IF;
END
$$;

-- 코멘트 추가
COMMENT ON COLUMN design_themes.css_variables IS 'CSS 변수를 저장하는 JSONB 컬럼 (예: {"--color-primary": "#000"})';
COMMENT ON FUNCTION ensure_single_active_theme() IS 'theme_scope별로 활성 테마를 하나로 제한 (admin, platform, orders 독립 관리)';
