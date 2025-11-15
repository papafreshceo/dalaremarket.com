'use client'

import { useMemo } from 'react';

interface CalendarDay {
  day: number | null;
  isToday?: boolean;
}

// 새 방식과 옛날 방식 모두 지원
interface ProductCalendarProps {
  // 새 방식 (PlatformContent.tsx에서 사용)
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  // 옛날 방식 (ProductsContent.tsx에서 사용)
  title?: string;
  year?: number;
  month?: number;
  days?: CalendarDay[];
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  isMobile?: boolean;
}

export default function ProductCalendar(props: ProductCalendarProps) {
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // 옛날 방식인지 새 방식인지 확인
  const isOldStyle = props.title !== undefined || props.year !== undefined;

  // 옛날 방식일 때
  if (isOldStyle) {
    const { title = '상품 캘린더', year = 0, month = 0, days = [], onPrevMonth, onNextMonth, isMobile = false } = props;

    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(222, 226, 230, 0.1)',
        borderRadius: '12px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '16px'
      }}>
        {/* 타이틀과 캘린더 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: 0
          }}>{title}</h2>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              onClick={onPrevMonth}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#495057',
                padding: '4px 8px'
              }}
            >‹</button>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#212529'
            }}>
              {year}년 {month + 1}월
            </span>
            <button
              onClick={onNextMonth}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#495057',
                padding: '4px 8px'
              }}
            >›</button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '4px'
        }}>
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '500',
                color: idx === 0 ? '#ef4444' : idx === 6 ? '#2563eb' : '#6c757d',
                padding: '6px 0'
              }}
            >
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
          {days?.map((dayInfo, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid rgba(241, 243, 245, 0.1)',
                borderRadius: '6px',
                padding: '6px',
                minHeight: '40px',
                background: dayInfo.day ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
            >
              {dayInfo.day && (
                <div style={{
                  fontSize: '12px',
                  fontWeight: dayInfo.isToday ? '600' : '400',
                  color: dayInfo.isToday ? '#2563eb' : '#212529'
                }}>
                  {dayInfo.day}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 새 방식일 때
  const { currentMonth = new Date(), onMonthChange, isMobile = false } = props;

  // Generate calendar days from currentMonth
  const { year, month, days } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const days: CalendarDay[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null });
    }

    // Add all days of the month
    for (let day = 1; day <= totalDays; day++) {
      days.push({
        day,
        isToday: isCurrentMonth && day === today.getDate()
      });
    }

    return { year, month, days };
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange?.(newDate);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(222, 226, 230, 0.1)',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '24px',
      marginBottom: '16px'
    }}>
      {/* 타이틀과 캘린더 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: 0
        }}>상품 캘린더</h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={handlePrevMonth}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#495057',
              padding: '4px 8px'
            }}
          >‹</button>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#212529'
          }}>
            {year}년 {month + 1}월
          </span>
          <button
            onClick={handleNextMonth}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#495057',
              padding: '4px 8px'
            }}
          >›</button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '4px'
      }}>
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '500',
              color: idx === 0 ? '#ef4444' : idx === 6 ? '#2563eb' : '#6c757d',
              padding: '6px 0'
            }}
          >
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
        {days?.map((dayInfo, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid rgba(241, 243, 245, 0.1)',
              borderRadius: '6px',
              padding: '6px',
              minHeight: '40px',
              background: dayInfo.day ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            {dayInfo.day && (
              <div style={{
                fontSize: '12px',
                fontWeight: dayInfo.isToday ? '600' : '400',
                color: dayInfo.isToday ? '#2563eb' : '#212529'
              }}>
                {dayInfo.day}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
