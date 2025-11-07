'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 활성 테마 로드 및 적용
    const loadTheme = async () => {
      try {
        const response = await fetch('/api/design-theme/active');
        const result = await response.json();

        if (result.success && result.data) {
          const { css_variables } = result.data;

          // CSS 변수를 root에 적용
          const root = document.documentElement;
          Object.entries(css_variables).forEach(([key, value]) => {
            root.style.setProperty(key, value as string);
          });

          // 페이지 배경색도 테마에 맞게 변경
          if (css_variables['--color-background']) {
            document.body.style.backgroundColor = css_variables['--color-background'];
          }

        }
      } catch (error) {
        console.error('Failed to load design theme:', error);
      }
    };

    loadTheme();
  }, []);

  return <>{children}</>;
}
