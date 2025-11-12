'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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

interface ActiveTab {
  supply?: string;
}

interface Product {
  id: string;
  name: string;
  variety?: string;
  origin?: string;
  supply_price: number;
  status: string;
  shipping_schedule?: string;
  created_at: string;
}

interface OrganizationInfo {
  name: string;
  seller_code?: string;
  grade?: string;
  member_count?: number;
}

export default function ProductsPage() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shippingMonth, setShippingMonth] = useState(new Date());
  const [productMonth, setProductMonth] = useState(new Date());

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

  // 출하중인 상품 목록 가져오기 (품목 기준)
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

        // 품목(category_4) 기준으로 그룹핑 (출하중만 필터링)
        const groupedByCategory4 = new Map<string, any>();

        fetchedProducts?.forEach((p: any) => {
          const category4 = p.category_4;
          const status = p.category_supply_status;

          // 출하중인 것만 포함
          if (!category4 || status !== '출하중') return;

          // 각 품목의 첫 번째 옵션만 대표로 사용
          if (!groupedByCategory4.has(category4)) {
            groupedByCategory4.set(category4, {
              id: p.category_4_id || category4,
              name: category4,
              variety: p.category_3 || '',
              origin: p.shipping_location_name || '',
              supply_price: p.seller_supply_price || 0,
              status: status,
              shipping_schedule: '',
              created_at: p.created_at || ''
            });
          }
        });

        // Map을 배열로 변환
        const mappedProducts = Array.from(groupedByCategory4.values());

        setProducts(mappedProducts);
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

        // 현재 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.log('사용자 정보 없음:', userError);
          return;
        }

        // 사용자의 정보 가져오기 (primary_organization_id, seller_code, role)
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('primary_organization_id, seller_code, partner_code, role')
          .eq('id', user.id)
          .single();

        if (userDataError) {
          console.error('사용자 데이터 조회 오류:', userDataError);
          return;
        }

        if (!userData?.primary_organization_id) {
          console.log('primary_organization_id 없음');
          return;
        }

        // 조직 정보 가져오기
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name, tier')
          .eq('id', userData.primary_organization_id)
          .single();

        if (orgError) {
          console.error('조직 정보 조회 오류:', orgError);
          return;
        }

        // 멤버 수 가져오기
        const { count, error: countError } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', userData.primary_organization_id)
          .eq('status', 'active');

        if (countError) {
          console.error('멤버 수 조회 오류:', countError);
        }

        if (orgData) {
          // 역할에 따라 코드 선택
          const displayCode = userData.role === 'seller'
            ? userData.seller_code
            : userData.role === 'partner'
            ? userData.partner_code
            : undefined;

          setOrganizationInfo({
            name: orgData.name,
            seller_code: displayCode,
            grade: orgData.tier || 'light', // 실제 tier 값 사용 (기본값: light)
            member_count: count || 0
          });
        }
      } catch (error) {
        console.error('셀러계정 정보 로드 실패:', error);
      }
    };

    fetchOrganizationInfo();
  }, []);

  // 상단 통계 state
  const [stats, setStats] = useState<Stat[]>([]);

  // 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // API를 통해 상품과 상태 설정 가져오기
        const response = await fetch('/api/products/all');
        const { success, products: fetchedProducts, supplyStatuses, error } = await response.json();

        if (!success) {
          console.error('통계 조회 오류:', error);
          return;
        }

        const newStats: Stat[] = [];

        // 품목별로 중복 제거 후 상태별 개수 계산 (all 페이지 로직과 동일)
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

        // 전체 품목 수 (중복 제거된 category_4 개수)
        const totalCategory4Count = uniqueCategories.size;

        // 전체 상품 추가 (항상 첫 번째)
        newStats.push({
          label: '전체 상품',
          value: String(totalCategory4Count),
          color: '#2563eb',
          bgGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)'
        });

        // 상태별 통계 추가 (품목 기준)
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

  // 시세정보 데이터
  const marketPrices: MarketPrice[] = [
    { name: '배추', category: '채소류', price: '8,500원', change: '+500원', changePercent: '+6.3%', isUp: true },
    { name: '사과', category: '과일류', price: '32,000원', change: '-1,000원', changePercent: '-3.0%', isUp: false },
    { name: '무', category: '근채류', price: '3,200원', change: '0원', changePercent: '0%', isUp: null },
    { name: '대파', category: '양념류', price: '4,800원', change: '+300원', changePercent: '+6.7%', isUp: true }
  ];

  // 발송 캘린더 데이터 생성
  const getCalendarData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    return {
      year,
      month,
      daysInMonth,
      firstDayOfWeek,
      calendarDays: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      emptyDays: Array.from({ length: firstDayOfWeek }, () => null)
    };
  };

  const shippingCalendar = getCalendarData(shippingMonth);
  const productCalendar = getCalendarData(productMonth);

  // 월 변경 함수
  const changeMonth = (type: 'shipping' | 'product', direction: 'prev' | 'next') => {
    if (type === 'shipping') {
      const newDate = new Date(shippingMonth);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      setShippingMonth(newDate);
    } else {
      const newDate = new Date(productMonth);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      setProductMonth(newDate);
    }
  };

  return (
    <>
      
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
          background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 300px, #93c5fd 600px, #bfdbfe 900px, #dbeafe 1200px, #f0f9ff 1500px, #ffffff 1800px, #ffffff 100%)',
          zIndex: -3
        }} />

        {/* 왼쪽 연두색 */}
        <div style={{
          position: 'absolute',
          top: '400px',
          left: 0,
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at 0% 50%, rgba(187, 247, 208, 0.4) 0%, transparent 60%)',
          zIndex: -2
        }} />

        {/* 우측 상단 보라색 */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1600px',
          height: '1200px',
          background: 'radial-gradient(ellipse at 100% 0%, rgba(139, 92, 246, 0.5) 0%, transparent 60%)',
          zIndex: -1
        }} />
        <div style={{
          width: '100%',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr 1fr',
          gap: '24px'
        }}>
          {/* 칼럼 1 - 메인 콘텐츠 */}
          <div>
          {/* 상단 통계 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px',
            marginBottom: '16px',
          }}>
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: isMobile ? '8px' : '10px',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  transform: hoveredStat === index ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hoveredStat === index
                    ? '0 5px 15px rgba(0,0,0,0.1)'
                    : '0 1px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={() => setHoveredStat(index)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                  <div style={{
                    width: isMobile ? '24px' : '28px',
                    height: isMobile ? '24px' : '28px',
                    background: stat.bgGradient,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: isMobile ? '12px' : '14px',
                      height: isMobile ? '12px' : '14px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '3px'
                    }} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: isMobile ? '10px' : '11px',
                      color: '#6c757d',
                      marginBottom: '2px'
                    }}>
                      {stat.label}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: '600',
                      color: stat.color
                    }}>
                      {stat.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 1. 공급상품 섹션 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 100px)',
            overflow: 'hidden'
          }}>
            <h2 style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>공급상품</h2>

            <div style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '16px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <button
                onClick={() => setActiveTab({...activeTab, supply: 'list'})}
                style={{
                  background: 'transparent',
                  borderBottom: activeTab.supply === 'list' || !activeTab.supply ? '2px solid #2563eb' : '2px solid transparent',
                  color: activeTab.supply === 'list' || !activeTab.supply ? '#2563eb' : '#6c757d',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '-1px'
                }}
              >
                상품 목록 보기
              </button>
            </div>

            {/* 상품 목록 테이블 */}
            {(activeTab.supply === 'list' || !activeTab.supply) && (
              <div style={{
                overflowX: 'auto',
                overflowY: 'auto',
                flex: 1,
                minHeight: 0
              }}>
                {loading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: '#6c757d',
                    fontSize: '13px'
                  }}>
                    상품 목록을 불러오는 중...
                  </div>
                ) : products.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: '#6c757d',
                    fontSize: '13px'
                  }}>
                    현재 출하중인 상품이 없습니다.
                  </div>
                ) : (
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          padding: '10px',
                          borderBottom: '2px solid #dee2e6',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#495057'
                        }}>품목</th>
                        <th style={{
                          padding: '10px',
                          borderBottom: '2px solid #dee2e6',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#495057'
                        }}>상품명</th>
                        {!isMobile && <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#495057' }}>출고</th>}
                        <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#495057' }}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f3f5', fontSize: '13px', color: '#6c757d' }}>
                            {product.variety || '-'}
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f3f5', fontSize: '13px' }}>
                            {product.name}
                          </td>
                          {!isMobile && <td style={{ padding: '10px', borderBottom: '1px solid #f1f3f5', fontSize: '13px', color: '#6c757d' }}>
                            {product.origin || '-'}
                          </td>}
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f3f5' }}>
                            <span style={{
                              padding: '3px 6px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>출하중</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          </div>
          {/* 칼럼 1 끝 */}

          {/* 칼럼 2 */}
          {!isMobile && (
            <div style={{
            }}>
              {/* 시세정보 섹션 */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '24px',
                marginBottom: '16px',
              }}>
                <h2 style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>시세정보</h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {marketPrices.map((item, idx) => (
                    <div key={idx} style={{
                      background: '#ffffff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: '#e7f3ff',
                        color: '#2563eb',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        marginBottom: '12px'
                      }}>
                        {item.category}
                      </span>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}>{item.name}</h3>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#2563eb',
                        marginBottom: '4px'
                      }}>
                        {item.price}
                      </div>
                      <div style={{
                        color: item.isUp ? '#10b981' : item.isUp === false ? '#ef4444' : '#6c757d',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {item.isUp && '▲'}{item.isUp === false && '▼'}{item.isUp === null && '-'} {item.change} ({item.changePercent})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* 칼럼 2 끝 */}

          {/* 칼럼 3 */}
          {!isMobile && (
            <div style={{
            }}>
              {/* 발송캘린더 섹션 */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '16px',
                }}>
                {/* 타이틀과 캘린더 헤더 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>발송캘린더</h2>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => changeMonth('shipping', 'prev')}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1px solid #dee2e6',
                        background: '#ffffff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#495057'
                      }}>‹</button>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#212529',
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>{shippingCalendar.year}년 {shippingCalendar.month + 1}월</span>
                    <button
                      onClick={() => changeMonth('shipping', 'next')}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1px solid #dee2e6',
                        background: '#ffffff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#495057'
                      }}>›</button>
                  </div>
                </div>

                {/* 요일 헤더 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '3px',
                  marginBottom: '6px'
                }}>
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                    <div key={idx} style={{
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: idx === 0 ? '#dc3545' : idx === 6 ? '#2563eb' : '#6c757d',
                      padding: '6px 0'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* 캘린더 그리드 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '3px'
                }}>
                  {[...shippingCalendar.emptyDays, ...shippingCalendar.calendarDays].map((day, idx) => (
                    <div key={`shipping-${idx}`} style={{
                      border: '1px solid #f1f3f5',
                      borderRadius: '6px',
                      padding: '6px',
                      minHeight: '40px',
                      background: day ? '#ffffff' : 'transparent'
                    }}>
                      {day && (
                        <>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            marginBottom: '3px',
                            color: (idx % 7 === 0) ? '#dc3545' : (idx % 7 === 6) ? '#2563eb' : '#212529'
                          }}>
                            {day}
                          </div>
                          {[5, 10, 15, 20, 25].includes(day) && (
                            <div style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              background: '#e7f3ff',
                              color: '#2563eb',
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}>
                              발송일
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 상품캘린더 섹션 */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '16px',
              }}>
                {/* 타이틀과 캘린더 헤더 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>상품캘린더</h2>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => changeMonth('product', 'prev')}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1px solid #dee2e6',
                        background: '#ffffff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#495057'
                      }}>‹</button>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#212529',
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>{productCalendar.year}년 {productCalendar.month + 1}월</span>
                    <button
                      onClick={() => changeMonth('product', 'next')}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1px solid #dee2e6',
                        background: '#ffffff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#495057'
                      }}>›</button>
                  </div>
                </div>

                {/* 요일 헤더 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '3px',
                  marginBottom: '6px'
                }}>
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                    <div key={`product-${idx}`} style={{
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: idx === 0 ? '#dc3545' : idx === 6 ? '#2563eb' : '#6c757d',
                      padding: '6px 0'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* 캘린더 그리드 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '3px'
                }}>
                  {[...productCalendar.emptyDays, ...productCalendar.calendarDays].map((day, idx) => (
                    <div key={`product-day-${idx}`} style={{
                      border: '1px solid #f1f3f5',
                      borderRadius: '6px',
                      padding: '6px',
                      minHeight: '40px',
                      background: day ? '#ffffff' : 'transparent'
                    }}>
                      {day && (
                        <>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            marginBottom: '3px',
                            color: (idx % 7 === 0) ? '#dc3545' : (idx % 7 === 6) ? '#2563eb' : '#212529'
                          }}>
                            {day}
                          </div>
                          {[3, 8, 13, 18, 23, 28].includes(day) && (
                            <div style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              background: '#d1fae5',
                              color: '#10b981',
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}>
                              입고일
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* 칼럼 2 끝 */}

          {/* 칼럼 4 */}
          {!isMobile && (
            <div style={{
            }}>
              {/* 셀러계정 정보 섹션 */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {organizationInfo ? (
                  <>
                    {/* 셀러계정명 */}
                    <div style={{ flex: '1 1 auto' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#212529'
                      }}>{organizationInfo.name}</div>
                      <div style={{
                        fontSize: '11px',
                        color: '#6c757d',
                        marginTop: '3px'
                      }}>{organizationInfo.seller_code || '-'}</div>
                    </div>

                    {/* 멤버현황 */}
                    <div style={{
                      padding: '6px 10px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#495057'
                    }}>
                      멤버 {organizationInfo.member_count || 0}명
                    </div>

                    {/* 셀러계정등급 */}
                    <div style={{
                      padding: '6px 12px',
                      background: organizationInfo.grade === 'legend'
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                        : organizationInfo.grade === 'elite'
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
                        : organizationInfo.grade === 'advance'
                        ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
                        : organizationInfo.grade === 'standard'
                        ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                        : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {organizationInfo.grade === 'legend' ? '🏆 레전드' :
                       organizationInfo.grade === 'elite' ? '💎 엘리트' :
                       organizationInfo.grade === 'advance' ? '⭐ 어드밴스' :
                       organizationInfo.grade === 'standard' ? '🌟 스탠다드' : '💡 라이트'}
                    </div>
                  </>
                ) : (
                  <div style={{
                    fontSize: '14px',
                    color: '#6c757d'
                  }}>로딩 중...</div>
                )}
              </div>

              {/* 발주시스템 섹션 */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '24px',
                marginBottom: '16px',
              }}>
                <h2 style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>발주시스템</h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '12px'
                }}>
                  {[
                    { title: '빠른 발주', desc: '자주 주문하는 상품을\n빠르게 발주하세요', primary: true },
                    { title: '정기 발주 설정', desc: '매주/매월 자동으로\n발주되도록 설정하세요', primary: false },
                    { title: '발주 내역 조회', desc: '지난 주문 내역을\n확인하고 재주문하세요', primary: false }
                  ].map((item: OrderSystemItem, idx) => (
                    <div key={idx} style={{
                      border: item.primary ? '2px solid #2563eb' : '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '14px',
                      textAlign: 'center'
                    }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '6px',
                        color: item.primary ? '#2563eb' : '#212529'
                      }}>
                        {item.title}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        marginBottom: '12px',
                        whiteSpace: 'pre-line',
                        lineHeight: '1.5'
                      }}>
                        {item.desc}
                      </p>
                      <button style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        background: item.primary ? '#2563eb' : '#ffffff',
                        color: item.primary ? '#ffffff' : '#2563eb',
                        border: item.primary ? 'none' : '1px solid #2563eb',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}>
                        {item.primary ? '바로 주문하기' : item.title.includes('설정') ? '설정하기' : '내역 보기'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Win-Win 프로그램 섹션 */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: isMobile ? '20px' : '40px',
                marginBottom: '24px',
                }}>
                <h2 style={{
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  color: '#8b5cf6'
                }}>Win-Win 프로그램</h2>

                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#8b5cf6',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>
                    특별 혜택
                  </span>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>농가 직거래 지원</h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6c757d',
                    lineHeight: '1.6',
                    marginBottom: '16px'
                  }}>
                    중간 유통 과정 없이 농가와 소비자를 직접 연결하여
                    농가 수익 증대와 소비자 가격 절감을 동시에 실현합니다.
                  </p>
                  <ul style={{
                    fontSize: '14px',
                    color: '#495057',
                    paddingLeft: '20px',
                    margin: 0
                  }}>
                    <li>판로 개척 지원</li>
                    <li>물류 시스템 제공</li>
                    <li>마케팅 지원</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {/* 칼럼 4 끝 */}

          {/* 칼럼 5 */}
          {!isMobile && (
            <div style={{
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>칼럼 5</h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6c757d'
                }}>새로운 컨텐츠가 여기에 표시됩니다.</p>
              </div>
            </div>
          )}
          {/* 칼럼 5 끝 */}

          {/* 병합 행 1 - 칼럼 1~5 병합 */}
          <div style={{
            gridColumn: '1 / -1',
          }}>
            {/* 업무도구 섹션 */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
                whiteSpace: 'nowrap'
              }}>업무도구</h2>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1
              }}>
                {['매출 분석', '재고 관리', '세금계산서', '문자 발송'].map((tool, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    background: '#f8f9fa'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: `linear-gradient(135deg, hsl(${idx * 90}, 70%, 50%) 0%, hsl(${idx * 90 + 30}, 70%, 60%) 100%)`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#495057',
                      whiteSpace: 'nowrap'
                    }}>{tool}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 병합 행 2 - 칼럼 1~5 병합 */}
          <div style={{
            gridColumn: '1 / -1',
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>병합 행 2</h3>
              <p style={{
                fontSize: '14px',
                color: '#6c757d'
              }}>칼럼 1~5가 병합된 두 번째 행입니다.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
