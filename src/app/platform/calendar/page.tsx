'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Package, Leaf, Sun, Snowflake, ChevronDown } from 'lucide-react';

interface ProductItem {
  id: number;
  category_1: string;
  category_2: string;
  category_3: string;
  category_4: string;
  category_4_id?: number;
  supply_status: string;
  season_start_date?: string; // MM-DD
  season_end_date?: string;   // MM-DD
  thumbnail_url?: string;
}

type ViewMode = 'week' | 'month' | 'year';

export default function ProductCalendarPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [supplyStatuses, setSupplyStatuses] = useState<Array<{code: string; name: string; color: string}>>([]);
  const [yearSortByShipping, setYearSortByShipping] = useState(false); // 년간보기 출하순 정렬
  const [selectedCategory1, setSelectedCategory1] = useState<string>(''); // 카테고리1 필터
  const [selectedCategory2, setSelectedCategory2] = useState<string>(''); // 카테고리2 필터
  const [cat1Open, setCat1Open] = useState(false);
  const [cat2Open, setCat2Open] = useState(false);
  const cat1Ref = useRef<HTMLDivElement>(null);
  const cat2Ref = useRef<HTMLDivElement>(null);
  const [categoryImageMap, setCategoryImageMap] = useState<Map<string, string>>(new Map());

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cat1Ref.current && !cat1Ref.current.contains(e.target as Node)) setCat1Open(false);
      if (cat2Ref.current && !cat2Ref.current.contains(e.target as Node)) setCat2Open(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategoryImages(); // 썸네일은 별도로 로딩
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // API를 통해 품목 정보 가져오기 (RLS 우회)
      const response = await fetch('/api/products/calendar');
      const result = await response.json();

      if (!result.success) {
        console.error('품목 조회 오류:', result.error);
        return;
      }

      setProducts(result.products || []);
      setSupplyStatuses(result.supplyStatuses || []);
    } catch (error) {
      console.error('데이터 fetch 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 품목별 대표이미지 별도 로딩 (Cloudinary)
  const fetchCategoryImages = async () => {
    try {
      const response = await fetch('/api/products/all');
      const { success, products: allProducts } = await response.json();
      if (success && allProducts) {
        const newCategoryImageMap = new Map<string, string>(
          allProducts
            .filter((p: any) => p.category_4 && p.category_thumbnail_url)
            .map((p: any) => [p.category_4, p.category_thumbnail_url])
        );
        setCategoryImageMap(newCategoryImageMap);
      }
    } catch (imgError) {
      console.error('대표이미지 조회 오류:', imgError);
    }
  };

  // 현재 날짜 정보
  const today = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // MM-DD를 Date 객체로 변환 (현재 연도 기준)
  const parseSeasonDate = (mmdd: string | undefined, year: number = currentYear): Date | null => {
    if (!mmdd) return null;
    const [month, day] = mmdd.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // 해당 날짜가 시즌 범위에 포함되는지 확인
  const isInSeason = (product: ProductItem, date: Date): boolean => {
    if (!product.season_start_date || !product.season_end_date) return false;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const start = product.season_start_date;
    const end = product.season_end_date;

    // 연도를 넘어가는 경우 (예: 11-01 ~ 02-28)
    if (end < start) {
      return dateKey >= start || dateKey <= end;
    }
    return dateKey >= start && dateKey <= end;
  };

  // 해당 날짜가 시즌 시작일인지 확인
  const isSeasonStart = (product: ProductItem, date: Date): boolean => {
    if (!product.season_start_date) return false;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateKey === product.season_start_date;
  };

  // 해당 날짜가 시즌 종료일인지 확인
  const isSeasonEnd = (product: ProductItem, date: Date): boolean => {
    if (!product.season_end_date) return false;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateKey === product.season_end_date;
  };

  // 주의 시작일 (월요일)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  };

  // 주의 종료일 (일요일)
  const getWeekEnd = (date: Date): Date => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  // 현재 주/월에 시작하는 품목
  const getStartingProducts = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = getWeekEnd(currentDate);
      return products.filter(p => {
        if (!p.season_start_date) return false;
        const startDate = parseSeasonDate(p.season_start_date);
        if (!startDate) return false;
        return startDate >= weekStart && startDate <= weekEnd;
      });
    } else {
      // 월간/년간: 해당 월에 시작하는 품목
      const monthStart = `${String(currentMonth + 1).padStart(2, '0')}-01`;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthEnd = `${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      return products.filter(p => {
        if (!p.season_start_date) return false;
        return p.season_start_date >= monthStart && p.season_start_date <= monthEnd;
      });
    }
  }, [products, currentDate, viewMode, currentMonth, currentYear]);

  // 현재 주/월에 종료하는 품목
  const getEndingProducts = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = getWeekEnd(currentDate);
      return products.filter(p => {
        if (!p.season_end_date) return false;
        const endDate = parseSeasonDate(p.season_end_date);
        if (!endDate) return false;
        return endDate >= weekStart && endDate <= weekEnd;
      });
    } else {
      const monthStart = `${String(currentMonth + 1).padStart(2, '0')}-01`;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthEnd = `${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      return products.filter(p => {
        if (!p.season_end_date) return false;
        return p.season_end_date >= monthStart && p.season_end_date <= monthEnd;
      });
    }
  }, [products, currentDate, viewMode, currentMonth, currentYear]);

  // 출하중인 품목
  const shippingProducts = useMemo(() => {
    return products.filter(p => p.supply_status === '출하중');
  }, [products]);

  // 이전/다음 이동
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setFullYear(d.getFullYear() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 월 캘린더 렌더링
  const renderMonthCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // 이전 달 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 이번 달
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={`py-3 text-center text-sm font-medium ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-24 border-b border-r border-gray-100 bg-gray-50" />;
            }

            const isToday = date.toDateString() === today.toDateString();
            const dayOfWeek = date.getDay();
            const productsStarting = products.filter(p => isSeasonStart(p, date));
            const productsEnding = products.filter(p => isSeasonEnd(p, date));
            const productsInSeason = products.filter(p => isInSeason(p, date) && p.supply_status === '출하중');

            return (
              <div
                key={date.toISOString()}
                className={`h-24 border-b border-r border-gray-100 p-1 overflow-hidden ${
                  isToday ? 'bg-blue-50' : ''
                }`}
              >
                {/* 날짜 */}
                <div className={`text-xs font-medium mb-1 ${
                  dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700'
                } ${isToday ? 'bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                  {date.getDate()}
                </div>

                {/* 이벤트 표시 */}
                <div className="space-y-0.5 overflow-hidden">
                  {productsStarting.slice(0, 2).map(p => (
                    <div
                      key={`start-${p.id}`}
                      className="text-[9px] px-1 py-0.5 bg-green-100 text-green-700 rounded truncate"
                      title={`${p.category_3} / ${p.category_4} 시작`}
                    >
                      <Leaf className="w-2 h-2 inline mr-0.5" />
                      {p.category_4}
                    </div>
                  ))}
                  {productsEnding.slice(0, 2).map(p => (
                    <div
                      key={`end-${p.id}`}
                      className="text-[9px] px-1 py-0.5 bg-orange-100 text-orange-700 rounded truncate"
                      title={`${p.category_3} / ${p.category_4} 종료`}
                    >
                      <Snowflake className="w-2 h-2 inline mr-0.5" />
                      {p.category_4}
                    </div>
                  ))}
                  {(productsStarting.length > 2 || productsEnding.length > 2) && (
                    <div className="text-[8px] text-gray-400">
                      +{Math.max(0, productsStarting.length - 2) + Math.max(0, productsEnding.length - 2)}개 더
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 주간 캘린더 렌더링
  const renderWeekCalendar = () => {
    const weekStart = getWeekStart(currentDate);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 날짜 헤더 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {days.map((date, index) => {
            const isToday = date.toDateString() === today.toDateString();
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            return (
              <div
                key={date.toISOString()}
                className={`py-3 text-center ${isToday ? 'bg-blue-100' : ''}`}
              >
                <div className={`text-xs ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}>
                  {dayNames[index]}
                </div>
                <div className={`text-lg font-semibold ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-900'
                } ${isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 품목 타임라인 */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {days.map((date) => {
            const productsStarting = products.filter(p => isSeasonStart(p, date));
            const productsEnding = products.filter(p => isSeasonEnd(p, date));
            const productsInSeason = products.filter(p => isInSeason(p, date) && p.supply_status === '출하중');

            return (
              <div
                key={date.toISOString()}
                className="border-r border-gray-100 p-2 space-y-1"
              >
                {productsStarting.map(p => (
                  <ProductChip key={`start-${p.id}`} product={p} type="start" />
                ))}
                {productsEnding.map(p => (
                  <ProductChip key={`end-${p.id}`} product={p} type="end" />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 년간 캘린더 렌더링 - 테이블 형태 시즌밴드
  const renderYearCalendar = () => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    // 각 월의 일수 (윤년 고려 - 2024년 기준)
    const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const totalDays = 366; // 윤년 기준

    // 월별 시작 위치 (%) 계산
    const monthStartPercent: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < 12; i++) {
      monthStartPercent.push((cumulative / totalDays) * 100);
      cumulative += daysInMonths[i];
    }

    // MM-DD를 연간 위치(%)로 변환
    const getYearPercent = (mmdd: string): number => {
      const [month, day] = mmdd.split('-').map(Number);
      let dayOfYear = 0;
      for (let i = 0; i < month - 1; i++) {
        dayOfYear += daysInMonths[i];
      }
      dayOfYear += day;
      return (dayOfYear / totalDays) * 100;
    };

    // 시즌밴드 구간 계산
    const getSeasonBands = (startDate: string, endDate: string): Array<{ left: number; width: number }> => {
      const startPercent = getYearPercent(startDate);
      const endPercent = getYearPercent(endDate);

      // 종료일이 시작일보다 앞이면 연도를 넘어가는 경우
      if (endPercent < startPercent) {
        return [
          { left: startPercent, width: 100 - startPercent }, // 시작 ~ 12월 말
          { left: 0, width: endPercent } // 1월 초 ~ 종료
        ];
      }

      return [{ left: startPercent, width: endPercent - startPercent }];
    };

    // 현재 날짜 위치 (%)
    const todayPercent = (() => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      return getYearPercent(`${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    })();

    // 시즌 데이터가 있는 품목만 필터링하고 정렬
    const productsWithSeason = products
      .filter(p => p.season_start_date && p.season_end_date)
      .filter(p => !selectedCategory1 || p.category_1 === selectedCategory1)
      .filter(p => !selectedCategory2 || p.category_2 === selectedCategory2)
      .sort((a, b) => {
        if (yearSortByShipping) {
          // 출하순: 시작일이 빠른 순서대로 정렬
          const aStart = a.season_start_date || '12-31';
          const bStart = b.season_start_date || '12-31';
          return aStart.localeCompare(bStart);
        }
        // 카테고리3 오름차순
        const cat3Compare = (a.category_3 || '').localeCompare(b.category_3 || '', 'ko');
        if (cat3Compare !== 0) return cat3Compare;
        // 카테고리3이 같으면 카테고리4로 정렬
        return (a.category_4 || '').localeCompare(b.category_4 || '', 'ko');
      });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 헤더 - 월 표시 */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {/* 품목명 컬럼 헤더 */}
          <div className="w-52 flex-shrink-0 px-3 py-2 font-medium text-sm text-gray-700 border-r border-gray-200">
            품목명
          </div>
          {/* 월 헤더 */}
          <div className="flex-1 flex">
            {months.map((month, index) => (
              <div
                key={month}
                className="flex-1 text-center py-2 text-xs font-medium text-gray-600 border-r border-gray-100 last:border-r-0"
                style={{ width: `${(daysInMonths[index] / totalDays) * 100}%` }}
              >
                {month}
              </div>
            ))}
          </div>
        </div>

        {/* 품목별 시즌밴드 */}
        <div className="max-h-[600px] overflow-y-auto">
          {productsWithSeason.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              시즌 정보가 등록된 품목이 없습니다.
            </div>
          ) : (
            productsWithSeason.map((product, index) => {
              const bands = getSeasonBands(product.season_start_date!, product.season_end_date!);
              const isShipping = product.supply_status === '출하중';

              return (
                <div
                  key={product.id}
                  className={`flex border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  {/* 품목명 */}
                  <div className="w-52 flex-shrink-0 px-3 py-3 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-700 truncate">
                          <span className="text-gray-400">{product.category_3}</span>
                          <span className="text-gray-300 mx-1">/</span>
                          <span className="font-medium text-gray-900">{product.category_4}</span>
                        </div>
                      </div>
                      {isShipping && (
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="출하중" />
                      )}
                    </div>
                  </div>

                  {/* 시즌밴드 영역 */}
                  <div className="flex-1 relative py-3 px-1">
                    {/* 오늘 표시선 */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                      style={{ left: `${todayPercent}%` }}
                    />

                    {/* 배경 바 */}
                    <div className="relative h-4 bg-gray-100 rounded-sm">
                      {/* 시즌 밴드 */}
                      {bands.map((band, i) => {
                        // 시작일이 30일 이내인지 확인
                        const startPercent = getYearPercent(product.season_start_date!);
                        const isStartingSoon = Math.abs(startPercent - todayPercent) <= (30 / totalDays) * 100 && startPercent >= todayPercent;

                        // 기본 색상 및 살짝 밝은 색상 결정
                        const baseColor = isStartingSoon
                          ? 'rgb(245, 158, 11)' // amber-500
                          : isShipping
                            ? 'rgb(16, 185, 129)' // emerald-500
                            : 'rgb(96, 165, 250)'; // blue-400

                        const endColor = isStartingSoon
                          ? 'rgb(252, 211, 77)' // amber-300
                          : isShipping
                            ? 'rgb(110, 231, 183)' // emerald-300
                            : 'rgb(191, 219, 254)'; // blue-200

                        // 연도 넘어가는 경우: 첫 번째 밴드(12월 말로 끝남)는 단색, 두 번째 밴드만 그라데이션
                        // 연도 안 넘어가는 경우: 그라데이션 적용
                        const isYearCrossing = bands.length === 2;
                        const isEndBand = !isYearCrossing || i === 1; // 실제 종료일이 있는 밴드

                        return (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0"
                            style={{
                              left: `${band.left}%`,
                              width: `${Math.max(band.width, 0.5)}%`,
                              background: isEndBand
                                ? `linear-gradient(to right, ${baseColor} 0%, ${endColor} 100%)`
                                : baseColor
                            }}
                            title={`${product.season_start_date} ~ ${product.season_end_date}`}
                          />
                        );
                      })}

                      {/* 시작일 화살표 마커 (밴드 안쪽, 흰색) */}
                      <div
                        className="absolute top-1/2 z-20 flex items-center justify-center"
                        style={{
                          left: `calc(${getYearPercent(product.season_start_date!)}% + 2px)`,
                          transform: 'translateY(-50%)'
                        }}
                        title={`시작: ${product.season_start_date}`}
                      >
                        <svg width="5" height="8" viewBox="0 0 5 8" className="text-white drop-shadow-sm">
                          <path d="M0 0L5 4L0 8V0Z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 범례 */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-600 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <span>출하중</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 bg-gradient-to-r from-blue-400 to-cyan-400" />
            <span>시즌</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 bg-gradient-to-r from-amber-500 to-orange-400" />
            <span>곧 시작 (30일 이내)</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="6" height="8" viewBox="0 0 6 8" className="text-gray-500">
              <path d="M0 0L6 4L0 8V0Z" fill="currentColor" />
            </svg>
            <span>시작일</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-4 bg-red-400" />
            <span>오늘</span>
          </div>
          <div className="ml-auto text-gray-400">
            총 {productsWithSeason.length}개 품목
          </div>
        </div>
      </div>
    );
  };

  // 품목 칩 컴포넌트
  const ProductChip = ({ product, type }: { product: ProductItem; type: 'start' | 'end' | 'shipping' }) => {
    const bgColor = type === 'start' ? 'bg-green-50 border-green-200' :
                    type === 'end' ? 'bg-orange-50 border-orange-200' :
                    'bg-blue-50 border-blue-200';
    const textColor = type === 'start' ? 'text-green-700' :
                      type === 'end' ? 'text-orange-700' :
                      'text-blue-700';
    const Icon = type === 'start' ? Leaf : type === 'end' ? Snowflake : Sun;

    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${bgColor} ${textColor}`}>
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.category_4}
            className="w-5 h-5 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
            <Package className="w-3 h-3 text-gray-400" />
          </div>
        )}
        <span className="text-xs truncate">
          <span className="text-gray-500">{product.category_3} / </span>
          <span className="font-medium">{product.category_4}</span>
        </span>
        <Icon className="w-3 h-3 flex-shrink-0" />
      </div>
    );
  };

  // 품목 목록 섹션 컴포넌트
  const ProductListSection = ({ title, products, icon: Icon, bgColor, textColor }: {
    title: string;
    products: ProductItem[];
    icon: React.ElementType;
    bgColor: string;
    textColor: string;
  }) => (
    <div className={`rounded-lg border ${bgColor} p-4`}>
      <div className={`flex items-center gap-2 mb-3 ${textColor}`}>
        <Icon className="w-4 h-4" />
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded">{products.length}개</span>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {products.length === 0 ? (
          <div className="text-xs text-gray-400 py-2">해당 품목이 없습니다</div>
        ) : (
          products.map(p => {
            const thumbnailUrl = categoryImageMap.get(p.category_4);
            return (
            <div key={p.id} className="flex items-center gap-2 bg-white rounded px-2 py-1.5">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={p.category_4}
                  className="w-6 h-6 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <span className="text-xs truncate">
                <span className="text-gray-500">{p.category_3} / </span>
                <span className="font-medium text-gray-900">{p.category_4}</span>
              </span>
              {p.season_start_date && p.season_end_date && (
                <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap">
                  {p.season_start_date} ~ {p.season_end_date}
                </span>
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
  );

  // 타이틀 생성
  const getTitle = () => {
    if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = getWeekEnd(currentDate);
      return `${weekStart.getFullYear()}년 ${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 ~ ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
    } else if (viewMode === 'month') {
      return `${currentYear}년 ${currentMonth + 1}월`;
    } else {
      return `${currentYear}년`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">상품캘린더를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-900">상품캘린더</h1>
          </div>

          {/* 뷰 모드 선택 */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['week', 'month', 'year'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'week' ? '주간' : mode === 'month' ? '월간' : '년간'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        {viewMode !== 'year' ? (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                오늘
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
            <div className="w-32" /> {/* 스페이서 */}
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-4">
            {/* 카테고리1 드롭다운 */}
            <div ref={cat1Ref} className="relative">
              <button
                onClick={() => { setCat1Open(!cat1Open); setCat2Open(false); }}
                className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <span>{selectedCategory1 || '전체'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {cat1Open && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-sm z-50 max-h-40 overflow-y-auto">
                  <div
                    onClick={() => { setSelectedCategory1(''); setSelectedCategory2(''); setCat1Open(false); }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer whitespace-nowrap"
                  >
                    전체
                  </div>
                  {Array.from(new Set(products.map(p => p.category_1).filter(Boolean))).sort().map(cat => (
                    <div
                      key={cat}
                      onClick={() => { setSelectedCategory1(cat); setSelectedCategory2(''); setCat1Open(false); }}
                      className={`px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer whitespace-nowrap ${selectedCategory1 === cat ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className="text-gray-300 text-sm">/</span>

            {/* 카테고리2 드롭다운 */}
            <div ref={cat2Ref} className="relative">
              <button
                onClick={() => { setCat2Open(!cat2Open); setCat1Open(false); }}
                className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <span>{selectedCategory2 || '전체'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {cat2Open && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-sm z-50 max-h-40 overflow-y-auto">
                  <div
                    onClick={() => { setSelectedCategory2(''); setCat2Open(false); }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer whitespace-nowrap"
                  >
                    전체
                  </div>
                  {Array.from(new Set(
                    products
                      .filter(p => !selectedCategory1 || p.category_1 === selectedCategory1)
                      .map(p => p.category_2)
                      .filter(Boolean)
                  )).sort().map(cat => (
                    <div
                      key={cat}
                      onClick={() => { setSelectedCategory2(cat); setCat2Open(false); }}
                      className={`px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer whitespace-nowrap ${selectedCategory2 === cat ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 출하순 버튼 */}
            <button
              onClick={() => setYearSortByShipping(!yearSortByShipping)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                yearSortByShipping
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              출하순
            </button>
          </div>
        )}

        {/* 캘린더 */}
        <div className="mb-6">
          {viewMode === 'week' && renderWeekCalendar()}
          {viewMode === 'month' && renderMonthCalendar()}
          {viewMode === 'year' && renderYearCalendar()}
        </div>

        {/* 하단 품목 목록 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProductListSection
            title={viewMode === 'week' ? '이번 주 시작 품목' : '이번 달 시작 품목'}
            products={getStartingProducts}
            icon={Leaf}
            bgColor="bg-green-50 border-green-200"
            textColor="text-green-700"
          />
          <ProductListSection
            title={viewMode === 'week' ? '이번 주 종료 품목' : '이번 달 종료 품목'}
            products={getEndingProducts}
            icon={Snowflake}
            bgColor="bg-orange-50 border-orange-200"
            textColor="text-orange-700"
          />
          <ProductListSection
            title="출하중인 품목"
            products={shippingProducts}
            icon={Sun}
            bgColor="bg-blue-50 border-blue-200"
            textColor="text-blue-700"
          />
        </div>
      </div>
    </div>
  );
}
