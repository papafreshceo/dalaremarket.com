'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import UserHeader from '@/components/layout/UserHeader'
import PlatformSidebar from '@/components/layout/PlatformSidebar'
import PlatformTopBar from '@/components/layout/PlatformTopBar'
import IconSidebar from '@/components/layout/IconSidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import Footer from '@/components/layout/Footer'
import { UserBalanceProvider } from '@/contexts/UserBalanceContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import './platform.css'

function LayoutContent({ children, pathname }: { children: React.ReactNode; pathname: string | null }) {
  const { isSidebarVisible } = useSidebar()
  const [isInIframe, setIsInIframe] = useState<boolean | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setIsInIframe(window.self !== window.top)

    // 모바일 체크
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // platform/orders와 admin을 제외한 모든 platform 페이지에서 다크모드 강제 해제
    const path = window.location.pathname;
    if (!path.startsWith('/platform/orders') && !path.startsWith('/admin')) {
      document.documentElement.classList.remove('dark');
    }

    return () => window.removeEventListener('resize', checkMobile)
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
  const showLayout = !isMounted || isInIframe === false

  // /platform/orders 페이지 체크
  const isOrdersPage = pathname?.startsWith('/platform/orders')

  // 모바일: 기존 UserHeader 방식
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        {showLayout && <UserHeader />}
        <main className="flex-1">{children}</main>
        {showLayout && <Footer />}
        {showLayout && <MobileBottomNav />}
      </div>
    )
  }

  // 데스크톱: 사이드바 레이아웃
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 상단바 - 전체 너비 */}
      {showLayout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001 }}>
          <PlatformTopBar />
        </div>
      )}

      {/* 최상위 아이콘 사이드바 */}
      {showLayout && <IconSidebar />}

      {/* 왼쪽 사이드바 */}
      {showLayout && <PlatformSidebar />}

      {/* 오른쪽 메인 영역 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginLeft: isSidebarVisible ? '242px' : '50px',
        marginTop: '50px',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <main style={{ flex: 1, overflowY: 'auto', background: isOrdersPage ? 'white' : '#f8f9fa' }}>
          {children}
          {showLayout && <Footer />}
        </main>
      </div>
    </div>
  )
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <UserBalanceProvider>
      <SidebarProvider>
        <LayoutContent pathname={pathname}>
          {children}
        </LayoutContent>
      </SidebarProvider>
    </UserBalanceProvider>
  )
}
