import { useState } from 'react';

function ModernCalendar() {
  const [selectedDate, setSelectedDate] = useState(12);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2024);

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const deliveryDates = [5, 12, 19, 26];
  const today = 15;

  const changeMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleDateClick = (date) => {
    if (date >= 1 && date <= 31) {
      setSelectedDate(date);
    }
  };

  return (
    <div>
      <div>
        <button onClick={() => changeMonth('prev')}>‹</button>
        <h3>{currentYear}년 {monthNames[currentMonth]}</h3>
        <button onClick={() => changeMonth('next')}>›</button>
      </div>
      
      <div>
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      
      <div>
        {[...Array(35)].map((_, idx) => {
          const date = idx - 5;
          const isCurrentMonth = date >= 1 && date <= 31;
          const hasDelivery = deliveryDates.includes(date);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          
          return (
            <div key={idx} onClick={() => handleDateClick(date)}>
              {isCurrentMonth && (
                <>
                  <div>{date}</div>
                  {hasDelivery && <div>•</div>}
                  {isSelected && hasDelivery && <div>3건</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
      
      <button>캘린더 더보기 →</button>
    </div>
  );
}

export default ModernCalendar;