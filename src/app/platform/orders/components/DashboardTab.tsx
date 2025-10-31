'use client';

import { useMemo, useState, useEffect } from 'react';
import { Order, StatusConfig, StatsData } from '../types';
import DatePicker from '@/components/ui/DatePicker';

interface DashboardTabProps {
  isMobile: boolean;
  orders: Order[];
  statusConfig: Record<Order['status'], StatusConfig>;
}

export default function DashboardTab({ isMobile, orders, statusConfig }: DashboardTabProps) {
  const [hoveredBadge, setHoveredBadge] = useState<{ type: string; amount: number; position: { x: number; y: number } } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | null>(null);

  // 현재 날짜 정보
  const now = useMemo(() => new Date(), []);
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);

  // 날짜 필터 상태 (기본값: 최근 7일)
  const [startDate, setStartDate] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // 이번 달 첫날과 마지막 날
  const firstDayOfMonth = useMemo(() => new Date(currentYear, currentMonth - 1, 1), [currentYear, currentMonth]);
  const lastDayOfMonth = useMemo(() => new Date(currentYear, currentMonth, 0), [currentYear, currentMonth]);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 전월 마지막 날짜
  const prevMonthLastDay = useMemo(() => new Date(currentYear, currentMonth - 1, 0).getDate(), [currentYear, currentMonth]);
  const prevMonth = useMemo(() => currentMonth === 1 ? 12 : currentMonth - 1, [currentMonth]);

  // 다음달 첫 날짜 이후 필요한 칸 수
  const totalCells = firstDayOfWeek + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonth = useMemo(() => currentMonth === 12 ? 1 : currentMonth + 1, [currentMonth]);

  // 대한민국 공휴일 (2025년 기준)
  const holidays = useMemo(() => {
    const holidayMap: Record<string, string> = {
      '1-1': '신정',
      '1-28': '설날연휴',
      '1-29': '설날',
      '1-30': '설날연휴',
      '3-1': '삼일절',
      '3-3': '삼일절대체',
      '5-5': '어린이날',
      '5-6': '대체공휴일',
      '6-6': '현충일',
      '8-15': '광복절',
      '10-3': '개천절',
      '10-4': '추석연휴',
      '10-5': '추석연휴',
      '10-6': '추석',
      '10-7': '추석연휴',
      '10-8': '대체공휴일',
      '10-9': '한글날',
      '12-25': '크리스마스'
    };
    return holidayMap;
  }, []);

  // 특정 날짜가 공휴일인지 확인
  const getHoliday = (month: number, day: number) => {
    return holidays[`${month}-${day}`];
  };

  // 이전 달로 이동
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 날짜 필터 함수
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const handleToday = () => {
    const today = new Date();
    setStartDate(formatDate(today));
    setEndDate(formatDate(today));
  };

  const handleYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setStartDate(formatDate(yesterday));
    setEndDate(formatDate(yesterday));
  };

  const handleThisYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const yearStart = `${year}-01-01`;
    setStartDate(yearStart);
    setEndDate(formatDate(today));
  };

  // 날짜별 주문 집계 (발주서확정일 기준으로 확정건수 + 발송완료건수 + 취소요청건수)
  const ordersByDate = useMemo(() => {
    const dateMap: Record<number, {
      confirmedCount: number;
      shippedCount: number;
      cancelRequestedCount: number;
      confirmedAmount: number;
      shippedAmount: number;
      cancelRequestedAmount: number;
    }> = {};

    orders.forEach(order => {
      // 발주서확정일 기준으로 집계
      if (order.confirmedAt) {
        const confirmedDate = new Date(order.confirmedAt);
        if (confirmedDate.getFullYear() === currentYear && confirmedDate.getMonth() === currentMonth - 1) {
          const day = confirmedDate.getDate();
          if (!dateMap[day]) {
            dateMap[day] = {
              confirmedCount: 0,
              shippedCount: 0,
              cancelRequestedCount: 0,
              confirmedAmount: 0,
              shippedAmount: 0,
              cancelRequestedAmount: 0
            };
          }
          dateMap[day].confirmedCount++;
          dateMap[day].confirmedAmount += (order as any).settlement_amount || 0;

          // 같은 발주서확정일에, 해당 주문이 발송완료되었다면 shippedCount 증가
          if (order.shippedDate) {
            dateMap[day].shippedCount++;
            dateMap[day].shippedAmount += (order as any).settlement_amount || 0;
          }

          // 같은 발주서확정일에, 해당 주문이 취소요청되었다면 cancelRequestedCount 증가
          if (order.status === 'cancelRequested') {
            dateMap[day].cancelRequestedCount++;
            dateMap[day].cancelRequestedAmount += (order as any).settlement_amount || 0;
          }
        }
      }
    });

    return dateMap;
  }, [orders, currentYear, currentMonth]);

  // 이번 달 통계
  const thisMonthStats = useMemo(() => {
    let totalAmount = 0;
    let totalCount = 0;

    orders.forEach(order => {
      const orderDate = order.registeredAt ? new Date(order.registeredAt) : null;
      if (!orderDate) return;

      if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth - 1) {
        totalAmount += order.amount || 0;
        totalCount++;
      }
    });

    return { totalAmount, totalCount, avgAmount: totalCount > 0 ? totalAmount / totalCount : 0 };
  }, [orders, currentYear, currentMonth]);

  // 어제 통계
  const yesterdayStats = useMemo(() => {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    let totalAmount = 0;
    let totalCount = 0;

    orders.forEach(order => {
      const orderDate = order.registeredAt ? new Date(order.registeredAt) : null;
      if (!orderDate) return;

      if (
        orderDate.getFullYear() === yesterday.getFullYear() &&
        orderDate.getMonth() === yesterday.getMonth() &&
        orderDate.getDate() === yesterday.getDate()
      ) {
        totalAmount += order.amount || 0;
        totalCount++;
      }
    });

    return { totalAmount, totalCount };
  }, [orders, now]);

  // 최근 7일 통계
  const last7DaysStats = useMemo(() => {
    const stats: { day: string; date: string; value: number; amount: number; count: number }[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      let dayAmount = 0;
      let dayCount = 0;

      orders.forEach(order => {
        const orderDate = new Date(order.date);
        const koreaOrderDate = new Date(orderDate.getTime() + (9 * 60 * 60 * 1000));

        if (
          koreaOrderDate.getUTCFullYear() === date.getFullYear() &&
          koreaOrderDate.getUTCMonth() === date.getMonth() &&
          koreaOrderDate.getUTCDate() === date.getDate()
        ) {
          dayAmount += order.supplyPrice || 0;
          dayCount += 1;
        }
      });

      stats.push({
        day: dayNames[date.getDay()],
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        value: dayAmount,
        amount: dayAmount,
        count: dayCount
      });
    }

    // Normalize heights (0-100%)
    const maxAmount = Math.max(...stats.map(s => s.amount), 1);
    stats.forEach(s => {
      s.value = (s.amount / maxAmount) * 100;
    });

    return stats;
  }, [orders, now]);

  // 월별 발주 추이 (최근 7개월)
  const monthlyStats = useMemo(() => {
    const stats: { month: string; value: number; amount: number; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      let monthAmount = 0;
      let monthCount = 0;

      orders.forEach(order => {
        const orderDate = new Date(order.date);
        const koreaOrderDate = new Date(orderDate.getTime() + (9 * 60 * 60 * 1000));

        if (
          koreaOrderDate.getUTCFullYear() === date.getFullYear() &&
          koreaOrderDate.getUTCMonth() === date.getMonth()
        ) {
          monthAmount += order.supplyPrice || 0;
          monthCount += 1;
        }
      });

      stats.push({
        month: `${date.getMonth() + 1}월`,
        value: monthAmount,
        amount: monthAmount,
        count: monthCount
      });
    }

    // Normalize heights
    const maxAmount = Math.max(...stats.map(s => s.amount), 1);
    stats.forEach(s => {
      s.value = (s.amount / maxAmount) * 100;
    });

    return stats;
  }, [orders, currentYear, currentMonth]);

  // 품목 발주 TOP 10 (옵션명의 category_4 기준)
  const [productTop10, setProductTop10] = useState<Array<{ name: string; category3: string; amount: number; percent: number }>>([]);
  const [allProducts, setAllProducts] = useState<Array<{ name: string; category3: string; amount: number; percent: number }>>([]);
  const [selectedCategory4, setSelectedCategory4] = useState<string | null>(null);
  const [optionNameToCategory4, setOptionNameToCategory4] = useState<Map<string, string>>(new Map());

  // 날짜와 상태로 필터링된 주문
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 날짜 필터링
      if (startDate && endDate && order.registeredAt) {
        const orderDate = new Date(order.registeredAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // 종료일 23:59:59까지 포함

        if (orderDate < start || orderDate > end) {
          return false;
        }
      }

      // 상태 필터링 (선택된 상태가 있으면 해당 상태만)
      if (selectedStatus && order.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [orders, startDate, endDate, selectedStatus]);

  // 옵션상품 TOP 10 (선택된 품목에 따라 필터링, 필터링된 주문 사용)
  const optionTop10 = useMemo(() => {
    const optionMap: Record<string, number> = {};

    filteredOrders.forEach(order => {
      const optionName = order.optionName || '미지정';

      // 선택된 품목이 있으면 필터링
      if (selectedCategory4) {
        const category4 = optionNameToCategory4.get(optionName);
        if (category4 !== selectedCategory4) {
          return; // 선택된 품목이 아니면 스킵
        }
      }

      if (!optionMap[optionName]) {
        optionMap[optionName] = 0;
      }
      optionMap[optionName] += order.supplyPrice || 0;
    });

    const sorted = Object.entries(optionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxAmount = sorted[0]?.[1] || 1;

    const result = sorted.map(([name, amount]) => ({
      name,
      amount,
      percent: (amount / maxAmount) * 100
    }));

    return result;
  }, [filteredOrders, selectedCategory4, optionNameToCategory4]);

  useEffect(() => {
    const fetchProductTop10 = async () => {
      // 1. 옵션명별로 금액 집계 (필터링된 주문 사용)
      const optionMap: Record<string, number> = {};
      filteredOrders.forEach(order => {
        const optionName = order.optionName || '미지정';
        if (!optionMap[optionName]) {
          optionMap[optionName] = 0;
        }
        optionMap[optionName] += order.supplyPrice || 0;
      });

      // 2. option_products에서 category_4 조회
      const uniqueOptions = Object.keys(optionMap).filter(opt => opt !== '미지정');

      if (uniqueOptions.length === 0) {
        setProductTop10([]);
        return;
      }

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: optionProducts, error } = await supabase
        .from('option_products')
        .select('option_name, category_3, category_4')
        .in('option_name', uniqueOptions);

      if (error) {
        console.error('품목 조회 실패:', error);
        setProductTop10([]);
        return;
      }

      // 3. category별로 금액 재집계 (category_3 + category_4 조합으로 키 생성)
      // 동시에 optionName -> category4 매핑 저장
      const categoryMap: Record<string, { category3: string; category4: string; amount: number }> = {};
      const nameToCategory4Map = new Map<string, string>();

      optionProducts?.forEach((product: any) => {
        const category3 = product.category_3 || '';
        const category4 = product.category_4 || '미지정';
        const key = `${category3}|${category4}`;
        const amount = optionMap[product.option_name] || 0;

        // 옵션명 -> category4 매핑 저장
        nameToCategory4Map.set(product.option_name, category4);

        if (!categoryMap[key]) {
          categoryMap[key] = { category3, category4, amount: 0 };
        }
        categoryMap[key].amount += amount;
      });

      // 매핑 정보 state에 저장
      setOptionNameToCategory4(nameToCategory4Map);

      // 미지정 옵션도 포함
      if (optionMap['미지정']) {
        const key = '|미지정';
        if (!categoryMap[key]) {
          categoryMap[key] = { category3: '', category4: '미지정', amount: 0 };
        }
        categoryMap[key].amount += optionMap['미지정'];
      }

      // 4. 정렬
      const sorted = Object.values(categoryMap)
        .sort((a, b) => b.amount - a.amount);

      // 전체 금액 계산
      const totalAmount = sorted.reduce((sum, item) => sum + item.amount, 0);

      // 모든 제품 리스트 (범례용)
      const allResult = sorted.map((item) => ({
        name: item.category4,
        category3: item.category3,
        amount: item.amount,
        percent: (item.amount / totalAmount) * 100
      }));

      // TOP 10 + 기타 (도넛 차트용)
      const top10Items = sorted.slice(0, 10);
      const othersItems = sorted.slice(10);

      let chartResult = top10Items.map((item) => ({
        name: item.category4,
        category3: item.category3,
        amount: item.amount,
        percent: (item.amount / totalAmount) * 100
      }));

      // 기타 항목이 있으면 추가
      if (othersItems.length > 0) {
        const othersAmount = othersItems.reduce((sum, item) => sum + item.amount, 0);
        chartResult.push({
          name: '기타',
          category3: '',
          amount: othersAmount,
          percent: (othersAmount / totalAmount) * 100
        });
      }

      setProductTop10(chartResult);
      setAllProducts(allResult);
    };

    fetchProductTop10();
  }, [filteredOrders]);

  // 상태별 통계 데이터 (건수 + 정산금액)
  const statsData = useMemo(() => {
    const calculateStats = (status: Order['status']) => {
      const filteredOrders = orders.filter(o => o.status === status);
      const count = filteredOrders.length;
      // 정산금액 합계 (supplyPrice 사용)
      const amount = filteredOrders.reduce((sum, order) => {
        return sum + (order.supplyPrice || 0);
      }, 0);
      return { count, amount };
    };

    return [
      { status: 'registered' as const, ...calculateStats('registered'), bgGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' },
      { status: 'confirmed' as const, ...calculateStats('confirmed'), bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
      { status: 'preparing' as const, ...calculateStats('preparing'), bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
      { status: 'shipped' as const, ...calculateStats('shipped'), bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
      { status: 'cancelRequested' as const, ...calculateStats('cancelRequested'), bgGradient: 'linear-gradient(135deg, #f87171 0%, #fca5a5 100%)' },
      { status: 'cancelled' as const, ...calculateStats('cancelled'), bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' },
      { status: 'refunded' as const, ...calculateStats('refunded'), bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }
    ];
  }, [orders]);

  // 마켓별 날짜별 통계 데이터 (seller_market_name 기준, 필터링된 주문 사용)
  const marketDateStats = useMemo(() => {
    // 날짜별 마켓별 금액 집계
    const dateMarketMap = new Map<string, Map<string, number>>();

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.date);
      const koreaOrderDate = new Date(orderDate.getTime() + (9 * 60 * 60 * 1000));
      const dateKey = `${koreaOrderDate.getUTCFullYear()}-${String(koreaOrderDate.getUTCMonth() + 1).padStart(2, '0')}-${String(koreaOrderDate.getUTCDate()).padStart(2, '0')}`;
      const marketName = order.sellerMarketName || '미지정';

      if (!dateMarketMap.has(dateKey)) {
        dateMarketMap.set(dateKey, new Map());
      }

      const marketMap = dateMarketMap.get(dateKey)!;
      const existing = marketMap.get(marketName) || 0;
      marketMap.set(marketName, existing + (order.supplyPrice || 0));
    });

    // 날짜 정렬
    const sortedDates = Array.from(dateMarketMap.keys()).sort();

    // 모든 마켓 목록 추출
    const allMarkets = new Set<string>();
    filteredOrders.forEach(order => {
      const marketName = order.sellerMarketName || '미지정';
      allMarkets.add(marketName);
    });

    // 마켓별 색상 정의
    const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // 각 마켓별로 날짜별 데이터 생성
    const marketLines = Array.from(allMarkets).map((market, idx) => ({
      market,
      color: colors[idx % colors.length],
      data: sortedDates.map(date => ({
        date,
        amount: dateMarketMap.get(date)?.get(market) || 0
      }))
    }));

    // 총 금액 기준으로 정렬
    marketLines.sort((a, b) => {
      const totalA = a.data.reduce((sum, d) => sum + d.amount, 0);
      const totalB = b.data.reduce((sum, d) => sum + d.amount, 0);
      return totalB - totalA;
    });

    // 상위 10개와 나머지를 "기타"로 묶기
    let finalMarketLines = marketLines.slice(0, 10);

    if (marketLines.length > 10) {
      const othersLines = marketLines.slice(10);

      // "기타" 라인 생성 - 날짜별로 나머지 마켓들의 합계
      const othersData = sortedDates.map(date => {
        const totalAmount = othersLines.reduce((sum, line) => {
          const dateData = line.data.find(d => d.date === date);
          return sum + (dateData?.amount || 0);
        }, 0);
        return {
          date,
          amount: totalAmount
        };
      });

      // "기타" 라인 추가
      finalMarketLines.push({
        market: `기타 (${othersLines.length}개)`,
        color: '#9ca3af', // 회색
        data: othersData
      });
    }

    return {
      dates: sortedDates,
      marketLines: finalMarketLines,
      totalMarkets: marketLines.length
    };
  }, [filteredOrders]);

  return (
    <div>
      {/* 발주 캘린더 - 전체 너비 */}
      <div className="card" style={{
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            margin: 0
          }}>
            발주캘린더
          </h3>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <button
                onClick={handlePrevMonth}
                className="bg-white border-gray-200"
                style={{
                  padding: '6px',
                  border: '1px solid',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '100px',
                textAlign: 'center'
              }}>
                {currentYear}년 {currentMonth}월
              </span>
              <button
                onClick={handleNextMonth}
                className="bg-white border-gray-200"
                style={{
                  padding: '6px',
                  border: '1px solid',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '12px'
          }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div key={idx} className={idx === 0 ? 'text-danger' : idx === 6 ? 'text-primary' : ''} style={{
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 0'
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {/* 이전 달 날짜 */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => {
              const prevDay = prevMonthLastDay - firstDayOfWeek + i + 1;
              return (
                <div key={`prev-${i}`} style={{
                  padding: '12px 4px',
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#999',
                    fontWeight: '400'
                  }}>
                    {prevMonth}/{prevDay}
                  </span>
                </div>
              );
            })}

            {/* 현재 달 날짜 */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isToday = currentYear === todayYear && currentMonth === todayMonth && day === todayDay;
              const dayData = ordersByDate[day];
              const hasOrder = !!dayData;
              const confirmedCount = dayData?.confirmedCount || 0;
              const shippedCount = dayData?.shippedCount || 0;
              const cancelRequestedCount = dayData?.cancelRequestedCount || 0;
              const confirmedAmount = dayData?.confirmedAmount || 0;
              const shippedAmount = dayData?.shippedAmount || 0;
              const cancelRequestedAmount = dayData?.cancelRequestedAmount || 0;
              const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
              const holiday = getHoliday(currentMonth, day);
              const isHoliday = !!holiday;

              return (
                <div key={day} className={hasOrder && !isToday ? 'bg-white' : ''} style={{
                  position: 'relative',
                  background: isToday ? 'rgba(37, 99, 235, 0.1)' : hasOrder ? undefined : 'transparent',
                  border: isToday ? '2px solid' : hasOrder ? '1px solid' : 'none',
                  borderColor: isToday ? '#2563eb' : hasOrder ? '#dee2e6' : undefined,
                  borderRadius: '8px',
                  padding: '12px 4px',
                  minHeight: '80px',
                  cursor: hasOrder ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  if (hasOrder && !isToday) {
                    e.currentTarget.style.background = 'rgba(219, 234, 254, 0.8)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasOrder && !isToday) {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <span className={dayOfWeek === 0 || isHoliday ? 'text-danger' : dayOfWeek === 6 || isToday ? 'text-primary' : ''} style={{
                      fontSize: '13px',
                      fontWeight: isToday ? '600' : '500'
                    }}>
                      {day}
                    </span>
                    {isHoliday && (
                      <span style={{
                        fontSize: '9px',
                        color: '#ef4444',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}>
                        {holiday}
                      </span>
                    )}
                  </div>
                  {hasOrder && (
                    <div style={{
                      display: 'flex',
                      gap: '3px',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      {confirmedCount > 0 && (
                        <div
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBadge({
                              type: '확정',
                              amount: confirmedAmount,
                              position: { x: rect.left + rect.width / 2, y: rect.top }
                            });
                          }}
                          onMouseLeave={() => setHoveredBadge(null)}
                          style={{
                            border: '1px solid #7c3aed',
                            color: '#7c3aed',
                            background: 'transparent',
                            borderRadius: '3px',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          {confirmedCount}
                        </div>
                      )}
                      {shippedCount > 0 && (
                        <div
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBadge({
                              type: '발송',
                              amount: shippedAmount,
                              position: { x: rect.left + rect.width / 2, y: rect.top }
                            });
                          }}
                          onMouseLeave={() => setHoveredBadge(null)}
                          style={{
                            border: '1px solid #10b981',
                            color: '#10b981',
                            background: 'transparent',
                            borderRadius: '3px',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          {shippedCount}
                        </div>
                      )}
                      {cancelRequestedCount > 0 && (
                        <div
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBadge({
                              type: '취소',
                              amount: cancelRequestedAmount,
                              position: { x: rect.left + rect.width / 2, y: rect.top }
                            });
                          }}
                          onMouseLeave={() => setHoveredBadge(null)}
                          style={{
                            border: '1px solid #f87171',
                            color: '#f87171',
                            background: 'transparent',
                            borderRadius: '3px',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          {cancelRequestedCount}
                        </div>
                      )}
                    </div>
                  )}
                  {isToday && (
                    <div className="bg-primary" style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      color: '#ffffff',
                      borderRadius: '3px',
                      padding: '1px 4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      오늘
                    </div>
                  )}
                </div>
              );
            })}

            {/* 다음 달 날짜 */}
            {Array.from({ length: remainingCells }, (_, i) => {
              const nextDay = i + 1;
              return (
                <div key={`next-${i}`} style={{
                  padding: '12px 4px',
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#999',
                    fontWeight: '400'
                  }}>
                    {nextMonth}/{nextDay}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 캘린더 범례 */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(222, 226, 230, 0.5)',
            fontSize: '11px',
            justifyContent: 'flex-start'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                border: '1px solid #7c3aed',
                color: '#7c3aed',
                background: 'transparent',
                borderRadius: '2px',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: '700'
              }}>
                N
              </div>
              <span style={{ color: '#7c3aed', fontWeight: '500' }}>발주확정</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                border: '1px solid #10b981',
                color: '#10b981',
                background: 'transparent',
                borderRadius: '2px',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: '700'
              }}>
                N
              </div>
              <span style={{ color: '#10b981', fontWeight: '500' }}>발송완료</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                border: '1px solid #f87171',
                color: '#f87171',
                background: 'transparent',
                borderRadius: '2px',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: '700'
              }}>
                N
              </div>
              <span style={{ color: '#f87171', fontWeight: '500' }}>취소요청</span>
            </div>
          </div>
      </div>

      {/* 차트 영역 - Flex 레이아웃 */}
      <div style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start'
      }}>
        {/* 첫 번째 열: 날짜 필터 & 통계 카드 - Sticky */}
        <div style={{
          width: '240px',
          flexShrink: 0,
          position: 'sticky',
          top: '80px',
          maxHeight: 'calc(100vh - 96px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* 날짜 필터 */}
          <div className="card" style={{
            borderRadius: '8px',
            padding: '8px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* 날짜 입력 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}>
                <DatePicker
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholder="시작일"
                  maxDate={endDate || undefined}
                />
                <span style={{ color: '#6b7280', fontSize: '12px' }}>~</span>
                <DatePicker
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholder="종료일"
                  minDate={startDate || undefined}
                />
              </div>

              {/* 빠른 선택 버튼 */}
              <div style={{
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleToday}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '400',
                    border: '1px solid',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '16px'
                  }}
                >
                  오늘
                </button>
                <button
                  onClick={handleYesterday}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '400',
                    border: '1px solid',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '16px'
                  }}
                >
                  어제
                </button>
                <button
                  onClick={() => setDateRange(7)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '400',
                    border: '1px solid',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '16px'
                  }}
                >
                  7일
                </button>
                <button
                  onClick={() => setDateRange(30)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '400',
                    border: '1px solid',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '16px'
                  }}
                >
                  30일
                </button>
                <button
                  onClick={() => setDateRange(90)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '400',
                    border: '1px solid',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '16px'
                  }}
                >
                  90일
                </button>
                <button
                  onClick={() => setDateRange(365)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '400',
                    border: '1px solid',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '16px'
                  }}
                >
                  1년
                </button>
                <button
                  onClick={handleThisYear}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '400',
                    border: '1px solid',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '16px'
                  }}
                >
                  올해
                </button>
              </div>
            </div>
          </div>

          {/* 통계 카드들 */}
          {statsData.map((stat) => {
            const config = statusConfig[stat.status];
            const isSelected = selectedStatus === stat.status;

            return (
              <div
                key={stat.status}
                className="card"
                onClick={() => setSelectedStatus(isSelected ? null : stat.status)}
                style={{
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${config.color}` : '1px solid transparent',
                  boxShadow: isSelected ? `0 0 0 2px ${config.color}20` : undefined,
                  transform: isSelected ? 'scale(1.01)' : undefined,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  marginBottom: '3px',
                  color: config.color,
                  fontWeight: '500'
                }}>
                  {config.label}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '4px'
                }}>
                  <div style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: config.color
                  }}>
                    {stat.count}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1px',
                    color: '#6b7280',
                    whiteSpace: 'nowrap'
                  }}>
                    <span>₩</span>
                    <span>{stat.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 두 번째, 세 번째 열: 차트 영역 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* 첫 번째 행: 발주 TOP 10 + 옵션상품 발주 TOP 10 (6:4) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '6fr 4fr',
            gap: '24px'
          }}>
          {/* 품목 발주 TOP 10 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '500px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              발주 TOP 10
            </h3>
            {productTop10.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '32px',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1
              }}>
                {/* 원형 그래프 */}
                <div style={{
                  width: isMobile ? '300px' : '340px',
                  height: isMobile ? '300px' : '340px',
                  position: 'relative',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg viewBox="0 0 200 200" style={{
                    transform: 'rotate(-90deg)',
                    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
                  }}>
                    {/* 외곽 테두리 원 */}
                    <circle
                      cx="100"
                      cy="100"
                      r="92"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="2"
                    />

                    {(() => {
                      let cumulativePercent = 0;
                      const colors = [
                        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
                        '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'
                      ];

                      // 원의 둘레 계산: 2 * π * r
                      const radius = 62;
                      const circumference = 2 * Math.PI * radius;
                      const totalAmount = productTop10.reduce((sum, i) => sum + i.amount, 0);

                      const segments = productTop10.map((item, idx) => {
                        const percent = item.amount / totalAmount;
                        const strokeDasharray = `${percent * circumference} ${circumference}`;
                        const strokeDashoffset = -cumulativePercent * circumference;

                        // 각 세그먼트의 중간 각도 계산 (라디안)
                        const startAngle = cumulativePercent * 2 * Math.PI;
                        const midAngle = startAngle + (percent * 2 * Math.PI) / 2;
                        const endAngle = startAngle + (percent * 2 * Math.PI);

                        // 텍스트 위치 계산 (도넛 중간 지점)
                        const textRadius = 62; // 도넛 중간 지점
                        const textX = 100 + textRadius * Math.cos(midAngle);
                        const textY = 100 + textRadius * Math.sin(midAngle);

                        // 경계선을 위한 내부/외부 반지름
                        const innerRadius = 32;
                        const outerRadius = 92;

                        // 세그먼트 끝 위치 계산
                        const endX1 = 100 + innerRadius * Math.cos(endAngle);
                        const endY1 = 100 + innerRadius * Math.sin(endAngle);
                        const endX2 = 100 + outerRadius * Math.cos(endAngle);
                        const endY2 = 100 + outerRadius * Math.sin(endAngle);

                        // '기타' 항목은 회색으로 표시
                        const isOthers = item.name === '기타';
                        const segmentColor = isOthers ? '#9ca3af' : colors[idx % colors.length];

                        cumulativePercent += percent;

                        return {
                          circle: (
                            <circle
                              key={idx}
                              cx="100"
                              cy="100"
                              r={radius}
                              fill="transparent"
                              stroke={segmentColor}
                              strokeWidth="60"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              style={{
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: 0.95
                              }}
                            />
                          ),
                          divider: idx < productTop10.length - 1 ? ( // 마지막 세그먼트는 제외
                            <line
                              key={`divider-${idx}`}
                              x1={endX1}
                              y1={endY1}
                              x2={endX2}
                              y2={endY2}
                              stroke="rgba(255, 255, 255, 0.6)"
                              strokeWidth="0.8"
                              style={{
                                pointerEvents: 'none'
                              }}
                            />
                          ) : null,
                          text: percent > 0.05 ? ( // 5% 이상인 경우만 표시
                            <text
                              key={`text-${idx}`}
                              x={textX}
                              y={textY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#ffffff"
                              fontSize="10"
                              fontWeight="700"
                              style={{
                                transform: 'rotate(90deg)',
                                transformOrigin: `${textX}px ${textY}px`,
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                                pointerEvents: 'none'
                              }}
                            >
                              {(percent * 100).toFixed(1)}%
                            </text>
                          ) : null
                        };
                      });

                      // 첫 번째 세그먼트 시작점 경계선 추가
                      const firstDivider = (() => {
                        const angle = 0; // 첫 번째 세그먼트 시작 각도
                        const innerRadius = 32;
                        const outerRadius = 92;
                        const x1 = 100 + innerRadius * Math.cos(angle);
                        const y1 = 100 + innerRadius * Math.sin(angle);
                        const x2 = 100 + outerRadius * Math.cos(angle);
                        const y2 = 100 + outerRadius * Math.sin(angle);

                        return (
                          <line
                            key="divider-first"
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(255, 255, 255, 0.6)"
                            strokeWidth="0.8"
                            style={{
                              pointerEvents: 'none'
                            }}
                          />
                        );
                      })();

                      return (
                        <>
                          {segments.map(s => s.circle)}
                          {firstDivider}
                          {segments.map(s => s.divider)}
                          {segments.map(s => s.text)}
                        </>
                      );
                    })()}

                    {/* 중앙 흰색 원 - 그라데이션 효과 */}
                    <defs>
                      <radialGradient id="centerGradient">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#fafafa" />
                      </radialGradient>
                    </defs>
                    <circle
                      cx="100"
                      cy="100"
                      r="32"
                      fill="url(#centerGradient)"
                      filter="drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))"
                    />
                  </svg>
                </div>

                {/* 범례 - 오른쪽에 세로 배치 (모든 제품 표시) */}
                <div style={{
                  flex: 1,
                  maxHeight: '340px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {allProducts.map((item, idx) => {
                    const colors = [
                      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
                      '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'
                    ];
                    // TOP 10에 포함되는지 확인
                    const isInTop10 = idx < 10;
                    const color = isInTop10 ? colors[idx % colors.length] : '#9ca3af';
                    const isSelected = selectedCategory4 === item.name;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          // 같은 항목 클릭시 선택 해제
                          if (selectedCategory4 === item.name) {
                            setSelectedCategory4(null);
                          } else {
                            setSelectedCategory4(item.name);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '10px',
                          gap: '10px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          marginLeft: '-8px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: color,
                          flexShrink: 0
                        }} />
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flex: 1,
                          minWidth: 0,
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: '#374151'
                          }}>
                            {item.category3 && (
                              <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '400' }}>{item.category3} / </span>
                            )}
                            {item.name}
                          </span>
                          <span style={{
                            whiteSpace: 'nowrap',
                            color: '#6b7280',
                            fontSize: '11px',
                            fontWeight: '400'
                          }}>
                            ₩{item.amount.toLocaleString()}
                          </span>
                          <span style={{
                            whiteSpace: 'nowrap',
                            fontWeight: '600',
                            color: color,
                            fontSize: '12px'
                          }}>
                            {item.percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                데이터가 없습니다
              </div>
            )}
          </div>

          {/* 옵션상품 발주 TOP 10 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              옵션상품 발주 TOP 10
            </h3>
            <div style={{
              maxHeight: '440px',
              overflowY: 'auto'
            }}>
              {optionTop10.length > 0 ? optionTop10.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                    }}>
                      {idx + 1}. {item.name}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      }}>
                      ₩{item.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-gray-200" style={{
                    height: '6px',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div className="bg-primary" style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  데이터가 없습니다
                </div>
              )}
            </div>
          </div>
          </div>

{/* 마켓별 통계 - 전체 너비 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                margin: 0
              }}>
                마켓별 날짜별 통계
              </h3>
              {marketDateStats.totalMarkets > 10 && (
                <span style={{
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  상위 10개 + 기타 / 총 {marketDateStats.totalMarkets}개
                </span>
              )}
            </div>
            {marketDateStats.dates.length > 0 && marketDateStats.marketLines.length > 0 ? (
              <div style={{ position: 'relative' }}>
                {/* 그래프 영역 */}
                <svg viewBox="0 0 500 250" style={{ width: '100%', height: '250px' }}>
                  {/* 가로 격자선 */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={`grid-${i}`}
                      x1="60"
                      y1={30 + i * 40}
                      x2="480"
                      y2={30 + i * 40}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}

                  {/* 각 마켓별 꺾은선 그래프 */}
                  {(() => {
                    if (marketDateStats.dates.length === 0 || marketDateStats.marketLines.length === 0) {
                      return null;
                    }

                    const maxAmount = Math.max(
                      ...marketDateStats.marketLines.flatMap(line =>
                        line.data.map(d => d.amount)
                      ),
                      1
                    );

                    const dateCount = marketDateStats.dates.length;
                    const divisor = dateCount > 1 ? dateCount - 1 : 1;

                    return marketDateStats.marketLines.map((line, lineIdx) => {
                      const points = line.data.map((d, idx) => {
                        const x = 60 + (idx / divisor) * 420;
                        const y = 210 - ((d.amount / maxAmount) * 160);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <g key={lineIdx}>
                          <polyline
                            points={points}
                            fill="none"
                            stroke={line.color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                          {line.data.map((d, idx) => {
                            const x = 60 + (idx / divisor) * 420;
                            const y = 210 - ((d.amount / maxAmount) * 160);
                            return (
                              <circle
                                key={idx}
                                cx={x}
                                cy={y}
                                r="3"
                                fill={line.color}
                                stroke="#fff"
                                strokeWidth="1"
                                style={{
                                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                            );
                          })}
                        </g>
                      );
                    });
                  })()}

                  {/* X축 레이블 (날짜) */}
                  {marketDateStats.dates.length > 0 && marketDateStats.dates.map((date, idx) => {
                    const divisor = marketDateStats.dates.length > 1 ? marketDateStats.dates.length - 1 : 1;
                    const x = 60 + (idx / divisor) * 420;
                    const displayDate = date.substring(5);
                    return (
                      <text
                        key={idx}
                        x={x}
                        y="230"
                        textAnchor="middle"
                        fontSize="9"
                        fill="#6b7280"
                      >
                        {displayDate}
                      </text>
                    );
                  })}
                </svg>

                {/* 범례 */}
                <div style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {marketDateStats.marketLines.map((line, idx) => {
                    const totalAmount = line.data.reduce((sum, d) => sum + d.amount, 0);
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: line.color
                        }} />
                        <span>{line.market}</span>
                        <span style={{ color: '#6b7280', fontSize: '11px' }}>
                          (₩{totalAmount.toLocaleString()})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'center',
                padding: '20px 0'
              }}>
                마켓별 데이터가 없습니다
              </div>
            )}
          </div>

          {/* 두 번째 행: 최근 7일 + 월별 발주 추이 (5:5) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px'
          }}>
          {/* 최근 7일 발주 현황 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              최근 7일 발주 현황
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '180px',
              gap: '8px',
              position: 'relative'
            }}>
              {last7DaysStats.map((item, idx) => {
                const barHeight = item.amount > 0 ? Math.max(item.value * 1.2, 10) : 2;
                return (
                  <div key={idx} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        {item.count}건
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: '#495057',
                        fontWeight: '500'
                      }}>
                        ₩{item.amount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${barHeight}px`,
                      background: idx === 6 ? '#10b981' : '#93c5fd',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1px',
                      marginTop: '4px'
                    }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {item.day}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        {item.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 월별 발주 추이 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              월별 발주 추이 (최근 7개월)
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '180px',
              gap: '8px',
              position: 'relative'
            }}>
              {monthlyStats.map((stat, idx) => {
                const barHeight = stat.amount > 0 ? Math.max(stat.value * 1.2, 10) : 2;
                return (
                  <div key={idx} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        {stat.count}건
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: '#495057',
                        fontWeight: '500'
                      }}>
                        ₩{stat.amount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${barHeight}px`,
                      background: idx === monthlyStats.length - 1 ? '#2563eb' : '#93c5fd',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      marginTop: '4px'
                    }}>
                      {stat.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* 커스텀 툴팁 */}
      {hoveredBadge && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredBadge.position.x}px`,
            top: `${hoveredBadge.position.y - 40}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 10000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          {hoveredBadge.type}: {hoveredBadge.amount.toLocaleString()}원
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(0, 0, 0, 0.9)'
            }}
          />
        </div>
      )}
    </div>
  );
}
