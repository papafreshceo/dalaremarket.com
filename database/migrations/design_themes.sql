-- 디자인 테마 관리 테이블
CREATE TABLE IF NOT EXISTS design_themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  css_variables JSONB NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 기본 네오브루탈리즘 테마 삽입/업데이트 (UPSERT)
INSERT INTO design_themes (name, description, css_variables, is_active) VALUES
(
  'Neobrutalism Default',
  '기본 네오브루탈리즘 디자인 시스템',
  '{
    "--font-sans": "DM Sans, sans-serif",
    "--font-mono": "Space Mono, monospace",
    "--color-primary": "#2563eb",
    "--color-primary-hover": "#1d4ed8",
    "--color-secondary": "#ffffff",
    "--color-accent": "#fef3c7",
    "--color-background": "#ffffff",
    "--color-surface": "#ffffff",
    "--color-surface-hover": "#f9fafb",
    "--color-text": "#111827",
    "--color-text-secondary": "#4b5563",
    "--color-text-tertiary": "#6b7280",
    "--color-border": "#e5e7eb",
    "--color-border-hover": "#d1d5db",
    "--color-success": "#10b981",
    "--color-warning": "#f59e0b",
    "--color-danger": "#dc2626",
    "--border-width": "1px",
    "--shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "--radius": "0.5rem"
  }'::jsonb,
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  css_variables = EXCLUDED.css_variables,
  updated_at = NOW();

INSERT INTO design_themes (name, description, css_variables, is_active) VALUES
(
  'Soft Neobrutalism',
  '부드러운 네오브루탈리즘 스타일',
  '{
    "--font-sans": "DM Sans, sans-serif",
    "--font-mono": "Space Mono, monospace",
    "--color-primary": "#6366f1",
    "--color-primary-hover": "#4f46e5",
    "--color-secondary": "#f8fafc",
    "--color-accent": "#dbeafe",
    "--color-background": "#f8fafc",
    "--color-surface": "#ffffff",
    "--color-surface-hover": "#f1f5f9",
    "--color-text": "#1e293b",
    "--color-text-secondary": "#475569",
    "--color-text-tertiary": "#64748b",
    "--color-border": "#cbd5e1",
    "--color-border-hover": "#94a3b8",
    "--color-success": "#22c55e",
    "--color-warning": "#f59e0b",
    "--color-danger": "#ef4444",
    "--border-width": "1px",
    "--shadow-sm": "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "--radius": "0.75rem"
  }'::jsonb,
  false
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  css_variables = EXCLUDED.css_variables,
  updated_at = NOW();

INSERT INTO design_themes (name, description, css_variables, is_active) VALUES
(
  'Dark Modern',
  '다크 모던 테마',
  '{
    "--font-sans": "Inter, sans-serif",
    "--font-mono": "Fira Code, monospace",
    "--color-primary": "#3b82f6",
    "--color-primary-hover": "#2563eb",
    "--color-secondary": "#1f2937",
    "--color-accent": "#fbbf24",
    "--color-background": "#111827",
    "--color-surface": "#1f2937",
    "--color-surface-hover": "#374151",
    "--color-text": "#f9fafb",
    "--color-text-secondary": "#d1d5db",
    "--color-text-tertiary": "#9ca3af",
    "--color-border": "#374151",
    "--color-border-hover": "#4b5563",
    "--color-success": "#34d399",
    "--color-warning": "#fbbf24",
    "--color-danger": "#f87171",
    "--border-width": "1px",
    "--shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
    "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
    "--radius": "0.5rem"
  }'::jsonb,
  false
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  css_variables = EXCLUDED.css_variables,
  updated_at = NOW();

-- 활성 테마는 하나만 가능하도록 트리거 생성
CREATE OR REPLACE FUNCTION ensure_single_active_theme()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    UPDATE design_themes
    SET is_active = FALSE
    WHERE id != NEW.id AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_theme
BEFORE INSERT OR UPDATE ON design_themes
FOR EACH ROW
WHEN (NEW.is_active = TRUE)
EXECUTE FUNCTION ensure_single_active_theme();

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_design_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_design_themes_updated_at
BEFORE UPDATE ON design_themes
FOR EACH ROW
EXECUTE FUNCTION update_design_themes_updated_at();
