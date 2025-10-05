// src/pages/user/DeliveryCalendar.jsx
import { useState, useEffect } from 'react';

function Delivery() {
  const [viewMode, setViewMode] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 공지사항 데이터
  const notices = [
    { id: 1, type: 'holiday', title: '설 연휴 배송 안내', date: '2025.01.25 - 01.30', content: '설 연휴 기간 중 특별 배송 일정이 적용됩니다.' },
    { id: 2, type: 'info', title: '1월 셋째주 배송 일정 변경', date: '2025.01.15', content: '산지 사정으로 일부 상품 배송일이 변경됩니다.' },
    { id: 3, type: 'special', title: '겨울철 신선 배송 안내', date: '2025.01.10', content: '기온 저하로 인한 특별 포장 적용 중입니다.' }
  ];

  // 달력 데이터 생성
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // 이전 달 날짜
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // 현재 달 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = 
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      // 특별 배송일 (예시)
      const specialDays = [5, 15, 25];
      const holidays = [28, 29, 30]; // 설날 예시
      
      days.push({
        day: i,
        isCurrentMonth: true,
        isWeekend,
        isToday,
        isHoliday: holidays.includes(i),
        isSpecial: specialDays.includes(i),
        deliveryStatus: holidays.includes(i) ? 'unavailable' : 
                       specialDays.includes(i) ? 'special' : 
                       isWeekend ? 'unavailable' : 'available'
      });
    }

    // 다음 달 날짜
    const remainingDays = 42 - days.length; // 6주 * 7일
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isNextMonth: true
      });
    }

    return days;
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 연도별 뷰 데이터
  const generateYearView = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push({
        month: i,
        name: monthNames[i],
        holidays: i === 0 ? 3 : i === 1 ? 2 : i === 8 ? 3 : 1
      });
    }
    return months;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #eff6ff, #ffffff 25%, #ffffff)',
      paddingTop: '70px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 배경 장식 */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '-140px',
        width: '260px',
        height: '260px',
        background: '#bfdbfe',
        borderRadius: '999px',
        filter: 'blur(60px)',
        opacity: 0.5,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        right: '-120px',
        bottom: '-140px',
        width: '300px',
        height: '300px',
        background: '#93c5fd',
        borderRadius: '999px',
        filter: 'blur(60px)',
        opacity: 0.5,
        pointerEvents: 'none'
      }} />

      {/* 메인 컨테이너 */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '40px 20px' : '72px 20px'
      }}>
        {/* 헤더 섹션 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: isMobile ? '32px 20px' : '40px',
          border: '1px solid #dee2e6',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#6c757d',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>
                DELIVERY CALENDAR
              </div>
              <h1 style={{
                fontSize: isMobile ? '28px' : '36px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#212529'
              }}>
                배송 캘린더
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#6c757d',
                lineHeight: '1.6'
              }}>
                달래마켓의 배송 가능일을 확인하세요<br />
                공휴일 및 특별 배송일 정보를 제공합니다
              </p>
            </div>

            {/* 뷰 전환 버튼 */}
            <div style={{
              display: 'flex',
              gap: '0',
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '4px'
            }}>
              <button
                onClick={() => setViewMode('month')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'month' ? '#2563eb' : 'transparent',
                  color: viewMode === 'month' ? '#ffffff' : '#6c757d',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                월별
              </button>
              <button
                onClick={() => setViewMode('year')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'year' ? '#2563eb' : 'transparent',
                  color: viewMode === 'year' ? '#ffffff' : '#6c757d',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                연도별
              </button>
            </div>
          </div>

          {/* 안내 박스 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
            padding: '16px',
            background: '#e7f3ff',
            borderRadius: '8px',
            border: '1px solid #93c5fd'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <p style={{
              fontSize: '14px',
              color: '#2563eb',
              margin: 0
            }}>
              평일은 기본 배송, 주말 및 공휴일은 특별 배송 또는 배송 불가입니다.
            </p>
          </div>
        </div>

        {/* 공지사항 섹션 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: isMobile ? '24px 20px' : '32px 40px',
          border: '1px solid #dee2e6',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#212529'
          }}>
            공지사항
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {notices.map(notice => (
              <div key={notice.id} style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  padding: '4px 8px',
                  background: notice.type === 'holiday' ? '#fee2e2' : 
                             notice.type === 'special' ? '#fef3c7' : '#e7f3ff',
                  color: notice.type === 'holiday' ? '#dc3545' : 
                         notice.type === 'special' ? '#f59e0b' : '#2563eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {notice.type === 'holiday' ? '휴무' : 
                   notice.type === 'special' ? '특별' : '안내'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: '#212529'
                  }}>
                    {notice.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginBottom: '2px'
                  }}>
                    {notice.date}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#495057'
                  }}>
                    {notice.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 캘린더 본체 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr',
          gap: '24px'
        }}>
          {/* 캘린더 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: isMobile ? '24px 20px' : '32px 40px',
            border: '1px solid #dee2e6'
          }}>
            {viewMode === 'month' ? (
              <>
                {/* 월별 네비게이션 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <button
                    onClick={handlePrevMonth}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '1px solid #dee2e6',
                      background: '#ffffff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.color = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#dee2e6';
                      e.currentTarget.style.color = '#495057';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#212529'
                  }}>
                    {currentYear}년 {monthNames[currentMonth]}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '1px solid #dee2e6',
                      background: '#ffffff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.color = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#dee2e6';
                      e.currentTarget.style.color = '#495057';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>

                {/* 요일 헤더 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px',
                  marginBottom: '12px'
                }}>
                  {weekDays.map((day, idx) => (
                    <div key={idx} style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: idx === 0 ? '#dc3545' : idx === 6 ? '#2563eb' : '#6c757d',
                      padding: '8px 0'
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
                  {generateCalendarDays().map((dayInfo, idx) => (
                    <div key={idx} style={{
                      border: dayInfo.isToday ? '2px solid #2563eb' : '1px solid #f1f3f5',
                      borderRadius: '8px',
                      padding: isMobile ? '8px' : '12px',
                      minHeight: isMobile ? '80px' : '100px',
                      background: !dayInfo.isCurrentMonth ? '#fafafa' :
                                dayInfo.isToday ? '#e7f3ff' :
                                dayInfo.isHoliday ? '#fee2e2' :
                                dayInfo.isSpecial ? '#fef3c7' :
                                '#ffffff',
                      position: 'relative',
                      transition: 'all 0.2s',
                      cursor: dayInfo.isCurrentMonth ? 'pointer' : 'default'
                    }}
                    onMouseEnter={(e) => {
                      if (dayInfo.isCurrentMonth) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (dayInfo.isCurrentMonth) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: dayInfo.isToday ? '600' : '500',
                        marginBottom: '8px',
                        color: !dayInfo.isCurrentMonth ? '#cbd5e1' :
                              dayInfo.isWeekend && dayInfo.day % 7 === 1 ? '#dc3545' :
                              dayInfo.isWeekend && dayInfo.day % 7 === 0 ? '#2563eb' :
                              '#212529'
                      }}>
                        {dayInfo.day}
                      </div>
                      
                      {dayInfo.isCurrentMonth && dayInfo.deliveryStatus && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          margin: '0 auto',
                          background: dayInfo.deliveryStatus === 'special' ? 'rgba(37, 99, 235, 0.1)' :
                                     dayInfo.deliveryStatus === 'available' ? 'rgba(16, 185, 129, 0.1)' :
                                     'rgba(239, 68, 68, 0.1)'
                        }}>
                          {dayInfo.deliveryStatus === 'special' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4M12 8h.01" />
                            </svg>
                          ) : dayInfo.deliveryStatus === 'available' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          )}
                        </div>
                      )}
                      
                      {dayInfo.isToday && (
                        <div style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          background: '#2563eb',
                          color: '#ffffff',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          오늘
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* 연도별 뷰 */
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                {generateYearView().map((monthData) => (
                  <div
                    key={monthData.month}
                    onClick={() => {
                      setCurrentMonth(monthData.month);
                      setViewMode('month');
                    }}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#dee2e6';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: '#212529'
                    }}>
                      {monthData.name}
                    </h4>
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d'
                    }}>
                      공휴일 {monthData.holidays}일
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 배송 안내 정보 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: isMobile ? '24px 20px' : '32px',
            border: '1px solid #dee2e6',
            height: 'fit-content'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#212529'
            }}>
              발송 안내
            </h3>
            
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#495057',
              marginBottom: '12px'
            }}>
              발송 정책
            </div>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 20px 0',
              fontSize: '13px',
              color: '#6c757d',
              lineHeight: '1.8'
            }}>
              <li>• 영업일: 발송</li>
              <li>• 토요일: 발송 없음</li>
              <li>• 일요일/연휴 마지막날: 상품/산지여건에 따라 발송</li>
              <li>• 공휴일 전날: 발송 휴무</li>
            </ul>

            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#495057',
              marginBottom: '12px'
            }}>
              아이콘 안내
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(37, 99, 235, 0.1)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <span style={{ fontSize: '13px', color: '#495057' }}>
                  특별 배송 가능
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: '13px', color: '#495057' }}>
                  일반 배송 가능
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <span style={{ fontSize: '13px', color: '#495057' }}>
                  배송 불가
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Delivery;