'use client';

import { useEffect } from 'react';

/**
 * 다크모드를 강제로 해제하는 컴포넌트
 * /platform/orders와 /admin을 제외한 모든 페이지에서 사용
 */
export default function ForceLightMode() {
  useEffect(() => {
    // 다크모드 클래스 제거
    document.documentElement.classList.remove('dark');

    // localStorage의 테마를 light로 임시 설정 (페이지 이동 시)
    const originalTheme = localStorage.getItem('theme');
    localStorage.setItem('theme', 'light');

    // 컴포넌트 언마운트 시 원래 테마로 복원
    return () => {
      if (originalTheme) {
        localStorage.setItem('theme', originalTheme);
      }
    };
  }, []);

  return null;
}
