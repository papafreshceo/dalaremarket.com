'use client'

import { useEffect, useState } from 'react'
import UserHeader from '@/components/layout/UserHeader'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import PlatformFooter from '@/components/PlatformFooter'
import { UserBalanceProvider } from '@/contexts/UserBalanceContext'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // iframe 안에서 로드되었는지 확인 - hydration mismatch 방지를 위해 null로 초기화
  const [isInIframe, setIsInIframe] = useState<boolean | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setIsInIframe(window.self !== window.top)
  }, [])

  // 플랫폼 화면 파비콘 설정 (더 빠른 타이밍)
  useEffect(() => {
    const updateFavicon = () => {
      // document.head가 있는지 확인 (null 체크)
      if (!document.head) return;

      // 기존 파비콘 모두 제거
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach(el => {
        try {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch (e) {
          // 이미 제거된 경우 무시
        }
      });

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

  // mount 전까지 항상 헤더/네비 표시 (hydration mismatch 방지)
  const showHeaderAndNav = !isMounted || isInIframe === false

  return (
    <UserBalanceProvider>
      <div className="flex flex-col min-h-screen">
        {showHeaderAndNav && <UserHeader />}
        <main className="flex-1">{children}</main>
        {showHeaderAndNav && <PlatformFooter />}
        {showHeaderAndNav && <MobileBottomNav />}
      </div>
    </UserBalanceProvider>
  )
}
