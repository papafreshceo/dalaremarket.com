-- platform/orders 기본 테마 저장
-- 현재 적용된 스타일을 기본 테마로 설정

INSERT INTO design_themes (
  name,
  description,
  theme_scope,
  css_variables,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'Orders System Default',
  'platform/orders 발주 시스템 기본 테마',
  'orders',
  '{
    "--color-primary": "#2563eb",
    "--color-primary-hover": "#1d4ed8",
    "--color-success": "#10b981",
    "--color-success-hover": "#059669",
    "--color-warning": "#f59e0b",
    "--color-warning-hover": "#d97706",
    "--color-danger": "#ef4444",
    "--color-danger-hover": "#dc2626",
    "--color-background": "#ffffff",
    "--color-background-secondary": "#f9fafb",
    "--color-surface": "#ffffff",
    "--color-surface-hover": "#f9fafb",
    "--color-text": "#111827",
    "--color-text-secondary": "#4b5563",
    "--color-text-tertiary": "#6b7280",
    "--color-text-disabled": "#9ca3af",
    "--color-border": "#e5e7eb",
    "--color-border-hover": "#d1d5db",
    "--color-border-focus": "#3b82f6",
    "--spacing-xs": "0.25rem",
    "--spacing-sm": "0.5rem",
    "--spacing-md": "1rem",
    "--spacing-lg": "1.5rem",
    "--spacing-xl": "2rem",
    "--radius-sm": "0.25rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",
    "--shadow-xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "--shadow-sm": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    "--shadow-md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "--shadow-lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "--shadow-xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "--font-sans": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    "--font-serif": "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif",
    "--font-mono": "ui-monospace, monospace"
  }'::jsonb,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 플랫폼 기본 테마도 추가 (나중에 수정 가능)
INSERT INTO design_themes (
  name,
  description,
  theme_scope,
  css_variables,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'Platform Default',
  '플랫폼 기본 테마',
  'platform',
  '{
    "--color-primary": "#2563eb",
    "--color-primary-hover": "#1d4ed8",
    "--color-success": "#10b981",
    "--color-success-hover": "#059669",
    "--color-warning": "#f59e0b",
    "--color-warning-hover": "#d97706",
    "--color-danger": "#ef4444",
    "--color-danger-hover": "#dc2626",
    "--color-background": "#ffffff",
    "--color-background-secondary": "#f9fafb",
    "--color-surface": "#ffffff",
    "--color-surface-hover": "#f9fafb",
    "--color-text": "#111827",
    "--color-text-secondary": "#4b5563",
    "--color-text-tertiary": "#6b7280",
    "--color-border": "#e5e7eb",
    "--color-border-hover": "#d1d5db",
    "--spacing-xs": "0.25rem",
    "--spacing-sm": "0.5rem",
    "--spacing-md": "1rem",
    "--spacing-lg": "1.5rem",
    "--spacing-xl": "2rem",
    "--radius-sm": "0.25rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",
    "--shadow-xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "--shadow-sm": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    "--shadow-md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "--shadow-lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "--font-sans": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    "--font-serif": "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif",
    "--font-mono": "ui-monospace, monospace"
  }'::jsonb,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
