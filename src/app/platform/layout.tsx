'use client'

import { useEffect, useState } from 'react'
import UserHeader from '@/components/layout/UserHeader'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // iframe 안에서 로드되었는지 확인
  const [isInIframe, setIsInIframe] = useState(false)

  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  // 플랫폼 화면 파비콘 설정 (더 빠른 타이밍)
  useEffect(() => {
    const updateFavicon = () => {
      // 기존 파비콘 모두 제거
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach(el => el.remove());

      // 플랫폼용 파비콘 추가 (캐시 무효화)
      const timestamp = Date.now();
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = `/platform-favicon.png?v=${timestamp}`;
      document.head.appendChild(link);

      // 타이틀 변경
      document.title = '달래마켓';
    };

    // 즉시 실행
    updateFavicon();

    // DOM 로드 후에도 한번 더 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateFavicon);
      return () => document.removeEventListener('DOMContentLoaded', updateFavicon);
    }
  }, []);

  return (
    <>
      {!isInIframe && <UserHeader />}
      {children}
      {!isInIframe && <MobileBottomNav />}
    </>
  )
}
