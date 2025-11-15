'use client'

interface CalendarDay {
  day: number | null;
  isToday?: boolean;
}

interface ProductCalendarProps {
  title: string;
  year: number;
  month: number;
  days: CalendarDay[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isMobile?: boolean;
}

export default function ProductCalendar({
  title,
  year,
  month,
  days,
  onPrevMonth,
  onNextMonth,
  isMobile = false
}: ProductCalendarProps) {
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

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
        {days.map((dayInfo, idx) => (
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
