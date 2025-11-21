'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight, Calendar, Package, Leaf, Sun, Snowflake } from 'lucide-react';

interface ProductItem {
  id: number;
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

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // products_master에서 품목 정보 가져오기
      const { data: productsData, error: productsError } = await supabase
        .from('products_master')
        .select('id, category_3, category_4, supply_status, season_start_date, season_end_date, thumbnail_url')
        .order('category_3')
        .order('category_4');

      if (productsError) {
        console.error('품목 조회 오류:', productsError);
        return;
      }

      // 공급상태 설정 가져오기
      const { data: statusData } = await supabase
        .from('supply_status_settings')
        .select('code, name, color, display_order')
        .order('display_order');

      setProducts(productsData || []);
      setSupplyStatuses(statusData || []);
    } catch (error) {
      console.error('데이터 fetch 오류:', error);
    } finally {
      setLoading(false);
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

  // 년간 캘린더 렌더링
  const renderYearCalendar = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {months.map(month => {
          const monthProducts = products.filter(p => {
            if (!p.season_start_date && !p.season_end_date) return false;
            const monthStr = String(month + 1).padStart(2, '0');
            const startMonth = p.season_start_date?.split('-')[0];
            const endMonth = p.season_end_date?.split('-')[0];
            return startMonth === monthStr || endMonth === monthStr;
          });

          const shippingInMonth = products.filter(p => {
            if (p.supply_status !== '출하중') return false;
            const monthStr = String(month + 1).padStart(2, '0');
            if (!p.season_start_date || !p.season_end_date) return false;

            const start = p.season_start_date;
            const end = p.season_end_date;
            const monthStart = `${monthStr}-01`;
            const monthEnd = `${monthStr}-31`;

            if (end < start) {
              return monthStart <= end || monthEnd >= start;
            }
            return !(monthEnd < start || monthStart > end);
          });

          return (
            <div
              key={month}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setCurrentDate(new Date(currentYear, month, 1));
                setViewMode('month');
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{month + 1}월</span>
                {shippingInMonth.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    출하중 {shippingInMonth.length}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                시작: {products.filter(p => p.season_start_date?.startsWith(String(month + 1).padStart(2, '0'))).length}개
              </div>
              <div className="text-xs text-gray-500">
                종료: {products.filter(p => p.season_end_date?.startsWith(String(month + 1).padStart(2, '0'))).length}개
              </div>
            </div>
          );
        })}
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
          products.map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-white rounded px-2 py-1.5">
              {p.thumbnail_url ? (
                <img
                  src={p.thumbnail_url}
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
          ))
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
