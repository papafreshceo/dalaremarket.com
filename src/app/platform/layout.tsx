'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import PlatformSidebar from '@/components/layout/PlatformSidebar'
import PlatformTopBar from '@/components/layout/PlatformTopBar'
import IconSidebar from '@/components/layout/IconSidebar'
import MobileHeader from '@/components/layout/MobileHeader'
import MobileDrawer from '@/components/layout/MobileDrawer'
import Footer from '@/components/layout/Footer'
import { UserBalanceProvider } from '@/contexts/UserBalanceContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { DesignSystemProvider } from '@/contexts/DesignSystemContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { useSession } from '@/contexts/SessionProvider'
import { ToastProvider } from '@/components/ui/Toast'
import './platform.css'

function LayoutContent({ children, pathname }: { children: React.ReactNode; pathname: string | null }) {
  const { isSidebarVisible, isHydrated } = useSidebar()
  const { user, loading: sessionLoading } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isInIframe, setIsInIframe] = useState<boolean | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginMode, setLoginMode] = useState<'login' | 'findId' | 'resetPassword'>('login')
  
  // URL 파라미터로 로그인 모달 제어 (외부 링크에서 올 때만)
  useEffect(() => {
    const shouldShowLogin = searchParams?.get('login') === 'true'
    const error = searchParams?.get('error')
    const mode = searchParams?.get('mode')
    
    // 세션 로딩 중이면 대기
    if (sessionLoading) {
      return
    }
    
    // URL에 login=true가 있고 로그인되지 않은 경우
    if (shouldShowLogin && !user) {
      console.log('[PlatformLayout] URL 파라미터로 인한 로그인 모달 표시')
      setShowLoginModal(true)
      
      // 모드 설정
      if (mode === 'findId') {
        setLoginMode('findId')
      } else if (mode === 'resetPassword') {
        setLoginMode('resetPassword')
      } else {
        setLoginMode('login')
      }
      
      // URL 파라미터 즉시 제거 (깔끔한 URL 유지)
      const url = new URL(window.location.href)
      url.searchParams.delete('login')
      url.searchParams.delete('error')
      url.searchParams.delete('mode')
      url.searchParams.delete('redirect')
      window.history.replaceState({}, '', url.pathname + url.search)
      
    } else if (shouldShowLogin && user) {
      // 이미 로그인된 상태면 URL 정리
      console.log('[PlatformLayout] 이미 로그인됨, URL 정리')
      const url = new URL(window.location.href)
      url.searchParams.delete('login')
      url.searchParams.delete('error')
      url.searchParams.delete('mode')
      url.searchParams.delete('redirect')
      router.replace(url.pathname + url.search)
      setShowLoginModal(false)
    }
  }, [searchParams, user, sessionLoading, router])

  const handleCloseLoginModal = () => {
    setShowLoginModal(false)
    // URL에서 login 파라미터 제거
    const url = new URL(window.location.href)
    url.searchParams.delete('login')
    url.searchParams.delete('error')
    url.searchParams.delete('mode')
    url.searchParams.delete('redirect')
    router.replace(url.pathname + url.search)
  }

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

  // 드로어 열려있을 때 body 스크롤 방지
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

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

  // 모바일: MobileHeader + MobileDrawer 방식
  if (isMobile) {
    return (
      <>
        {showLayout && (
          <>
            <MobileHeader onMenuOpen={() => setIsDrawerOpen(true)} />
            <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
          </>
        )}
        <main style={{ paddingTop: showLayout ? '56px' : '0', minHeight: '100vh' }}>
          {children}
        </main>
        {showLayout && <Footer />}
        
        {/* 로그인 모달 */}
        {showLoginModal && (
          <AuthModal
            isOpen={showLoginModal}
            onClose={handleCloseLoginModal}
            initialMode={loginMode}
          />
        )}
      </>
    )
  }

  // 데스크톱: 사이드바 레이아웃
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 상단바 - 전체 너비 */}
      {showLayout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
          <PlatformTopBar />
        </div>
      )}

      {/* 최상위 아이콘 사이드바 */}
      {showLayout && <IconSidebar />}

      {/* 왼쪽 사이드바 */}
      {showLayout && <PlatformSidebar />}

      {/* 오른쪽 메인 영역 */}
      <div
        suppressHydrationWarning
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginLeft: isHydrated && isSidebarVisible ? '242px' : '50px',
          marginTop: '50px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
        <main style={{ flex: 1, overflowY: 'auto', background: isOrdersPage ? 'white' : '#f8f9fa' }}>
          {children}
          {showLayout && <Footer />}
        </main>
      </div>
      
      {/* 로그인 모달 */}
      {showLoginModal && (
        <AuthModal
          isOpen={showLoginModal}
          onClose={handleCloseLoginModal}
          initialMode={loginMode}
        />
      )}
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
    <DesignSystemProvider>
      <ToastProvider>
        <UserBalanceProvider>
          <SidebarProvider>
            <Suspense fallback={null}>
              <LayoutContent pathname={pathname}>
                {children}
              </LayoutContent>
            </Suspense>
          </SidebarProvider>
        </UserBalanceProvider>
      </ToastProvider>
    </DesignSystemProvider>
  )
}
