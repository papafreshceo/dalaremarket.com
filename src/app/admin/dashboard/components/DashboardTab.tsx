'use client';

import { Order, StatusConfig } from '../types';

interface DashboardTabProps {
  isMobile: boolean;
  orders: Order[];
  statusConfig: Record<Order['status'], StatusConfig>;
}

export default function DashboardTab({ isMobile, orders, statusConfig }: DashboardTabProps) {
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
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px',
          border: '1px solid #e5e7eb'
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
              color: '#212529',
              margin: 0
            }}>
              월간 발주 일정
            </h3>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <button style={{
                padding: '6px',
                background: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="#6c757d" strokeWidth="2" fill="none">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529',
                minWidth: '100px',
                textAlign: 'center'
              }}>
                2025년 1월
              </span>
              <button style={{
                padding: '6px',
                background: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="#6c757d" strokeWidth="2" fill="none">
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
              <div key={idx} style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '600',
                color: idx === 0 ? '#ef4444' : idx === 6 ? '#2563eb' : '#6c757d',
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
            {/* 이전 달 날짜 (비활성) */}
            {[29, 30, 31].map(day => (
              <div key={`prev-${day}`} style={{
                padding: '8px 4px',
                textAlign: 'center',
                color: '#cbd5e1',
                fontSize: '13px'
              }}>
                {day}
              </div>
            ))}
            {/* 현재 달 날짜 */}
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
              const isToday = day === 15;
              const hasOrder = [5, 8, 12, 15, 18, 22, 25, 28].includes(day);
              const orderCounts: Record<number, number> = { 5: 3, 8: 2, 12: 4, 15: 1, 18: 5, 22: 2, 25: 3, 28: 4 };
              const orderCount = hasOrder ? orderCounts[day] : 0;
              const dayOfWeek = (day + 2) % 7; // 1일이 수요일

              return (
                <div key={day} style={{
                  position: 'relative',
                  background: isToday ? 'rgba(37, 99, 235, 0.1)' : hasOrder ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                  border: isToday ? '2px solid #2563eb' : hasOrder ? '1px solid #dee2e6' : 'none',
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
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isToday ? '600' : '500',
                    color: dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#2563eb' : isToday ? '#2563eb' : '#212529'
                  }}>
                    {day}
                  </span>
                  {hasOrder && (
                    <>
                      <div style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {orderCount}건
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: '#10b981',
                        fontWeight: '500'
                      }}>
                        ₩{(orderCount * 450).toLocaleString()}K
                      </div>
                    </>
                  )}
                  {isToday && (
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      background: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '3px',
                      padding: '1px 4px',
                      fontSize: '8px',
                      fontWeight: '600'
                    }}>
                      오늘
                    </div>
                  )}
                </div>
              );
            })}
            {/* 다음 달 날짜 (비활성) */}
            {[1].map(day => (
              <div key={`next-${day}`} style={{
                padding: '8px 4px',
                textAlign: 'center',
                color: '#cbd5e1',
                fontSize: '13px'
              }}>
                {day}
              </div>
            ))}
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
                border: '2px solid #2563eb',
                borderRadius: '3px'
              }} />
              <span style={{ color: '#6c757d' }}>오늘</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #dee2e6',
                borderRadius: '3px'
              }} />
              <span style={{ color: '#6c757d' }}>발주일</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                background: '#2563eb',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '9px',
                fontWeight: '500'
              }}>
                N건
              </div>
              <span style={{ color: '#6c757d' }}>발주 건수</span>
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
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              이번달 발주액
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              ₩8,450,000
            </div>
            <div style={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280'
            }}>
              <span style={{ color: '#34d399' }}>▲</span>
              <span>전월 대비 +12.5%</span>
            </div>
          </div>

          {/* 어제 발주액 */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              어제 발주액
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              ₩520,000
            </div>
            <div style={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280'
            }}>
              <span style={{ color: '#fbbf24' }}>▼</span>
              <span>전일 대비 -8.2%</span>
            </div>
          </div>

          {/* 평균 주문액 */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              평균 주문액
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              ₩680,000
            </div>
            <div style={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280'
            }}>
              <span style={{ color: '#34d399' }}>▲</span>
              <span>전월 대비 +5.8%</span>
            </div>
          </div>

          {/* 총 발주 건수 */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              총 발주 건수
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              156건
            </div>
            <div style={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280'
            }}>
              <span style={{ color: '#34d399' }}>▲</span>
              <span>전월 대비 +22건</span>
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
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#212529',
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
              {[60, 45, 75, 85, 70, 90, 95].map((height, idx) => (
                <div key={idx} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '100%',
                    height: `${height}%`,
                    background: idx === 6 ? '#2563eb' : '#93c5fd',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s'
                  }} />
                  <span style={{
                    fontSize: '10px',
                    color: '#6c757d'
                  }}>
                    {['7월', '8월', '9월', '10월', '11월', '12월', '1월'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 판매채널별 발주 비율 */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#212529',
              marginBottom: '16px'
            }}>
              판매채널별 발주 비율
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* 도넛 차트 */}
              <div style={{
                position: 'relative',
                width: '100px',
                height: '100px'
              }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="20"
                    strokeDasharray="75.4 226.2" transform="rotate(-90 50 50)"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20"
                    strokeDasharray="62.8 226.2" strokeDashoffset="-75.4" transform="rotate(-90 50 50)"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20"
                    strokeDasharray="50.3 226.2" strokeDashoffset="-138.2" transform="rotate(-90 50 50)"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20"
                    strokeDasharray="37.7 226.2" strokeDashoffset="-188.5" transform="rotate(-90 50 50)"/>
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#212529'
                  }}>
                    100%
                  </div>
                </div>
              </div>
              {/* 범례 */}
              <div style={{ flex: 1 }}>
                {[
                  { label: '온라인몰', value: '35%', color: '#2563eb' },
                  { label: '오프라인', value: '28%', color: '#10b981' },
                  { label: 'B2B', value: '22%', color: '#f59e0b' },
                  { label: '기타', value: '15%', color: '#8b5cf6' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        background: item.color,
                        borderRadius: '2px'
                      }} />
                      <span style={{
                        fontSize: '12px',
                        color: '#495057'
                      }}>
                        {item.label}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#212529'
                    }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 품목별 발주 TOP 5 */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#212529',
              marginBottom: '16px'
            }}>
              품목별 발주 TOP 5
            </h3>
            <div>
              {[
                { name: '토마토', amount: '₩2,450,000', percent: 85 },
                { name: '딸기', amount: '₩1,980,000', percent: 70 },
                { name: '양파', amount: '₩1,520,000', percent: 55 },
                { name: '감자', amount: '₩980,000', percent: 40 },
                { name: '대파', amount: '₩650,000', percent: 25 }
              ].map((item, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#495057'
                    }}>
                      {idx + 1}. {item.name}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#212529'
                    }}>
                      {item.amount}
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: '#dee2e6',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      background: '#2563eb',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 일별 발주 현황 */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#212529',
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
              {[
                { day: '월', value: 45, amount: '520K' },
                { day: '화', value: 75, amount: '850K' },
                { day: '수', value: 60, amount: '680K' },
                { day: '목', value: 85, amount: '920K' },
                { day: '금', value: 70, amount: '780K' },
                { day: '토', value: 30, amount: '350K' },
                { day: '일', value: 95, amount: '1.2M' }
              ].map((item, idx) => (
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
                    {item.amount}
                  </span>
                  <div style={{
                    width: '100%',
                    height: `${item.value}%`,
                    background: idx === 6 ? '#10b981' : '#93c5fd',
                    borderRadius: '4px 4px 0 0'
                  }} />
                  <span style={{
                    fontSize: '10px',
                    color: '#6c757d'
                  }}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
