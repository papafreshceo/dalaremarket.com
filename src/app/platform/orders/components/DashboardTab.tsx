'use client';

import { useMemo } from 'react';
import { Order, StatusConfig } from '../types';

interface DashboardTabProps {
  isMobile: boolean;
  orders: Order[];
  statusConfig: Record<Order['status'], StatusConfig>;
}

export default function DashboardTab({ isMobile, orders, statusConfig }: DashboardTabProps) {
  // 현재 날짜 정보
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // 이번 달 첫날과 마지막 날
  const firstDayOfMonth = useMemo(() => new Date(currentYear, currentMonth - 1, 1), [currentYear, currentMonth]);
  const lastDayOfMonth = useMemo(() => new Date(currentYear, currentMonth, 0), [currentYear, currentMonth]);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 날짜별 주문 집계
  const ordersByDate = useMemo(() => {
    const dateMap: Record<number, { count: number; amount: number }> = {};

    orders.forEach(order => {
      const orderDate = order.registeredAt ? new Date(order.registeredAt) : null;
      if (!orderDate) return;

      if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth - 1) {
        const day = orderDate.getDate();
        if (!dateMap[day]) {
          dateMap[day] = { count: 0, amount: 0 };
        }
        dateMap[day].count++;
        dateMap[day].amount += order.amount || 0;
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
              월간 발주 일정
            </h3>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <button className="bg-white border-gray-200" style={{
                padding: '6px',
                border: '1px solid',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
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
              <button className="bg-white border-gray-200" style={{
                padding: '6px',
                border: '1px solid',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
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
            {/* 이전 달 빈 칸 */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} style={{ padding: '8px 4px' }} />
            ))}

            {/* 현재 달 날짜 */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isToday = day === currentDay;
              const dayData = ordersByDate[day];
              const hasOrder = !!dayData;
              const orderCount = dayData?.count || 0;
              const orderAmount = dayData?.amount || 0;
              const dayOfWeek = (firstDayOfWeek + day - 1) % 7;

              return (
                <div key={day} className={hasOrder && !isToday ? 'bg-white' : ''} style={{
                  position: 'relative',
                  background: isToday ? 'rgba(37, 99, 235, 0.1)' : hasOrder ? undefined : 'transparent',
                  border: isToday ? '2px solid' : hasOrder ? '1px solid' : 'none',
                  borderColor: isToday ? '#2563eb' : hasOrder ? '#dee2e6' : undefined,
                  borderRadius: '8px',
                  padding: '8px 4px',
                  minHeight: '60px',
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
                  <span className={dayOfWeek === 0 ? 'text-danger' : dayOfWeek === 6 || isToday ? 'text-primary' : ''} style={{
                    fontSize: '13px',
                    fontWeight: isToday ? '600' : '500'
                  }}>
                    {day}
                  </span>
                  {hasOrder && (
                    <>
                      <div className="bg-primary" style={{
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {orderCount}건
                      </div>
                      <div className="text-success" style={{
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        ₩{(orderAmount / 1000).toFixed(0)}K
                      </div>
                    </>
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
          </div>

          {/* 캘린더 범례 */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(222, 226, 230, 0.5)',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                background: 'rgba(37, 99, 235, 0.1)',
                border: '2px solid',
                borderColor: '#2563eb',
                borderRadius: '3px'
              }} />
              <span>오늘</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="bg-white border-gray-200" style={{
                width: '12px',
                height: '12px',
                border: '1px solid',
                borderRadius: '3px'
              }} />
              <span>발주일</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="bg-primary" style={{
                color: '#ffffff',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '9px',
                fontWeight: '500'
              }}>
                N건
              </div>
              <span>발주 건수</span>
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
    </div>
  );
}
