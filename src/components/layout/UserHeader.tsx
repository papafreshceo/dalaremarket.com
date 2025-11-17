'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';
import { useToast } from '@/components/ui/Toast';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import TierBadge from '@/components/TierBadge';
import { useUserBalance } from '@/contexts/UserBalanceContext';
import NotificationBell from '@/components/notifications/NotificationBell';

interface NavItem {
  path: string;
  text: string;
  hasSubmenu?: boolean;
  submenu?: { path: string; text: string }[];
  special?: boolean;
  isImage?: boolean;
  imageUrl?: string;
}

export default function UserHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showSubmenu, setShowSubmenu] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [organizationTier, setOrganizationTier] = useState<'light' | 'standard' | 'advance' | 'elite' | 'legend' | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const { cashBalance, creditBalance, setCashBalance, setCreditBalance } = useUserBalance();
  const [showCashTooltip, setShowCashTooltip] = useState(false);
  const [showCreditTooltip, setShowCreditTooltip] = useState(false);
  const [contributionPoints, setContributionPoints] = useState(0);
  const [showContributionTooltip, setShowContributionTooltip] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [sellerCode, setSellerCode] = useState<string>('');

  // 활동 추적 콜백 (useCallback으로 안정화)
  const handleRewardClaimed = useCallback((amount: number, newBalance: number) => {
    setCashBalance(newBalance);
  }, [setCashBalance]);

  const handleLimitReached = useCallback(() => {
    // 한도 도달 시 아무것도 하지 않음
  }, []);

  // 활동 시간 추적 (로그인 시에만)
  useActivityTracker({
    enabled: !!user,
    onRewardClaimed: handleRewardClaimed,
    onLimitReached: handleLimitReached
  });

  // 발주관리 열기 함수
  const openOrders = (status?: string | null) => {
    const isPWACheck = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    const isMobileCheck = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // 모바일이면 항상 라우팅으로 전체화면 전환
    if (isMobileCheck) {
      const url = status ? `/platform/orders?status=${status}` : '/platform/orders';
      router.push(url);
      return;
    }

    // 데스크톱: 새 창으로 열기 (주소창 있음, 하지만 PWA 설치 안내 표시)
    const url = status
      ? `/platform/orders?status=${status}`
      : '/platform/orders';

    // Full HD 화면 크기 또는 사용자 화면 크기에 맞춤
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const windowFeatures = `width=${screenWidth},height=${screenHeight},left=0,top=0,resizable=yes,scrollbars=yes`;
    window.open(url, 'dalrea_orders', windowFeatures);
  };

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 주문 데이터 가져오기
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      // 사용자의 조직 ID 가져오기
      const { data: userData } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.primary_organization_id) {
        setOrders([]);
        return;
      }

      // 최근 7일 주문 가져오기
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('integrated_orders')
        .select('id, shipping_status, created_at')
        .eq('organization_id', userData.primary_organization_id)
        .gte('created_at', startDate.toISOString());

      if (error) {
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    };

    fetchOrders();

    // 30초마다 새로고침
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // 다크모드 감지
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // MutationObserver로 class 변경 감지
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // 스크롤 다운 - 헤더 숨김
        setHeaderVisible(false);
      } else {
        // 스크롤 업 - 헤더 표시
        setHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, primary_organization_id')
          .eq('id', user.id)
          .single();

        setUserRole(userData?.role || null);

        // 조직의 기여점수, 티어, 셀러계정명, 셀러코드 조회
        if (userData?.primary_organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('accumulated_points, tier, business_name, seller_code')
            .eq('id', userData.primary_organization_id)
            .single();

          setSellerCode(orgData?.seller_code || '');

          setContributionPoints(orgData?.accumulated_points || 0);
          setOrganizationName(orgData?.business_name || '');

          // tier 설정 (조직 기준, NULL 허용)
          const validTiers = ['light', 'standard', 'advance', 'elite', 'legend'];
          const tier = orgData?.tier?.toLowerCase();
          setOrganizationTier(tier && validTiers.includes(tier) ? tier : null);
        } else {
          setContributionPoints(0);
          setOrganizationName('');
          setSellerCode('');
          setOrganizationTier(null);
        }
      } else {
        setUserRole(null);
        setOrganizationTier(null);
        setContributionPoints(0);
        setOrganizationName('');
        setSellerCode('');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser();
      } else {
        setUser(null);
        setUserRole(null);
        setOrganizationTier(null);
        setContributionPoints(0);
        setOrganizationName('');
        setSellerCode('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 캐시/크레딧 통합 관리 (최적화)
  useEffect(() => {
    if (!user) {
      setCashBalance(0);
      setCreditBalance(0);
      return;
    }

    let isFirstLoad = true;

    const fetchBalances = async () => {
      try {
        // 오늘 날짜 (KST)
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstDate = new Date(now.getTime() + kstOffset);
        const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // localStorage에서 오늘 로그인 보상 청구 여부 확인
        const loginRewardKey = `login_reward_claimed_${today}`;
        const alreadyClaimed = localStorage.getItem(loginRewardKey) === 'true';

        console.log('[fetchBalances] isFirstLoad:', isFirstLoad, 'alreadyClaimed:', alreadyClaimed, 'will call login API:', isFirstLoad && !alreadyClaimed);

        // 병렬로 API 호출하여 성능 개선
        const [cashRes, creditRes, loginRes] = await Promise.all([
          fetch('/api/cash'),
          fetch('/api/credits/daily-refill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }),
          // 로그인 보상은 첫 로드 시이고 오늘 아직 청구하지 않았을 때만 시도
          isFirstLoad && !alreadyClaimed
            ? fetch('/api/cash/claim-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              })
            : Promise.resolve(null)
        ]);

        // 캐시 잔액 업데이트
        const cashData = await cashRes.json();
        if (cashData.success) {
          setCashBalance(cashData.balance);
        }

        // 크레딧 리필 및 잔액 업데이트
        const creditData = await creditRes.json();
        if (creditData.success) {
          setCreditBalance(creditData.balance);

          // 리필되었을 때만 토스트 표시
          if (creditData.refilled) {
            showToast('일일 크레딧 100이 지급되었습니다!', 'success');
          }
        }

        // 로그인 보상 처리 (첫 로드 시에만)
        if (loginRes) {
          const loginData = await loginRes.json();
          if (loginData.success) {
            setCashBalance(loginData.newBalance);
            showToast(`일일 로그인 보상 ${loginData.amount}캐시가 지급되었습니다!`, 'success');
            // localStorage에 오늘 청구했음을 기록
            localStorage.setItem(loginRewardKey, 'true');
          }
        }

        isFirstLoad = false;
      } catch (error) {
        console.error('잔액 조회 실패:', error);
      }
    };

    // 초기 로드
    fetchBalances();

    // 60초마다 갱신 (30초 -> 60초로 변경하여 부하 감소)
    const interval = setInterval(fetchBalances, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // 모달 닫기 메시지 수신

  const navItems: NavItem[] = [
    {
      path: '/platform',
      text: '공급상품',
      hasSubmenu: true,
      submenu: [
        { path: '/platform/products/all', text: '전체상품' },
        { path: '/platform/calendar', text: '상품캘린더' },
        { path: '/gallery', text: '이미지다운로드' }
      ]
    },
    { path: '/platform/tools', text: '업무도구' },
    { path: '/platform/pricing', text: '요금제' },
    { path: '/platform/ranking', text: '🏆 셀러랭킹' },
    { path: '/platform/winwin', text: 'Win-Win', special: true },
    { path: '/platform/notice', text: '공지사항' },
    {
      path: '/platform/seller-feed',
      text: 'Seller Feed',
      isImage: true,
      imageUrl: 'https://res.cloudinary.com/dde1hpbrp/image/upload/v1758988139/Seller_Feed_cgnxok.png'
    },
  ];

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // 로그아웃 시 탭 상태 초기화
    localStorage.removeItem('ordersActiveTab');
    showToast('로그아웃되었습니다.', 'success');
    router.push('/platform');
  };

  // 상태별 설정
  const statusConfig: Record<string, { label: string; color: string }> = {
    registered: { label: '등록', color: '#2563eb' },
    confirmed: { label: '확정', color: '#7c3aed' },
    preparing: { label: '준비중', color: '#f59e0b' },
    shipped: { label: '발송', color: '#10b981' },
    cancelRequested: { label: '취소요청', color: '#f87171' },
    cancelled: { label: '취소', color: '#6b7280' },
    refunded: { label: '환불', color: '#10b981' }
  };

  // shipping_status를 매핑하는 함수
  const mapShippingStatus = (shippingStatus: string | null): string => {
    if (!shippingStatus) return 'registered';

    const statusMap: Record<string, string> = {
      '발주서등록': 'registered',
      '발주서확정': 'confirmed',
      '결제완료': 'confirmed',
      '상품준비중': 'preparing',
      '배송중': 'shipped',
      '배송완료': 'shipped',
      '발송완료': 'shipped',
      '취소요청': 'cancelRequested',
      '취소완료': 'cancelled',
      '환불완료': 'refunded',
      'refunded': 'refunded'
    };

    return statusMap[shippingStatus] || 'registered';
  };

  // 상태별 통계
  const statsData = [
    { status: 'registered', count: orders.filter(o => mapShippingStatus(o.shipping_status) === 'registered').length },
    { status: 'confirmed', count: orders.filter(o => mapShippingStatus(o.shipping_status) === 'confirmed').length },
    { status: 'preparing', count: orders.filter(o => mapShippingStatus(o.shipping_status) === 'preparing').length },
    { status: 'shipped', count: orders.filter(o => mapShippingStatus(o.shipping_status) === 'shipped').length },
    { status: 'cancelRequested', count: orders.filter(o => mapShippingStatus(o.shipping_status) === 'cancelRequested').length },
    { status: 'cancelled', count: orders.filter(o => mapShippingStatus(o.shipping_status) === 'cancelled').length },
    { status: 'refunded', count: orders.filter(o => mapShippingStatus(o.shipping_status) === 'refunded').length }
  ];

  return (
    <>
      <div style={{ height: isMobile ? '35px' : '70px' }} />

      {/* Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            transition: 'opacity 0.3s'
          }}
        />
      )}

      <header style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? (headerVisible ? 0 : '-100%') : 0,
        right: 0,
        height: isMobile ? '35px' : '70px',
        background: isMobile ? 'transparent' : 'white',
        borderBottom: 'none',
        zIndex: 1000,
        transition: isMobile ? 'left 0.3s ease' : 'none'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          padding: isMobile ? '0 16px' : '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '40px' }}>
            {/* 햄버거 메뉴 (모바일) */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}

            <Link href="/platform">
              <img
                src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
                alt="달래마켓"
                style={{ height: isMobile ? '20px' : '24px' }}
              />
            </Link>

            {/* 데스크톱 네비게이션 */}
            {!isMobile && (
              <nav style={{ display: 'flex', gap: '24px' }}>
              {navItems.map(item => (
                <div
                  key={item.path}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => item.hasSubmenu && setShowSubmenu(item.path)}
                  onMouseLeave={() => setShowSubmenu(null)}
                >
                  <Link
                    href={item.path}
                    style={{
                      fontSize: '14px',
                      color: isActive(item.path) ? '#2563eb' : '#212529',
                      fontWeight: '500',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {item.isImage ? (
                      <img
                        src={item.imageUrl}
                        alt={item.text}
                        style={{
                          height: '19px',
                          width: 'auto',
                          objectFit: 'contain',
                          filter: isActive(item.path) ? 'none' : 'grayscale(0)',
                          opacity: isActive(item.path) ? 1 : 0.8,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = isActive(item.path) ? '1' : '0.8';
                        }}
                      />
                    ) : (
                      <>
                        {item.text}
                        {item.hasSubmenu && (
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </>
                    )}
                  </Link>

                  {/* Submenu dropdown */}
                  {item.hasSubmenu && showSubmenu === item.path && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      paddingTop: '8px',
                      zIndex: 1001
                    }}>
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: '1px solid #e0e0e0',
                        minWidth: item.text === '업무도구' ? '600px' : '200px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: item.text === '업무도구' ? '16px' : '0'
                      }}>
                        {item.text === '업무도구' ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0'
                          }}>
                            {item.submenu?.map(subItem => (
                              <Link
                                key={subItem.path}
                                href={subItem.path}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 12px',
                                  fontSize: '13px',
                                  color: '#212529',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s',
                                  borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f8f9fa';
                                  e.currentTarget.style.color = '#2563eb';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#212529';
                                }}
                              >
                                <span>{subItem.text}</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          item.submenu?.map(subItem => (
                            <Link
                              key={subItem.path}
                              href={subItem.path}
                              style={{
                                display: 'block',
                                padding: '10px 16px',
                                fontSize: '13px',
                                color: '#212529',
                                textDecoration: 'none',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8f9fa';
                                e.currentTarget.style.color = '#2563eb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#212529';
                              }}
                            >
                              {subItem.text}
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
            )}
          </div>

          {/* 우측: 발주관리시스템 버튼 + 상태 통계 배지 + 로그인 정보/버튼들 (데스크톱) */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: '0 0 auto' }}>
              {/* 발주관리시스템 버튼 (항상 표시) */}
              <button
                onClick={() => openOrders()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: 'white',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2563eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#2563eb';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                발주관리시스템
              </button>

              {/* 상태 통계 배지들 (로그인 시에만 표시) */}
              {user && statsData.map((stat) => {
                const config = statusConfig[stat.status];
                if (!config || stat.count === 0) return null;
                return (
                  <div
                    key={stat.status}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'white',
                      border: `1px solid ${config.color}30`,
                      fontSize: '11px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setSelectedStatus(stat.status);
                      openOrders(stat.status);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${config.color}10`;
                      e.currentTarget.style.borderColor = config.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = `${config.color}30`;
                    }}
                  >
                    <span style={{ color: config.color, fontSize: '8px' }}>●</span>
                    <span style={{ color: '#6b7280' }}>{config.label}</span>
                    <span style={{ color: config.color, fontWeight: '600' }}>{stat.count}</span>
                  </div>
                );
              })}
            {user ? (
              <>
                {/* 캐시 잔액 표시 */}
                <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;700;800&display=swap" rel="stylesheet" />
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block'
                  }}
                  onMouseEnter={() => setShowCashTooltip(true)}
                  onMouseLeave={() => setShowCashTooltip(false)}
                >
                  <div style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '24px',
                    padding: '0px 6px',
                    border: '1.5px solid #10b981',
                    borderRadius: '6px',
                    background: 'transparent'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#10b981',
                      fontFamily: 'Oxanium, monospace',
                      letterSpacing: '0.5px',
                      lineHeight: '1'
                    }}>
                      {cashBalance.toLocaleString()}
                    </span>
                  </div>
                  {showCashTooltip && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: '0',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      zIndex: 10000
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>달래캐시</div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>활동/로그인 보상으로 획득</div>
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: '8px',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '5px solid rgba(0, 0, 0, 0.9)'
                      }}></div>
                    </div>
                  )}
                </div>

                {/* 툴크레딧 표시 */}
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block'
                  }}
                  onMouseEnter={() => setShowCreditTooltip(true)}
                  onMouseLeave={() => setShowCreditTooltip(false)}
                >
                  <div style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '24px',
                    padding: '0px 6px',
                    border: '1.5px solid #7c3aed',
                    borderRadius: '6px',
                    background: 'transparent'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#7c3aed',
                      fontFamily: 'Oxanium, monospace',
                      letterSpacing: '0.5px',
                      lineHeight: '1'
                    }}>
                      {creditBalance.toLocaleString()}
                    </span>
                  </div>
                  {showCreditTooltip && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: '0',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      zIndex: 10000
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>크레딧</div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>업무도구 사용 포인트 (매일 1,000 리필)</div>
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: '8px',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '5px solid rgba(0, 0, 0, 0.9)'
                      }}></div>
                    </div>
                  )}
                </div>

                {/* 기여점수 표시 */}
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block'
                  }}
                  onMouseEnter={() => setShowContributionTooltip(true)}
                  onMouseLeave={() => setShowContributionTooltip(false)}
                >
                  <div style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '24px',
                    padding: '0px 6px',
                    border: '1.5px solid #f59e0b',
                    borderRadius: '6px',
                    background: 'transparent'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#f59e0b',
                      fontFamily: 'Oxanium, monospace',
                      letterSpacing: '0.5px',
                      lineHeight: '1'
                    }}>
                      {contributionPoints.toLocaleString()}p
                    </span>
                  </div>
                  {showContributionTooltip && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: '0',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      zIndex: 10000
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>기여점수</div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>셀러 등급 판정 및 혜택 기준</div>
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: '8px',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '5px solid rgba(0, 0, 0, 0.9)'
                      }}></div>
                    </div>
                  )}
                </div>

                {/* 알림 아이콘 */}
                <NotificationBell />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {organizationTier && <TierBadge tier={organizationTier as 'light' | 'standard' | 'advance' | 'elite' | 'legend'} iconOnly glow={0} />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {organizationName && (
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#212529' }}>
                        {organizationName}
                      </div>
                    )}
                    {sellerCode && (
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {sellerCode}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#495057' }}>
                    {user.email}
                  </span>
                  <button
                    onClick={() => window.location.href = '/platform/profile'}
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f3f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="회원정보"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#495057" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </button>
                </div>
                {(userRole === 'admin' || userRole === 'employee' || userRole === 'super_admin') && (
                  <button
                    onClick={() => router.push('/admin')}
                    style={{
                      padding: '6px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    관리자 화면
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#212529',
                    cursor: 'pointer'
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#212529',
                    cursor: 'pointer'
                  }}
                >
                  로그인
                </button>

                <button
                  onClick={() => router.push('/register')}
                  style={{
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  회원가입
                </button>
              </>
            )}
          </div>
          )}
        </div>
      </header>

      {/* 모바일 슬라이드 메뉴 */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: mobileMenuOpen ? 0 : '-100%',
          width: '50%',
          maxWidth: '280px',
          height: '125vh',
          background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 60px, #93c5fd 120px, #bfdbfe 180px, #dbeafe 240px, #f0f9ff 300px, #ffffff 360px, #ffffff 100%)',
          zIndex: 1001,
          transition: 'left 0.3s ease',
          overflowY: 'auto',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          paddingTop: '35px'
        }}>
          <nav style={{ padding: '16px' }}>
            {navItems.map(item => (
              <div key={item.path} style={{ marginBottom: '2px' }}>
                <div
                  onClick={(e) => {
                    if (item.hasSubmenu) {
                      e.preventDefault();
                      setExpandedSubmenu(expandedSubmenu === item.path ? null : item.path);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 4px',
                    fontSize: '15px',
                    color: isActive(item.path) ? '#2563eb' : '#1f2937',
                    fontWeight: isActive(item.path) ? '600' : '400',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                  }}
                >
                  {item.hasSubmenu ? (
                    <>
                      <span>{item.text}</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{
                          transform: expandedSubmenu === item.path ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        width: '100%',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      {item.isImage ? (
                        <div style={{ marginLeft: '-10px' }}>
                          <img
                            src={item.imageUrl}
                            alt={item.text}
                            style={{ height: '16px', width: 'auto' }}
                          />
                        </div>
                      ) : (
                        item.text
                      )}
                    </Link>
                  )}
                </div>

                {/* 서브메뉴 (토글) */}
                {item.hasSubmenu && item.submenu && expandedSubmenu === item.path && (
                  <div style={{
                    paddingLeft: '12px',
                    marginTop: '2px',
                    marginBottom: '2px'
                  }}>
                    {item.submenu.map(subItem => (
                      <Link
                        key={subItem.path}
                        href={subItem.path}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          display: 'block',
                          padding: '4px 4px',
                          fontSize: '14px',
                          color: '#4b5563',
                          textDecoration: 'none',
                          marginBottom: '1px',
                          transition: 'color 0.2s'
                        }}
                      >
                        {subItem.text}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 모바일 하단 메뉴 */}
            <div style={{ marginTop: '24px', padding: '16px 4px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              {user ? (
                <>
                  {/* 포인트 배지들 (모바일) */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* 캐시 잔액 표시 */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500' }}>달래캐시</div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '26px',
                          padding: '0px 8px',
                          border: '1.5px solid #10b981',
                          borderRadius: '8px',
                          background: 'transparent'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#10b981',
                            fontFamily: 'Oxanium, monospace',
                            letterSpacing: '0.5px',
                            lineHeight: '1'
                          }}>
                            {cashBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* 툴크레딧 표시 */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500' }}>크레딧</div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '26px',
                          padding: '0px 8px',
                          border: '1.5px solid #7c3aed',
                          borderRadius: '8px',
                          background: 'transparent'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#7c3aed',
                            fontFamily: 'Oxanium, monospace',
                            letterSpacing: '0.5px',
                            lineHeight: '1'
                          }}>
                            {creditBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* 기여점수 표시 */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500' }}>기여점수</div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '26px',
                          padding: '0px 8px',
                          border: '1.5px solid #f59e0b',
                          borderRadius: '8px',
                          background: 'transparent'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#f59e0b',
                            fontFamily: 'Oxanium, monospace',
                            letterSpacing: '0.5px',
                            lineHeight: '1'
                          }}>
                            {contributionPoints.toLocaleString()}p
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                      캐시: 활동보상 | 크레딧: 매일 1,000 리필 | 기여점수: 등급 판정
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      {organizationTier && <TierBadge tier={organizationTier as 'light' | 'standard' | 'advance' | 'elite' | 'legend'} iconOnly glow={0} />}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {organizationName && (
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#212529' }}>
                            {organizationName}
                          </div>
                        )}
                        {sellerCode && (
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            {sellerCode}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {user.email}
                    </div>
                  </div>
                  {(userRole === 'admin' || userRole === 'employee' || userRole === 'super_admin') && (
                    <div
                      onClick={() => { router.push('/admin'); setMobileMenuOpen(false); }}
                      style={{
                        padding: '8px 0',
                        fontSize: '15px',
                        color: '#10b981',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      관리자 화면
                    </div>
                  )}
                  <div
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    style={{
                      padding: '8px 0',
                      fontSize: '15px',
                      color: '#1f2937',
                      cursor: 'pointer'
                    }}
                  >
                    로그아웃
                  </div>
                </>
              ) : (
                <>
                  <div
                    onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); setMobileMenuOpen(false); }}
                    style={{
                      padding: '8px 0',
                      fontSize: '15px',
                      color: '#1f2937',
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                  >
                    로그인
                  </div>
                  <div
                    onClick={() => { router.push('/register'); setMobileMenuOpen(false); }}
                    style={{
                      padding: '8px 0',
                      fontSize: '15px',
                      color: '#2563eb',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    회원가입
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

    </>
  );
}
