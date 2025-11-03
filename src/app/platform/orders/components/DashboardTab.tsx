'use client';

import { useMemo, useState, useEffect } from 'react';
import { Order, StatusConfig, StatsData } from '../types';
import DatePicker from '@/components/ui/DatePicker';
import MyRankingWidget from './MyRankingWidget';

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

  // 주차 계산 (ISO 8601: 월요일 시작, 첫 목요일이 있는 주가 1주차)
  function getISOWeek(d: Date): { year: number; week: number } {
    const k = toKst(d);
    const date = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: date.getUTCFullYear(), week: weekNo };
  }

  function yearWeekKey(d: Date) {
    const { year, week } = getISOWeek(d);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  function yearMonthKey(d: Date) {
    const k = toKst(d);
    const y = k.getUTCFullYear();
    const m = String(k.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  // ISO Week를 해당 주의 월요일 날짜로 변환
  function weekKeyToMonday(weekKey: string): string {
    // weekKey 형식: "2025-W41"
    const [yearStr, weekStr] = weekKey.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);

    // ISO Week의 첫 번째 날(월요일) 계산
    const jan4 = new Date(Date.UTC(year, 0, 4)); // 1월 4일은 항상 1주차에 속함
    const jan4Day = jan4.getUTCDay() || 7; // 일요일=7
    const weekOneMonday = new Date(jan4);
    weekOneMonday.setUTCDate(jan4.getUTCDate() - jan4Day + 1); // 1주차 월요일

    // 해당 주의 월요일 계산
    const targetMonday = new Date(weekOneMonday);
    targetMonday.setUTCDate(weekOneMonday.getUTCDate() + (week - 1) * 7);

    // YYYY-MM-DD 형식으로 반환
    const y = targetMonday.getUTCFullYear();
    const m = String(targetMonday.getUTCMonth() + 1).padStart(2, '0');
    const d = String(targetMonday.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ISO Week를 "2025-10-W1" 형식으로 변환 (해당 월의 몇째주인지)
  function formatWeekForTooltip(weekKey: string): string {
    // weekKey 형식: "2025-W41"
    const mondayDate = weekKeyToMonday(weekKey);
    const [yearStr, monthStr, dayStr] = mondayDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // 해당 월의 1일 구하기
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const firstDayOfWeek = firstDay.getUTCDay(); // 0(일) ~ 6(토)

    // 1일이 속한 주의 월요일 구하기
    const firstMonday = new Date(firstDay);
    if (firstDayOfWeek === 0) {
      // 1일이 일요일이면 다음 월요일이 첫째주 시작
      firstMonday.setUTCDate(2);
    } else if (firstDayOfWeek === 1) {
      // 1일이 월요일이면 그대로
      firstMonday.setUTCDate(1);
    } else {
      // 1일이 화~토요일이면 그 주의 월요일 (이전 주로 갈 수 있음)
      firstMonday.setUTCDate(1 - (firstDayOfWeek - 1));
    }

    // 해당 월요일과 첫째주 월요일 사이의 주 차이 계산
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const weekDiff = Math.floor((targetDate.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekOfMonth = weekDiff + 1;

    return `${year}-${String(month).padStart(2, '0')}-W${weekOfMonth}`;
  }

  // startDate와 endDate 사이의 모든 기간 생성 (일/주/월)
  function getAllPeriods(startYmd: string, endYmd: string, unit: 'day' | 'week' | 'month'): string[] {
    const start = new Date(startYmd);
    const end = new Date(endYmd);
    const periods: string[] = [];

    if (unit === 'day') {
      // 평일만 생성 (주말 제외)
      const current = new Date(start);
      while (current <= end) {
        const dayOfWeek = current.getDay(); // 0=일요일, 6=토요일
        // 주말(토, 일) 제외
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, '0');
          const d = String(current.getDate()).padStart(2, '0');
          periods.push(`${y}-${m}-${d}`);
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (unit === 'week') {
      // 모든 주차 생성
      const current = new Date(start);
      const seenWeeks = new Set<string>();

      while (current <= end) {
        const weekKey = yearWeekKey(current);
        if (!seenWeeks.has(weekKey)) {
          periods.push(weekKey);
          seenWeeks.add(weekKey);
        }
        current.setDate(current.getDate() + 1);
      }
    } else { // month
      // 모든 월 생성
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();

      let currentYear = startYear;
      let currentMonth = startMonth;

      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const y = currentYear;
        const m = String(currentMonth + 1).padStart(2, '0');
        periods.push(`${y}-${m}`);

        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    }

    return periods;
  }

  // 집계 기준 필드: 발주확정일시 기준으로 통계 집계
  const BASE_FIELD: keyof Order = 'confirmedAt';
  const getBaseDate = (o: Order) => {
    // confirmedAt이 없으면 registeredAt 사용 (발주서등록 상태인 경우)
    const date = fromDbUTC(o.confirmedAt as any) || fromDbUTC(o.registeredAt as any);
    return date;
  };

  const [hoveredBadge, setHoveredBadge] = useState<{ type: string; amount: number; position: { x: number; y: number } } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | null>(null);

  // 품목/옵션별 통계 상태
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [currentProductForOptions, setCurrentProductForOptions] = useState<string | null>(null); // 옵션 TOP 10 필터용
  const [selectedProductMarkets, setSelectedProductMarkets] = useState<string[]>([]);
  const [selectedOptionMarkets, setSelectedOptionMarkets] = useState<string[]>([]);
  const [productTimeUnit, setProductTimeUnit] = useState<'day' | 'week' | 'month'>('day');
  const [optionTimeUnit, setOptionTimeUnit] = useState<'day' | 'week' | 'month'>('day');
  const [showProductMarketTotal, setShowProductMarketTotal] = useState(false);
  const [showOptionMarketTotal, setShowOptionMarketTotal] = useState(false);

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
  const [activeDateFilter, setActiveDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | '90days' | '365days' | 'thisYear' | null>('7days');

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
    if (days === 7) setActiveDateFilter('7days');
    else if (days === 30) setActiveDateFilter('30days');
    else if (days === 90) setActiveDateFilter('90days');
    else if (days === 365) setActiveDateFilter('365days');
    else setActiveDateFilter(null);
  };
  const handleToday = () => {
    const t = new Date();
    setStartDate(formatYmdKst(t));
    setEndDate(formatYmdKst(t));
    setActiveDateFilter('today');
  };
  const handleYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setStartDate(formatYmdKst(y));
    setEndDate(formatYmdKst(y));
    setActiveDateFilter('yesterday');
  };
  const handleThisYear = () => {
    const t = new Date();
    const year = toKst(t).getUTCFullYear();
    setStartDate(`${year}-01-01`);
    setEndDate(formatYmdKst(t));
    setActiveDateFilter('thisYear');
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
  const [optionNameToCategory4, setOptionNameToCategory4] = useState<Map<string, string>>(new Map());

  // 날짜만 필터링 (통계 계산용)
  const dateFilteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (startDate && endDate) {
        const base = getBaseDate(order);
        if (!base || !betweenYmdKst(base, startDate, endDate)) return false;
      }
      return true;
    });
  }, [orders, startDate, endDate]);

  // 날짜/상태로 필터링 (차트 표시용)
  const filteredOrders = useMemo(() => {
    const filtered = dateFilteredOrders.filter(order => {
      if (selectedStatus && order.status !== selectedStatus) return false;
      return true;
    });

    console.log(`[filteredOrders] 선택된 상태: ${selectedStatus}`);
    console.log(`[filteredOrders] 날짜 필터 후: ${dateFilteredOrders.length}개`);
    console.log(`[filteredOrders] 상태 필터 후: ${filtered.length}개`);
    if (filtered.length > 0) {
      console.log(`[filteredOrders] 첫 주문 샘플:`, {
        status: filtered[0].status,
        date: filtered[0].registeredAt,
        amount: filtered[0].supplyPrice
      });
    }

    return filtered;
  }, [dateFilteredOrders, selectedStatus]);

  // 옵션상품 TOP 10 (현재 선택된 품목만 반영)
  const optionTop10 = useMemo(() => {
    const optionMap: Record<string, number> = {};

    filteredOrders.forEach(order => {
      const optionName = order.optionName || order.option_name || '미지정';

      // 현재 선택된 품목이 있으면 해당 품목의 옵션만 표시
      if (currentProductForOptions) {
        const category4 = optionNameToCategory4.get(optionName);
        // 현재 선택한 품목이 아니면 제외
        if (!category4 || category4 !== currentProductForOptions) {
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
  }, [filteredOrders, currentProductForOptions, optionNameToCategory4]);

  useEffect(() => {
    const fetchProductTop10 = async () => {
      // 1) 옵션명별 금액 집계 (필터링된 주문 사용)
      const optionMap: Record<string, number> = {};
      filteredOrders.forEach(order => {
        const optionName = order.optionName || order.option_name || '미지정';
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

      // API를 통해 조회 (비회원도 가능)
      const response = await fetch(`/api/option-products?option_names=${encodeURIComponent(uniqueOptions.join(','))}`);
      const result = await response.json();

      if (!result.success || !result.data) {
        console.error('품목 조회 실패:', result.error);
        setProductTop10([]);
        setAllProducts([]);
        setOptionNameToCategory4(new Map());
        return;
      }

      const optionProducts = result.data;

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

  // 상태별 통계 데이터 (건수 + 정산금액, 날짜 필터만 적용)
  const statsData = useMemo(() => {
    const calculateStats = (status: Order['status']) => {
      const filtered = dateFilteredOrders.filter(o => o.status === status);
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
  }, [dateFilteredOrders]);

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

    // 실제 발주가 있는 날짜만 추출 (주말/공휴일 제외)
    const datesWithOrders = Array.from(dateMarketMap.keys()).sort();

    // 15일 초과 시 15개로 샘플링 (시작일과 종료일 반드시 포함)
    let displayDates = datesWithOrders;
    if (datesWithOrders.length > 15) {
      const sampledDates = [datesWithOrders[0]]; // 시작일 추가

      // 중간 날짜들 균등 샘플링 (13개)
      const middleCount = 13;
      for (let i = 1; i <= middleCount; i++) {
        const index = Math.floor((i * (datesWithOrders.length - 1)) / (middleCount + 1));
        if (index > 0 && index < datesWithOrders.length - 1 && !sampledDates.includes(datesWithOrders[index])) {
          sampledDates.push(datesWithOrders[index]);
        }
      }

      sampledDates.push(datesWithOrders[datesWithOrders.length - 1]); // 종료일 추가
      displayDates = sampledDates.sort();
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
    // '전체' 모드가 아닐 때만 자동으로 모든 마켓 선택
    if (selectedProductMarkets.length === 0 && !showProductMarketTotal) {
      setSelectedProductMarkets(allMarkets);
    }
    if (selectedOptionMarkets.length === 0 && !showOptionMarketTotal) {
      setSelectedOptionMarkets(allMarkets);
    }
  }, [filteredOrders, showProductMarketTotal, showOptionMarketTotal]);

  // 날짜 범위에 따라 시간 단위 자동 조정 (품목 그래프)
  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDiff <= 7 && (productTimeUnit === 'week' || productTimeUnit === 'month')) {
      // 7일 이하인데 '주' 또는 '월'이 선택되어 있으면 '일'로 변경
      setProductTimeUnit('day');
    } else if (daysDiff <= 31 && productTimeUnit === 'month') {
      // 31일 이하인데 '월'이 선택되어 있으면 '일'로 변경
      setProductTimeUnit('day');
    }
  }, [startDate, endDate, productTimeUnit]);

  // 날짜 범위에 따라 시간 단위 자동 조정 (옵션 그래프)
  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDiff <= 7 && (optionTimeUnit === 'week' || optionTimeUnit === 'month')) {
      // 7일 이하인데 '주' 또는 '월'이 선택되어 있으면 '일'로 변경
      setOptionTimeUnit('day');
    } else if (daysDiff <= 31 && optionTimeUnit === 'month') {
      // 31일 이하인데 '월'이 선택되어 있으면 '일'로 변경
      setOptionTimeUnit('day');
    }
  }, [startDate, endDate, optionTimeUnit]);

  // 품목별 통계 그래프 데이터
  const productStats = useMemo(() => {
    const selectedItems = selectedProducts;
    const itemType = 'product';

    // '전체' 모드가 아니고 선택된 마켓이 없으면 빈 데이터 반환
    if (selectedProductMarkets.length === 0 && !showProductMarketTotal) {
      return { dates: [], lines: [] };
    }

    // 시간 단위별 데이터 맵 생성
    const dateItemMarketMap = new Map<string, Map<string, Map<string, number>>>();

    filteredOrders.forEach(order => {
      const b = getBaseDate(order);
      if (!b) return;

      // 시간 단위별로 키 생성
      let dateKey: string;
      if (productTimeUnit === 'day') {
        dateKey = ymdKst(b);
      } else if (productTimeUnit === 'week') {
        dateKey = yearWeekKey(b);
      } else { // month
        dateKey = yearMonthKey(b);
      }

      const marketName = order.sellerMarketName || '미지정';

      // '전체' 모드가 아닐 때만 선택된 마켓 필터링
      if (!showProductMarketTotal && !selectedProductMarkets.includes(marketName)) return;

      // optionName으로 category4 조회
      const optionName = order.optionName || '';
      const itemName = optionNameToCategory4.get(optionName) || '미지정';

      // 선택된 품목이 있으면 해당 품목만, 없으면 전체
      if (selectedItems.length > 0 && !selectedItems.includes(itemName)) return;

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

    // startDate와 endDate 사이의 모든 기간 생성
    const allPeriods = getAllPeriods(startDate, endDate, productTimeUnit);

    console.log(`[품목그래프-${productTimeUnit}] 전체 기간 개수:`, allPeriods.length);
    console.log(`[품목그래프-${productTimeUnit}] dateItemMarketMap 크기:`, dateItemMarketMap.size);

    // 첫 번째 기간의 데이터 확인
    if (allPeriods.length > 0) {
      const firstPeriod = allPeriods[0];
      const firstData = dateItemMarketMap.get(firstPeriod);
      console.log(`[품목그래프-${productTimeUnit}] 첫 번째 기간 (${firstPeriod}) 데이터:`, firstData);
    }

    // 15개 초과 시 15개로 샘플링
    let displayPeriods = allPeriods;
    if (allPeriods.length > 15) {
      const sampledPeriods = [allPeriods[0]]; // 시작 기간 추가

      // 중간 기간들 균등 샘플링 (13개)
      const middleCount = 13;
      for (let i = 1; i <= middleCount; i++) {
        const index = Math.floor((i * (allPeriods.length - 1)) / (middleCount + 1));
        if (index > 0 && index < allPeriods.length - 1 && !sampledPeriods.includes(allPeriods[index])) {
          sampledPeriods.push(allPeriods[index]);
        }
      }

      sampledPeriods.push(allPeriods[allPeriods.length - 1]); // 종료 기간 추가
      displayPeriods = sampledPeriods.sort();
    }

    const sortedDates = displayPeriods;

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

    // 마켓 전체 표시 모드
    if (showProductMarketTotal) {
      // 모든 마켓의 합계를 하나의 선으로 표시
      if (selectedItems.length === 0) {
        // 품목 선택 없음: 모든 품목 × 모든 마켓의 합계
        lines.push({
          label: '전체 - 전체',
          item: '전체',
          market: '전체',
          color: '#6b7280', // 회색
          dashStyle: dashStyles[0],
          data: sortedDates.map(date => {
            let total = 0;
            const dateMap = dateItemMarketMap.get(date);
            if (dateMap) {
              dateMap.forEach((marketMap) => {
                marketMap.forEach((amount) => {
                  total += amount;
                });
              });
            }
            return { date, amount: total };
          })
        });
      } else {
        // 품목 선택됨: 선택된 품목 × 모든 마켓의 합계
        selectedItems.forEach((item, itemIdx) => {
          lines.push({
            label: `${item} - 전체`,
            item,
            market: '전체',
            color: '#6b7280', // 회색
            dashStyle: dashStyles[itemIdx % dashStyles.length],
            data: sortedDates.map(date => {
              let total = 0;
              const itemMap = dateItemMarketMap.get(date)?.get(item);
              if (itemMap) {
                itemMap.forEach((amount) => {
                  total += amount;
                });
              }
              return { date, amount: total };
            })
          });
        });
      }
    } else {
      // 개별 마켓 표시 모드
      // 선택된 품목이 없으면 전체 합계로 표시
      if (selectedItems.length === 0) {
        selectedProductMarkets.forEach((market) => {
          const marketIdx = allMarketsList.indexOf(market);
          lines.push({
            label: `전체 - ${market}`,
            item: '전체',
            market,
            color: marketColors[marketIdx % marketColors.length],
            dashStyle: dashStyles[0],
            data: sortedDates.map(date => {
              // 해당 날짜/마켓의 모든 품목 합계
              let total = 0;
              const dateMap = dateItemMarketMap.get(date);
              if (dateMap) {
                dateMap.forEach((marketMap) => {
                  total += marketMap.get(market) || 0;
                });
              }
              return { date, amount: total };
            })
          });
        });
      } else {
        // 선택된 품목이 있으면 품목별로 표시
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
      }
    }

    return {
      dates: sortedDates,
      lines
    };
  }, [filteredOrders, selectedProducts, selectedProductMarkets, startDate, endDate, optionNameToCategory4, productTimeUnit, showProductMarketTotal]);

  // 옵션별 통계 그래프 데이터
  const optionStats = useMemo(() => {
    const selectedItems = selectedOptions;

    // '전체' 모드가 아니고 선택된 마켓이 없으면 빈 데이터 반환
    if (selectedOptionMarkets.length === 0 && !showOptionMarketTotal) {
      return { dates: [], lines: [] };
    }

    // 시간 단위별 데이터 맵 생성
    const dateItemMarketMap = new Map<string, Map<string, Map<string, number>>>();

    filteredOrders.forEach(order => {
      const b = getBaseDate(order);
      if (!b) return;

      // 시간 단위별로 키 생성
      let dateKey: string;
      if (optionTimeUnit === 'day') {
        dateKey = ymdKst(b);
      } else if (optionTimeUnit === 'week') {
        dateKey = yearWeekKey(b);
      } else { // month
        dateKey = yearMonthKey(b);
      }

      const marketName = order.sellerMarketName || '미지정';

      // '전체' 모드가 아닐 때만 선택된 마켓 필터링
      if (!showOptionMarketTotal && !selectedOptionMarkets.includes(marketName)) return;

      // optionName 사용
      const itemName = order.optionName || '미지정';

      // 선택된 옵션이 있으면 해당 옵션만, 없으면 전체
      if (selectedItems.length > 0 && !selectedItems.includes(itemName)) return;

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

    // startDate와 endDate 사이의 모든 기간 생성
    const allPeriods = getAllPeriods(startDate, endDate, optionTimeUnit);

    console.log(`[옵션그래프-${optionTimeUnit}] 전체 기간 개수:`, allPeriods.length);
    console.log(`[옵션그래프-${optionTimeUnit}] dateItemMarketMap 크기:`, dateItemMarketMap.size);

    // 첫 번째 기간의 데이터 확인
    if (allPeriods.length > 0) {
      const firstPeriod = allPeriods[0];
      const firstData = dateItemMarketMap.get(firstPeriod);
      console.log(`[옵션그래프-${optionTimeUnit}] 첫 번째 기간 (${firstPeriod}) 데이터:`, firstData);
    }

    // 15개 초과 시 15개로 샘플링
    let displayPeriods = allPeriods;
    if (allPeriods.length > 15) {
      const sampledPeriods = [allPeriods[0]]; // 시작 기간 추가

      // 중간 기간들 균등 샘플링 (13개)
      const middleCount = 13;
      for (let i = 1; i <= middleCount; i++) {
        const index = Math.floor((i * (allPeriods.length - 1)) / (middleCount + 1));
        if (index > 0 && index < allPeriods.length - 1 && !sampledPeriods.includes(allPeriods[index])) {
          sampledPeriods.push(allPeriods[index]);
        }
      }

      sampledPeriods.push(allPeriods[allPeriods.length - 1]); // 종료 기간 추가
      displayPeriods = sampledPeriods.sort();
    }

    const sortedDates = displayPeriods;

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

    // 마켓 전체 표시 모드
    if (showOptionMarketTotal) {
      // 모든 마켓의 합계를 하나의 선으로 표시
      if (selectedItems.length === 0) {
        // 옵션 선택 없음: 모든 옵션 × 모든 마켓의 합계
        lines.push({
          label: '전체 - 전체',
          item: '전체',
          market: '전체',
          color: '#6b7280', // 회색
          dashStyle: dashStyles[0],
          data: sortedDates.map(date => {
            let total = 0;
            const dateMap = dateItemMarketMap.get(date);
            if (dateMap) {
              dateMap.forEach((marketMap) => {
                marketMap.forEach((amount) => {
                  total += amount;
                });
              });
            }
            return { date, amount: total };
          })
        });
      } else {
        // 옵션 선택됨: 선택된 옵션 × 모든 마켓의 합계
        selectedItems.forEach((item, itemIdx) => {
          lines.push({
            label: `${item} - 전체`,
            item,
            market: '전체',
            color: '#6b7280', // 회색
            dashStyle: dashStyles[itemIdx % dashStyles.length],
            data: sortedDates.map(date => {
              let total = 0;
              const itemMap = dateItemMarketMap.get(date)?.get(item);
              if (itemMap) {
                itemMap.forEach((amount) => {
                  total += amount;
                });
              }
              return { date, amount: total };
            })
          });
        });
      }
    } else {
      // 개별 마켓 표시 모드
      // 선택된 옵션이 없으면 전체 합계로 표시
      if (selectedItems.length === 0) {
        selectedOptionMarkets.forEach((market) => {
          const marketIdx = allMarketsList.indexOf(market);
          lines.push({
            label: `전체 - ${market}`,
            item: '전체',
            market,
            color: marketColors[marketIdx % marketColors.length],
            dashStyle: dashStyles[0],
            data: sortedDates.map(date => {
              // 해당 날짜/마켓의 모든 옵션 합계
              let total = 0;
              const dateMap = dateItemMarketMap.get(date);
              if (dateMap) {
                dateMap.forEach((marketMap) => {
                  total += marketMap.get(market) || 0;
                });
              }
              return { date, amount: total };
            })
          });
        });
      } else {
        // 선택된 옵션이 있으면 옵션별로 표시
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
      }
    }

    return {
      dates: sortedDates,
      lines
    };
  }, [filteredOrders, selectedOptions, selectedOptionMarkets, startDate, endDate, optionTimeUnit, showOptionMarketTotal]);

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
          padding: '16px',
          fontSize: '14px',
          height: '480px',
          maxHeight: '480px',
          display: 'flex',
          flexDirection: 'column'
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
              fontSize: '0.86em',
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
                  minHeight: '60px',
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
                  minHeight: '60px',
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
                  minHeight: '60px',
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
    <div style={{ display: 'block', width: '100%' }}>
      {/* 차트 영역 - Flex 레이아웃 */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start',
          maxWidth: '100%',
          overflow: 'visible'
        }}
      >
        {/* 첫 번째 열: 날짜 필터 & 통계 카드 - Sticky */}
        <div
          style={{
            minWidth: '200px',
            width: '11.2%',
            flexShrink: 1,
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 96px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            paddingBottom: '8px',
            zIndex: 1000
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
                <DatePicker
                  value={startDate}
                  onChange={date => {
                    setStartDate(date);
                    setActiveDateFilter(null);
                  }}
                  placeholder="시작일"
                  maxDate={endDate || undefined}
                />
                <span style={{ color: '#6b7280', fontSize: '12px' }}>~</span>
                <DatePicker
                  value={endDate}
                  onChange={date => {
                    setEndDate(date);
                    setActiveDateFilter(null);
                  }}
                  placeholder="종료일"
                  minDate={startDate || undefined}
                />
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
                    fontWeight: activeDateFilter === 'today' ? '600' : '400',
                    border: activeDateFilter === 'today' ? '1px solid #3b82f6' : '1px solid',
                    color: activeDateFilter === 'today' ? '#3b82f6' : 'var(--color-text)',
                    backgroundColor: activeDateFilter === 'today' ? 'rgba(59, 130, 246, 0.05)' : undefined,
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
                    fontWeight: activeDateFilter === 'yesterday' ? '600' : '400',
                    border: activeDateFilter === 'yesterday' ? '1px solid #3b82f6' : '1px solid',
                    color: activeDateFilter === 'yesterday' ? '#3b82f6' : 'var(--color-text)',
                    backgroundColor: activeDateFilter === 'yesterday' ? 'rgba(59, 130, 246, 0.05)' : undefined,
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
                    fontWeight: activeDateFilter === '7days' ? '600' : '400',
                    border: activeDateFilter === '7days' ? '1px solid #3b82f6' : '1px solid',
                    color: activeDateFilter === '7days' ? '#3b82f6' : 'var(--color-text)',
                    backgroundColor: activeDateFilter === '7days' ? 'rgba(59, 130, 246, 0.05)' : undefined,
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
                    fontWeight: activeDateFilter === '30days' ? '600' : '400',
                    border: activeDateFilter === '30days' ? '1px solid #3b82f6' : '1px solid',
                    color: activeDateFilter === '30days' ? '#3b82f6' : 'var(--color-text)',
                    backgroundColor: activeDateFilter === '30days' ? 'rgba(59, 130, 246, 0.05)' : undefined,
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
                    fontWeight: activeDateFilter === '90days' ? '600' : '400',
                    border: activeDateFilter === '90days' ? '1px solid #3b82f6' : '1px solid',
                    color: activeDateFilter === '90days' ? '#3b82f6' : 'var(--color-text)',
                    backgroundColor: activeDateFilter === '90days' ? 'rgba(59, 130, 246, 0.05)' : undefined,
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
                    fontWeight: activeDateFilter === '365days' ? '600' : '400',
                    border: activeDateFilter === '365days' ? '1px solid #3b82f6' : '1px solid',
                    color: activeDateFilter === '365days' ? '#3b82f6' : 'var(--color-text)',
                    backgroundColor: activeDateFilter === '365days' ? 'rgba(59, 130, 246, 0.05)' : undefined,
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
                    fontWeight: activeDateFilter === 'thisYear' ? '600' : '400',
                    border: activeDateFilter === 'thisYear' ? '1px solid #3b82f6' : '1px solid',
                    color: activeDateFilter === 'thisYear' ? '#3b82f6' : 'var(--color-text)',
                    backgroundColor: activeDateFilter === 'thisYear' ? 'rgba(59, 130, 246, 0.05)' : undefined,
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
                  className={isSelected ? '' : 'card'}
                  onClick={() => setSelectedStatus(isSelected ? null : stat.status)}
                  style={{
                    borderRadius: '6px',
                    padding: '6px 12px',
                    margin: '0 4px',
                    cursor: 'pointer',
                    background: 'var(--color-card-bg)',
                    boxShadow: isSelected
                      ? `0 0 0 2px ${config.color}40, 0 4px 6px -1px ${config.color}40`
                      : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
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

          {/* 내 순위 위젯 */}
          <div style={{ margin: '0 4px' }}>
            <MyRankingWidget />
          </div>
        </div>

        {/* 두 번째/세 번째 열 */}
        <div
          style={{
            flex: '0 1 auto',
            minWidth: '800px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* 첫 번째 행: 발주 TOP 10 + 옵션상품 발주 TOP 10 + 발주 캘린더 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.83fr 1fr 2fr',
              gap: '20px',
              flex: '0 0 auto'
            }}
          >
            {/* 품목 발주 TOP 10 */}
            <div
              className="card"
              style={{
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                height: '480px',
                maxHeight: '480px',
                fontSize: '14px'
              }}
            >
              <h3
                style={{
                  fontSize: '1em',
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
                    gap: '24px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1
                  }}
                >
                  {/* 원형 그래프 */}
                  <div
                    style={{
                      width: isMobile ? '300px' : 'min(240px, 40%)',
                      height: isMobile ? '300px' : 'auto',
                      aspectRatio: '1',
                      position: 'relative',
                      flexShrink: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      viewBox="0 0 200 200"
                      style={{
                        width: '100%',
                        height: '100%',
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
                                  stroke="var(--color-border)"
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
                                  fill="var(--color-text)"
                                  fontSize="10"
                                  fontWeight="700"
                                  style={{
                                    transform: 'rotate(90deg)',
                                    transformOrigin: `${textX}px ${textY}px`,
                                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
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
                              stroke="var(--color-border)"
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

                      {/* 중앙 원 (다크모드 대응) */}
                      <circle cx="100" cy="100" r="32" fill="var(--color-surface)" filter="drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))" />
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
                            // 옵션 TOP 10 필터는 항상 업데이트
                            setCurrentProductForOptions(item.name);

                            // 그래프에는 이미 선택되지 않았고, 3개 미만일 때만 추가
                            if (!isSelected && selectedProducts.length < 3) {
                              setSelectedProducts([...selectedProducts, item.name]);
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
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface-hover)';
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
                                color: 'var(--color-text)'
                              }}
                            >
                              {item.category3 && <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: '400' }}>{item.category3} / </span>}
                              {item.name}
                            </span>
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                color: 'var(--color-text-secondary)',
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
            <div className="card" style={{
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              height: '480px',
              maxHeight: '480px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ fontSize: '1em', fontWeight: '600', marginBottom: '16px' }}>옵션상품 발주 TOP 10</h3>
              <div style={{ maxHeight: '440px', overflowY: 'auto', flex: 1 }}>
                {optionTop10.length > 0 ? (
                  optionTop10.map((item, idx) => {
                    const isSelected = selectedOptions.includes(item.name);

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          // 이미 선택된 경우 아무 동작 안함 (해제는 그래프 배지에서만)
                          if (!isSelected) {
                            // 최대 3개까지만 선택 가능
                            if (selectedOptions.length < 3) {
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', gridAutoRows: 'min-content' }}>
              {/* 품목별 통계 */}
              <div style={{ minWidth: 0 }}>
              <div style={{ display: 'block' }}>
                {/* 헤더 컨테이너 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '40px', marginBottom: '0' }}>
                  {/* 좌측: 제목 + 선택된 품목 태그 */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6366f1', margin: 0 }}>품목</h3>
                    {selectedProducts.length === 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'var(--color-surface)',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>전체</span>
                      </div>
                    ) : (
                      selectedProducts.map((p, idx) => {
                        const dashStyles = ['0', '4 4', '8 4', '2 2', '8 4 2 4'];
                        return (
                          <div
                            key={p}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'var(--color-surface)',
                              padding: '3px 6px',
                              borderRadius: '8px',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <svg width="20" height="10">
                              <line x1="0" y1="5" x2="20" y2="5" stroke="var(--color-text-secondary)" strokeWidth="1.5"
                                strokeDasharray={dashStyles[idx % dashStyles.length]} />
                            </svg>
                            <span style={{ fontSize: '10px', color: 'var(--color-text)' }}>{p}</span>
                            <button
                              onClick={() => setSelectedProducts(selectedProducts.filter(item => item !== p))}
                              style={{
                                fontSize: '10px',
                                color: 'var(--color-text-secondary)',
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
                      })
                    )}
                  </div>

                  {/* 우측: 시간 단위 버튼 */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['day', 'week', 'month'] as const).map((unit) => {
                      const labels = { day: '일', week: '주', month: '월' };
                      const isActive = productTimeUnit === unit;

                      // 날짜 범위 계산
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                      // 버튼 활성화 조건
                      let isDisabled = false;
                      if (daysDiff <= 7) {
                        // 7일 이하: '주', '월' 비활성화
                        isDisabled = unit === 'week' || unit === 'month';
                      } else if (daysDiff <= 31) {
                        // 7일 초과 31일 이하: '월' 비활성화
                        isDisabled = unit === 'month';
                      }
                      // 31일 초과: 모든 버튼 활성화

                      return (
                        <button
                          key={unit}
                          onClick={() => !isDisabled && setProductTimeUnit(unit)}
                          disabled={isDisabled}
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: isActive ? '1px solid #6366f1' : '1px solid var(--color-border)',
                            background: isDisabled ? 'var(--color-surface)' : isActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-surface)',
                            color: isDisabled ? 'var(--color-text-disabled)' : isActive ? '#6366f1' : 'var(--color-text-secondary)',
                            fontWeight: isActive ? '600' : '400',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                            opacity: isDisabled ? 0.5 : 1
                          }}
                        >
                          {labels[unit]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 그래프 */}
                {productStats.dates.length > 0 && productStats.lines.length > 0 ? (
                  <>
                  <div style={{ height: '300px', marginTop: '8px', marginBottom: '16px', clear: 'both' }}>
                    {/* 메인 그래프 */}
                    <svg viewBox="0 0 1200 424" style={{ width: '100%', height: '100%', display: 'block' }}>
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
                        const chartRight = 1120; // 오른쪽 여백 확보 (1150 -> 1120)
                        const chartTop = 30;
                        const chartBottom = 390;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;

                        // X축 좌우 여백 (차트 폭의 5%씩)
                        const xPadding = chartWidth * 0.05;
                        const usableWidth = chartWidth - 2 * xPadding;

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
                                    stroke="var(--color-border)"
                                    strokeWidth="1"
                                  />
                                  {i !== 0 && (
                                    <text
                                      x={chartLeft - 10}
                                      y={y + 4}
                                      fontSize="18"
                                      fill="var(--color-text-secondary)"
                                      textAnchor="end"
                                    >
                                      {value.toLocaleString()}
                                    </text>
                                  )}
                                </g>
                              );
                            })}

                            {/* 품목 × 마켓 조합별 선 */}
                            {productStats.lines.map((line, lineIdx) => {
                              const points = line.data.map((d, idx) => {
                                const x = chartLeft + xPadding + (idx / divisor) * usableWidth;
                                const y = chartBottom - (d.amount / maxY) * chartHeight;
                                return { x, y };
                              });

                              const smoothPath = createSmoothPath(points);

                              // 전체 마켓일 때 area fill용 path 생성
                              const isMarketTotal = line.market === '전체';
                              let areaPath = '';
                              if (isMarketTotal && points.length > 0) {
                                const firstPoint = points[0];
                                const lastPoint = points[points.length - 1];
                                areaPath = smoothPath + ` L ${lastPoint.x},${chartBottom} L ${firstPoint.x},${chartBottom} Z`;
                              }

                              return (
                                <g key={lineIdx} clipPath="url(#chart-clip-product)">
                                  {/* 전체 마켓일 때만 영역 채우기 */}
                                  {isMarketTotal && (
                                    <path
                                      d={areaPath}
                                      fill="rgba(107, 115, 128, 0.1)"
                                      stroke="none"
                                    />
                                  )}
                                  <path
                                    d={smoothPath}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth="2"
                                    strokeDasharray={line.dashStyle}
                                  />
                                  {line.data.map((d, idx) => {
                                    const x = chartLeft + xPadding + (idx / divisor) * usableWidth;
                                    const y = chartBottom - (d.amount / maxY) * chartHeight;
                                    return (
                                      <g key={idx}>
                                        {/* 투명한 큰 원 - 마우스 영역 */}
                                        <circle
                                          cx={x}
                                          cy={y}
                                          r="12"
                                          fill="transparent"
                                          style={{ cursor: 'pointer' }}
                                          onMouseEnter={(e) => {
                                            // 시간 단위에 따라 날짜 포맷 변경
                                            let displayDate = productStats.dates[idx];
                                            if (productTimeUnit === 'week') {
                                              displayDate = formatWeekForTooltip(productStats.dates[idx]);
                                            } else if (productTimeUnit === 'month') {
                                              // 월 형식 그대로 (YYYY-MM)
                                              displayDate = productStats.dates[idx];
                                            }

                                            setTooltip({
                                              x: e.clientX,
                                              y: e.clientY - 40,
                                              item: line.item,
                                              market: line.market,
                                              date: displayDate,
                                              amount: d.amount
                                            });
                                          }}
                                          onMouseLeave={() => setTooltip(null)}
                                        />
                                        {/* 실제 보이는 작은 점 */}
                                        <circle
                                          cx={x}
                                          cy={y}
                                          r="3"
                                          fill={line.color}
                                          style={{ pointerEvents: 'none' }}
                                        />
                                      </g>
                                    );
                                  })}
                                </g>
                              );
                            })}

                            {/* 매월 1일 세로 격자선 */}
                            {productStats.dates && productStats.dates.map((date, idx) => {
                              const day = parseInt(date.slice(8, 10), 10);
                              if (day !== 1) return null;

                              // 전체 날짜 기준으로 X 좌표 계산
                              const x = chartLeft + xPadding + (idx / divisor) * usableWidth;
                              return (
                                <line
                                  key={`grid-${idx}`}
                                  x1={x}
                                  y1={chartTop}
                                  x2={x}
                                  y2={chartBottom}
                                  stroke="var(--color-border)"
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                />
                              );
                            })}

                            {/* X축 날짜 라벨 */}
                            {productStats.dates && productStats.dates.map((date, idx) => {
                              const totalPeriods = productStats.dates.length;

                              // 날짜 표시 로직
                              let shouldShow = false;

                              // 월보기와 주보기는 모든 라벨 표시 (15개 이하로 제한됨)
                              if (productTimeUnit === 'month' || productTimeUnit === 'week') {
                                shouldShow = true;
                              }
                              // 시작과 종료는 무조건 표시
                              else if (idx === 0 || idx === totalPeriods - 1) {
                                shouldShow = true;
                              } else if (totalPeriods <= 30) {
                                // 30개 이하: 2개 중 1개만 표시
                                if (idx % 2 === 0) {
                                  shouldShow = true;
                                }
                              } else {
                                // 30개 초과: 3개 중 1개만 표시
                                if (idx % 3 === 0) {
                                  shouldShow = true;
                                }
                              }

                              if (!shouldShow) return null;

                              // 전체 날짜 기준으로 X 좌표 계산
                              const x = chartLeft + xPadding + (idx / divisor) * usableWidth;

                              // 시간 단위별 레이블 형식
                              let formattedDate: string;
                              if (productTimeUnit === 'day') {
                                // mm/dd 형식
                                formattedDate = date.slice(5, 7) + '/' + date.slice(8, 10);
                              } else if (productTimeUnit === 'week') {
                                // YYYY-WXX -> 해당 주 월요일 날짜 (mm/dd)
                                const mondayDate = weekKeyToMonday(date);
                                formattedDate = mondayDate.slice(5, 7) + '/' + mondayDate.slice(8, 10);
                              } else {
                                // YYYY-MM -> MM월
                                const month = date.slice(5, 7);
                                formattedDate = month + '월';
                              }

                              // 시작일은 왼쪽 정렬, 마지막은 오른쪽 정렬, 나머지는 중앙 정렬
                              const anchor = idx === 0 ? "start" : idx === totalPeriods - 1 ? "end" : "middle";

                              return (
                                <text
                                  key={idx}
                                  x={x}
                                  y="410"
                                  fontSize="18"
                                  fill="var(--color-text-secondary)"
                                  textAnchor={anchor}
                                >
                                  {formattedDate}
                                </text>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* 범례 컨테이너 */}
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        {/* 전체 버튼 */}
                        <div
                          onClick={() => setShowProductMarketTotal(!showProductMarketTotal)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            opacity: showProductMarketTotal ? 1 : 0.4,
                            padding: '4px 8px',
                            marginLeft: '-8px',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface-hover)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6b7280' }} />
                          <span style={{ fontSize: '11px', fontWeight: showProductMarketTotal ? '600' : '400' }}>전체</span>
                        </div>

                        {/* 개별 마켓 범례 */}
                        {allMarkets.map((market) => {
                          const isSelected = selectedProductMarkets.includes(market);
                          const color = marketColorMap.get(market);
                          return (
                            <div
                              key={market}
                              onClick={() => {
                                // '전체' 모드일 때는 '전체' 해제하고 해당 마켓만 활성화
                                if (showProductMarketTotal) {
                                  setShowProductMarketTotal(false);
                                  setSelectedProductMarkets([market]);
                                } else {
                                  // 개별 모드일 때는 토글
                                  if (isSelected) {
                                    const newMarkets = selectedProductMarkets.filter(m => m !== market);
                                    setSelectedProductMarkets(newMarkets);
                                    // 모든 마켓이 선택 해제되면 '전체' 활성화
                                    if (newMarkets.length === 0) {
                                      setShowProductMarketTotal(true);
                                    }
                                  } else {
                                    setSelectedProductMarkets([...selectedProductMarkets, market]);
                                  }
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                opacity: showProductMarketTotal ? 0.3 : (isSelected ? 1 : 0.4),
                                padding: '4px 8px',
                                marginLeft: '-8px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface-hover)';
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
                  <div style={{ height: '300px', marginTop: '8px', marginBottom: '16px', clear: 'both', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      <div style={{ fontSize: '14px', marginBottom: '8px' }}>좌측에서 품목을 선택하세요</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>최대 5개까지 선택 가능</div>
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* 옵션별 통계 */}
              <div style={{ minWidth: 0 }}>
              <div style={{ display: 'block' }}>
                {/* 헤더 컨테이너 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '40px', marginBottom: '0' }}>
                  {/* 좌측: 제목 + 선택된 옵션 태그 */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#8b5cf6', margin: 0 }}>옵션</h3>
                    {selectedOptions.length === 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'var(--color-surface)',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>전체</span>
                      </div>
                    ) : (
                      selectedOptions.map((o, idx) => {
                        const dashStyles = ['0', '4 4', '8 4', '2 2', '8 4 2 4'];
                        return (
                          <div
                            key={o}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'var(--color-surface)',
                              padding: '3px 6px',
                              borderRadius: '8px',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <svg width="20" height="10">
                              <line x1="0" y1="5" x2="20" y2="5" stroke="#6b7280" strokeWidth="1.5"
                                strokeDasharray={dashStyles[idx % dashStyles.length]} />
                            </svg>
                            <span style={{ fontSize: '10px', color: 'var(--color-text)' }}>{o}</span>
                            <button
                              onClick={() => setSelectedOptions(selectedOptions.filter(item => item !== o))}
                              style={{
                                fontSize: '10px',
                                color: 'var(--color-text-secondary)',
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
                      })
                    )}
                  </div>

                  {/* 우측: 시간 단위 버튼 */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['day', 'week', 'month'] as const).map((unit) => {
                      const labels = { day: '일', week: '주', month: '월' };
                      const isActive = optionTimeUnit === unit;

                      // 날짜 범위 계산
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                      // 버튼 활성화 조건
                      let isDisabled = false;
                      if (daysDiff <= 7) {
                        isDisabled = unit === 'week' || unit === 'month';
                      } else if (daysDiff <= 31) {
                        isDisabled = unit === 'month';
                      }

                      return (
                        <button
                          key={unit}
                          onClick={() => !isDisabled && setOptionTimeUnit(unit)}
                          disabled={isDisabled}
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: isActive ? '1px solid #8b5cf6' : '1px solid var(--color-border)',
                            background: isDisabled ? 'var(--color-surface)' : isActive ? 'rgba(139, 92, 246, 0.1)' : 'var(--color-surface)',
                            color: isDisabled ? 'var(--color-text-disabled)' : isActive ? '#8b5cf6' : 'var(--color-text-secondary)',
                            fontWeight: isActive ? '600' : '400',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                            opacity: isDisabled ? 0.5 : 1
                          }}
                        >
                          {labels[unit]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 그래프 */}
                {optionStats.dates.length > 0 && optionStats.lines.length > 0 ? (
                  <>
                  <div style={{ height: '300px', marginTop: '8px', marginBottom: '16px', clear: 'both' }}>
                    {/* 메인 그래프 */}
                    <svg viewBox="0 0 1200 424" style={{ width: '100%', height: '100%', display: 'block' }}>
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
                        const chartRight = 1120; // 오른쪽 여백 확보 (1150 -> 1120)
                        const chartTop = 30;
                        const chartBottom = 390;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;

                        // X축 좌우 여백 (차트 폭의 5%씩)
                        const xPadding = chartWidth * 0.05;
                        const usableWidth = chartWidth - 2 * xPadding;

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
                                    stroke="var(--color-border)"
                                    strokeWidth="1"
                                  />
                                  {i !== 0 && (
                                    <text
                                      x={chartLeft - 10}
                                      y={y + 4}
                                      fontSize="18"
                                      fill="var(--color-text-secondary)"
                                      textAnchor="end"
                                    >
                                      {value.toLocaleString()}
                                    </text>
                                  )}
                                </g>
                              );
                            })}

                            {/* 옵션 × 마켓 조합별 선 */}
                            {optionStats.lines.map((line, lineIdx) => {
                              const points = line.data.map((d, idx) => {
                                const x = chartLeft + xPadding + (idx / divisor) * usableWidth;
                                const y = chartBottom - (d.amount / maxY) * chartHeight;
                                return { x, y };
                              });

                              const smoothPath = createSmoothPath(points);

                              // 전체 마켓일 때 area fill용 path 생성
                              const isMarketTotal = line.market === '전체';
                              let areaPath = '';
                              if (isMarketTotal && points.length > 0) {
                                const firstPoint = points[0];
                                const lastPoint = points[points.length - 1];
                                areaPath = smoothPath + ` L ${lastPoint.x},${chartBottom} L ${firstPoint.x},${chartBottom} Z`;
                              }

                              return (
                                <g key={lineIdx} clipPath="url(#chart-clip-option)">
                                  {/* 전체 마켓일 때만 영역 채우기 */}
                                  {isMarketTotal && (
                                    <path
                                      d={areaPath}
                                      fill="rgba(107, 115, 128, 0.1)"
                                      stroke="none"
                                    />
                                  )}
                                  <path
                                    d={smoothPath}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth="2"
                                    strokeDasharray={line.dashStyle}
                                  />
                                  {line.data.map((d, idx) => {
                                    const x = chartLeft + xPadding + (idx / divisor) * usableWidth;
                                    const y = chartBottom - (d.amount / maxY) * chartHeight;
                                    return (
                                      <g key={idx}>
                                        {/* 투명한 큰 원 - 마우스 영역 */}
                                        <circle
                                          cx={x}
                                          cy={y}
                                          r="12"
                                          fill="transparent"
                                          style={{ cursor: 'pointer' }}
                                          onMouseEnter={(e) => {
                                            // 시간 단위에 따라 날짜 포맷 변경
                                            let displayDate = optionStats.dates[idx];
                                            if (optionTimeUnit === 'week') {
                                              displayDate = formatWeekForTooltip(optionStats.dates[idx]);
                                            } else if (optionTimeUnit === 'month') {
                                              // 월 형식 그대로 (YYYY-MM)
                                              displayDate = optionStats.dates[idx];
                                            }

                                            setTooltip({
                                              x: e.clientX,
                                              y: e.clientY - 40,
                                              item: line.item,
                                              market: line.market,
                                              date: displayDate,
                                              amount: d.amount
                                            });
                                          }}
                                          onMouseLeave={() => setTooltip(null)}
                                        />
                                        {/* 실제 보이는 작은 점 */}
                                        <circle
                                          cx={x}
                                          cy={y}
                                          r="3"
                                          fill={line.color}
                                          style={{ pointerEvents: 'none' }}
                                        />
                                      </g>
                                    );
                                  })}
                                </g>
                              );
                            })}

                            {/* 매월 1일 세로 격자선 */}
                            {optionStats.dates && optionStats.dates.map((date, idx) => {
                              const day = parseInt(date.slice(8, 10), 10);
                              if (day !== 1) return null;

                              // 전체 날짜 기준으로 X 좌표 계산
                              const x = chartLeft + xPadding + (idx / divisor) * usableWidth;
                              return (
                                <line
                                  key={`grid-${idx}`}
                                  x1={x}
                                  y1={chartTop}
                                  x2={x}
                                  y2={chartBottom}
                                  stroke="var(--color-border)"
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                />
                              );
                            })}

                            {/* X축 날짜 라벨 */}
                            {optionStats.dates && optionStats.dates.map((date, idx) => {
                              const totalPeriods = optionStats.dates.length;

                              // 날짜 표시 로직
                              let shouldShow = false;

                              // 월보기와 주보기는 모든 라벨 표시 (15개 이하로 제한됨)
                              if (optionTimeUnit === 'month' || optionTimeUnit === 'week') {
                                shouldShow = true;
                              }
                              // 시작과 종료는 무조건 표시
                              else if (idx === 0 || idx === totalPeriods - 1) {
                                shouldShow = true;
                              } else if (totalPeriods <= 30) {
                                // 30개 이하: 2개 중 1개만 표시
                                if (idx % 2 === 0) {
                                  shouldShow = true;
                                }
                              } else {
                                // 30개 초과: 3개 중 1개만 표시
                                if (idx % 3 === 0) {
                                  shouldShow = true;
                                }
                              }

                              if (!shouldShow) return null;

                              // 전체 날짜 기준으로 X 좌표 계산
                              const x = chartLeft + xPadding + (idx / divisor) * usableWidth;

                              // 시간 단위별 레이블 형식
                              let formattedDate: string;
                              if (optionTimeUnit === 'day') {
                                // mm/dd 형식
                                formattedDate = date.slice(5, 7) + '/' + date.slice(8, 10);
                              } else if (optionTimeUnit === 'week') {
                                // YYYY-WXX -> 해당 주 월요일 날짜 (mm/dd)
                                const mondayDate = weekKeyToMonday(date);
                                formattedDate = mondayDate.slice(5, 7) + '/' + mondayDate.slice(8, 10);
                              } else {
                                // YYYY-MM -> MM월
                                const month = date.slice(5, 7);
                                formattedDate = month + '월';
                              }

                              // 시작일은 왼쪽 정렬, 마지막은 오른쪽 정렬, 나머지는 중앙 정렬
                              const anchor = idx === 0 ? "start" : idx === totalPeriods - 1 ? "end" : "middle";

                              return (
                                <text
                                  key={idx}
                                  x={x}
                                  y="410"
                                  fontSize="18"
                                  fill="var(--color-text-secondary)"
                                  textAnchor={anchor}
                                >
                                  {formattedDate}
                                </text>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* 범례 컨테이너 */}
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        {/* 전체 버튼 */}
                        <div
                          onClick={() => setShowOptionMarketTotal(!showOptionMarketTotal)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            opacity: showOptionMarketTotal ? 1 : 0.4,
                            padding: '4px 8px',
                            marginLeft: '-8px',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface-hover)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6b7280' }} />
                          <span style={{ fontSize: '11px', fontWeight: showOptionMarketTotal ? '600' : '400' }}>전체</span>
                        </div>

                        {/* 개별 마켓 범례 */}
                        {allMarkets.map((market) => {
                          const isSelected = selectedOptionMarkets.includes(market);
                          const color = marketColorMap.get(market);
                          return (
                            <div
                              key={market}
                              onClick={() => {
                                // '전체' 모드일 때는 '전체' 해제하고 해당 마켓만 활성화
                                if (showOptionMarketTotal) {
                                  setShowOptionMarketTotal(false);
                                  setSelectedOptionMarkets([market]);
                                } else {
                                  // 개별 모드일 때는 토글
                                  if (isSelected) {
                                    const newMarkets = selectedOptionMarkets.filter(m => m !== market);
                                    setSelectedOptionMarkets(newMarkets);
                                    // 모든 마켓이 선택 해제되면 '전체' 활성화
                                    if (newMarkets.length === 0) {
                                      setShowOptionMarketTotal(true);
                                    }
                                  } else {
                                    setSelectedOptionMarkets([...selectedOptionMarkets, market]);
                                  }
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                opacity: showOptionMarketTotal ? 0.3 : (isSelected ? 1 : 0.4),
                                padding: '4px 8px',
                                marginLeft: '-8px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface-hover)';
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
                  <div style={{ height: '300px', marginTop: '8px', marginBottom: '16px', clear: 'both', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      <div style={{ fontSize: '14px', marginBottom: '8px' }}>좌측에서 옵션상품을 선택하세요</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>최대 5개까지 선택 가능</div>
                    </div>
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
              gap: '20px'
            }}
          >
            {/* 최근 7일 발주 현황 */}
            <div className="card" style={{ borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text)' }}>최근 7일 발주 현황</h3>
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
                        <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{item.count}건</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text)', fontWeight: '500' }}>₩{item.amount.toLocaleString()}</span>
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
                        <span style={{ fontSize: '10px', fontWeight: '500', color: 'var(--color-text)' }}>{item.day}</span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{item.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 월별 발주 추이 */}
            <div className="card" style={{ borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text)' }}>월별 발주 추이 (최근 7개월)</h3>
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
                        <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{stat.count}건</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text)', fontWeight: '500' }}>₩{stat.amount.toLocaleString()}</span>
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
                      <span style={{ fontSize: '10px', fontWeight: '500', marginTop: '4px', color: 'var(--color-text)' }}>{stat.month}</span>
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
            border: '1px solid var(--color-border)',
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
