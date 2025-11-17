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

    // platform/orders와 admin을 제외한 모든 platform 페이지에서 다크모드 강제 해제
    const path = window.location.pathname;
    if (!path.startsWith('/platform/orders') && !path.startsWith('/admin')) {
      document.documentElement.classList.remove('dark');
    }
  }, [])

  // 플랫폼 화면 파비콘 설정 (더 빠른 타이밍)
  useEffect(() => {
    const updateFavicon = () => {
      // document.head가 있는지 확인 (null 체크)
      if (!document.head) return;

      try {
        // 기존 파비콘 찾기
        let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

        if (!faviconLink) {
          // 파비콘이 없으면 새로 생성
          faviconLink = document.createElement('link');
          faviconLink.rel = 'icon';
          faviconLink.type = 'image/png';
          document.head.appendChild(faviconLink);
        }

        // 플랫폼용 파비콘으로 변경 (캐시 무효화)
        const timestamp = Date.now();
        faviconLink.href = `/platform-favicon.png?v=${timestamp}`;

        // 타이틀 변경
        document.title = '달래마켓';
      } catch (error) {
        console.error('Favicon update error:', error);
      }
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
