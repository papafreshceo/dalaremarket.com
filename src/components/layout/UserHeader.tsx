'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';
import { useToast } from '@/components/ui/Toast';
import { useActivityTracker } from '@/hooks/useActivityTracker';

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
  const [showSubmenu, setShowSubmenu] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [ordersModalOpen, setOrdersModalOpen] = useState<boolean>(false);
  const [ordersModalLoaded, setOrdersModalLoaded] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);

  // 활동 시간 추적 (로그인 시에만)
  useActivityTracker({
    enabled: !!user,
    onRewardClaimed: (amount, newBalance) => {
      setCashBalance(newBalance);
      showToast(`활동 보상 ${amount}캐시가 지급되었습니다!`, 'success');
    },
    onLimitReached: () => {
      showToast('오늘 활동 보상 한도에 도달했습니다.', 'info');
    }
  });

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

      // 최근 7일 주문 가져오기
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('integrated_orders')
        .select('id, shipping_status, created_at')
        .eq('seller_id', user.id)
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
          .select('role')
          .eq('id', user.id)
          .single();

        setUserRole(userData?.role || null);
      } else {
        setUserRole(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser();
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 캐시 잔액 조회
  useEffect(() => {
    const fetchCashBalance = async () => {
      if (!user) {
        setCashBalance(0);
        return;
      }

      try {
        const response = await fetch('/api/cash');
        const data = await response.json();

        if (data.success) {
          setCashBalance(data.balance);
        }
      } catch (error) {
        console.error('캐시 잔액 조회 실패:', error);
      }
    };

    fetchCashBalance();

    // 30초마다 캐시 잔액 갱신
    const interval = setInterval(fetchCashBalance, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // 로그인 보상 자동 지급
  useEffect(() => {
    const claimLoginReward = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/cash/claim-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
          setCashBalance(data.newBalance);
          showToast(`일일 로그인 보상 ${data.amount}캐시가 지급되었습니다!`, 'success');
        }
        // alreadyClaimed가 true이면 조용히 무시
      } catch (error) {
        console.error('로그인 보상 지급 실패:', error);
      }
    };

    claimLoginReward();
  }, [user]);

  // 모달 닫기 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'closeModal') {
        setOrdersModalOpen(false);
        setOrdersModalLoaded(false);
        setSelectedStatus(null); // Reset selected status when modal closes
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const navItems: NavItem[] = [
    {
      path: '/platform/products',
      text: '공급상품',
      hasSubmenu: true,
      submenu: [
        { path: '/platform/products/all', text: '전체상품' },
        { path: '/platform/products/calendar', text: '상품캘린더' },
        { path: '/gallery', text: '이미지다운로드' }
      ]
    },
    { path: '/platform/orders', text: '발주관리', special: true },
    {
      path: '/platform/tools',
      text: '업무도구',
      hasSubmenu: true,
      submenu: [
        { path: '/platform/tools/margin-calculator', text: '마진계산기' },
        { path: '/platform/tools/price-simulator', text: '판매가 시뮬레이터' },
        { path: '/platform/tools/order-integration', text: '주문통합 (Excel)' },
        { path: '/platform/tools/option-pricing', text: '옵션가 세팅' },
        { path: '/platform/tools/inventory-tracker', text: '재고 추적기' },
        { path: '/platform/tools/discount-calculator', text: '할인율 계산기' },
        { path: '/platform/tools/sales-analytics', text: '매출 분석' },
        { path: '/platform/tools/customer-message', text: '고객 메시지' },
        { path: '/platform/tools/barcode-generator', text: '바코드 생성기' },
        { path: '/platform/tools/transaction-statement', text: '거래명세서 즉시 발급' },
        { path: '/platform/tools/trend-analysis', text: '트렌드 분석' },
        { path: '/platform/tools/competitor-monitor', text: '경쟁사 모니터링' },
        { path: '/platform/tools/product-name-optimizer', text: '상품명 최적화 도구' },
        { path: '/platform/tools/review-analyzer', text: '리뷰 분석' },
        { path: '/platform/tools/price-recommender', text: '판매가/할인가 추천기' },
        { path: '/platform/tools/category-rank-checker', text: '카테고리 순위 확인' }
      ]
    },
    { path: '/platform/pricing', text: '요금제' },
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
    showToast('로그아웃되었습니다.', 'success');
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
        borderBottom: isMobile ? 'none' : '1px solid #e0e0e0',
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

            <Link href="/">
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
                  {item.text === '발주관리' ? (
                    <button
                      onClick={() => setOrdersModalOpen(true)}
                      style={{
                        fontSize: '14px',
                        color: '#212529',
                        fontWeight: '500',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {item.text}
                    </button>
                  ) : (
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
                  )}

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
                onClick={() => setOrdersModalOpen(true)}
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
                      // 모달이 이미 열려있으면 닫았다가 다시 열기
                      if (ordersModalOpen) {
                        setOrdersModalOpen(false);
                        setOrdersModalLoaded(false);
                        setTimeout(() => {
                          setOrdersModalOpen(true);
                        }, 50);
                      } else {
                        setOrdersModalLoaded(false);
                        setOrdersModalOpen(true);
                      }
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
                <div style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  padding: '0px 8px',
                  border: '1.5px solid #10b981',
                  borderRadius: '12px',
                  background: 'transparent'
                }}
                title="달래캐시 잔액">
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#10b981',
                    fontFamily: 'Oxanium, monospace',
                    letterSpacing: '0.5px'
                  }}>
                    {cashBalance.toLocaleString()}
                  </span>
                </div>

                <span style={{ fontSize: '14px', color: '#495057' }}>
                  {user.email}
                </span>
                {(userRole === 'admin' || userRole === 'employee' || userRole === 'super_admin') && (
                  <button
                    onClick={() => window.open('/admin/dashboard', '_blank')}
                    style={{
                      padding: '8px 20px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    관리자 화면
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 20px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
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
                    padding: '8px 20px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#212529',
                    cursor: 'pointer'
                  }}
                >
                  로그인
                </button>

                <button
                  onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}
                  style={{
                    padding: '8px 20px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
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
                    } else if (item.text === '발주관리') {
                      e.preventDefault();
                      setOrdersModalOpen(true);
                      setMobileMenuOpen(false);
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
                  ) : item.text === '발주관리' ? (
                    <span>{item.text}</span>
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
                  {/* 캐시 잔액 표시 (모바일) */}
                  <div style={{
                    marginBottom: '12px',
                    padding: '1px 10px',
                    border: '1.5px solid #10b981',
                    borderRadius: '14px',
                    background: 'transparent',
                    display: 'inline-block'
                  }}>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#10b981',
                      fontFamily: 'Oxanium, monospace',
                      letterSpacing: '0.5px'
                    }}>
                      {cashBalance.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                    {user.email}
                  </div>
                  {(userRole === 'admin' || userRole === 'employee' || userRole === 'super_admin') && (
                    <div
                      onClick={() => { window.open('/admin/dashboard', '_blank'); setMobileMenuOpen(false); }}
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
                    onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); setMobileMenuOpen(false); }}
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

      {/* 발주관리 모달 */}
      {ordersModalOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            onClick={() => {
              setOrdersModalOpen(false);
              setOrdersModalLoaded(false);
              setSelectedStatus(null); // Reset selected status when modal closes
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998
            }}
          />

          {/* 모달 컨텐츠 */}
          <div style={{
            position: 'fixed',
            top: '5vh',
            left: '5vw',
            right: '5vw',
            bottom: '5vh',
            background: 'transparent',
            borderRadius: '12px',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          }}>
            {/* 로딩 화면 */}
            {!ordersModalLoaded && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-background)',
                zIndex: 10001,
                gap: '24px'
              }}>
                {/* 로딩 스피너 */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid rgba(37, 99, 235, 0.1)',
                  borderTop: '4px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />

                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--color-text)',
                  textAlign: 'center'
                }}>
                  발주관리시스템으로 이동중
                </div>

                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }

                  /* 다크모드 스크롤바 스타일 */
                  .orders-modal-iframe::-webkit-scrollbar {
                    width: 12px;
                  }

                  .orders-modal-iframe::-webkit-scrollbar-track {
                    background: var(--color-background);
                  }

                  .orders-modal-iframe::-webkit-scrollbar-thumb {
                    background: var(--color-border);
                    border-radius: 6px;
                  }

                  .orders-modal-iframe::-webkit-scrollbar-thumb:hover {
                    background: var(--color-text-secondary);
                  }
                `}</style>
              </div>
            )}

            {/* iframe으로 orders 페이지 로드 */}
            <iframe
              key={selectedStatus || 'default'} // Force iframe reload when selectedStatus changes
              className="orders-modal-iframe"
              ref={(iframe) => {
                if (iframe && selectedStatus) {
                  // iframe이 로드되면 메시지 전송
                  const sendMessage = () => {
                    if (iframe.contentWindow) {
                      iframe.contentWindow.postMessage(
                        { type: 'setStatus', status: selectedStatus },
                        window.location.origin
                      );
                    }
                  };

                  // 이미 로드되어 있으면 바로 전송, 아니면 onload 이벤트 대기
                  if (iframe.contentDocument?.readyState === 'complete') {
                    setTimeout(sendMessage, 100);
                  } else {
                    iframe.addEventListener('load', () => setTimeout(sendMessage, 100), { once: true });
                  }
                }
              }}
              src={selectedStatus ? `/platform/orders?modal=true&status=${selectedStatus}` : "/platform/orders?modal=true"}
              onLoad={() => setOrdersModalLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                opacity: ordersModalLoaded ? 1 : 0,
                transition: 'opacity 0.3s'
              }}
            />
          </div>
        </>
      )}
    </>
  );
}
