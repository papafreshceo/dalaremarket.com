'use client';

import { useMemo, useState } from 'react';
import { Order, StatusConfig } from '../types';
import DatePicker from '@/components/ui/DatePicker';

interface DashboardTabProps {
  isMobile: boolean;
  orders: Order[];
  statusConfig: Record<Order['status'], StatusConfig>;
}

export default function DashboardTab({ isMobile, orders, statusConfig }: DashboardTabProps) {
  const [hoveredBadge, setHoveredBadge] = useState<{ type: string; amount: number; position: { x: number; y: number } } | null>(null);

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
    const stats: { day: string; value: number; amount: number }[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      let dayAmount = 0;
      orders.forEach(order => {
        const orderDate = order.registeredAt ? new Date(order.registeredAt) : null;
        if (!orderDate) return;

        if (
          orderDate.getFullYear() === date.getFullYear() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getDate() === date.getDate()
        ) {
          dayAmount += order.amount || 0;
        }
      });

      stats.push({
        day: dayNames[date.getDay()],
        value: dayAmount,
        amount: dayAmount
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
    const stats: { month: string; value: number; amount: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      let monthAmount = 0;

      orders.forEach(order => {
        const orderDate = order.registeredAt ? new Date(order.registeredAt) : null;
        if (!orderDate) return;

        if (
          orderDate.getFullYear() === date.getFullYear() &&
          orderDate.getMonth() === date.getMonth()
        ) {
          monthAmount += order.amount || 0;
        }
      });

      stats.push({
        month: `${date.getMonth() + 1}월`,
        value: monthAmount,
        amount: monthAmount
      });
    }

    // Normalize heights
    const maxAmount = Math.max(...stats.map(s => s.amount), 1);
    stats.forEach(s => {
      s.value = (s.amount / maxAmount) * 100;
    });

    return stats;
  }, [orders, currentYear, currentMonth]);

  // 옵션명별 TOP 5
  const optionTop5 = useMemo(() => {
    const optionMap: Record<string, number> = {};

    orders.forEach(order => {
      const optionName = order.optionName || '미지정';
      if (!optionMap[optionName]) {
        optionMap[optionName] = 0;
      }
      optionMap[optionName] += order.amount || 0;
    });

    const sorted = Object.entries(optionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const maxAmount = sorted[0]?.[1] || 1;

    return sorted.map(([name, amount]) => ({
      name,
      amount,
      percent: (amount / maxAmount) * 100
    }));
  }, [orders]);

  return (
    <div>
      {/* 통계 대시보드 섹션 */}
      <div style={{
        background: 'transparent',
        borderRadius: '16px',
        padding: 0,
        marginBottom: 0
      }}>

        {/* 발주 캘린더 */}
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

        {/* 날짜 필터 */}
        <div className="card" style={{
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            alignItems: 'center'
          }}>
            {/* 날짜 입력 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <DatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="시작일"
                maxDate={endDate || undefined}
              />
              <span style={{ color: '#6b7280' }}>~</span>
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
              gap: '6px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <button
                onClick={handleToday}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '400',
                  border: '1px solid',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '20px'
                }}
              >
                오늘
              </button>
              <button
                onClick={handleYesterday}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '400',
                  border: '1px solid',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '20px'
                }}
              >
                어제
              </button>
              <button
                onClick={() => setDateRange(7)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '400',
                  border: '1px solid',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '20px'
                }}
              >
                7일
              </button>
              <button
                onClick={() => setDateRange(30)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '400',
                  border: '1px solid',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '20px'
                }}
              >
                30일
              </button>
              <button
                onClick={() => setDateRange(90)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '400',
                  border: '1px solid',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '20px'
                }}
              >
                90일
              </button>
              <button
                onClick={() => setDateRange(365)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '400',
                  border: '1px solid',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '20px'
                }}
              >
                1년
              </button>
              <button
                onClick={handleThisYear}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '400',
                  border: '1px solid',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '20px'
                }}
              >
                올해
              </button>
            </div>
          </div>
        </div>

        {/* 주요 지표 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '40px'
        }}>
          {/* 이번달 발주액 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              이번달 발주액
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              ₩{thisMonthStats.totalAmount.toLocaleString()}
            </div>
            <div style={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280'
            }}>
              <span className="text-success">📊</span>
              <span>{thisMonthStats.totalCount}건</span>
            </div>
          </div>

          {/* 어제 발주액 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              어제 발주액
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              ₩{yesterdayStats.totalAmount.toLocaleString()}
            </div>
            <div style={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280'
            }}>
              <span>📈</span>
              <span>{yesterdayStats.totalCount}건</span>
            </div>
          </div>

          {/* 평균 주문액 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              평균 주문액
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              ₩{Math.round(thisMonthStats.avgAmount).toLocaleString()}
            </div>
            <div style={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280'
            }}>
              <span>💰</span>
              <span>이번달 기준</span>
            </div>
          </div>

          {/* 총 발주 건수 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              총 발주 건수
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              {orders.length}건
            </div>
            <div style={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280'
            }}>
              <span>📝</span>
              <span>전체 주문</span>
            </div>
          </div>
        </div>

        {/* 차트 영역 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '32px'
        }}>
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
              월별 발주 추이
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '120px',
              gap: '8px'
            }}>
              {monthlyStats.map((stat, idx) => (
                <div key={idx} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '100%',
                    height: `${stat.value || 5}%`,
                    background: idx === monthlyStats.length - 1 ? '#2563eb' : '#93c5fd',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s'
                  }} />
                  <span style={{
                    fontSize: '10px',
                  }}>
                    {stat.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 옵션명별 발주 TOP 5 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              옵션명별 발주 TOP 5
            </h3>
            <div>
              {optionTop5.length > 0 ? optionTop5.map((item, idx) => (
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
                      transition: 'width 0.3s'
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

          {/* 일별 발주 현황 */}
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
              height: '100px',
              gap: '8px'
            }}>
              {last7DaysStats.map((item, idx) => (
                <div key={idx} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    {item.amount >= 1000000
                      ? `${(item.amount / 1000000).toFixed(1)}M`
                      : `${(item.amount / 1000).toFixed(0)}K`}
                  </span>
                  <div style={{
                    width: '100%',
                    height: `${item.value || 5}%`,
                    background: idx === 6 ? '#10b981' : '#93c5fd',
                    borderRadius: '4px 4px 0 0'
                  }} />
                  <span style={{
                    fontSize: '10px',
                  }}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 상태별 주문 현황 */}
          <div className="card" style={{
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              상태별 주문 현황
            </h3>
            <div>
              {Object.entries(statusConfig).map(([status, config], idx) => {
                const count = orders.filter(o => o.status === status).length;
                const percent = orders.length > 0 ? (count / orders.length) * 100 : 0;

                return (
                  <div key={idx} style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '12px',
                      }}>
                        {config.label}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                      }}>
                        {count}건
                      </span>
                    </div>
                    <div className="border-gray-200" style={{
                      height: '6px',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: config.color,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                );
              })}
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
