// app/admin/admin-client-layout.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Head from 'next/head'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui/ConfirmModal'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { FloatingHtmlBuilder } from '@/components/admin/FloatingHtmlBuilder'
import { CalendarPopup } from '@/components/admin/CalendarPopup'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { getUserAccessiblePages } from '@/lib/permissions'
import { menuCategories, menuGroups } from '@/config/admin-menu'
import { AdminAuthProvider, UserData } from '@/contexts/AdminAuthContext'
import { User } from '@supabase/supabase-js'
import { useSession } from '@/contexts/SessionProvider'
import { syncSession } from '@/lib/session-sync'

// React Query 클라이언트 설정 (최적화)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10분간 데이터를 fresh로 간주 (5분 -> 10분)
      gcTime: 1000 * 60 * 60, // 60분간 캐시 유지 (30분 -> 60분)
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
      refetchOnMount: false, // 마운트 시 자동 refetch 비활성화
      refetchOnReconnect: false, // 재연결 시 자동 refetch 비활성화
      retry: 1, // 실패 시 1회만 재시도
    },
  },
})

export default function AdminClientLayout({
  children,
  initialUser,
  initialUserData
}: {
  children: React.ReactNode
  initialUser: User | null
  initialUserData: UserData | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user: sessionUser, loading: sessionLoading, refreshSession } = useSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showHtmlBuilder, setShowHtmlBuilder] = useState(false)
  const [showCalendarPopup, setShowCalendarPopup] = useState(false)
  const [themeLoaded, setThemeLoaded] = useState(false)
  const [accessiblePages, setAccessiblePages] = useState<string[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('operation')
  const [selectedGroup, setSelectedGroup] = useState<string>('dashboard')
  const supabase = createClient()

  // 세션 동기화 체크 (한 번만 실행)
  useEffect(() => {
    // 초기 로드시 세션 동기화 (sessionLoading이 false일 때만)
    if (!sessionLoading && !sessionUser && !initialUser) {
      syncSession().then(result => {
        if (!result.success) {
          console.log('[AdminClientLayout] Session sync failed:', result.error)
          // Rate limit 에러가 아닐 때만 리다이렉트
          if (!result.error?.toString().includes('rate limit')) {
            router.push('/platform?login=true')
          }
        }
      })
    }
  }, [sessionLoading]) // sessionUser, router 제거하여 무한 루프 방지

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) setIsSidebarOpen(false)
      else setIsSidebarOpen(true)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 읽지 않은 알림 개수 조회 (폴링 간격 최적화: 30초 → 60초)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'admin')
          .eq('is_read', false)

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('읽지 않은 알림 개수 조회 실패:', error)
      }
    }

    fetchUnreadCount()

    // 60초마다 업데이트 (기존 30초에서 최적화)
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  // 관리자 화면 타이틀 및 배경색 설정
  useEffect(() => {
    // 타이틀 변경
    document.title = '달래마켓 관리자';

    // 관리자 페이지에서는 body 그라데이션 제거하고 단색으로
    const originalBackground = document.body.style.background;
    document.body.style.background = 'var(--color-background)';

    return () => {
      // 페이지 떠날 때 원래 배경 복원
      if (document.body) {
        document.body.style.background = originalBackground;
      }
    };
  }, []);

  // 접근 가능한 페이지 가져오기 (user, userData는 props로 전달받음)
  useEffect(() => {
    const fetchAccessiblePages = async () => {
      if (initialUser) {
        const pages = await getUserAccessiblePages(initialUser.id)
        if (pages) setAccessiblePages(pages)
      }
    }
    fetchAccessiblePages()
  }, [initialUser])

  // 모든 메뉴 아이템을 플랫하게 만들기 (권한 체크용)
  const menuItems = useMemo(
    () => menuGroups.flatMap(group => group.items),
    [] // menuGroups는 정적 데이터이므로 빈 배열
  );

  // 현재 경로에 따라 활성 그룹 및 카테고리 자동 선택
  useEffect(() => {
    if (pathname) {
      let bestMatch = { group: '', category: '', matchLength: 0 };

      // 가장 구체적인(긴) 경로와 매칭되는 메뉴 찾기
      for (const group of menuGroups) {
        for (const item of group.items) {
          if (pathname.startsWith(item.href) && item.href.length > bestMatch.matchLength) {
            bestMatch = {
              group: group.id,
              category: group.category,
              matchLength: item.href.length
            };
          }
        }
      }

      if (bestMatch.group) {
        setSelectedGroup(bestMatch.group);
        setSelectedCategory(bestMatch.category);
      }
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/admin/dashboard' && pathname === '/admin') return true
    return pathname?.startsWith(href) || false
  }

  // 권한 기반 메뉴 필터링 (그룹 단위)
  const filteredMenuGroups = useMemo(
    () => menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // super_admin은 모든 메뉴 표시
        if (accessiblePages.includes('*')) return true
        // 접근 가능한 페이지 목록에 있는지 확인
        return accessiblePages.includes(item.href)
      })
    })).filter(group => group.items.length > 0), // 아이템이 없는 그룹은 제외
    [accessiblePages] // accessiblePages 변경 시에만 재계산
  );

  // 현재 선택된 카테고리의 그룹들
  const currentCategoryGroups = useMemo(
    () => filteredMenuGroups.filter(g => g.category === selectedCategory),
    [filteredMenuGroups, selectedCategory]
  );

  // 현재 선택된 그룹의 메뉴 아이템들
  const selectedGroupData = useMemo(
    () => filteredMenuGroups.find(g => g.id === selectedGroup),
    [filteredMenuGroups, selectedGroup]
  );
  const currentItems = selectedGroupData?.items || [];

  // 카테고리별 필터링 (적어도 하나의 그룹이 있는 카테고리만)
  const filteredCategories = useMemo(
    () => menuCategories.filter(category =>
      filteredMenuGroups.some(group => group.category === category.id)
    ),
    [filteredMenuGroups]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider initialUser={initialUser} initialUserData={initialUserData}>
        <ToastProvider>
          <ConfirmProvider>
          <div className="flex flex-col h-screen bg-background" style={{ background: 'var(--color-background)' }}>
      {/* 헤더 */}
      <header className="h-16 bg-surface border-b border-gray-200 z-50">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* 로고 */}
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <h2 className="text-lg font-bold text-text">달래마켓 관리자</h2>
              </Link>
            </div>

            <div className="w-px h-5 bg-border hidden lg:block" />

            {/* 사용자 정보 */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-text">
                <span className="font-medium">{initialUserData?.name || '관리자'}</span>
                <span className="text-text-tertiary mx-1.5">·</span>
                <span className="text-text-tertiary text-xs">{initialUser?.email || 'loading...'}</span>
              </p>
            </div>
          </div>

          {/* 헤더 우측 */}
          <div className="flex items-center gap-3">

            <div className="hidden md:flex items-center bg-background-secondary rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="검색..."
                className="ml-2 bg-transparent outline-none text-sm text-text placeholder-gray-400 dark:placeholder-[#6e6e6e] w-40"
              />
            </div>

            {/* 알림 아이콘 */}
            <button
              onClick={() => router.push('/admin/notifications')}
              className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors group"
            >
              <svg className="w-5 h-5 text-text-tertiary group-hover:text-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* 달력 아이콘 */}
            <button
              onClick={() => setShowCalendarPopup(!showCalendarPopup)}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors group"
              title="일정 관리"
            >
              <svg className="w-5 h-5 text-text-tertiary group-hover:text-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <div className="w-px h-5 bg-border" />

            {/* HTML 생성기 버튼 */}
            <button
              onClick={() => setShowHtmlBuilder(!showHtmlBuilder)}
              className="px-2.5 py-1.5 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-md hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              title="HTML 생성기"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="font-medium">HTML</span>
            </button>

            {/* 플랫폼 화면 버튼 */}
            <Link
              href="/platform"
              className="px-2.5 py-1.5 text-xs bg-gray-900 dark:bg-gray-800 !text-white rounded-md hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="font-medium text-white">플랫폼</span>
            </Link>

            <div className="w-px h-5 bg-border" />

            {/* 로그아웃 버튼 */}
            <LogoutButton />

            <div className="w-px h-5 bg-border" />

            {/* 테마 토글 */}
            <ThemeToggle />

          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 3단 사이드바 */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed lg:relative lg:translate-x-0
          flex h-full
          transition-transform duration-200 ease-in-out z-40
        `}>
          {/* 1단 사이드바: 대카테고리 */}
          <aside className="w-16 h-full bg-surface border-r border-gray-200 flex flex-col">
            {/* 대카테고리 */}
            <nav className="flex-1 py-4 overflow-y-auto">
              <div className="space-y-1">
                {filteredCategories.map((category) => {
                  const isCategoryActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        // 해당 카테고리의 첫 번째 그룹 자동 선택
                        const firstGroup = filteredMenuGroups.find(g => g.category === category.id);
                        if (firstGroup) {
                          setSelectedGroup(firstGroup.id);
                        }
                      }}
                      className={`
                        w-full flex flex-col items-center gap-1 py-3 transition-all duration-150
                        ${isCategoryActive
                          ? 'bg-primary/10 text-primary border-r-2 border-primary'
                          : 'text-text-tertiary hover:text-text hover:bg-surface-hover'
                        }
                      `}
                      title={category.name}
                    >
                      <span className={`${isCategoryActive ? 'text-primary' : 'text-text-tertiary'}`}>
                        {category.icon}
                      </span>
                      <span className="text-[9px] font-medium text-center px-1 leading-tight">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* 2단 사이드바: 선택된 카테고리의 그룹들 */}
          <aside className="w-16 h-full bg-surface border-r border-gray-200 flex flex-col">
            {/* 메뉴 그룹 */}
            <nav className="flex-1 py-4 overflow-y-auto">
              <div className="space-y-1">
                {currentCategoryGroups.map((group) => {
                  const isGroupActive = selectedGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group.id)}
                      className={`
                        w-full flex flex-col items-center gap-1 py-3 transition-all duration-150
                        ${isGroupActive
                          ? 'bg-primary/10 text-primary border-r-2 border-primary'
                          : 'text-text-tertiary hover:text-text hover:bg-surface-hover'
                        }
                      `}
                      title={group.name}
                    >
                      <span className={`${isGroupActive ? 'text-primary' : 'text-text-tertiary'}`}>
                        {group.icon}
                      </span>
                      <span className="text-[9px] font-medium text-center px-1 leading-tight">
                        {group.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* 3단 사이드바: 선택된 그룹의 메뉴 */}
          <aside className="w-48 h-full bg-gradient-to-b from-surface to-background border-r border-gray-200 shadow-[2px_0_8px_rgba(0,0,0,0.06)] flex flex-col">
            {/* 메뉴 목록 */}
            <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
              <div className="px-3 space-y-1">
                {currentItems.map((item, index) => {
                  // 구분선 제외
                  if (item.name === '---divider---') {
                    return null;
                  }

                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        ${active
                          ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                          : 'text-text-secondary hover:text-text hover:bg-surface-hover/80 hover:shadow-sm hover:translate-x-0.5'
                        }
                      `}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      {/* 활성 인디케이터 */}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary via-primary to-primary/50 rounded-r-full" />
                      )}

                      {/* 아이콘 */}
                      <div className={`
                        flex items-center justify-center w-5 h-5 transition-all duration-200
                        ${active ? 'text-primary scale-110' : 'text-text-tertiary group-hover:text-primary group-hover:scale-105'}
                      `}>
                        {item.icon}
                      </div>

                      {/* 메뉴명 */}
                      <span className={`
                        text-[13px] flex-1 transition-all duration-200
                        ${active ? 'font-medium' : 'font-normal group-hover:font-medium'}
                      `}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </aside>
        </div>

        {/* 메인 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>

          {/* 관리자 전용 푸터 */}
          <footer className="border-t border-border bg-surface">
            <div className="px-4 lg:px-6 py-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* 좌측: 저작권 정보 */}
                <div className="text-sm text-text-tertiary">
                  <p>© 2025 <span className="font-semibold text-text">달래마켓</span>. All rights reserved.</p>
                </div>

                {/* 중앙: 빠른 링크 */}
                <div className="flex items-center gap-6 text-xs text-text-secondary">
                  <Link href="/admin/settings" className="hover:text-primary transition-colors">
                    설정
                  </Link>
                  <Link href="/admin/notifications" className="hover:text-primary transition-colors">
                    알림
                  </Link>
                  <Link href="/admin/help" className="hover:text-primary transition-colors">
                    도움말
                  </Link>
                </div>

                {/* 우측: 버전 정보 */}
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium">시스템 정상</span>
                  </div>
                  <span className="text-border">|</span>
                  <span>v2.0.0</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
        </ConfirmProvider>

        {/* 플로팅 HTML 생성기 */}
        <FloatingHtmlBuilder
          isOpen={showHtmlBuilder}
          onClose={() => setShowHtmlBuilder(false)}
        />

        {/* 달력 팝업 */}
        <CalendarPopup
          isOpen={showCalendarPopup}
          onClose={() => setShowCalendarPopup(false)}
        />
        </ToastProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  )
}
