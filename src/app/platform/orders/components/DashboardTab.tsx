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

  // 툴팁 상태
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    market: string;
    amount: number;
  } | null>(null);

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

  // 마켓별 통계 그래프 필터 (단일 선택 - 기존 방식)
  const [selectedProductForGraph, setSelectedProductForGraph] = useState<string | null>(null);
  const [selectedOptionForGraph, setSelectedOptionForGraph] = useState<string | null>(null);

  // 품목/옵션별 통계 탭
  const [graphTab, setGraphTab] = useState<'market' | 'product'>('market');

  // 품목/옵션 다중 선택 (상호 배타적)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // 모든 마켓 목록 추출
  const allMarketsList = useMemo(() => {
    const markets = new Set<string>();
    filteredOrders.forEach(order => {
      const marketName = order.sellerMarketName || '미지정';
      markets.add(marketName);
    });
    return Array.from(markets);
  }, [filteredOrders]);

  // 마켓 다중 선택 (초기값: 모든 마켓 선택)
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  // 초기 마켓 선택 (모든 마켓)
  useEffect(() => {
    if (allMarketsList.length > 0 && selectedMarkets.length === 0) {
      setSelectedMarkets(allMarketsList);
    }
  }, [allMarketsList]);

  // 선택 타입 확인
  const selectionType = selectedProducts.length > 0 ? 'product'
                      : selectedOptions.length > 0 ? 'option'
                      : null;

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
    // 필터의 날짜 범위로 모든 날짜 생성
    const allDatesInRange: string[] = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const current = new Date(start);

      while (current <= end) {
        const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        allDatesInRange.push(dateKey);
        current.setDate(current.getDate() + 1);
      }
    }

    // 날짜별 마켓별 금액 집계
    const dateMarketMap = new Map<string, Map<string, number>>();

    // 모든 날짜를 초기화 (금액 0)
    allDatesInRange.forEach(dateKey => {
      dateMarketMap.set(dateKey, new Map());
    });

    filteredOrders.forEach(order => {
      // 품목 필터링 (selectedProductForGraph가 있으면)
      if (selectedProductForGraph) {
        const category4 = optionNameToCategory4.get(order.optionName || '');
        if (category4 !== selectedProductForGraph) {
          return; // 선택된 품목이 아니면 스킵
        }
      }

      // 옵션상품 필터링 (selectedOptionForGraph가 있으면)
      if (selectedOptionForGraph) {
        if (order.optionName !== selectedOptionForGraph) {
          return; // 선택된 옵션상품이 아니면 스킵
        }
      }

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

    // 날짜 정렬 (allDatesInRange 사용)
    const sortedDates = allDatesInRange.length > 0 ? allDatesInRange : Array.from(dateMarketMap.keys()).sort();

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
  }, [filteredOrders, startDate, endDate, selectedProductForGraph, selectedOptionForGraph, optionNameToCategory4]);

  // 품목/옵션별 통계 그래프 데이터 (품목/옵션 × 마켓 조합)
  const productMarketStats = useMemo(() => {
    // 선택된 품목이나 옵션이 없으면 빈 데이터
    if (selectedProducts.length === 0 && selectedOptions.length === 0) {
      return { dates: [], lines: [] };
    }

    // 필터의 날짜 범위로 모든 날짜 생성
    const allDatesInRange: string[] = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const current = new Date(start);

      while (current <= end) {
        const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        allDatesInRange.push(dateKey);
        current.setDate(current.getDate() + 1);
      }
    }

    // 품목/옵션 × 마켓 조합별 데이터 생성
    const lines: Array<{
      productOrOption: string;
      market: string;
      color: string;
      dashStyle: string;
      data: Array<{ date: string; amount: number }>;
    }> = [];

    // 마켓별 색상
    const marketColors: Record<string, string> = {
      '스마트스토어': '#6366f1',
      '쿠팡': '#ef4444',
      '11번가': '#10b981',
      '옥션': '#f59e0b',
      '미지정': '#9ca3af'
    };

    // 선 스타일 (품목/옵션별)
    const dashStyles = ['solid', '4 4', '8 4', '2 2', '8 4 2 4'];

    // 선택된 품목들 처리
    selectedProducts.forEach((product, productIdx) => {
      selectedMarkets.forEach(market => {
        // 날짜별 금액 맵
        const dateAmountMap = new Map<string, number>();

        // 모든 날짜를 0으로 초기화
        allDatesInRange.forEach(date => {
          dateAmountMap.set(date, 0);
        });

        // 데이터 집계
        filteredOrders.forEach(order => {
          const category4 = optionNameToCategory4.get(order.optionName || '');
          if (category4 === product && order.sellerMarketName === market) {
            const orderDate = new Date(order.date);
            const koreaOrderDate = new Date(orderDate.getTime() + (9 * 60 * 60 * 1000));
            const dateKey = `${koreaOrderDate.getUTCFullYear()}-${String(koreaOrderDate.getUTCMonth() + 1).padStart(2, '0')}-${String(koreaOrderDate.getUTCDate()).padStart(2, '0')}`;

            if (dateAmountMap.has(dateKey)) {
              dateAmountMap.set(dateKey, (dateAmountMap.get(dateKey) || 0) + (order.supplyPrice || 0));
            }
          }
        });

        lines.push({
          productOrOption: product,
          market,
          color: marketColors[market] || '#9ca3af',
          dashStyle: dashStyles[productIdx % dashStyles.length],
          data: allDatesInRange.map(date => ({
            date,
            amount: dateAmountMap.get(date) || 0
          }))
        });
      });
    });

    // 선택된 옵션들 처리
    selectedOptions.forEach((option, optionIdx) => {
      selectedMarkets.forEach(market => {
        // 날짜별 금액 맵
        const dateAmountMap = new Map<string, number>();

        // 모든 날짜를 0으로 초기화
        allDatesInRange.forEach(date => {
          dateAmountMap.set(date, 0);
        });

        // 데이터 집계
        filteredOrders.forEach(order => {
          if (order.optionName === option && order.sellerMarketName === market) {
            const orderDate = new Date(order.date);
            const koreaOrderDate = new Date(orderDate.getTime() + (9 * 60 * 60 * 1000));
            const dateKey = `${koreaOrderDate.getUTCFullYear()}-${String(koreaOrderDate.getUTCMonth() + 1).padStart(2, '0')}-${String(koreaOrderDate.getUTCDate()).padStart(2, '0')}`;

            if (dateAmountMap.has(dateKey)) {
              dateAmountMap.set(dateKey, (dateAmountMap.get(dateKey) || 0) + (order.supplyPrice || 0));
            }
          }
        });

        lines.push({
          productOrOption: option,
          market,
          color: marketColors[market] || '#9ca3af',
          dashStyle: dashStyles[optionIdx % dashStyles.length],
          data: allDatesInRange.map(date => ({
            date,
            amount: dateAmountMap.get(date) || 0
          }))
        });
      });
    });

    return {
      dates: allDatesInRange,
      lines
    };
  }, [filteredOrders, startDate, endDate, selectedProducts, selectedOptions, selectedMarkets, optionNameToCategory4]);

  return (
    <>
      <style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes graphFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .graph-line {
          animation: graphFadeIn 0.6s ease-out;
        }

        .graph-point {
          animation: graphFadeIn 0.6s ease-out;
        }
      `}</style>
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
            flexDirection: 'column'
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
                  maxHeight: '580px',
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

                    // 단일 선택 (기존 방식)
                    const isSingleSelected = selectedCategory4 === item.name;

                    // 다중 선택 (새 방식)
                    const isMultiSelected = selectedProducts.includes(item.name);

                    // 옵션이 선택된 상태면 품목 비활성화
                    const isDisabled = selectionType === 'option';

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isDisabled) return;

                          setSelectedProducts(prev => {
                            if (prev.includes(item.name)) {
                              return prev.filter(p => p !== item.name);
                            } else {
                              // 최대 5개 제한
                              if (prev.length >= 5) {
                                alert('최대 5개까지만 선택할 수 있습니다.');
                                return prev;
                              }
                              return [...prev, item.name];
                            }
                          });

                          // 단일 선택 상태는 유지 (마켓별 통계용)
                          if (selectedCategory4 === item.name) {
                            setSelectedCategory4(null);
                            setSelectedProductForGraph(null);
                          } else {
                            setSelectedCategory4(item.name);
                            setSelectedProductForGraph(item.name);
                            setSelectedOptionForGraph(null);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '10px',
                          gap: '10px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          padding: '4px 8px',
                          marginLeft: '-8px',
                          borderRadius: '6px',
                          backgroundColor: isMultiSelected ? '#eef2ff' : (isSingleSelected ? '#f3f4f6' : 'transparent'),
                          transition: 'all 0.2s ease',
                          opacity: isDisabled ? 0.5 : 1,
                          border: isMultiSelected ? '2px solid #6366f1' : '2px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isDisabled && !isMultiSelected) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isDisabled) {
                            e.currentTarget.style.backgroundColor = isMultiSelected ? '#eef2ff' : (isSingleSelected ? '#f3f4f6' : 'transparent');
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
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              옵션상품 발주 TOP 10
            </h3>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              {optionTop10.length > 0 ? optionTop10.map((item, idx) => {
                // 단일 선택 (기존 방식)
                const isSingleSelected = selectedOptionForGraph === item.name;

                // 다중 선택 (새 방식)
                const isMultiSelected = selectedOptions.includes(item.name);

                // 품목이 선택된 상태면 옵션 비활성화
                const isDisabled = selectionType === 'product';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isDisabled) return;

                      setSelectedOptions(prev => {
                        if (prev.includes(item.name)) {
                          return prev.filter(o => o !== item.name);
                        } else {
                          // 최대 5개 제한
                          if (prev.length >= 5) {
                            alert('최대 5개까지만 선택할 수 있습니다.');
                            return prev;
                          }
                          return [...prev, item.name];
                        }
                      });

                      // 단일 선택 상태는 유지 (마켓별 통계용)
                      if (selectedOptionForGraph === item.name) {
                        setSelectedOptionForGraph(null);
                      } else {
                        setSelectedOptionForGraph(item.name);
                        setSelectedProductForGraph(null);
                      }
                    }}
                    style={{
                      marginBottom: '8px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      padding: '6px 8px',
                      marginLeft: '-8px',
                      marginRight: '-8px',
                      borderRadius: '6px',
                      backgroundColor: isMultiSelected ? '#eef2ff' : (isSingleSelected ? '#f3f4f6' : 'transparent'),
                      transition: 'all 0.2s ease',
                      opacity: isDisabled ? 0.5 : 1,
                      border: isMultiSelected ? '2px solid #6366f1' : '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled && !isMultiSelected) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = isMultiSelected ? '#eef2ff' : (isSingleSelected ? '#f3f4f6' : 'transparent');
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '3px',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        marginRight: '8px'
                      }}>
                        {idx + 1}. {item.name}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        flexShrink: 0
                      }}>
                        ₩{item.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-gray-200" style={{
                      height: '5px',
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
                );
              }) : (
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
            {/* 탭 네비게이션 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '0'
            }}>
              <button
                onClick={() => setGraphTab('market')}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: graphTab === 'market' ? '2px solid #6366f1' : '2px solid transparent',
                  color: graphTab === 'market' ? '#6366f1' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: graphTab === 'market' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '-2px'
                }}
                onMouseEnter={(e) => {
                  if (graphTab !== 'market') {
                    e.currentTarget.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (graphTab !== 'market') {
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                마켓별 통계
              </button>
              <button
                onClick={() => setGraphTab('product')}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: graphTab === 'product' ? '2px solid #6366f1' : '2px solid transparent',
                  color: graphTab === 'product' ? '#6366f1' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: graphTab === 'product' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '-2px'
                }}
                onMouseEnter={(e) => {
                  if (graphTab !== 'product') {
                    e.currentTarget.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (graphTab !== 'product') {
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                품목/옵션별 통계
              </button>
            </div>

            {/* 마켓별 통계 탭 */}
            {graphTab === 'market' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  마켓별 통계
                </h3>
                {(selectedProductForGraph || selectedOptionForGraph) && (
                  <span
                    onClick={() => {
                      setSelectedProductForGraph(null);
                      setSelectedOptionForGraph(null);
                    }}
                    style={{
                      fontSize: '11px',
                      color: '#6366f1',
                      backgroundColor: '#eef2ff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#eef2ff';
                    }}
                  >
                    {selectedProductForGraph ? `품목: ${selectedProductForGraph}` : `옵션: ${selectedOptionForGraph}`}
                    <span style={{ fontSize: '14px', marginLeft: '2px' }}>×</span>
                  </span>
                )}
              </div>
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
                <svg viewBox="0 0 1200 250" style={{
                  width: '100%',
                  height: '300px',
                  overflow: 'visible'
                }}>
                  {/* 각 마켓별 꺾은선 그래프 */}
                  {(() => {
                    // 데이터가 없으면 아무것도 렌더링하지 않음
                    if (marketDateStats.dates.length === 0 || marketDateStats.marketLines.length === 0) {
                      return null;
                    }

                    // 모든 금액 중 최대값 찾기 + 10%
                    const rawMaxAmount = Math.max(
                      ...marketDateStats.marketLines.flatMap(line =>
                        line.data.map(d => d.amount)
                      ),
                      1
                    );
                    const maxAmountWith10Percent = rawMaxAmount * 1.1; // 최대값에 10% 추가

                    // 최대값을 10,000 단위로 올림
                    const maxAmount = Math.ceil(maxAmountWith10Percent / 10000) * 10000;

                    const dateCount = marketDateStats.dates.length;
                    const divisor = dateCount > 1 ? dateCount - 1 : 1;

                    // Y축 눈금 값 계산 (5개 구간, 10,000 단위로 반올림)
                    const yAxisValues = [0, 1, 2, 3, 4].map(i => {
                      const value = maxAmount * (1 - i / 4); // 위에서부터 100%, 75%, 50%, 25%, 0%
                      return Math.round(value / 10000) * 10000;
                    });

                    // 그래프 영역: Y축 30~210 (180px 높이)
                    const graphTop = 30;
                    const graphBottom = 210;
                    const graphHeight = graphBottom - graphTop; // 180

                    return (
                      <>
                        {/* 가로 격자선과 Y축 레이블 */}
                        {[0, 1, 2, 3, 4].map(i => {
                          const yValue = yAxisValues[i];
                          // Y 좌표: maxAmount는 30, 0은 210
                          const y = graphTop + (i / 4) * graphHeight;

                          return (
                            <g key={`grid-${i}`}>
                              <line
                                x1="60"
                                y1={y}
                                x2="1180"
                                y2={y}
                                stroke="var(--color-border, #e5e7eb)"
                                strokeWidth="1"
                                opacity="0.5"
                                style={{
                                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                              <text
                                x="55"
                                y={y + 3}
                                textAnchor="end"
                                fontSize="10"
                                fill="var(--color-text-secondary, #6b7280)"
                                style={{
                                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              >
                                {yValue.toLocaleString()}
                              </text>
                            </g>
                          );
                        })}

                        {/* 마켓별 라인 */}
                        {marketDateStats.marketLines.map((line, lineIdx) => {
                      // 라인의 포인트 계산
                      const points = line.data.map((d, idx) => {
                        const x = 60 + (idx / divisor) * 1120; // 1180 - 60 = 1120
                        // Y축: maxAmount는 30(상단), 0은 210(하단)
                        const y = graphBottom - ((d.amount / maxAmount) * graphHeight);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <g key={`${line.market}-${lineIdx}`}>
                          {/* 선 */}
                          <polyline
                            points={points}
                            fill="none"
                            stroke={line.color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="graph-line"
                            style={{
                              opacity: 1
                            }}
                          />

                          {/* 점 */}
                          {line.data.map((d, idx) => {
                            const x = 60 + (idx / divisor) * 1120; // 1180 - 60 = 1120
                            const y = graphBottom - ((d.amount / maxAmount) * graphHeight);
                            return (
                              <g key={idx}>
                                {/* 호버 영역 확대 (투명) */}
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="8"
                                  fill="transparent"
                                  style={{ cursor: 'pointer' }}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltip({
                                      visible: true,
                                      x: rect.left + rect.width / 2,
                                      y: rect.top,
                                      date: d.date,
                                      market: line.market,
                                      amount: d.amount
                                    });
                                  }}
                                  onMouseLeave={() => setTooltip(null)}
                                />
                                {/* 실제 점 */}
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="3"
                                  fill={line.color}
                                  stroke="#fff"
                                  strokeWidth="1"
                                  style={{
                                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    pointerEvents: 'none'
                                  }}
                                />
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}
                      </>
                    );
                  })()}

                  {/* X축 레이블 (날짜) */}
                  {(() => {
                    if (marketDateStats.dates.length === 0) return null;

                    const totalDates = marketDateStats.dates.length;
                    const divisor = totalDates > 1 ? totalDates - 1 : 1;

                    // 30개 초과 시 최대 30개로 제한
                    let displayIndices: number[] = [];
                    if (totalDates <= 30) {
                      // 30개 이하면 모두 표시
                      displayIndices = Array.from({ length: totalDates }, (_, i) => i);
                    } else {
                      // 30개 초과면 30개로 균등 배분
                      const step = (totalDates - 1) / 29; // 29개 간격으로 30개 포인트
                      for (let i = 0; i < 30; i++) {
                        displayIndices.push(Math.round(i * step));
                      }
                    }

                    return displayIndices.map(idx => {
                      const date = marketDateStats.dates[idx];
                      const x = 60 + (idx / divisor) * 1120; // 1180 - 60 = 1120
                      const displayDate = date.substring(5); // MM-DD만 표시
                      return (
                        <text
                          key={idx}
                          x={x}
                          y="230"
                          textAnchor="middle"
                          fontSize="9"
                          fill="#6b7280"
                          style={{
                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          {displayDate}
                        </text>
                      );
                    });
                  })()}
                </svg>

                {/* 툴팁 */}
                {tooltip && tooltip.visible && (
                  <div
                    style={{
                      position: 'fixed',
                      left: `${tooltip.x}px`,
                      top: `${tooltip.y - 90}px`,
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(40, 40, 40, 0.98) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      zIndex: 1000,
                      pointerEvents: 'none',
                      minWidth: '120px',
                      animation: 'tooltipFadeIn 0.2s ease-out'
                    }}
                  >
                    {/* 화살표 */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '10px',
                        height: '10px',
                        background: 'rgba(35, 35, 35, 0.98)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderTop: 'none',
                        borderLeft: 'none',
                        transform: 'translateX(-50%) rotate(45deg)'
                      }}
                    />

                    {/* 마켓명 */}
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#fff',
                      marginBottom: '4px',
                      paddingBottom: '4px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {tooltip.market}
                    </div>

                    {/* 날짜 */}
                    <div style={{
                      fontSize: '9px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '4px'
                    }}>
                      {tooltip.date}
                    </div>

                    {/* 금액 */}
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#10b981'
                    }}>
                      {tooltip.amount.toLocaleString()}원
                    </div>
                  </div>
                )}

                {/* 범례 (클릭 가능) */}
                <div style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {marketDateStats.marketLines.map((line, idx) => {
                    const totalAmount = line.data.reduce((sum, d) => sum + d.amount, 0);
                    const isSelected = selectedMarkets.includes(line.market);

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedMarkets(prev => {
                            if (prev.includes(line.market)) {
                              // 이미 선택된 경우 제거 (최소 1개는 남겨야 함)
                              if (prev.length > 1) {
                                return prev.filter(m => m !== line.market);
                              }
                              return prev;
                            } else {
                              // 선택되지 않은 경우 추가
                              return [...prev, line.market];
                            }
                          });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          opacity: isSelected ? 1 : 0.4,
                          background: isSelected ? 'transparent' : '#f3f4f6',
                          transition: 'all 0.2s ease',
                          border: isSelected ? '2px solid transparent' : '2px solid #e5e7eb'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isSelected ? '#f9fafb' : '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isSelected ? 'transparent' : '#f3f4f6';
                        }}
                      >
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: line.color
                        }} />
                        <span style={{ fontWeight: isSelected ? '500' : '400' }}>
                          {line.market}
                        </span>
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
            )}

            {/* 품목/옵션별 통계 탭 */}
            {graphTab === 'product' && (
              <div>
                {productMarketStats.lines.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#9ca3af'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                      품목/옵션별 통계
                    </p>
                    <p style={{ fontSize: '14px' }}>
                      왼쪽 패널에서 품목 또는 옵션상품을 선택하면 마켓별 상세 통계가 표시됩니다.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* 선택 정보 표시 */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '16px',
                      flexWrap: 'wrap'
                    }}>
                      {selectedProducts.map((product, idx) => (
                        <span
                          key={`product-${idx}`}
                          style={{
                            fontSize: '11px',
                            color: '#6366f1',
                            backgroundColor: '#eef2ff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}
                        >
                          품목: {product}
                        </span>
                      ))}
                      {selectedOptions.map((option, idx) => (
                        <span
                          key={`option-${idx}`}
                          style={{
                            fontSize: '11px',
                            color: '#10b981',
                            backgroundColor: '#d1fae5',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}
                        >
                          옵션: {option}
                        </span>
                      ))}
                    </div>

                    {/* 그래프 */}
                    <svg viewBox="0 0 1200 250" style={{
                      width: '100%',
                      height: '300px',
                      overflow: 'visible'
                    }}>
                      {(() => {
                        if (productMarketStats.dates.length === 0 || productMarketStats.lines.length === 0) {
                          return null;
                        }

                        // 최대값 계산
                        const rawMaxAmount = Math.max(
                          ...productMarketStats.lines.flatMap(line => line.data.map(d => d.amount)),
                          1
                        );
                        const maxAmountWith10Percent = rawMaxAmount * 1.1;
                        const maxAmount = Math.ceil(maxAmountWith10Percent / 10000) * 10000;

                        const dateCount = productMarketStats.dates.length;
                        const divisor = dateCount > 1 ? dateCount - 1 : 1;

                        // Y축 눈금
                        const yAxisValues = [0, 1, 2, 3, 4].map(i => {
                          const value = maxAmount * (1 - i / 4);
                          return Math.round(value / 10000) * 10000;
                        });

                        const graphTop = 30;
                        const graphBottom = 210;
                        const graphHeight = graphBottom - graphTop;

                        return (
                          <>
                            {/* 가로 격자선과 Y축 레이블 */}
                            {[0, 1, 2, 3, 4].map(i => {
                              const yValue = yAxisValues[i];
                              const y = graphTop + (i / 4) * graphHeight;

                              return (
                                <g key={`grid-${i}`}>
                                  <line
                                    x1="60"
                                    y1={y}
                                    x2="1180"
                                    y2={y}
                                    stroke="var(--color-border, #e5e7eb)"
                                    strokeWidth="1"
                                    opacity="0.5"
                                  />
                                  <text
                                    x="55"
                                    y={y + 3}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="var(--color-text-secondary, #6b7280)"
                                  >
                                    {yValue.toLocaleString()}
                                  </text>
                                </g>
                              );
                            })}

                            {/* 조합별 라인 */}
                            {productMarketStats.lines.map((line, lineIdx) => {
                              const points = line.data.map((d, idx) => {
                                const x = 60 + (idx / divisor) * 1120;
                                const y = graphBottom - ((d.amount / maxAmount) * graphHeight);
                                return `${x},${y}`;
                              }).join(' ');

                              return (
                                <g key={lineIdx}>
                                  <polyline
                                    points={points}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth="2"
                                    strokeDasharray={line.dashStyle === 'solid' ? 'none' : line.dashStyle}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  {line.data.map((d, idx) => {
                                    const x = 60 + (idx / divisor) * 1120;
                                    const y = graphBottom - ((d.amount / maxAmount) * graphHeight);
                                    return (
                                      <circle
                                        key={idx}
                                        cx={x}
                                        cy={y}
                                        r="3"
                                        fill={line.color}
                                        stroke="#fff"
                                        strokeWidth="1"
                                      />
                                    );
                                  })}
                                </g>
                              );
                            })}

                            {/* X축 날짜 */}
                            {(() => {
                              const totalDates = productMarketStats.dates.length;
                              let displayIndices: number[] = [];
                              if (totalDates <= 30) {
                                displayIndices = Array.from({ length: totalDates }, (_, i) => i);
                              } else {
                                const step = (totalDates - 1) / 29;
                                for (let i = 0; i < 30; i++) {
                                  displayIndices.push(Math.round(i * step));
                                }
                              }

                              return displayIndices.map(idx => {
                                const date = productMarketStats.dates[idx];
                                const x = 60 + (idx / divisor) * 1120;
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
                              });
                            })()}
                          </>
                        );
                      })()}
                    </svg>

                    {/* 하단 범례 (마켓 - 색상) + 우측 범례 (품목/옵션 - 선 스타일) */}
                    <div style={{
                      display: 'flex',
                      gap: '24px',
                      marginTop: '16px',
                      flexWrap: 'wrap'
                    }}>
                      {/* 마켓 범례 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#6b7280' }}>
                          마켓 (색상)
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          {Array.from(new Set(productMarketStats.lines.map(l => l.market))).map((market, idx) => {
                            const line = productMarketStats.lines.find(l => l.market === market);
                            return (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px'
                              }}>
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  background: line?.color
                                }} />
                                <span>{market}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 품목/옵션 범례 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#6b7280' }}>
                          품목/옵션 (선 스타일)
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {Array.from(new Set(productMarketStats.lines.map(l => l.productOrOption))).map((item, idx) => {
                            const line = productMarketStats.lines.find(l => l.productOrOption === item);
                            return (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px'
                              }}>
                                <svg width="30" height="12">
                                  <line
                                    x1="0"
                                    y1="6"
                                    x2="30"
                                    y2="6"
                                    stroke="#374151"
                                    strokeWidth="2"
                                    strokeDasharray={line?.dashStyle === 'solid' ? 'none' : line?.dashStyle}
                                  />
                                </svg>
                                <span>{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
    </>
  );
}
