'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';
import ToolModal from '@/components/tools/ToolModal';
import StatsCards from './products/components/StatsCards';
import SupplyProductsTable from './products/components/SupplyProductsTable';
import MarketPrices from './products/components/MarketPrices';
import ProductCalendar from './products/components/ProductCalendar';
import SellerAccountInfo from './products/components/SellerAccountInfo';
import BusinessTools from './products/components/BusinessTools';
import OrderSystemSection from './products/components/OrderSystemSection';
import WinWinProgram from './products/components/WinWinProgram';
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

function PlatformContentInner() {
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState<boolean>(false);
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
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // URL 파라미터로 로그인 모달 열기
  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setShowLoginModal(true);
    }
  }, [searchParams]);

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (expandedComponent || selectedTool || showLoginModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [expandedComponent, selectedTool, showLoginModal]);

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

        // 출하 중인 품목
        const shippingCount = statusCounts.get('출하중') || 0;
        newStats.push({
          label: '출하중',
          value: String(shippingCount),
          color: '#10b981',
          bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
        });

        // 품절 품목
        const outOfStockCount = statusCounts.get('품절') || 0;
        newStats.push({
          label: '품절',
          value: String(outOfStockCount),
          color: '#ef4444',
          bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
        });

        setStats(newStats);
      } catch (error) {
        console.error('통계 데이터 가져오기 오류:', error);
      }
    };

    fetchStats();
  }, []);

  // 상품 데이터 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/products/all');
        const { success, products: fetchedProducts, error } = await response.json();

        if (!success) {
          console.error('상품 조회 오류:', error);
          setLoading(false);
          return;
        }

        // 출하중인 품목만 표시
        const shippingProducts = fetchedProducts?.filter((p: any) =>
          p.category_supply_status === '출하중'
        ) || [];

        // 품목별로 중복 제거
        const uniqueProducts = new Map<string, Product>();
        shippingProducts.forEach((p: any) => {
          const category4 = p.category_4;
          if (category4 && !uniqueProducts.has(category4)) {
            uniqueProducts.set(category4, {
              id: p.id,
              name: category4,
              variety: p.variety || '',
              origin: p.origin || '',
              status: p.category_supply_status || '출하중'
            });
          }
        });

        setProducts(Array.from(uniqueProducts.values()));
      } catch (error) {
        console.error('상품 데이터 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 조직 정보 가져오기
  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      try {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, seller_code, grade, member_count')
          .eq('creator_id', user.id)
          .single();

        if (orgData) {
          setOrganizationInfo({
            name: orgData.name || '조직명 없음',
            seller_code: orgData.seller_code,
            grade: orgData.grade,
            member_count: orgData.member_count
          });
        }
      } catch (error) {
        console.error('조직 정보 가져오기 오류:', error);
      }
    };

    fetchOrganizationInfo();
  }, []);

  // 업무도구 데이터
  useEffect(() => {
    setTools([
      {
        id: 'margin-calculator',
        name: '마진 계산기',
        icon: '💰',
        desc: '최적의 마진율 계산',
      },
      {
        id: 'price-simulator',
        name: '가격 시뮬레이터',
        icon: '📊',
        desc: '다양한 가격 시나리오 분석',
      },
      {
        id: 'option-pricing',
        name: '옵션 가격 산정',
        icon: '🎯',
        desc: '상품 옵션별 적정 가격',
      },
      {
        id: 'order-integration',
        name: '주문 통합',
        icon: '📦',
        desc: '여러 마켓 주문 한번에',
      },
      {
        id: 'trend-analysis',
        name: '트렌드 분석',
        icon: '📈',
        desc: '시장 트렌드 및 수요 예측',
      },
      {
        id: 'competitor-monitor',
        name: '경쟁사 모니터',
        icon: '🔍',
        desc: '경쟁사 가격 및 전략 추적',
      },
    ]);
  }, []);

  // 시세정보 더미 데이터
  const marketPrices: MarketPrice[] = [
    { name: '감자(수미)', category: '채소류', price: '63,000', change: '+3,000', changePercent: '+5.0%', isUp: true },
    { name: '양파', category: '채소류', price: '38,000', change: '-2,000', changePercent: '-5.0%', isUp: false },
    { name: '대파(1kg)', category: '채소류', price: '7,800', change: '0', changePercent: '0%', isUp: null },
    { name: '마늘(깐마늘)', category: '채소류', price: '9,500', change: '+500', changePercent: '+5.6%', isUp: true },
    { name: '생강', category: '채소류', price: '12,000', change: '-1,000', changePercent: '-7.7%', isUp: false },
  ];

  // 업무도구 핸들러
  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
  };

  const handleCloseToolModal = () => {
    setSelectedTool(null);
  };

  const handleExpandComponent = (componentName: string) => {
    setExpandedComponent(componentName);
  };

  const handleCloseExpandedComponent = () => {
    setExpandedComponent(null);
  };

  return (
    <>
      <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '32px',
        paddingBottom: isMobile ? '100px' : '60px',
      }}>
        {/* 통계 카드 */}
        <StatsCards stats={stats} isMobile={isMobile} />

        {/* 3칼럼 레이아웃 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '16px' : '24px',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          {/* 칼럼 1 - 공급상품 */}
          <div>
            <SupplyProductsTable
              products={products}
              loading={loading}
              isMobile={isMobile}
            />
          </div>

          {/* 칼럼 2 - 시세정보 */}
          <div style={{ pointerEvents: 'none' }}>
            <div onClick={() => setExpandedComponent('market')} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
              <MarketPrices prices={marketPrices} isMobile={isMobile} />
            </div>
          </div>

          {/* 칼럼 3 - 상품 캘린더 */}
          <div>
            <ProductCalendar
              currentMonth={productMonth}
              onMonthChange={setProductMonth}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* 2칼럼 레이아웃 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: isMobile ? '16px' : '24px',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          {/* 업무도구 */}
          <div>
            <BusinessTools
              tools={tools}
              onToolClick={handleToolClick}
              isMobile={isMobile}
            />
          </div>

          {/* 판매자 정보 */}
          <div>
            <SellerAccountInfo
              organizationInfo={organizationInfo}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* 2칼럼 레이아웃 - 차트 영역 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '16px' : '24px',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          {/* 주간 주문 현황 */}
          <div style={{ pointerEvents: 'none' }}>
            <div onClick={() => setExpandedComponent('weekly')} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
              <WeeklyOrderChart orders={orders} isMobile={isMobile} />
            </div>
          </div>

          {/* 월별 주문 추이 */}
          <div style={{ pointerEvents: 'none' }}>
            <div onClick={() => setExpandedComponent('monthly')} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
              <MonthlyOrderChart orders={orders} isMobile={isMobile} />
            </div>
          </div>
        </div>

        {/* 발주 TOP 10 */}
        <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
          <div style={{ pointerEvents: 'none' }}>
            <div onClick={() => setExpandedComponent('top10')} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
              <ProductTop10Chart orders={orders} isMobile={isMobile} />
            </div>
          </div>
        </div>

        {/* 발주 시스템 & 윈윈 프로그램 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '16px' : '24px'
        }}>
          <OrderSystemSection isMobile={isMobile} />
          <WinWinProgram isMobile={isMobile} />
        </div>
      </div>

      {/* 모달들 */}
      {showLoginModal && (
        <AuthModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          defaultMode="login"
        />
      )}

      {selectedTool && (
        <ToolModal
          isOpen={!!selectedTool}
          onClose={handleCloseToolModal}
          toolId={selectedTool}
          toolName={tools.find(t => t.id === selectedTool)?.name}
          onOpenSimulator={() => {
            handleCloseToolModal();
            setTimeout(() => setSelectedTool('price-simulator'), 100);
          }}
        />
      )}

      {/* 확대된 차트 모달 */}
      {expandedComponent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={handleCloseExpandedComponent}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '1400px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '24px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseExpandedComponent}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s',
              }}
            >
              ×
            </button>

            {expandedComponent === 'weekly' && <WeeklyOrderChart orders={orders} isMobile={false} />}
            {expandedComponent === 'monthly' && <MonthlyOrderChart orders={orders} isMobile={false} />}
            {expandedComponent === 'top10' && <ProductTop10Chart orders={orders} isMobile={false} />}
            {expandedComponent === 'market' && <MarketPrices prices={marketPrices} isMobile={false} />}
          </div>
        </div>
      )}
    </>
  );
}

export default function PlatformContent() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#6c757d'
      }}>
        <div>로딩 중...</div>
      </div>
    }>
      <PlatformContentInner />
    </Suspense>
  );
}
