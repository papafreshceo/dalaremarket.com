'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { createClient } from '@/lib/supabase/client';

export default function IconSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { activeIconMenu, setActiveIconMenu, isSidebarVisible, setIsSidebarVisible, isHydrated } = useSidebar();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showOpenButton, setShowOpenButton] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!expandedMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExpandedMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedMenu]);

  // 프로필 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!showProfileDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  // 사이드바 애니메이션 후 열기 버튼 표시
  useEffect(() => {
    if (!isSidebarVisible) {
      const timer = setTimeout(() => {
        setShowOpenButton(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowOpenButton(false);
    }
  }, [isSidebarVisible]);

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // 읽지 않은 알림 개수 조회
  useEffect(() => {
    if (!currentUserId) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.unread_count);
        }
      } catch (error) {
        console.error('읽지 않은 알림 개수 조회 실패:', error);
      }
    };

    fetchUnreadCount();
  }, [currentUserId]);

  // Realtime 구독: 알림 개수 실시간 업데이트
  useEffect(() => {
    if (!currentUserId) return;

    // 기존 채널 구독 해제
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // 새 채널 구독
    const channel = supabase
      .channel('notifications-sidebar')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        () => {
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload: any) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload: any) => {
          if (!payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // 페이지 로드 시 현재 경로에 맞는 메뉴 상태 설정
  // Hydration 완료 후에만 실행하여 서버/클라이언트 불일치 방지
  useEffect(() => {
    // Hydration 완료 전에는 실행하지 않음
    if (!isHydrated) return;
    // 클라이언트에서만 URL 파라미터 및 localStorage 확인
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') || null;
    // localStorage에서 저장된 탭 값도 확인 (router.push 후에는 이 값 사용)
    const savedTab = localStorage.getItem('ordersActiveTab');

    if (pathname.startsWith('/platform/notifications')) {
      setActiveIconMenu('notifications');
      setIsSidebarVisible(true);
    } else if (pathname.startsWith('/platform/deposit') || pathname === '/platform/wallet') {
      setActiveIconMenu('deposit');
      setIsSidebarVisible(true);
    } else if (pathname.startsWith('/platform/community') || pathname === '/platform/ranking' || pathname === '/platform/seller-feed') {
      setActiveIconMenu('community');
      setIsSidebarVisible(true);
    } else if (pathname.startsWith('/platform/subscription') || pathname === '/platform/pricing' || pathname === '/platform/winwin') {
      setActiveIconMenu('subscription');
      setIsSidebarVisible(true);
    } else if (pathname.startsWith('/platform/announcements') || pathname === '/platform/notice') {
      setActiveIconMenu('announcements');
      setIsSidebarVisible(true);
    } else if (pathname === '/platform/tools') {
      setActiveIconMenu('tools');
      setIsSidebarVisible(true);
    } else if (pathname === '/platform/settings') {
      setActiveIconMenu('settings');
      setIsSidebarVisible(true);
    } else if (pathname === '/platform/orders' && (tab === '지갑' || savedTab === '지갑')) {
      // 지갑 탭: 예치금 메뉴 활성화
      setActiveIconMenu('deposit');
      setIsSidebarVisible(true);
    } else if (pathname === '/platform/orders' && (tab === '옵션상품매핑' || savedTab === '옵션상품매핑')) {
      // 옵션상품매핑 탭: 설정 메뉴 활성화
      setActiveIconMenu('settings');
      setIsSidebarVisible(true);
    } else if (pathname === '/platform' || pathname.startsWith('/platform/products') || pathname === '/platform/calendar' || pathname === '/gallery' || pathname === '/platform/orders') {
      // 홈 및 기본 메뉴: activeIconMenu는 null
      setActiveIconMenu(null);
      // localStorage에서 사이드바 표시 상태 가져오기
      const savedVisible = localStorage.getItem('platformSidebarVisible');
      setIsSidebarVisible(savedVisible === 'true');
    }
  }, [pathname, isHydrated]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const menuItems = [
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      path: '/platform',
      label: '홈'
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      path: '/platform/profile',
      label: '프로필',
      submenu: [
        { path: '/platform/profileinfo', label: '프로필' },
        { path: '/platform/profile', label: '셀러계정' }
      ]
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      path: '/platform/community',
      label: '커뮤니티',
      submenu: [
        { path: '/platform/ranking', label: '셀러랭킹' },
        { path: '/platform/seller-feed', label: '셀러피드' }
      ]
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      ),
      path: '/platform/deposit',
      label: '예치금',
      submenu: [
        { path: '/platform/deposit/charge', label: '예치금충전' },
        { path: '/platform/deposit/history', label: '예치금이력' },
        { path: '/platform/wallet', label: '지갑' }
      ]
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      ),
      path: '/platform/subscription',
      label: '구독',
      submenu: [
        { path: '/platform/pricing', label: '요금제' },
        { path: '/platform/winwin', label: 'Win-Win' }
      ]
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      ),
      path: '/platform/announcements',
      label: '공지',
      submenu: [
        { path: '/platform/notice', label: '일반공지' },
        { path: '/platform/announcements/important', label: '중요공지' }
      ]
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
          <path d="M5 3v4"></path>
          <path d="M19 17v4"></path>
          <path d="M3 5h4"></path>
          <path d="M17 19h4"></path>
        </svg>
      ),
      path: '/platform/tools',
      label: '업무도구',
      submenu: [
        { path: '/platform/tools', label: '전체 도구' }
      ]
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      path: '/platform/notifications',
      label: '알림',
      submenu: [
        { path: '/platform/notice', label: '공지사항' },
        { path: '/platform/notifications', label: '알림' },
        { path: '/platform/messages', label: '채팅' }
      ]
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      path: '/platform/settings',
      label: '설정',
      submenu: [
        { path: '/platform/orders', label: '옵션상품매핑', tab: '옵션상품매핑' }
      ]
    }
  ];

  const handleClick = (item: any) => {
    // 알림 아이콘은 PlatformSidebar에 메뉴 표시
    if (item.path === '/platform/notifications' && item.submenu) {
      const isCurrentlyActive = activeIconMenu === 'notifications';

      if (isCurrentlyActive) {
        // 같은 아이콘 클릭 - 사이드바 닫기
        setActiveIconMenu(null);
        setIsSidebarVisible(false);
      } else {
        // 다른 아이콘에서 전환 - 사이드바는 열린 상태 유지, 메뉴만 교체
        setActiveIconMenu('notifications');
        setIsSidebarVisible(true);
      }
      return;
    }

    // 예치금 아이콘은 PlatformSidebar에 메뉴 표시
    if (item.path === '/platform/deposit' && item.submenu) {
      const isCurrentlyActive = activeIconMenu === 'deposit';

      if (isCurrentlyActive) {
        // 같은 아이콘 클릭 - 사이드바 닫기
        setActiveIconMenu(null);
        setIsSidebarVisible(false);
      } else {
        // 다른 아이콘에서 전환 - 사이드바는 열린 상태 유지, 메뉴만 교체
        setActiveIconMenu('deposit');
        setIsSidebarVisible(true);
      }
      return;
    }

    // 커뮤니티 아이콘은 PlatformSidebar에 메뉴 표시
    if (item.path === '/platform/community' && item.submenu) {
      const isCurrentlyActive = activeIconMenu === 'community';

      if (isCurrentlyActive) {
        // 같은 아이콘 클릭 - 사이드바 닫기
        setActiveIconMenu(null);
        setIsSidebarVisible(false);
      } else {
        // 다른 아이콘에서 전환 - 사이드바는 열린 상태 유지, 메뉴만 교체
        setActiveIconMenu('community');
        setIsSidebarVisible(true);
      }
      return;
    }

    // 구독 아이콘은 PlatformSidebar에 메뉴 표시
    if (item.path === '/platform/subscription' && item.submenu) {
      const isCurrentlyActive = activeIconMenu === 'subscription';

      if (isCurrentlyActive) {
        // 같은 아이콘 클릭 - 사이드바 닫기
        setActiveIconMenu(null);
        setIsSidebarVisible(false);
      } else {
        // 다른 아이콘에서 전환 - 사이드바는 열린 상태 유지, 메뉴만 교체
        setActiveIconMenu('subscription');
        setIsSidebarVisible(true);
      }
      return;
    }

    // 공지 아이콘은 PlatformSidebar에 메뉴 표시
    if (item.path === '/platform/announcements' && item.submenu) {
      const isCurrentlyActive = activeIconMenu === 'announcements';

      if (isCurrentlyActive) {
        // 같은 아이콘 클릭 - 사이드바 닫기
        setActiveIconMenu(null);
        setIsSidebarVisible(false);
      } else {
        // 다른 아이콘에서 전환 - 사이드바는 열린 상태 유지, 메뉴만 교체
        setActiveIconMenu('announcements');
        setIsSidebarVisible(true);
      }
      return;
    }

    // 업무도구 아이콘은 PlatformSidebar에 메뉴 표시
    if (item.path === '/platform/tools' && item.submenu) {
      const isCurrentlyActive = activeIconMenu === 'tools';

      if (isCurrentlyActive) {
        // 같은 아이콘 클릭 - 사이드바 닫기
        setActiveIconMenu(null);
        setIsSidebarVisible(false);
      } else {
        // 다른 아이콘에서 전환 - 사이드바는 열린 상태 유지, 메뉴만 교체
        setActiveIconMenu('tools');
        setIsSidebarVisible(true);
      }
      return;
    }

    // 설정 아이콘은 PlatformSidebar에 메뉴 표시
    if (item.path === '/platform/settings' && item.submenu) {
      const isCurrentlyActive = activeIconMenu === 'settings';

      if (isCurrentlyActive) {
        // 같은 아이콘 클릭 - 사이드바 닫기
        setActiveIconMenu(null);
        setIsSidebarVisible(false);
      } else {
        // 다른 아이콘에서 전환 - 사이드바는 열린 상태 유지, 메뉴만 교체
        setActiveIconMenu('settings');
        setIsSidebarVisible(true);
      }
      return;
    }

    // 홈 아이콘은 사이드바 토글
    if (item.path === '/platform') {
      const isCurrentlyHome = activeIconMenu === null && isSidebarVisible;

      if (isCurrentlyHome) {
        // 홈이 이미 활성화된 상태 - 사이드바 닫기
        setIsSidebarVisible(false);
      } else {
        // 다른 메뉴에서 홈으로 전환 - 사이드바 열고 일반 메뉴 표시
        setActiveIconMenu(null);
        setIsSidebarVisible(true);
      }
      router.push(item.path);
      return;
    }

    // 기타 메뉴
    if (item.submenu) {
      setExpandedMenu(expandedMenu === item.path ? null : item.path);
    } else {
      router.push(item.path);
    }
  };

  const handleOpenSidebar = () => {
    setIsSidebarVisible(true);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      left: 0,
      width: '50px',
      height: 'calc(100vh - 50px)',
      background: 'var(--color-background-secondary, #f8f9fa)',
      borderRight: '1px solid var(--color-border, #e0e0e0)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '16px',
      gap: '12px',
      zIndex: 999
    }}>
      {menuItems.filter(item => item.path !== '/platform/profile').map((item, index) => {
        // 클릭 상태로만 활성화 여부 결정 (페이지 경로 무시)
        // Hydration 전에는 false로 처리하여 서버 렌더링과 일치
        const isHomeActive = item.path === '/platform' && activeIconMenu === null && isHydrated && isSidebarVisible;
        const isNotificationActive = item.path === '/platform/notifications' && activeIconMenu === 'notifications';
        const isProfileActive = item.path === '/platform/profile' && activeIconMenu === 'profile';
        const isDepositActive = item.path === '/platform/deposit' && activeIconMenu === 'deposit';
        const isCommunityActive = item.path === '/platform/community' && activeIconMenu === 'community';
        const isSubscriptionActive = item.path === '/platform/subscription' && activeIconMenu === 'subscription';
        const isAnnouncementsActive = item.path === '/platform/announcements' && activeIconMenu === 'announcements';
        const isToolsActive = item.path === '/platform/tools' && activeIconMenu === 'tools';
        const isSettingsActive = item.path === '/platform/settings' && activeIconMenu === 'settings';
        const isItemActive = isHomeActive || isNotificationActive || isProfileActive || isDepositActive || isCommunityActive || isSubscriptionActive || isAnnouncementsActive || isToolsActive || isSettingsActive;

        return (
          <div key={item.path} style={{ position: 'relative' }} ref={expandedMenu === item.path ? dropdownRef : null}>
            <button
              suppressHydrationWarning
              onClick={() => handleClick(item)}
              title={item.label}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isItemActive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.05)',
                color: isItemActive ? 'var(--color-text, #212529)' : 'var(--color-text-secondary, #6c757d)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isItemActive) {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                  e.currentTarget.style.color = 'var(--color-text, #212529)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isItemActive) {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                  e.currentTarget.style.color = 'var(--color-text-secondary, #6c757d)';
                }
              }}
            >
              {item.icon}
            </button>

            {/* 알림 배지 */}
            {item.path === '/platform/notifications' && unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#ef4444',
                color: 'white',
                fontSize: '9px',
                fontWeight: '600',
                borderRadius: '999px',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                pointerEvents: 'none'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            {/* 하위메뉴 드롭다운 (알림, 프로필, 예치금, 커뮤니티, 구독, 공지, 업무도구, 설정 제외) */}
            {item.submenu && expandedMenu === item.path && item.path !== '/platform/notifications' && item.path !== '/platform/profile' && item.path !== '/platform/deposit' && item.path !== '/platform/community' && item.path !== '/platform/subscription' && item.path !== '/platform/announcements' && item.path !== '/platform/tools' && item.path !== '/platform/settings' && (
            <div style={{
              position: 'fixed',
              left: '50px',
              top: `${66 + index * 52}px`,
              background: 'white',
              border: '1px solid var(--color-border, #e0e0e0)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px',
              minWidth: '140px',
              zIndex: 10000
            }}>
              {item.submenu.map((subItem: any) => (
                <button
                  key={subItem.path}
                  onClick={() => {
                    router.push(subItem.path);
                    setExpandedMenu(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: '400',
                    color: '#1e3a2e',
                    letterSpacing: '0.5px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface-hover, #e9ecef)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {subItem.label}
                </button>
              ))}
            </div>
            )}
          </div>
        );
      })}

      {/* 프로필 아이콘 (하단에 고정) */}
      {(() => {
        const profileItem = menuItems.find(item => item.path === '/platform/profile');
        if (!profileItem) return null;

        const isProfileActive = pathname === '/platform/profile' || pathname === '/platform/profileinfo';

        return (
          <div
            ref={profileDropdownRef}
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              title={profileItem.label}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isProfileActive || showProfileDropdown ? '#1a1a1a' : '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isProfileActive && !showProfileDropdown) {
                  e.currentTarget.style.background = '#333333';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProfileActive && !showProfileDropdown) {
                  e.currentTarget.style.background = '#000000';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
            >
              {profileItem.icon}
            </button>

            {/* 프로필 드롭다운 메뉴 */}
            {showProfileDropdown && profileItem.submenu && (
              <div style={{
                position: 'fixed',
                left: '50px',
                bottom: '16px',
                background: 'white',
                border: '1px solid var(--color-border, #e0e0e0)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '8px',
                minWidth: '140px',
                zIndex: 10000
              }}>
                {profileItem.submenu.map((subItem: any) => (
                  <button
                    key={subItem.path}
                    onClick={() => {
                      router.push(subItem.path);
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: '400',
                      color: '#1e3a2e',
                      letterSpacing: '0.5px',
                      background: pathname === subItem.path ? 'var(--color-surface-hover, #e9ecef)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-surface-hover, #e9ecef)';
                    }}
                    onMouseLeave={(e) => {
                      if (pathname !== subItem.path) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {subItem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* 사이드바 열기 버튼 (사이드바가 닫혀있을 때만 표시) */}
      {showOpenButton && (
        <div style={{
          position: 'absolute',
          right: '-12px',
          top: '50%',
          transform: 'translateY(calc(-50% - 120px))',
          zIndex: 997
        }}>
          <button
            onClick={handleOpenSidebar}
            style={{
              width: '24px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-background-secondary, #f8f9fa)',
              borderTop: '1px solid var(--color-border, #e0e0e0)',
              borderBottom: '1px solid var(--color-border, #e0e0e0)',
              borderRight: '1px solid var(--color-border, #e0e0e0)',
              borderLeft: 'none',
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer',
              color: '#6c757d',
              transition: 'all 0.2s',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#212529';
              e.currentTarget.style.boxShadow = '2px 0 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-background-secondary, #f8f9fa)';
              e.currentTarget.style.color = '#6c757d';
              e.currentTarget.style.boxShadow = '2px 0 8px rgba(0,0,0,0.1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
