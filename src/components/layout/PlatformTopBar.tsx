'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TierBadge from '@/components/TierBadge';
import { useUserBalance } from '@/contexts/UserBalanceContext';
import { AuthModal } from '@/components/auth/AuthModal';

export default function PlatformTopBar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [organizationTier, setOrganizationTier] = useState<'light' | 'standard' | 'advance' | 'elite' | 'legend' | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [sellerCode, setSellerCode] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const { cashBalance, creditBalance, refreshBalances } = useUserBalance();
  const [showCashTooltip, setShowCashTooltip] = useState(false);
  const [showCreditTooltip, setShowCreditTooltip] = useState(false);
  const [contributionPoints, setContributionPoints] = useState(0);
  const [showContributionTooltip, setShowContributionTooltip] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const supabase = createClient();

  // 잔액 초기 로드 및 주기적 갱신
  useEffect(() => {
    if (!user) return;

    // 초기 로드
    refreshBalances();

    // 30초마다 갱신
    const interval = setInterval(() => {
      refreshBalances();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, refreshBalances]);

  const fetchUser = async (session?: any) => {
    let currentUser = session?.user;

    if (!currentUser) {
      // 1. getUser() 시도 (보안상 권장)
      const { data: { user }, error } = await supabase.auth.getUser();

      if (user) {
        currentUser = user;
      } else {
        // 2. 실패 시 getSession() 시도 (로컬 세션 확인)
        // 새로고침 직후에는 getUser가 실패할 수 있으므로 getSession으로 보완
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user) {
          currentUser = session.user;
        } else {
          console.log('[PlatformTopBar] No user found');
          return;
        }
      }
    }

    setUser(currentUser);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, primary_organization_id')
      .eq('id', currentUser.id)
      .single();

    if (userError) {
      console.error('[PlatformTopBar] Error fetching user data:', userError);
      return;
    }

    setUserRole(userData?.role || null);

    if (userData?.primary_organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('accumulated_points, tier, business_name, seller_code')
        .eq('id', userData.primary_organization_id)
        .single();

      if (orgData) {
        setOrganizationTier(orgData.tier);
        setOrganizationName(orgData.business_name || '');
        setSellerCode(orgData.seller_code || '');
        setContributionPoints(orgData.accumulated_points || 0);
      }
    }
  };

  useEffect(() => {
    // 초기 사용자 정보 로드
    fetchUser();

    // 인증 상태 변경 리스너 등록
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[PlatformTopBar] Auth state changed:', event, session?.user?.id);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // 로그인 시 사용자 정보 갱신 및 모달 닫기
        // 세션 정보를 직접 전달하여 즉시 갱신
        fetchUser(session);
        setShowLoginModal(false);
      } else if (event === 'SIGNED_OUT') {
        // 로그아웃 시 상태 초기화
        setUser(null);
        setUserRole(null);
        setOrganizationTier(null);
        setOrganizationName('');
        setSellerCode('');
        setOrders([]);
      } else if (event === 'USER_UPDATED') {
        fetchUser(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 주문 데이터 가져오기
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.primary_organization_id) {
        setOrders([]);
        return;
      }

      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('integrated_orders')
        .select('id, shipping_status, created_at')
        .eq('organization_id', userData.primary_organization_id)
        .gte('created_at', startDate.toISOString());

      if (!error) {
        setOrders(data || []);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    const { logout } = await import('@/lib/logout');
    await logout(router, '/');
  };

  const openOrders = (status?: string) => {
    const url = status ? `/platform/orders?status=${status}` : '/platform/orders';
    router.push(url);
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    registered: { label: '등록', color: '#2563eb' },
    confirmed: { label: '확정', color: '#7c3aed' },
    preparing: { label: '준비중', color: '#f59e0b' },
    shipped: { label: '발송', color: '#10b981' },
    cancelRequested: { label: '취소요청', color: '#f87171' },
    cancelled: { label: '취소', color: '#6b7280' },
    refunded: { label: '환불', color: '#10b981' }
  };

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
    <header style={{
      height: '50px',
      background: 'var(--color-background-secondary, #f8f9fa)',
      borderBottom: '1px solid var(--color-border, #e0e0e0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* 왼쪽: 로고 */}
      <div style={{ display: 'flex', alignItems: 'center', flex: '1' }}>
        <img
          src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
          alt="달래마켓"
          style={{ height: '22px', cursor: 'pointer' }}
          onClick={() => router.push('/platform')}
        />
      </div>

      {/* 오른쪽: 상태 배지 + 포인트 + 알림 + 사용자 */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* 상태 통계 배지들 */}
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
              onClick={() => openOrders(stat.status)}
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

        {user && (
          <>
            {/* 캐시 잔액 */}
            <div
              style={{ position: 'relative', display: 'inline-block' }}
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

            {/* 크레딧 잔액 */}
            <div
              style={{ position: 'relative', display: 'inline-block' }}
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

            {/* 기여점수 */}
            <div
              style={{ position: 'relative', display: 'inline-block' }}
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

            {/* 티어 배지 */}
            {organizationTier && <TierBadge tier={organizationTier} iconOnly glow={0} />}

            {/* 관리자 화면 버튼 */}
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

            {/* 로그아웃 버튼 */}
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
        )}

        {/* 로그인 안 되어 있을 때 로그인 버튼 표시 */}
        {!user && (
          <button
            onClick={() => {
              console.log('[PlatformTopBar] 로그인 버튼 클릭 - 모달 열기');
              setShowLoginModal(true);
            }}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2563eb';
            }}
          >
            로그인
          </button>
        )}
      </div>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <AuthModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            // onAuthStateChange에서 처리하므로 여기서는 제거
          }}
          initialMode="login"
        />
      )}
    </header>
  );
}
