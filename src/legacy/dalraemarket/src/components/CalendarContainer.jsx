import { useState, useEffect } from 'react';
import ModernCalendar from './ModernCalendar';

function CalendarContainer() {
  const [calendarStyle, setCalendarStyle] = useState(() => {
    return localStorage.getItem('calendarStyle') || 'modern';
  });

  useEffect(() => {
    localStorage.setItem('calendarStyle', calendarStyle);
  }, [calendarStyle]);

  const styleOptions = [
    { value: 'modern', label: '모던 스타일', icon: '◫' },
    { value: 'grid', label: '그리드 스타일', icon: '⊞' },
    { value: 'list', label: '리스트 스타일', icon: '☰' },
    { value: 'timeline', label: '타임라인 스타일', icon: '━' }
  ];

  const renderCalendar = () => {
    switch(calendarStyle) {
      case 'modern':
        return <ModernCalendar />;
      case 'grid':
        return <div>그리드 캘린더 (준비중)</div>;
      case 'list':
        return <div>리스트 캘린더 (준비중)</div>;
      case 'timeline':
        return <div>타임라인 캘린더 (준비중)</div>;
      default:
        return <ModernCalendar />;
    }
  };

  return (
    <div>
      <select value={calendarStyle} onChange={(e) => setCalendarStyle(e.target.value)}>
        {styleOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.icon} {option.label}
          </option>
        ))}
      </select>
      {renderCalendar()}
    </div>
  );
}

export default CalendarContainer;