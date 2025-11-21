'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import TierBadge from '@/components/TierBadge';
import { useSidebar } from '@/contexts/SidebarContext';

interface MenuItem {
  path: string;
  text: string;
  icon: JSX.Element;
  hasSubmenu?: boolean;
  submenu?: { path: string; text: string }[];
  special?: boolean;
  isImage?: boolean;
  imageUrl?: string;
}

export default function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeIconMenu, isSidebarVisible, setIsSidebarVisible, setActiveIconMenu } = useSidebar();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [sellerCode, setSellerCode] = useState<string>('');
  const [organizationTier, setOrganizationTier] = useState<'light' | 'standard' | 'advance' | 'elite' | 'legend' | null>(null);
  const [primaryOrgId, setPrimaryOrgId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [toolsMenuItems, setToolsMenuItems] = useState<MenuItem[]>([]);
  const supabase = createClient();

  const handleClose = () => {
    setIsSidebarVisible(false);
    setActiveIconMenu(null);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('primary_organization_id')
          .eq('id', user.id)
          .single();

        if (userData?.primary_organization_id) {
          setPrimaryOrgId(userData.primary_organization_id);

          const { data: orgData } = await supabase
            .from('organizations')
            .select('business_name, seller_code, tier')
            .eq('id', userData.primary_organization_id)
            .single();

          if (orgData) {
            setOrganizationName(orgData.business_name || '');
            setSellerCode(orgData.seller_code || '');
            setOrganizationTier(orgData.tier);
          }
        }
      }
    };
    fetchUser();
  }, []);

  // 업무도구 목록 불러오기
  useEffect(() => {
    const loadTools = async () => {
      try {
        const response = await fetch('/api/tools');
        const data = await response.json();

        if (data.success && data.tools) {
          const formattedTools: MenuItem[] = data.tools.map((tool: any) => ({
            path: '/platform/tools',
            text: tool.name,
            icon: icons.tools
          }));

          // '전체 도구'를 맨 앞에 추가
          setToolsMenuItems([
            {
              path: '/platform/tools',
              text: '전체 도구',
              icon: icons.tools
            },
            ...formattedTools
          ]);
        }
      } catch (error) {
        console.error('업무도구 목록 로드 오류:', error);
        // 에러 발생 시 기본 항목만 표시
        setToolsMenuItems([
          {
            path: '/platform/tools',
            text: '전체 도구',
            icon: icons.tools
          }
        ]);
      }
    };

    loadTools();
  }, []);

  // localStorage에서 활성 탭 가져오기
  useEffect(() => {
    const savedTab = localStorage.getItem('ordersActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, [pathname]);

  // 메뉴 아이콘
  const icons = {
    products: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>,
    tools: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>,
    orders: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
    pricing: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    won: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><text x="50%" y="76%" textAnchor="middle" fontSize="20" fontWeight="50" fill="currentColor">₩</text></svg>,
    ranking: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
    notice: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
    profile: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    message: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    fileText: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M9 8h1"></path><path d="M9 12h1"></path><path d="M9 16h1"></path><path d="M14 8h1"></path><path d="M14 12h1"></path><path d="M14 16h1"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path></svg>,
    charge: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>,
    wallet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"></path><path d="M3 9v-2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"></path><circle cx="17" cy="14" r="1"></circle></svg>
  };

  // UserHeader와 동일한 메뉴 구조
  const menuItems: MenuItem[] = [
    {
      path: '/platform',
      text: '공급상품',
      icon: icons.products,
      hasSubmenu: true,
      submenu: [
        { path: '/platform/products/all', text: '전체상품' },
        { path: '/platform/calendar', text: '상품캘린더' },
        { path: '/gallery', text: '이미지다운로드' }
      ]
    },
    {
      path: '/platform/orders',
      text: '발주관리',
      icon: icons.orders,
      hasSubmenu: true,
      submenu: [
        { path: '/platform/orders', text: '대시보드', tab: '대시보드' },
        { path: '/platform/orders', text: '발주서등록', tab: '발주서등록' },
        { path: '/platform/orders', text: '건별등록', tab: '건별등록' }
      ]
    },
    {
      path: '/platform/orders',
      text: '정산관리',
      icon: icons.won,
      hasSubmenu: true,
      submenu: [
        { path: '/platform/orders', text: '거래명세서', tab: '정산관리' },
        { path: '/platform/settlement/tax-invoice', text: '세금계산서' }
      ]
    }
  ];

  // 알림 메뉴 아이템
  const notificationMenuItems: MenuItem[] = [
    {
      path: '/platform/notifications/orders',
      text: '발주/주문',
      icon: icons.orders
    },
    {
      path: '/platform/notifications/payment',
      text: '입금/정산',
      icon: icons.won
    },
    {
      path: '/platform/notifications/products',
      text: '상품정보',
      icon: icons.products
    },
    {
      path: '/platform/notifications/announcements',
      text: '공지알림',
      icon: icons.notice
    },
    {
      path: '/platform/notifications/messages',
      text: '메세지',
      icon: icons.message
    },
    {
      path: '/platform/notifications/etc',
      text: '기타',
      icon: icons.fileText
    }
  ];

  // 커뮤니티 메뉴 아이템
  const communityMenuItems: MenuItem[] = [
    {
      path: '/platform/ranking',
      text: '셀러랭킹',
      icon: icons.ranking
    },
    {
      path: '/platform/seller-feed',
      text: '셀러피드',
      icon: icons.notice
    }
  ];

  // 구독 메뉴 아이템
  const subscriptionMenuItems: MenuItem[] = [
    {
      path: '/platform/pricing',
      text: '요금제',
      icon: icons.pricing
    },
    {
      path: '/platform/winwin',
      text: 'Win-Win',
      icon: icons.ranking
    }
  ];

  // 공지 메뉴 아이템
  const announcementsMenuItems: MenuItem[] = [
    {
      path: '/platform/notice',
      text: '일반공지',
      icon: icons.notice
    },
    {
      path: '/platform/announcements/important',
      text: '중요공지',
      icon: icons.notice
    }
  ];

  // 예치금 메뉴 아이템
  const depositMenuItems: MenuItem[] = [
    {
      path: '/platform/deposit/charge',
      text: '예치금충전',
      icon: icons.charge
    },
    {
      path: '/platform/deposit/history',
      text: '예치금이력',
      icon: icons.fileText
    },
    {
      path: '/platform/orders',
      text: '지갑',
      icon: icons.wallet,
      tab: '지갑'
    }
  ];

  // 설정 메뉴 아이템
  const settingsMenuItems: MenuItem[] = [
    {
      path: '/platform/orders',
      text: '옵션상품매핑',
      icon: icons.tools,
      tab: '옵션상품매핑'
    }
  ];

  const toggleMenu = (path: string) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };

  const isActive = (path: string) => {
    // 정확한 경로 매칭
    if (pathname === path) return true;

    // /platform은 상품 관련 경로만 매칭 (orders, pricing 등 제외)
    if (path === '/platform') {
      return pathname?.startsWith('/platform/products/') ||
             pathname === '/platform/calendar' ||
             pathname === '/gallery';
    }

    // 다른 경로는 하위 경로 매칭
    return pathname?.startsWith(path + '/');
  };

  // 부모 메뉴의 활성화 상태 확인 (하위 메뉴 중 하나라도 활성화되어 있으면 true)
  const isParentActive = (item: MenuItem) => {
    if (!item.hasSubmenu || !item.submenu) {
      return isActive(item.path);
    }

    // 하위 메뉴 중 하나라도 활성화되어 있는지 확인
    return item.submenu.some((subItem) => {
      const subItemTab = (subItem as any).tab;
      if (subItemTab) {
        return pathname === subItem.path && activeTab === subItemTab;
      }
      return pathname === subItem.path;
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      left: '50px',
      width: '192px',
      height: 'calc(100vh - 50px)',
      background: 'var(--color-background-secondary, #f8f9fa)',
      borderRight: '1px solid var(--color-border, #e0e0e0)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1002,
      transform: isSidebarVisible ? 'translateX(0)' : 'translateX(-242px)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* 닫기 버튼 */}
      {isSidebarVisible && (
      <div style={{
        position: 'absolute',
        right: '-12px',
        top: '50%',
        transform: 'translateY(calc(-50% - 120px))',
        zIndex: 10
      }}>
        <button
          onClick={handleClose}
          style={{
            width: '24px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-background-secondary, #f8f9fa)',
            borderTop: '1px solid var(--color-border, #e0e0e0)',
            borderBottom: '1px solid var(--color-border, #e0e0e0)',
            borderLeft: '1px solid var(--color-border, #e0e0e0)',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            cursor: 'pointer',
            color: '#6c757d',
            transition: 'all 0.2s',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#212529';
            e.currentTarget.style.boxShadow = '-2px 0 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-background-secondary, #f8f9fa)';
            e.currentTarget.style.color = '#6c757d';
            e.currentTarget.style.boxShadow = '-2px 0 8px rgba(0,0,0,0.1)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </button>
      </div>
      )}

      {/* 메뉴 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: '16px', paddingLeft: '12px', paddingRight: '12px' }}>
        {/* 알림 메뉴 (아이콘 메뉴에서 활성화된 경우) - 사이드바 전체 교체 */}
        {activeIconMenu === 'notifications' ? (
          <div key="notifications" style={{
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {notificationMenuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px 8px 8px',
                  margin: '1px 8px',
                  background: isActive(item.path) ? '#e9ecef' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1e3a2e',
                  letterSpacing: '0.5px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = '#f1f3f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        ) : activeIconMenu === 'community' ? (
          <div key="community" style={{
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {communityMenuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px 8px 8px',
                  margin: '1px 8px',
                  background: isActive(item.path) ? '#e9ecef' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1e3a2e',
                  letterSpacing: '0.5px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = '#f1f3f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        ) : activeIconMenu === 'subscription' ? (
          <div key="subscription" style={{
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {subscriptionMenuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px 8px 8px',
                  margin: '1px 8px',
                  background: isActive(item.path) ? '#e9ecef' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1e3a2e',
                  letterSpacing: '0.5px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = '#f1f3f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        ) : activeIconMenu === 'announcements' ? (
          <div key="announcements" style={{
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {announcementsMenuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px 8px 8px',
                  margin: '1px 8px',
                  background: isActive(item.path) ? '#e9ecef' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1e3a2e',
                  letterSpacing: '0.5px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = '#f1f3f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        ) : activeIconMenu === 'deposit' ? (
          <div key="deposit" style={{
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {depositMenuItems.map((item) => {
              const subItemTab = (item as any).tab;

              // tab이 있는 경우 버튼으로 렌더링 (지갑)
              if (subItemTab) {
                const isTabActive = pathname === item.path && activeTab === subItemTab;

                return (
                  <button
                    key={item.path + '-' + subItemTab}
                    onClick={() => {
                      if (pathname === item.path) {
                        localStorage.setItem('ordersActiveTab', subItemTab);
                        setActiveTab(subItemTab);
                        window.dispatchEvent(new CustomEvent('ordersTabChange', { detail: subItemTab }));
                      } else {
                        localStorage.setItem('ordersActiveTab', subItemTab);
                        router.push(item.path);
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px 8px 8px',
                      margin: '1px 8px',
                      background: isTabActive ? '#e9ecef' : 'transparent',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '400',
                      color: '#1e3a2e',
                      letterSpacing: '0.5px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isTabActive) {
                        e.currentTarget.style.background = '#f1f3f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isTabActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </button>
                );
              }

              // tab이 없는 경우 Link로 렌더링
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px 8px 8px',
                    margin: '1px 8px',
                    background: isActive(item.path) ? '#e9ecef' : 'transparent',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '400',
                    color: '#1e3a2e',
                    letterSpacing: '0.5px',
                    textDecoration: 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = '#f1f3f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              );
            })}
          </div>
        ) : activeIconMenu === 'settings' ? (
          <div key="settings" style={{
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {settingsMenuItems.map((item) => {
              const subItemTab = (item as any).tab;

              // tab이 있는 경우 버튼으로 렌더링
              if (subItemTab) {
                const isTabActive = pathname === item.path && activeTab === subItemTab;

                return (
                  <button
                    key={item.path + '-' + subItemTab}
                    onClick={() => {
                      if (pathname === item.path) {
                        localStorage.setItem('ordersActiveTab', subItemTab);
                        setActiveTab(subItemTab);
                        window.dispatchEvent(new CustomEvent('ordersTabChange', { detail: subItemTab }));
                      } else {
                        localStorage.setItem('ordersActiveTab', subItemTab);
                        router.push(item.path);
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px 8px 8px',
                      margin: '1px 8px',
                      background: isTabActive ? '#e9ecef' : 'transparent',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '400',
                      color: '#1e3a2e',
                      letterSpacing: '0.5px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isTabActive) {
                        e.currentTarget.style.background = '#f1f3f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isTabActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </button>
                );
              }

              // tab이 없는 경우 Link로 렌더링
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px 8px 8px',
                    margin: '1px 8px',
                    background: isActive(item.path) ? '#e9ecef' : 'transparent',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '400',
                    color: '#1e3a2e',
                    letterSpacing: '0.5px',
                    textDecoration: 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = '#f1f3f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              );
            })}
          </div>
        ) : activeIconMenu === 'tools' ? (
          <div key="tools" style={{
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {toolsMenuItems.map((item) => (
              <Link
                key={item.path + '-' + item.text}
                href={item.path}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px 8px 8px',
                  margin: '1px 8px',
                  background: isActive(item.path) ? '#e9ecef' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1e3a2e',
                  letterSpacing: '0.5px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = '#f1f3f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        ) : (
          /* 일반 메뉴 */
          <div key="regular" style={{
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {menuItems.map((item) => (
          <div key={`${item.path}-${item.text}`}>
            {/* 메인 메뉴 */}
            {item.hasSubmenu ? (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px 8px 8px',
                  margin: '1px 8px',
                  background: isParentActive(item) ? '#e9ecef' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1e3a2e',
                  letterSpacing: '0.5px',
                  transition: 'background 0.2s',
                  cursor: 'default'
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </div>
            ) : (
              <Link
                href={item.path}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px 8px 8px',
                  margin: '1px 8px',
                  background: isActive(item.path) ? '#e9ecef' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1e3a2e',
                  letterSpacing: '0.5px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = '#f1f3f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.isImage ? (
                  <img
                    src={item.imageUrl}
                    alt={item.text}
                    style={{ height: '16px', width: 'auto', objectFit: 'contain', marginLeft: '20px' }}
                  />
                ) : (
                  <>
                    {item.icon}
                    <span>{item.text}</span>
                  </>
                )}
              </Link>
            )}

            {/* 서브메뉴 */}
            {item.hasSubmenu && item.submenu && (
              <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                {item.submenu.map((subItem) => {
                  // tab 속성이 있으면 tab으로 활성화 상태 확인, 없으면 pathname으로 확인
                  const subItemTab = (subItem as any).tab;
                  const isSubItemActive = subItemTab
                    ? (pathname === subItem.path && activeTab === subItemTab)
                    : pathname === subItem.path;

                  // tab 속성이 있으면 버튼으로 렌더링 (같은 페이지 내 탭 전환)
                  if (subItemTab) {
                    return (
                      <button
                        key={`${subItem.path}-${subItem.text}`}
                        onClick={() => {
                          if (pathname === subItem.path) {
                            // 같은 페이지면 탭만 변경
                            localStorage.setItem('ordersActiveTab', subItemTab);
                            setActiveTab(subItemTab);
                            // 커스텀 이벤트 발생시켜 orders 페이지에 알림
                            window.dispatchEvent(new CustomEvent('ordersTabChange', { detail: subItemTab }));
                          } else {
                            // 다른 페이지면 이동
                            localStorage.setItem('ordersActiveTab', subItemTab);
                            router.push(subItem.path);
                          }
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '6px 16px',
                          margin: '1px 8px 1px 34px',
                          background: isSubItemActive ? '#e9ecef' : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '400',
                          color: isSubItemActive ? 'var(--color-text, #212529)' : 'var(--color-text-secondary, #6c757d)',
                          letterSpacing: '0.5px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSubItemActive) {
                            e.currentTarget.style.background = '#f1f3f5';
                            e.currentTarget.style.color = 'var(--color-text, #212529)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubItemActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary, #6c757d)';
                          }
                        }}
                      >
                        {subItem.text}
                      </button>
                    );
                  }

                  // tab 속성이 없으면 Link로 렌더링 (일반 페이지 이동)
                  return (
                    <Link
                      key={`${subItem.path}-${subItem.text}`}
                      href={subItem.path}
                      style={{
                        display: 'block',
                        padding: '6px 16px',
                        margin: '1px 8px 1px 34px',
                        background: isSubItemActive ? '#e9ecef' : 'transparent',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '400',
                        color: isSubItemActive ? 'var(--color-text, #212529)' : 'var(--color-text-secondary, #6c757d)',
                        letterSpacing: '0.5px',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubItemActive) {
                          e.currentTarget.style.background = '#f1f3f5';
                          e.currentTarget.style.color = 'var(--color-text, #212529)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubItemActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--color-text-secondary, #6c757d)';
                        }
                      }}
                    >
                      {subItem.text}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
          </div>
        )}
      </div>

      {/* 하단 사용자 정보 */}
      {sellerCode && user && (
        <div style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--color-border, #e0e0e0)',
          background: 'var(--color-background-secondary, #f8f9fa)'
        }}>
          <div style={{
            padding: '8px 10px',
            background: 'white',
            border: '1px solid #2563eb',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#2563eb',
              fontFamily: 'monospace',
              letterSpacing: '0.5px',
              marginBottom: '4px'
            }}>
              {sellerCode}
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--color-text-secondary, #6c757d)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.email}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
