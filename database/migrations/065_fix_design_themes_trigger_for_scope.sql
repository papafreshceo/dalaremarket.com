-- 디자인 테마 트리거 수정: theme_scope별로 활성 테마 관리
-- 이전에는 모든 scope에서 하나의 활성 테마만 가능했으나,
-- 이제 각 scope(admin, platform, orders)별로 독립적으로 활성 테마를 관리

-- 기존 트리거 함수를 scope 인식 버전으로 교체
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

-- 트리거는 이미 존재하므로 재생성 불필요
-- CREATE TRIGGER trigger_single_active_theme
-- BEFORE INSERT OR UPDATE ON design_themes
-- FOR EACH ROW
-- WHEN (NEW.is_active = TRUE)
-- EXECUTE FUNCTION ensure_single_active_theme();

COMMENT ON FUNCTION ensure_single_active_theme() IS 'theme_scope별로 활성 테마를 하나로 제한 (admin, platform, orders 독립 관리)';
