'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';
import ToolModal from '@/components/tools/ToolModal';
import StatsCards from './components/StatsCards';
import SupplyProductsTable from './components/SupplyProductsTable';
import MarketPrices from './components/MarketPrices';
import ProductCalendar from './components/ProductCalendar';
import SellerAccountInfo from './components/SellerAccountInfo';
import BusinessTools from './components/BusinessTools';
import OrderSystemSection from './components/OrderSystemSection';
import WinWinProgram from './components/WinWinProgram';
import WeeklyOrderChart from '@/app/platform/orders/components/WeeklyOrderChart';
import MonthlyOrderChart from '@/app/platform/orders/components/MonthlyOrderChart';
import ProductTop10Chart from '@/app/platform/orders/components/ProductTop10Chart';

// TypeScript Interfaces
interface Stat {
  label: string;
  value: string;
  color: string;
  bgGradient: string;
}

interface MarketPrice {
  name: string;
  category: string;
  price: string;
  change: string;
  changePercent: string;
  isUp: boolean | null;
}

interface OrderSystemItem {
  title: string;
  desc: string;
  primary: boolean;
}

interface Product {
  id: string;
  name: string;
  variety?: string;
  origin?: string;
  status: string;
}

interface OrganizationInfo {
  name: string;
  seller_code?: string;
  grade?: string;
  member_count?: number;
}

interface CalendarDay {
  day: number | null;
  isToday?: boolean;
}

function ProductsPageInner() {
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [shippingMonth, setShippingMonth] = useState(new Date());
  const [productMonth, setProductMonth] = useState(new Date());
  const [orders, setOrders] = useState<any[]>([]); // 차트 컴포넌트용 빈 배열
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };

    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // URL 파라미터로 로그인 모달 열기
  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setShowLoginModal(true);
    }
  }, [searchParams]);

  // 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/products/all');
        const { success, products: fetchedProducts, supplyStatuses, error } = await response.json();

        if (!success) {
          console.error('통계 조회 오류:', error);
          return;
        }

        const newStats: Stat[] = [];

        // 품목별로 중복 제거 후 상태별 개수 계산
        const uniqueCategories = new Map<string, string>();
        fetchedProducts?.forEach((p: any) => {
          const category4 = p.category_4;
          const status = p.category_supply_status;
          if (category4 && !uniqueCategories.has(category4)) {
            uniqueCategories.set(category4, status);
          }
        });

        const statusCounts = new Map<string, number>();
        uniqueCategories.forEach(status => {
          if (status) {
            statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
          }
        });

        // 전체 품목 수
        newStats.push({
          label: '전체 상품',
          value: String(uniqueCategories.size),
          color: '#2563eb',
          bgGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)'
        });

        // 상태별 통계 추가
        if (supplyStatuses) {
          supplyStatuses.forEach((status: any) => {
            const count = statusCounts.get(status.name) || 0;
            newStats.push({
              label: status.name,
              value: String(count),
              color: status.color,
              bgGradient: `linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%)`
            });
          });
        }

        setStats(newStats);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      }
    };

    fetchStats();
  }, []);

  // 도구 목록 가져오기
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/tools');
        const data = await response.json();
        if (data.success && data.tools) {
          setTools(data.tools);
        }
      } catch (error) {
        console.error('도구 목록 로드 실패:', error);
      }
    };
    fetchTools();
  }, []);

  // 출하중인 상품 목록 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/all');
        const { success, products: fetchedProducts, error } = await response.json();

        if (!success) {
          console.error('상품 조회 오류:', error);
          setProducts([]);
          setLoading(false);
          return;
        }

        // 품목(category_4) 기준으로 그룹핑 (출하중만)
        const groupedByCategory4 = new Map<string, any>();

        fetchedProducts?.forEach((p: any) => {
          const category4 = p.category_4;
          const status = p.category_supply_status;

          if (!category4 || status !== '출하중') return;

          if (!groupedByCategory4.has(category4)) {
            groupedByCategory4.set(category4, {
              id: p.category_4_id || category4,
              name: category4,
              variety: p.category_3 || '',
              origin: p.shipping_location_name || '',
              status: status
            });
          }
        });

        setProducts(Array.from(groupedByCategory4.values()));
        setLoading(false);
      } catch (error) {
        console.error('상품 로드 실패:', error);
        setProducts([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 셀러계정 정보 가져오기
  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;

        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('primary_organization_id, role')
          .eq('id', user.id)
          .single();

        if (userDataError || !userData?.primary_organization_id) return;

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('business_name, tier, seller_code, partner_code')
          .eq('id', userData.primary_organization_id)
          .single();

        if (orgError) return;

        const { count, error: countError } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', userData.primary_organization_id)
          .eq('status', 'active');

        if (orgData) {
          const displayCode = userData.role === 'seller'
            ? orgData.seller_code
            : userData.role === 'partner'
            ? orgData.partner_code
            : undefined;

          setOrganizationInfo({
            name: orgData.business_name || '',
            seller_code: displayCode,
            grade: orgData.tier || 'light',
            member_count: count || 0
          });
        }
      } catch (error) {
        console.error('셀러계정 정보 로드 실패:', error);
      }
    };

    fetchOrganizationInfo();
  }, []);


  // 시세정보 데이터
  const marketPrices: MarketPrice[] = [
    { name: '배추', category: '채소류', price: '8,500원', change: '+500원', changePercent: '+6.3%', isUp: true },
    { name: '사과', category: '과일류', price: '32,000원', change: '-1,000원', changePercent: '-3.0%', isUp: false },
    { name: '무', category: '근채류', price: '3,200원', change: '0원', changePercent: '0%', isUp: null },
    { name: '대파', category: '양념류', price: '4,800원', change: '+300원', changePercent: '+6.7%', isUp: true }
  ];

  // 발주시스템 데이터
  const orderSystemItems: OrderSystemItem[] = [
    { title: '일반 발주', desc: '기본 발주서 작성', primary: false },
    { title: '긴급 발주', desc: '당일 배송 요청', primary: true },
    { title: '정기 발주', desc: '반복 주문 설정', primary: false }
  ];

  // 캘린더 데이터 생성 함수
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days: CalendarDay[] = [];

    // 빈 칸 추가
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null });
    }

    // 날짜 추가
    for (let i = 1; i <= lastDate; i++) {
      const isToday = today.getFullYear() === year &&
                      today.getMonth() === month &&
                      today.getDate() === i;
      days.push({ day: i, isToday });
    }

    return days;
  };

  const changeMonth = (calendar: 'shipping' | 'product', direction: 'prev' | 'next') => {
    const setMonth = calendar === 'shipping' ? setShippingMonth : setProductMonth;
    const currentMonth = calendar === 'shipping' ? shippingMonth : productMonth;

    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setMonth(newDate);
  };

  if (!isMounted) return null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingTop: '20px',
      paddingLeft: isMobile ? '20px' : '40px',
      paddingRight: isMobile ? '20px' : '40px',
      paddingBottom: isMobile ? '20px' : '40px',
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      {/* 메인 파란색 그라데이션 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, #ffffff 0%, #fefefe 50px, #fafaff 100px, #f5f7ff 150px, #f0f4ff 200px, #e8f0ff 250px, #dce7fe 300px, #d0dffe 350px, #c0d4fd 400px, #b0c9fc 450px, #9ebcfb 500px, #8aaffa 550px, #75a2f9 600px, #5f94f8 650px, #4787f6 700px, #3b82f6 750px, #60a5fa 1050px, #93c5fd 1350px, #bfdbfe 1650px, #dbeafe 1950px, #f0f9ff 2250px, #ffffff 2550px, #ffffff 100%)',
        zIndex: -3
      }} />

      {/* 왼쪽 연두색 */}
      <div style={{
        position: 'absolute',
        top: '600px',
        left: 0,
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse at 0% 50%, rgba(187, 247, 208, 0.4) 0%, transparent 60%)',
        zIndex: -2
      }} />

      {/* 우측 상단 보라색 */}
      <div style={{
        position: 'absolute',
        top: '400px',
        right: 0,
        width: '1600px',
        height: '1200px',
        background: 'radial-gradient(ellipse at 100% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 60%)',
        zIndex: -1
      }} />

      {/* 메인 콘텐츠 */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr 1fr',
        gap: '24px'
      }}>
        {/* 칼럼 1 - 메인 콘텐츠 */}
        <div>
          <div onClick={() => setExpandedComponent('stats')} style={{ cursor: 'pointer' }}>
            <StatsCards stats={stats} isMobile={isMobile} />
          </div>
          <div onClick={() => setExpandedComponent('products')} style={{ cursor: 'pointer' }}>
            <SupplyProductsTable products={products} loading={loading} isMobile={isMobile} />
          </div>
        </div>

        {/* 칼럼 2 - 시세정보 */}
        <div onClick={() => setExpandedComponent('market')} style={{ cursor: 'pointer' }}>
          <MarketPrices prices={marketPrices} isMobile={isMobile} />
        </div>

        {/* 칼럼 3 - 캘린더 */}
        <div>
          <div onClick={() => setExpandedComponent('shipping-calendar')} style={{ cursor: 'pointer' }}>
            <ProductCalendar
              title="발송캘린더"
              year={shippingMonth.getFullYear()}
              month={shippingMonth.getMonth()}
              days={generateCalendarDays(shippingMonth)}
              onPrevMonth={() => changeMonth('shipping', 'prev')}
              onNextMonth={() => changeMonth('shipping', 'next')}
              isMobile={isMobile}
            />
          </div>
          <div onClick={() => setExpandedComponent('product-calendar')} style={{ cursor: 'pointer' }}>
            <ProductCalendar
              title="상품캘린더"
              year={productMonth.getFullYear()}
              month={productMonth.getMonth()}
              days={generateCalendarDays(productMonth)}
              onPrevMonth={() => changeMonth('product', 'prev')}
              onNextMonth={() => changeMonth('product', 'next')}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* 칼럼 4 - 셀러계정, 발주시스템, Win-Win, 발주 그래프 */}
        <div>
          <div onClick={() => setExpandedComponent('seller-account')} style={{ cursor: 'pointer' }}>
            <SellerAccountInfo organizationInfo={organizationInfo} isMobile={isMobile} />
          </div>
          <div onClick={() => setExpandedComponent('order-system')} style={{ cursor: 'pointer' }}>
            <OrderSystemSection items={orderSystemItems} isMobile={isMobile} />
          </div>
          <div onClick={() => setExpandedComponent('winwin')} style={{ cursor: 'pointer' }}>
            <WinWinProgram isMobile={isMobile} />
          </div>
          <div onClick={() => setExpandedComponent('weekly-chart')} style={{ marginBottom: '16px', cursor: 'pointer' }}>
            <WeeklyOrderChart orders={orders} isMobile={isMobile} />
          </div>
          <div onClick={() => setExpandedComponent('monthly-chart')} style={{ cursor: 'pointer' }}>
            <MonthlyOrderChart orders={orders} isMobile={isMobile} />
          </div>
        </div>

        {/* 칼럼 5 - 발주 TOP 10 */}
        <div onClick={() => setExpandedComponent('top10')} style={{ cursor: 'pointer' }}>
          <ProductTop10Chart orders={orders} isMobile={isMobile} />
        </div>

        {/* 병합 행 1 - 빈 행 */}
        <div style={{ gridColumn: '1 / -1' }}>
          {/* 추가 콘텐츠 영역 */}
        </div>
      </div>

      {/* 확대 모달 */}
      {expandedComponent && (
        <div
          onClick={() => setExpandedComponent(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            overflow: 'hidden'
          }}
        >
          {/* 배경 레이어들 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, #ffffff 0%, #fefefe 50px, #fafaff 100px, #f5f7ff 150px, #f0f4ff 200px, #e8f0ff 250px, #dce7fe 300px, #d0dffe 350px, #c0d4fd 400px, #b0c9fc 450px, #9ebcfb 500px, #8aaffa 550px, #75a2f9 600px, #5f94f8 650px, #4787f6 700px, #3b82f6 750px, #60a5fa 1050px, #93c5fd 1350px, #bfdbfe 1650px, #dbeafe 1950px, #f0f9ff 2250px, #ffffff 2550px, #ffffff 100%)',
            zIndex: -3,
            opacity: 0,
            animation: 'fadeInBackground 0.5s ease-out forwards'
          }} />

          {/* 왼쪽 연두색 */}
          <div style={{
            position: 'absolute',
            top: '600px',
            left: 0,
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse at 0% 50%, rgba(187, 247, 208, 0.4) 0%, transparent 60%)',
            zIndex: -2,
            opacity: 0,
            animation: 'fadeInBackground 0.5s ease-out 0.1s forwards'
          }} />

          {/* 우측 상단 보라색 */}
          <div style={{
            position: 'absolute',
            top: '400px',
            right: 0,
            width: '1600px',
            height: '1200px',
            background: 'radial-gradient(ellipse at 100% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 60%)',
            zIndex: -1,
            opacity: 0,
            animation: 'fadeInBackground 0.5s ease-out 0.2s forwards'
          }} />

          {/* 어두운 오버레이 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0)',
            zIndex: 0,
            opacity: 0,
            animation: 'fadeInOverlay 0.3s ease-out forwards'
          }} />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: 'scale(2)',
              transformOrigin: 'center',
              transition: 'transform 0.3s ease-out',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {expandedComponent === 'stats' && <StatsCards stats={stats} isMobile={isMobile} />}
            {expandedComponent === 'products' && <SupplyProductsTable products={products} loading={loading} isMobile={isMobile} />}
            {expandedComponent === 'market' && <MarketPrices prices={marketPrices} isMobile={isMobile} />}
            {expandedComponent === 'shipping-calendar' && (
              <ProductCalendar
                title="발송캘린더"
                year={shippingMonth.getFullYear()}
                month={shippingMonth.getMonth()}
                days={generateCalendarDays(shippingMonth)}
                onPrevMonth={() => changeMonth('shipping', 'prev')}
                onNextMonth={() => changeMonth('shipping', 'next')}
                isMobile={isMobile}
              />
            )}
            {expandedComponent === 'product-calendar' && (
              <ProductCalendar
                title="상품캘린더"
                year={productMonth.getFullYear()}
                month={productMonth.getMonth()}
                days={generateCalendarDays(productMonth)}
                onPrevMonth={() => changeMonth('product', 'prev')}
                onNextMonth={() => changeMonth('product', 'next')}
                isMobile={isMobile}
              />
            )}
            {expandedComponent === 'seller-account' && <SellerAccountInfo organizationInfo={organizationInfo} isMobile={isMobile} />}
            {expandedComponent === 'order-system' && <OrderSystemSection items={orderSystemItems} isMobile={isMobile} />}
            {expandedComponent === 'winwin' && <WinWinProgram isMobile={isMobile} />}
            {expandedComponent === 'weekly-chart' && <WeeklyOrderChart orders={orders} isMobile={isMobile} />}
            {expandedComponent === 'monthly-chart' && <MonthlyOrderChart orders={orders} isMobile={isMobile} />}
            {expandedComponent === 'top10' && <ProductTop10Chart orders={orders} isMobile={isMobile} />}
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={() => setExpandedComponent(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* 오른쪽 플로팅 업무도구 사이드바 */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          width: '80px'
        }}>
          <BusinessTools isMobile={isMobile} onToolClick={(toolId) => setSelectedTool(toolId)} />
        </div>
      )}

      {/* 툴 모달 - 간단한 오버레이 */}
      {selectedTool && (
        <>
          <div
            onClick={() => setSelectedTool(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.1)',
              zIndex: 9999,
              animation: 'fadeIn 0.3s ease-out',
              pointerEvents: 'auto'
            }}
          />

          {/* 실제 ToolModal */}
          <ToolModal
            isOpen={!!selectedTool}
            onClose={() => setSelectedTool(null)}
            toolId={selectedTool}
            toolName={tools?.find(t => t.id === selectedTool)?.name || '업무도구'}
            zIndex={10000}
          />
        </>
      )}

      {/* 로그인 모달 */}
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialMode="login"
      />
    </div>
  );
}

export default function ProductsContent() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>}>
      <ProductsPageInner />
    </Suspense>
  );
}
