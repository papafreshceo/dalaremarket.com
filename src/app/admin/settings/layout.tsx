// app/admin/settings/layout.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    // 설정 페이지 전용 테마 로드
    const loadSettingsTheme = async () => {
      try {
        const response = await fetch('/api/design-theme/active');
        const result = await response.json();

        if (result.success && result.data) {
          const { css_variables } = result.data;

          // settings-theme-wrapper에만 CSS 변수 적용
          const wrapper = document.getElementById('settings-theme-wrapper');
          if (wrapper) {
            Object.entries(css_variables).forEach(([key, value]) => {
              wrapper.style.setProperty(key, value as string);
            });
          }

          console.log('✅ Settings theme applied:', result.data.name);
        }
      } catch (error) {
        console.error('Failed to load settings theme:', error);
      } finally {
        setThemeLoaded(true);
      }
    };

    loadSettingsTheme();
  }, []);

  if (!themeLoaded) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        테마 로딩 중...
      </div>
    );
  }

  return (
    <div
      id="settings-theme-wrapper"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background, #ffffff)',
        color: 'var(--color-text, #111827)',
        fontFamily: 'var(--font-sans, system-ui)'
      }}
    >
      {children}
    </div>
  );
}