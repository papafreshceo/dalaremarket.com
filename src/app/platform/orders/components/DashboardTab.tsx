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
  // 부드러운 곡선 경로 생성 함수 (Monotone Cubic Interpolation)
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }

    // 각 구간의 기울기 계산
    const n = points.length;
    const slopes: number[] = [];
    const dxs: number[] = [];
    const dys: number[] = [];

    // 구간별 delta 계산
    for (let i = 0; i < n - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      dxs.push(dx);
      dys.push(dy);
      slopes.push(dy / dx);
    }

    // 각 점에서의 접선 기울기 계산 (Fritsch-Carlson method)
    const tangents: number[] = [slopes[0]];
    for (let i = 1; i < n - 1; i++) {
      const m = slopes[i - 1];
      const mNext = slopes[i];
      if (m * mNext <= 0) {
        tangents.push(0);
      } else {
        const dx = dxs[i - 1];
        const dxNext = dxs[i];
        const common = dx + dxNext;
        tangents.push(3 * common / ((common + dxNext) / m + (common + dx) / mNext));
      }
    }
    tangents.push(slopes[n - 2]);

    // 베지어 곡선으로 경로 생성
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < n - 1; i++) {
      const dx = dxs[i];
      const cp1x = points[i].x + dx / 3;
      const cp1y = points[i].y + tangents[i] * dx / 3;
      const cp2x = points[i + 1].x - dx / 3;
      const cp2y = points[i + 1].y - tangents[i + 1] * dx / 3;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i + 1].x},${points[i + 1].y}`;
    }

    return path;
  };

  // --- Time helpers: DB(UTC) → KST(UTC+9)로 집계 ---
  const KST_OFFSET_MIN = 9 * 60;

  function fromDbUTC(v: string | Date | null | undefined): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;
    const s = String(v);
    // 'Z'나 '+HH:MM' 오프셋이 있으면 그대로 파싱, 없으면 UTC로 간주해 'Z' 추가
    return new Date(/[zZ]|[+\-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z');
  }

  function toKst(d: Date) {
    return new Date(d.getTime() + KST_OFFSET_MIN * 60 * 1000);
  }

  function ymdKst(d: Date) {
    const k = toKst(d);
    const y = k.getUTCFullYear();
    const m = String(k.getUTCMonth() + 1).padStart(2, '0');
    const da = String(k.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${da}`; // YYYY-MM-DD
  }

  function isSameYmdKst(a: Date, b: Date) {
    return ymdKst(a) === ymdKst(b);
  }

  function betweenYmdKst(target: Date, startYmd: string, endYmd: string) {
    const t = ymdKst(target);
    return t >= startYmd && t <= endYmd; // 문자열 비교로 안전
  }

  // 집계 기준 필드(원하시는 걸로 통일: registeredAt/confirmedAt/shippedDate 등)
  const BASE_FIELD: keyof Order = 'registeredAt';
  const getBaseDate = (o: Order) => fromDbUTC(o[BASE_FIELD] as any);

  const [hoveredBadge, setHoveredBadge] = useState<{ type: string; amount: number; position: { x: number; y: number } } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | null>(null);

  // 품목/옵션별 통계 상태
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedProductMarkets, setSelectedProductMarkets] = useState<string[]>([]);
  const [selectedOptionMarkets, setSelectedOptionMarkets] = useState<string[]>([]);

  // 그래프 툴팁 상태
  const [tooltip, setTooltip] = useState<{x: number, y: number, item: string, market: string, date: string, amount: number} | null>(null);

  // 현재 날짜 정보 (UI 표시에만 사용)
  const now = useMemo(() => new Date(), []);
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);

  // 날짜 포맷(KST 기준)
  const formatYmdKst = (date: Date) => ymdKst(date);

  // 날짜 필터 상태 (기본값: 최근 7일, KST 기준)
  const [startDate, setStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return formatYmdKst(start);
  });
  const [endDate, setEndDate] = useState(() => formatYmdKst(new Date()));

  // 이번 달 첫날과 마지막 날
  const firstDayOfMonth = useMemo(() => new Date(currentYear, currentMonth - 1, 1), [currentYear, currentMonth]);
  const lastDayOfMonth = useMemo(() => new Date(currentYear, currentMonth, 0), [currentYear, currentMonth]);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 전월 마지막 날짜
  const prevMonthLastDay = useMemo(() => new Date(currentYear, currentMonth - 1, 0).getDate(), [currentYear, currentMonth]);
  const prevMonth = useMemo(() => (currentMonth === 1 ? 12 : currentMonth - 1), [currentMonth]);

  // 다음달 첫 날짜 이후 필요한 칸 수
  const totalCells = firstDayOfWeek + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonth = useMemo(() => (currentMonth === 12 ? 1 : currentMonth + 1), [currentMonth]);

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
  const getHoliday = (month: number, day: number) => holidays[`${month}-${day}`];

  // 이전/다음 달
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 날짜 빠른 선택
  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    setStartDate(formatYmdKst(start));
    setEndDate(formatYmdKst(end));
  };
  const handleToday = () => {
    const t = new Date();
    setStartDate(formatYmdKst(t));
    setEndDate(formatYmdKst(t));
  };
  const handleYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setStartDate(formatYmdKst(y));
    setEndDate(formatYmdKst(y));
  };
  const handleThisYear = () => {
    const t = new Date();
    const year = toKst(t).getUTCFullYear();
    setStartDate(`${year}-01-01`);
    setEndDate(formatYmdKst(t));
  };

  // 날짜별 주문 집계 (발주서확정일 기준) - UTC→KST
  const ordersByDate = useMemo(() => {
    const dateMap: Record<
      number,
      {
        confirmedCount: number;
        shippedCount: number;
        cancelRequestedCount: number;
        confirmedAmount: number;
        shippedAmount: number;
        cancelRequestedAmount: number;
      }
    > = {};

    orders.forEach(order => {
      if (order.confirmedAt) {
        const c = fromDbUTC(order.confirmedAt);
        if (!c) return;
        const ck = toKst(c);
        if (ck.getUTCFullYear() === currentYear && ck.getUTCMonth() + 1 === currentMonth) {
          const day = ck.getUTCDate();
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

          if (order.shippedDate) {
            dateMap[day].shippedCount++;
            dateMap[day].shippedAmount += (order as any).settlement_amount || 0;
          }

          if (order.status === 'cancelRequested') {
            dateMap[day].cancelRequestedCount++;
            dateMap[day].cancelRequestedAmount += (order as any).settlement_amount || 0;
          }
        }
      }
    });

    return dateMap;
  }, [orders, currentYear, currentMonth]);

  // 이번 달 통계 (KST + BASE_FIELD, 금액 = supplyPrice)
  const thisMonthStats = useMemo(() => {
    let totalAmount = 0;
    let totalCount = 0;

    orders.forEach(order => {
      const b = getBaseDate(order);
      if (!b) return;
      const k = toKst(b);
      if (k.getUTCFullYear() === currentYear && k.getUTCMonth() + 1 === currentMonth) {
        totalAmount += order.supplyPrice || 0;
        totalCount++;
      }
    });

    return { totalAmount, totalCount, avgAmount: totalCount > 0 ? totalAmount / totalCount : 0 };
  }, [orders, currentYear, currentMonth]);

  // 어제 통계 (KST + BASE_FIELD, 금액 = supplyPrice)
  const yesterdayStats = useMemo(() => {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);

    let totalAmount = 0;
    let totalCount = 0;

    orders.forEach(order => {
      const b = getBaseDate(order);
      if (!b) return;
      if (isSameYmdKst(b, y)) {
        totalAmount += order.supplyPrice || 0;
        totalCount++;
      }
    });

    return { totalAmount, totalCount };
  }, [orders, now]);

  // 최근 7일 통계 (KST + BASE_FIELD)
  const last7DaysStats = useMemo(() => {
    const stats: { day: string; date: string; value: number; amount: number; count: number }[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      let amount = 0;
      let count = 0;

      orders.forEach(o => {
        const base = getBaseDate(o);
        if (!base) return;
        if (isSameYmdKst(base, d)) {
          amount += o.supplyPrice || 0;
          count += 1;
        }
      });

      const k = toKst(d);
      stats.push({
        day: dayNames[k.getUTCDay()],
        date: `${k.getUTCMonth() + 1}/${k.getUTCDate()}`,
        value: 0,
        amount,
        count
      });
    }

    const maxAmount = Math.max(...stats.map(s => s.amount), 1);
    stats.forEach(s => {
      s.value = (s.amount / maxAmount) * 100;
    });

    return stats;
  }, [orders]);

  // 월별 발주 추이 (최근 7개월, KST + BASE_FIELD)
  const monthlyStats = useMemo(() => {
    const stats: { month: string; value: number; amount: number; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const monthStart = new Date(currentYear, currentMonth - 1 - i, 1);
      const ky = toKst(monthStart).getUTCFullYear();
      const km = toKst(monthStart).getUTCMonth();

      let amount = 0;
      let count = 0;

      orders.forEach(o => {
        const b = getBaseDate(o);
        if (!b) return;
        const k = toKst(b);
        if (k.getUTCFullYear() === ky && k.getUTCMonth() === km) {
          amount += o.supplyPrice || 0;
          count += 1;
        }
      });

      stats.push({
        month: `${km + 1}월`,
        value: 0,
        amount,
        count
      });
    }

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

  // 날짜/상태로 필터링 (KST + BASE_FIELD)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (startDate && endDate) {
        const base = getBaseDate(order);
        if (!base || !betweenYmdKst(base, startDate, endDate)) return false;
      }
      if (selectedStatus && order.status !== selectedStatus) return false;
      return true;
    });
  }, [orders, startDate, endDate, selectedStatus]);

  // 옵션상품 TOP 10 (선택된 품목 반영)
  const optionTop10 = useMemo(() => {
    const optionMap: Record<string, number> = {};

    filteredOrders.forEach(order => {
      const optionName = order.optionName || '미지정';

      if (selectedCategory4) {
        const category4 = optionNameToCategory4.get(optionName);
        if (category4 !== selectedCategory4) {
          return;
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
      // 1) 옵션명별 금액 집계 (필터링된 주문 사용)
      const optionMap: Record<string, number> = {};
      filteredOrders.forEach(order => {
        const optionName = order.optionName || '미지정';
        if (!optionMap[optionName]) {
          optionMap[optionName] = 0;
        }
        optionMap[optionName] += order.supplyPrice || 0;
      });

      // 2) option_products에서 category 조회
      const uniqueOptions = Object.keys(optionMap).filter(opt => opt !== '미지정');

      if (uniqueOptions.length === 0) {
        setProductTop10([]);
        setAllProducts([]);
        setOptionNameToCategory4(new Map());
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
        setAllProducts([]);
        setOptionNameToCategory4(new Map());
        return;
      }

      // 3) category별 재집계 + 매핑 저장
      const categoryMap: Record<string, { category3: string; category4: string; amount: number }> = {};
      const nameToCategory4Map = new Map<string, string>();

      optionProducts?.forEach((product: any) => {
        const category3 = product.category_3 || '';
        const category4 = product.category_4 || '미지정';
        const key = `${category3}|${category4}`;
        const amount = optionMap[product.option_name] || 0;

        nameToCategory4Map.set(product.option_name, category4);

        if (!categoryMap[key]) {
          categoryMap[key] = { category3, category4, amount: 0 };
        }
        categoryMap[key].amount += amount;
      });

      setOptionNameToCategory4(nameToCategory4Map);

      // 미지정 옵션 포함
      if (optionMap['미지정']) {
        const key = '|미지정';
        if (!categoryMap[key]) {
          categoryMap[key] = { category3: '', category4: '미지정', amount: 0 };
        }
        categoryMap[key].amount += optionMap['미지정'];
      }

      const sorted = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
      const totalAmount = sorted.reduce((sum, item) => sum + item.amount, 0);

      const allResult = sorted.map(item => ({
        name: item.category4,
        category3: item.category3,
        amount: item.amount,
        percent: totalAmount ? (item.amount / totalAmount) * 100 : 0
      }));

      const top10Items = sorted.slice(0, 10);
      const othersItems = sorted.slice(10);

      let chartResult = top10Items.map(item => ({
        name: item.category4,
        category3: item.category3,
        amount: item.amount,
        percent: totalAmount ? (item.amount / totalAmount) * 100 : 0
      }));

      if (othersItems.length > 0) {
        const othersAmount = othersItems.reduce((sum, item) => sum + item.amount, 0);
        chartResult.push({
          name: '기타',
          category3: '',
          amount: othersAmount,
          percent: totalAmount ? (othersAmount / totalAmount) * 100 : 0
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
      const filtered = orders.filter(o => o.status === status);
      const count = filtered.length;
      const amount = filtered.reduce((sum, order) => sum + (order.supplyPrice || 0), 0);
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

  // 마켓별 날짜별 통계 (seller_market_name 기준, KST + BASE_FIELD, 필터링된 주문 사용)
  const marketDateStats = useMemo(() => {
    const dateMarketMap = new Map<string, Map<string, number>>();

    filteredOrders.forEach(order => {
      const b = getBaseDate(order);
      if (!b) return;
      const dateKey = ymdKst(b);
      const marketName = order.sellerMarketName || '미지정';

      if (!dateMarketMap.has(dateKey)) dateMarketMap.set(dateKey, new Map());
      const marketMap = dateMarketMap.get(dateKey)!;
      marketMap.set(marketName, (marketMap.get(marketName) || 0) + (order.supplyPrice || 0));
    });

    // startDate부터 endDate까지 모든 날짜 생성
    const allDates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(formatYmdKst(d));
    }

    // 30일 초과 시 30개로 샘플링 (시작일과 종료일 반드시 포함)
    let displayDates = allDates;
    if (allDates.length > 30) {
      const sampledDates = [allDates[0]]; // 시작일 추가

      // 중간 날짜들 균등 샘플링 (28개)
      const middleCount = 28;
      for (let i = 1; i <= middleCount; i++) {
        const index = Math.floor((i * (allDates.length - 1)) / (middleCount + 1));
        if (index > 0 && index < allDates.length - 1 && !sampledDates.includes(allDates[index])) {
          sampledDates.push(allDates[index]);
        }
      }

      sampledDates.push(allDates[allDates.length - 1]); // 종료일 추가
      displayDates = sampledDates;
    }

    const sortedDates = displayDates;

    const allMarkets = new Set<string>();
    filteredOrders.forEach(order => {
      allMarkets.add(order.sellerMarketName || '미지정');
    });

    const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    const marketLines = Array.from(allMarkets).map((market, idx) => ({
      market,
      color: colors[idx % colors.length],
      data: sortedDates.map(date => ({
        date,
        amount: dateMarketMap.get(date)?.get(market) || 0
      }))
    }));

    marketLines.sort((a, b) => {
      const totalA = a.data.reduce((s, d) => s + d.amount, 0);
      const totalB = b.data.reduce((s, d) => s + d.amount, 0);
      return totalB - totalA;
    });

    let finalMarketLines = marketLines.slice(0, 10);

    if (marketLines.length > 10) {
      const othersLines = marketLines.slice(10);
      const othersData = sortedDates.map(date => {
        const totalAmount = othersLines.reduce((sum, line) => {
          const dateData = line.data.find(d => d.date === date);
          return sum + (dateData?.amount || 0);
        }, 0);
        return { date, amount: totalAmount };
      });

      finalMarketLines.push({
        market: `기타 (${othersLines.length}개)`,
        color: '#9ca3af',
        data: othersData
      });
    }

    return {
      dates: sortedDates,
      marketLines: finalMarketLines,
      totalMarkets: marketLines.length
    };
  }, [filteredOrders, startDate, endDate]);

  // selectedMarkets 초기화 (마켓 목록 변경 시)
  useEffect(() => {
    const allMarkets = Array.from(new Set(filteredOrders.map(o => o.sellerMarketName || '미지정')));
    if (selectedProductMarkets.length === 0) {
      setSelectedProductMarkets(allMarkets);
    }
    if (selectedOptionMarkets.length === 0) {
      setSelectedOptionMarkets(allMarkets);
    }
  }, [filteredOrders]);

  // 품목별 통계 그래프 데이터
  const productStats = useMemo(() => {
    const selectedItems = selectedProducts;
    const itemType = 'product';

    if (selectedItems.length === 0 || selectedProductMarkets.length === 0) {
      return { dates: [], lines: [] };
    }

    // 날짜별 데이터 맵 생성
    const dateItemMarketMap = new Map<string, Map<string, Map<string, number>>>();

    filteredOrders.forEach(order => {
      const b = getBaseDate(order);
      if (!b) return;
      const dateKey = ymdKst(b);
      const marketName = order.sellerMarketName || '미지정';

      // 선택된 마켓만 처리
      if (!selectedProductMarkets.includes(marketName)) return;

      // optionName으로 category4 조회
      const optionName = order.optionName || '';
      const itemName = optionNameToCategory4.get(optionName) || '미지정';

      // 선택된 품목/옵션만 처리
      if (!selectedItems.includes(itemName)) return;

      if (!dateItemMarketMap.has(dateKey)) {
        dateItemMarketMap.set(dateKey, new Map());
      }
      const itemMap = dateItemMarketMap.get(dateKey)!;

      if (!itemMap.has(itemName)) {
        itemMap.set(itemName, new Map());
      }
      const marketMap = itemMap.get(itemName)!;

      marketMap.set(marketName, (marketMap.get(marketName) || 0) + (order.supplyPrice || 0));
    });

    // startDate부터 endDate까지 모든 날짜 생성
    const allDates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(formatYmdKst(d));
    }

    // 30일 초과 시 30개로 샘플링 (시작일과 종료일 반드시 포함)
    let displayDates = allDates;
    if (allDates.length > 30) {
      const sampledDates = [allDates[0]]; // 시작일 추가

      // 중간 날짜들 균등 샘플링 (28개)
      const middleCount = 28;
      for (let i = 1; i <= middleCount; i++) {
        const index = Math.floor((i * (allDates.length - 1)) / (middleCount + 1));
        if (index > 0 && index < allDates.length - 1 && !sampledDates.includes(allDates[index])) {
          sampledDates.push(allDates[index]);
        }
      }

      sampledDates.push(allDates[allDates.length - 1]); // 종료일 추가
      displayDates = sampledDates;
    }

    const sortedDates = displayDates;

    // 선 스타일 정의
    const dashStyles = ['0', '4 4', '8 4', '2 2', '8 4 2 4'];
    const marketColors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // 품목/옵션 × 마켓 조합으로 선 생성
    const lines: Array<{
      label: string;
      item: string;
      market: string;
      color: string;
      dashStyle: string;
      data: Array<{ date: string; amount: number }>;
    }> = [];

    // 전체 마켓 목록 생성 (색상 일관성 유지용)
    const allMarketsSet = new Set<string>();
    filteredOrders.forEach(order => {
      const marketName = order.sellerMarketName || '미지정';
      allMarketsSet.add(marketName);
    });
    const allMarketsList = Array.from(allMarketsSet).sort();

    selectedItems.forEach((item, itemIdx) => {
      selectedProductMarkets.forEach((market) => {
        const marketIdx = allMarketsList.indexOf(market);
        lines.push({
          label: `${item} - ${market}`,
          item,
          market,
          color: marketColors[marketIdx % marketColors.length],
          dashStyle: dashStyles[itemIdx % dashStyles.length],
          data: sortedDates.map(date => ({
            date,
            amount: dateItemMarketMap.get(date)?.get(item)?.get(market) || 0
          }))
        });
      });
    });

    return {
      dates: sortedDates,
      lines
    };
  }, [filteredOrders, selectedProducts, selectedProductMarkets, startDate, endDate, optionNameToCategory4]);

  // 옵션별 통계 그래프 데이터
  const optionStats = useMemo(() => {
    const selectedItems = selectedOptions;

    if (selectedItems.length === 0 || selectedOptionMarkets.length === 0) {
      return { dates: [], lines: [] };
    }

    // 날짜별 데이터 맵 생성
    const dateItemMarketMap = new Map<string, Map<string, Map<string, number>>>();

    filteredOrders.forEach(order => {
      const b = getBaseDate(order);
      if (!b) return;
      const dateKey = ymdKst(b);
      const marketName = order.sellerMarketName || '미지정';

      // 선택된 마켓만 처리
      if (!selectedOptionMarkets.includes(marketName)) return;

      // optionName 사용
      const itemName = order.optionName || '미지정';

      // 선택된 옵션만 처리
      if (!selectedItems.includes(itemName)) return;

      if (!dateItemMarketMap.has(dateKey)) {
        dateItemMarketMap.set(dateKey, new Map());
      }
      const itemMap = dateItemMarketMap.get(dateKey)!;

      if (!itemMap.has(itemName)) {
        itemMap.set(itemName, new Map());
      }
      const marketMap = itemMap.get(itemName)!;

      marketMap.set(marketName, (marketMap.get(marketName) || 0) + (order.supplyPrice || 0));
    });

    // startDate부터 endDate까지 모든 날짜 생성
    const allDates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(formatYmdKst(d));
    }

    // 30일 초과 시 30개로 샘플링 (시작일과 종료일 반드시 포함)
    let displayDates = allDates;
    if (allDates.length > 30) {
      const sampledDates = [allDates[0]]; // 시작일 추가

      // 중간 날짜들 균등 샘플링 (28개)
      const middleCount = 28;
      for (let i = 1; i <= middleCount; i++) {
        const index = Math.floor((i * (allDates.length - 1)) / (middleCount + 1));
        if (index > 0 && index < allDates.length - 1 && !sampledDates.includes(allDates[index])) {
          sampledDates.push(allDates[index]);
        }
      }

      sampledDates.push(allDates[allDates.length - 1]); // 종료일 추가
      displayDates = sampledDates;
    }

    const sortedDates = displayDates;

    // 선 스타일 정의
    const dashStyles = ['0', '4 4', '8 4', '2 2', '8 4 2 4'];
    const marketColors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // 옵션 × 마켓 조합으로 선 생성
    const lines: Array<{
      label: string;
      item: string;
      market: string;
      color: string;
      dashStyle: string;
      data: Array<{ date: string; amount: number }>;
    }> = [];

    // 전체 마켓 목록 생성 (색상 일관성 유지용)
    const allMarketsSet = new Set<string>();
    filteredOrders.forEach(order => {
      const marketName = order.sellerMarketName || '미지정';
      allMarketsSet.add(marketName);
    });
    const allMarketsList = Array.from(allMarketsSet).sort();

    selectedItems.forEach((item, itemIdx) => {
      selectedOptionMarkets.forEach((market) => {
        const marketIdx = allMarketsList.indexOf(market);
        lines.push({
          label: `${item} - ${market}`,
          item,
          market,
          color: marketColors[marketIdx % marketColors.length],
          dashStyle: dashStyles[itemIdx % dashStyles.length],
          data: sortedDates.map(date => ({
            date,
            amount: dateItemMarketMap.get(date)?.get(item)?.get(market) || 0
          }))
        });
      });
    });

    return {
      dates: sortedDates,
      lines
    };
  }, [filteredOrders, selectedOptions, selectedOptionMarkets, startDate, endDate]);

  // 모든 마켓 목록 추출 (범례 표시용)
  const allMarkets = useMemo(() => {
    const markets = new Set<string>();
    filteredOrders.forEach(order => {
      const marketName = order.sellerMarketName || '미지정';
      markets.add(marketName);
    });
    return Array.from(markets).sort();
  }, [filteredOrders]);

  // 마켓 색상 매핑
  const marketColors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const marketColorMap = useMemo(() => {
    const map = new Map<string, string>();
    allMarkets.forEach((market, idx) => {
      map.set(market, marketColors[idx % marketColors.length]);
    });
    return map;
  }, [allMarkets]);

  // 발주 캘린더 JSX
  const calendarJSX = (
      <div
        className="card"
        style={{
          borderRadius: '12px',
          padding: '20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <h3
            style={{
              fontSize: '12px',
              fontWeight: '600',
              margin: 0
            }}
          >
            발주캘린더
          </h3>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
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
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '500',
                minWidth: '100px',
                textAlign: 'center'
              }}
            >
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
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '12px'
          }}
        >
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div
              key={idx}
              className={idx === 0 ? 'text-danger' : idx === 6 ? 'text-primary' : ''}
              style={{
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: '600',
                padding: '4px 0'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}
        >
          {/* 이전 달 날짜 */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => {
            const prevDay = prevMonthLastDay - firstDayOfWeek + i + 1;
            return (
              <div
                key={`prev-${i}`}
                style={{
                  padding: '4px 4px',
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    color: '#999',
                    fontWeight: '400'
                  }}
                >
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
              <div
                key={day}
                className={hasOrder && !isToday ? 'bg-white' : ''}
                style={{
                  position: 'relative',
                  background: isToday ? 'rgba(37, 99, 235, 0.1)' : hasOrder ? undefined : 'transparent',
                  border: isToday ? '2px solid' : hasOrder ? '1px solid' : 'none',
                  borderColor: isToday ? '#2563eb' : hasOrder ? '#dee2e6' : undefined,
                  borderRadius: '8px',
                  padding: '4px 4px',
                  minHeight: '80px',
                  cursor: hasOrder ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  willChange: 'transform'
                }}
                onMouseEnter={e => {
                  if (hasOrder && !isToday) {
                    e.currentTarget.style.background = 'rgba(219, 234, 254, 0.8)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={e => {
                  if (hasOrder && !isToday) {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span
                    className={dayOfWeek === 0 || isHoliday ? 'text-danger' : dayOfWeek === 6 || isToday ? 'text-primary' : ''}
                    style={{
                      fontSize: '11px',
                      fontWeight: isToday ? '600' : '500'
                    }}
                  >
                    {day}
                  </span>
                  {isHoliday && (
                    <span
                      style={{
                        fontSize: '7px',
                        color: '#ef4444',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {holiday}
                    </span>
                  )}
                </div>

                {hasOrder && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '3px',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}
                  >
                    {confirmedCount > 0 && (
                      <div
                        onMouseEnter={e => {
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
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
                          fontSize: '9px',
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
                        onMouseEnter={e => {
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
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
                          fontSize: '9px',
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
                        onMouseEnter={e => {
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
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
                          fontSize: '9px',
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
                  <div
                    className="bg-primary"
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      color: '#ffffff',
                      borderRadius: '3px',
                      padding: '1px 4px',
                      fontSize: '9px',
                      fontWeight: '600'
                    }}
                  >
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
              <div
                key={`next-${i}`}
                style={{
                  padding: '4px 4px',
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    color: '#999',
                    fontWeight: '400'
                  }}
                >
                  {nextMonth}/{nextDay}
                </span>
              </div>
            );
          })}
        </div>

        {/* 캘린더 범례 */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(222, 226, 230, 0.5)',
            fontSize: '9px',
            justifyContent: 'flex-start'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
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
              }}
            >
              N
            </div>
            <span style={{ color: '#7c3aed', fontWeight: '500' }}>발주확정</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
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
              }}
            >
              N
            </div>
            <span style={{ color: '#10b981', fontWeight: '500' }}>발송완료</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
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
              }}
            >
              N
            </div>
            <span style={{ color: '#f87171', fontWeight: '500' }}>취소요청</span>
          </div>
        </div>
      </div>
  );

  return (
    <div>
      {/* 차트 영역 - Flex 레이아웃 */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start'
        }}
      >
        {/* 첫 번째 열: 날짜 필터 & 통계 카드 - Sticky */}
        <div
          style={{
            width: '240px',
            flexShrink: 0,
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 96px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* 날짜 필터 */}
          <div
            className="card"
            style={{
              borderRadius: '8px',
              padding: '8px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* 날짜 입력 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px'
                }}
              >
                <DatePicker value={startDate} onChange={date => setStartDate(date)} placeholder="시작일" maxDate={endDate || undefined} />
                <span style={{ color: '#6b7280', fontSize: '12px' }}>~</span>
                <DatePicker value={endDate} onChange={date => setEndDate(date)} placeholder="종료일" minDate={startDate || undefined} />
              </div>

              {/* 빠른 선택 버튼 */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  flexWrap: 'wrap'
                }}
              >
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
          {statsData
            .filter(stat => !['registered', 'preparing', 'cancelRequested'].includes(stat.status))
            .map(stat => {
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
                  <div
                    style={{
                      fontSize: '11px',
                      marginBottom: '3px',
                      color: config.color,
                      fontWeight: '500'
                    }}
                  >
                    {config.label}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: '4px'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: '700',
                        color: config.color
                      }}
                    >
                      {stat.count}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>₩</span>
                      <span>{stat.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* 두 번째/세 번째 열 */}
        <div
          style={{
            width: '1498px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {/* 첫 번째 행: 발주 TOP 10 + 옵션상품 발주 TOP 10 + 발주 캘린더 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '550px 300px 600px',
              gap: '24px'
            }}
          >
            {/* 품목 발주 TOP 10 */}
            <div
              className="card"
              style={{
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '500px'
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}
              >
                발주 TOP 10
              </h3>
              {productTop10.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '32px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1
                  }}
                >
                  {/* 원형 그래프 */}
                  <div
                    style={{
                      width: isMobile ? '300px' : '240px',
                      height: isMobile ? '300px' : '240px',
                      position: 'relative',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      viewBox="0 0 200 200"
                      style={{
                        transform: 'rotate(-90deg)',
                        filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
                      }}
                    >
                      {/* 외곽 테두리 원 */}
                      <circle cx="100" cy="100" r="92" fill="none" stroke="#f3f4f6" strokeWidth="2" />

                      {(() => {
                        let cumulativePercent = 0;
                        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'];
                        const radius = 62;
                        const circumference = 2 * Math.PI * radius;
                        const totalAmount = productTop10.reduce((sum, i) => sum + i.amount, 0);

                        const segments = productTop10.map((item, idx) => {
                          const percent = totalAmount ? item.amount / totalAmount : 0;
                          const strokeDasharray = `${percent * circumference} ${circumference}`;
                          const strokeDashoffset = -cumulativePercent * circumference;

                          const startAngle = cumulativePercent * 2 * Math.PI;
                          const midAngle = startAngle + (percent * 2 * Math.PI) / 2;
                          const endAngle = startAngle + percent * 2 * Math.PI;

                          const textRadius = 62;
                          const textX = 100 + textRadius * Math.cos(midAngle);
                          const textY = 100 + textRadius * Math.sin(midAngle);

                          const innerRadius = 32;
                          const outerRadius = 92;

                          const endX1 = 100 + innerRadius * Math.cos(endAngle);
                          const endY1 = 100 + innerRadius * Math.sin(endAngle);
                          const endX2 = 100 + outerRadius * Math.cos(endAngle);
                          const endY2 = 100 + outerRadius * Math.sin(endAngle);

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
                            divider:
                              idx < productTop10.length - 1 ? (
                                <line
                                  key={`divider-${idx}`}
                                  x1={endX1}
                                  y1={endY1}
                                  x2={endX2}
                                  y2={endY2}
                                  stroke="rgba(255, 255, 255, 0.6)"
                                  strokeWidth="0.8"
                                  style={{ pointerEvents: 'none' }}
                                />
                              ) : null,
                            text:
                              percent > 0.05 ? (
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

                        const firstDivider = (() => {
                          const angle = 0;
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
                              style={{ pointerEvents: 'none' }}
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

                      {/* 중앙 흰색 원 */}
                      <defs>
                        <radialGradient id="centerGradient">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="100%" stopColor="#fafafa" />
                        </radialGradient>
                      </defs>
                      <circle cx="100" cy="100" r="32" fill="url(#centerGradient)" filter="drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))" />
                    </svg>
                  </div>

                  {/* 범례 */}
                  <div
                    style={{
                      flex: 1,
                      maxHeight: '340px',
                      overflowY: 'auto',
                      paddingRight: '8px'
                    }}
                  >
                    {allProducts.map((item, idx) => {
                      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'];
                      const isInTop10 = idx < 10;
                      const color = isInTop10 ? colors[idx % colors.length] : '#9ca3af';
                      const isSelected = selectedProducts.includes(item.name);

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            // 이미 선택된 경우 아무 동작 안함
                            if (!isSelected) {
                              // 최대 5개까지만 선택 가능
                              if (selectedProducts.length < 5) {
                                setSelectedProducts([...selectedProducts, item.name]);
                              }
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '4px',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '2px 8px',
                            marginLeft: '-8px',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f9fafb';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '3px',
                              backgroundColor: color,
                              flexShrink: 0
                            }}
                          />
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flex: 1,
                              minWidth: 0,
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#374151'
                              }}
                            >
                              {item.category3 && <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '400' }}>{item.category3} / </span>}
                              {item.name}
                            </span>
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                color: '#6b7280',
                                fontSize: '11px',
                                fontWeight: '400'
                              }}
                            >
                              ₩{item.amount.toLocaleString()}
                            </span>
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                fontWeight: '600',
                                color: color,
                                fontSize: '12px'
                              }}
                            >
                              {item.percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>데이터가 없습니다</div>
              )}
            </div>

            {/* 옵션상품 발주 TOP 10 */}
            <div className="card" style={{ borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>옵션상품 발주 TOP 10</h3>
              <div style={{ maxHeight: '440px', overflowY: 'auto' }}>
                {optionTop10.length > 0 ? (
                  optionTop10.map((item, idx) => {
                    const isSelected = selectedOptions.includes(item.name);

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          // 이미 선택된 경우 아무 동작 안함
                          if (!isSelected) {
                            // 최대 5개까지만 선택 가능
                            if (selectedOptions.length < 5) {
                              setSelectedOptions([...selectedOptions, item.name]);
                            }
                          }
                        }}
                        style={{
                          marginBottom: '3px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '4px'
                          }}
                        >
                          <span style={{ fontSize: '12px' }}>{idx + 1}. {item.name}</span>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>₩{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="border-gray-200" style={{ height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div className="bg-primary" style={{ width: `${item.percent}%`, height: '100%', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>데이터가 없습니다</div>
                )}
              </div>
            </div>

            {/* 발주 캘린더 */}
            {calendarJSX}
          </div>

          {/* 마켓별 통계 */}
          <div className="card" style={{ borderRadius: '12px', padding: '20px', width: '100%', background: 'none', boxShadow: 'none' }}>
            {/* 탭 헤더 */}
            {/* 품목별 / 옵션별 통계 좌우 배치 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* 품목별 통계 */}
              <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* 헤더 컨테이너 */}
                <div style={{ marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#6366f1' }}>품목별 통계</h3>

                  {/* 선택 정보 표시 */}
                  {selectedProducts.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '4px' }}>선택된 품목:</span>
                      {selectedProducts.map((p, idx) => {
                        const dashStyles = ['0', '4 4', '8 4', '2 2', '8 4 2 4'];
                        return (
                          <div
                            key={p}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#ffffff',
                              padding: '3px 6px',
                              borderRadius: '8px',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)'
                            }}
                          >
                            <svg width="20" height="10">
                              <line x1="0" y1="5" x2="20" y2="5" stroke="#6b7280" strokeWidth="1.5"
                                strokeDasharray={dashStyles[idx % dashStyles.length]} />
                            </svg>
                            <span style={{ fontSize: '10px', color: '#374151' }}>{p}</span>
                            <button
                              onClick={() => setSelectedProducts(selectedProducts.filter(item => item !== p))}
                              style={{
                                fontSize: '10px',
                                color: '#9ca3af',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                marginLeft: '2px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 그래프 */}
                {productStats.dates.length > 0 && productStats.lines.length > 0 ? (
                  <>
                    {/* 메인 그래프 */}
                    <svg viewBox="0 0 1200 402" style={{ width: '100%', height: '350px', display: 'block' }}>
                      {(() => {
                        const maxAmount = Math.max(
                          ...productStats.lines.flatMap(line => line.data.map(d => d.amount)),
                          10000
                        );

                        // 최대값의 110%를 10,000원 단위로 올림
                        const maxY = Math.ceil(maxAmount * 1.1 / 10000) * 10000;
                        const yStep = maxY / 5;

                        const dateCount = productStats.dates.length;
                        const divisor = dateCount > 1 ? dateCount - 1 : 1;

                        // 그래프 영역 설정
                        const chartLeft = 100;
                        const chartRight = 1150;
                        const chartTop = 5;
                        const chartBottom = 390;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;

                        return (
                          <>
                            {/* clipPath 정의: 0 값 아래로 선이 내려가지 않도록 제한 */}
                            <defs>
                              <clipPath id="chart-clip-product">
                                <rect x={chartLeft} y={chartTop} width={chartWidth} height={chartHeight} />
                              </clipPath>
                            </defs>

                            {/* 가로 격자선 및 Y축 레이블 */}
                            {[0, 1, 2, 3, 4, 5].map(i => {
                              const y = chartBottom - (i / 5) * chartHeight;
                              const value = i * yStep;
                              return (
                                <g key={`grid-${i}`}>
                                  <line
                                    x1={chartLeft}
                                    y1={y}
                                    x2={chartRight}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={chartLeft - 10}
                                    y={y + 4}
                                    fontSize="11"
                                    fill="#6b7280"
                                    textAnchor="end"
                                  >
                                    {value.toLocaleString()}
                                  </text>
                                </g>
                              );
                            })}

                            {/* 품목 × 마켓 조합별 선 */}
                            {productStats.lines.map((line, lineIdx) => {
                              const points = line.data.map((d, idx) => {
                                const x = chartLeft + (idx / divisor) * chartWidth;
                                const y = chartBottom - (d.amount / maxY) * chartHeight;
                                return { x, y };
                              });

                              const smoothPath = createSmoothPath(points);

                              return (
                                <g key={lineIdx} clipPath="url(#chart-clip-product)">
                                  <path
                                    d={smoothPath}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth="2"
                                    strokeDasharray={line.dashStyle}
                                  />
                                  {line.data.map((d, idx) => {
                                    const x = chartLeft + (idx / divisor) * chartWidth;
                                    const y = chartBottom - (d.amount / maxY) * chartHeight;
                                    return (
                                      <circle
                                        key={idx}
                                        cx={x}
                                        cy={y}
                                        r="3"
                                        fill={line.color}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={(e) => {
                                          setTooltip({
                                            x: e.clientX,
                                            y: e.clientY,
                                            item: line.item,
                                            market: line.market,
                                            date: productStats.dates[idx],
                                            amount: d.amount
                                          });
                                        }}
                                        onMouseLeave={() => setTooltip(null)}
                                      />
                                    );
                                  })}
                                </g>
                              );
                            })}

                            {/* X축 날짜 라벨 */}
                            {productStats.dates.map((date, idx) => {
                              const divisor = productStats.dates.length > 1 ? productStats.dates.length - 1 : 1;
                              const x = chartLeft + (idx / divisor) * chartWidth;
                              return (
                                <text
                                  key={idx}
                                  x={x}
                                  y="392"
                                  fontSize="10"
                                  fill="#6b7280"
                                  textAnchor="middle"
                                >
                                  {date.slice(5)}
                                </text>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>

                    {/* 범례 컨테이너 */}
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {allMarkets.map((market) => {
                          const isSelected = selectedProductMarkets.includes(market);
                          const color = marketColorMap.get(market);
                          return (
                            <div
                              key={market}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedProductMarkets(selectedProductMarkets.filter(m => m !== market));
                                } else {
                                  setSelectedProductMarkets([...selectedProductMarkets, market]);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                opacity: isSelected ? 1 : 0.4,
                                padding: '4px 8px',
                                marginLeft: '-8px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#e5e7eb';
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
                              <span style={{ fontSize: '11px' }}>{market}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>좌측에서 품목을 선택하세요</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>최대 5개까지 선택 가능</div>
                  </div>
                )}
              </div>
              </div>

              {/* 옵션별 통계 */}
              <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* 헤더 컨테이너 */}
                <div style={{ marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#8b5cf6' }}>옵션별 통계</h3>

                  {/* 선택 정보 표시 */}
                  {selectedOptions.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '4px' }}>선택된 옵션:</span>
                      {selectedOptions.map((o, idx) => {
                        const dashStyles = ['0', '4 4', '8 4', '2 2', '8 4 2 4'];
                        return (
                          <div
                            key={o}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#ffffff',
                              padding: '3px 6px',
                              borderRadius: '8px',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)'
                            }}
                          >
                            <svg width="20" height="10">
                              <line x1="0" y1="5" x2="20" y2="5" stroke="#6b7280" strokeWidth="1.5"
                                strokeDasharray={dashStyles[idx % dashStyles.length]} />
                            </svg>
                            <span style={{ fontSize: '10px', color: '#374151' }}>{o}</span>
                            <button
                              onClick={() => setSelectedOptions(selectedOptions.filter(item => item !== o))}
                              style={{
                                fontSize: '10px',
                                color: '#9ca3af',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                marginLeft: '2px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 그래프 */}
                {optionStats.dates.length > 0 && optionStats.lines.length > 0 ? (
                  <>
                    {/* 메인 그래프 */}
                    <svg viewBox="0 0 1200 402" style={{ width: '100%', height: '350px', display: 'block' }}>
                      {(() => {
                        const maxAmount = Math.max(
                          ...optionStats.lines.flatMap(line => line.data.map(d => d.amount)),
                          10000
                        );

                        // 최대값의 110%를 10,000원 단위로 올림
                        const maxY = Math.ceil(maxAmount * 1.1 / 10000) * 10000;
                        const yStep = maxY / 5;

                        const dateCount = optionStats.dates.length;
                        const divisor = dateCount > 1 ? dateCount - 1 : 1;

                        // 그래프 영역 설정
                        const chartLeft = 100;
                        const chartRight = 1150;
                        const chartTop = 5;
                        const chartBottom = 390;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;

                        return (
                          <>
                            {/* clipPath 정의: 0 값 아래로 선이 내려가지 않도록 제한 */}
                            <defs>
                              <clipPath id="chart-clip-option">
                                <rect x={chartLeft} y={chartTop} width={chartWidth} height={chartHeight} />
                              </clipPath>
                            </defs>

                            {/* 가로 격자선 및 Y축 레이블 */}
                            {[0, 1, 2, 3, 4, 5].map(i => {
                              const y = chartBottom - (i / 5) * chartHeight;
                              const value = i * yStep;
                              return (
                                <g key={`grid-${i}`}>
                                  <line
                                    x1={chartLeft}
                                    y1={y}
                                    x2={chartRight}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={chartLeft - 10}
                                    y={y + 4}
                                    fontSize="11"
                                    fill="#6b7280"
                                    textAnchor="end"
                                  >
                                    {value.toLocaleString()}
                                  </text>
                                </g>
                              );
                            })}

                            {/* 옵션 × 마켓 조합별 선 */}
                            {optionStats.lines.map((line, lineIdx) => {
                              const points = line.data.map((d, idx) => {
                                const x = chartLeft + (idx / divisor) * chartWidth;
                                const y = chartBottom - (d.amount / maxY) * chartHeight;
                                return { x, y };
                              });

                              const smoothPath = createSmoothPath(points);

                              return (
                                <g key={lineIdx} clipPath="url(#chart-clip-option)">
                                  <path
                                    d={smoothPath}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth="2"
                                    strokeDasharray={line.dashStyle}
                                  />
                                  {line.data.map((d, idx) => {
                                    const x = chartLeft + (idx / divisor) * chartWidth;
                                    const y = chartBottom - (d.amount / maxY) * chartHeight;
                                    return (
                                      <circle
                                        key={idx}
                                        cx={x}
                                        cy={y}
                                        r="3"
                                        fill={line.color}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={(e) => {
                                          setTooltip({
                                            x: e.clientX,
                                            y: e.clientY,
                                            item: line.item,
                                            market: line.market,
                                            date: optionStats.dates[idx],
                                            amount: d.amount
                                          });
                                        }}
                                        onMouseLeave={() => setTooltip(null)}
                                      />
                                    );
                                  })}
                                </g>
                              );
                            })}

                            {/* X축 날짜 라벨 */}
                            {optionStats.dates.map((date, idx) => {
                              const divisor = optionStats.dates.length > 1 ? optionStats.dates.length - 1 : 1;
                              const x = chartLeft + (idx / divisor) * chartWidth;
                              return (
                                <text
                                  key={idx}
                                  x={x}
                                  y="392"
                                  fontSize="10"
                                  fill="#6b7280"
                                  textAnchor="middle"
                                >
                                  {date.slice(5)}
                                </text>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>

                    {/* 범례 컨테이너 */}
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {allMarkets.map((market) => {
                          const isSelected = selectedOptionMarkets.includes(market);
                          const color = marketColorMap.get(market);
                          return (
                            <div
                              key={market}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedOptionMarkets(selectedOptionMarkets.filter(m => m !== market));
                                } else {
                                  setSelectedOptionMarkets([...selectedOptionMarkets, market]);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                opacity: isSelected ? 1 : 0.4,
                                padding: '4px 8px',
                                marginLeft: '-8px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#e5e7eb';
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
                              <span style={{ fontSize: '11px' }}>{market}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>좌측에서 옵션상품을 선택하세요</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>최대 5개까지 선택 가능</div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>

          {/* 두 번째 행: 최근 7일 + 월별 발주 추이 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}
          >
            {/* 최근 7일 발주 현황 */}
            <div className="card" style={{ borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>최근 7일 발주 현황</h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: '180px',
                  gap: '8px',
                  position: 'relative'
                }}
              >
                {last7DaysStats.map((item, idx) => {
                  const barHeight = item.amount > 0 ? Math.max(item.value * 1.2, 10) : 2;
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        height: '100%',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          marginBottom: '4px'
                        }}
                      >
                        <span style={{ fontSize: '9px', color: '#6b7280' }}>{item.count}건</span>
                        <span style={{ fontSize: '10px', color: '#495057', fontWeight: '500' }}>₩{item.amount.toLocaleString()}</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: `${barHeight}px`,
                          background: idx === 6 ? '#10b981' : '#93c5fd',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1px',
                          marginTop: '4px'
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: '500' }}>{item.day}</span>
                        <span style={{ fontSize: '9px', color: '#6b7280' }}>{item.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 월별 발주 추이 */}
            <div className="card" style={{ borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>월별 발주 추이 (최근 7개월)</h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: '180px',
                  gap: '8px',
                  position: 'relative'
                }}
              >
                {monthlyStats.map((stat, idx) => {
                  const barHeight = stat.amount > 0 ? Math.max(stat.value * 1.2, 10) : 2;
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        height: '100%',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          marginBottom: '4px'
                        }}
                      >
                        <span style={{ fontSize: '9px', color: '#6b7280' }}>{stat.count}건</span>
                        <span style={{ fontSize: '10px', color: '#495057', fontWeight: '500' }}>₩{stat.amount.toLocaleString()}</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: `${barHeight}px`,
                          background: idx === monthlyStats.length - 1 ? '#2563eb' : '#93c5fd',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                      <span style={{ fontSize: '10px', fontWeight: '500', marginTop: '4px' }}>{stat.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 네 번째 열: 빈 공간 */}
        <div
          style={{
            width: '400px',
            flexShrink: 0
          }}
        >
        </div>
      </div>

      {/* 커스텀 툴팁 */}
      {hoveredBadge && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredBadge.position.x}px`,
            top: `${Math.max(8, hoveredBadge.position.y - 40)}px`,
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

      {/* 그래프 점 툴팁 */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 60}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid #e5e7eb',
            padding: '8px 10px',
            borderRadius: '6px',
            fontSize: '10px',
            zIndex: 10000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            lineHeight: '1.4'
          }}
        >
          <div style={{ color: '#111827', fontWeight: '600', marginBottom: '2px' }}>{tooltip.item}</div>
          <div style={{ color: '#6b7280', marginBottom: '2px' }}>{tooltip.market}</div>
          <div style={{ color: '#6b7280', marginBottom: '2px' }}>{tooltip.date}</div>
          <div style={{ color: '#111827', fontWeight: '600' }}>{tooltip.amount.toLocaleString()}원</div>
        </div>
      )}
    </div>
  );
}
