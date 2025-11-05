'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Download, X, Move } from 'lucide-react';

interface Holiday {
  id: string;
  holiday_date: string;
  holiday_name: string;
  holiday_type: 'national' | 'temporary' | 'shipping_closed' | 'task' | 'product_info';
}

interface CalendarPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarPopup({ isOpen, onClose }: CalendarPopupProps) {
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add'>('view');
  const [modalType, setModalType] = useState<'temporary' | 'shipping_closed' | 'task' | 'product_info'>('temporary');
  const [holidayName, setHolidayName] = useState('');

  // 드래그 관련 상태
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHolidays();
      // 팝업 열릴 때 위치 초기화
      setPosition({ x: 0, y: 0 });
    }
  }, [year, isOpen]);

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/holidays?year=${year}`);
      const result = await response.json();

      if (result.success) {
        setHolidays(result.holidays);
      } else {
        toast.error('공휴일 조회 실패');
      }
    } catch (error) {
      console.error('공휴일 조회 오류:', error);
      toast.error('공휴일 조회 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHolidays = async () => {
    if (!confirm(`${year}년 국공휴일을 불러오시겠습니까?\n기존 국공휴일은 모두 삭제되고 새로 등록됩니다.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/holidays', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchHolidays();
      } else {
        toast.error(result.error || '불러오기 실패');
      }
    } catch (error) {
      console.error('국공휴일 불러오기 오류:', error);
      toast.error('불러오기 중 오류 발생');
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setModalMode('view');
    setShowModal(true);
    setHolidayName('');
  };

  const handleAddHoliday = async () => {
    if (!selectedDate || !holidayName) {
      toast.error('날짜와 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holiday_date: selectedDate,
          holiday_name: holidayName,
          holiday_type: modalType
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('등록되었습니다');
        setModalMode('view');
        setHolidayName('');
        fetchHolidays();
      } else {
        toast.error(result.error || '등록 실패');
      }
    } catch (error) {
      console.error('등록 오류:', error);
      toast.error('등록 중 오류 발생');
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    if (holiday.holiday_type === 'national') {
      toast.error('국공휴일은 삭제할 수 없습니다.');
      return;
    }

    const typeName = holiday.holiday_type === 'temporary' ? '임시공휴일' :
                     holiday.holiday_type === 'shipping_closed' ? '발송휴무일' :
                     holiday.holiday_type === 'task' ? '할일' : '상품정보';
    if (!confirm(`'${holiday.holiday_name}' ${typeName}을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/holidays?id=${holiday.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('삭제되었습니다');
        fetchHolidays();
      } else {
        toast.error(result.error || '삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      toast.error('삭제 중 오류 발생');
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getHolidayForDate = (date: string): Holiday | undefined => {
    return holidays.find(h => h.holiday_date === date);
  };

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const todayDate = today.getDate();

    // 빈 칸 채우기
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 bg-gray-50"></div>);
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const holiday = getHolidayForDate(dateStr);
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = isCurrentMonth && day === todayDate;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(dateStr)}
          className={`
            relative p-2 min-h-[70px] border cursor-pointer transition-all duration-200
            ${isWeekend && !holiday ? 'bg-gray-50' : 'bg-white'}
            ${holiday ? 'border-2' : 'border-gray-200'}
            ${holiday?.holiday_type === 'national' ? 'border-red-400 bg-red-50 hover:bg-red-100' : ''}
            ${holiday?.holiday_type === 'temporary' ? 'border-blue-400 bg-blue-50 hover:bg-blue-100' : ''}
            ${holiday?.holiday_type === 'shipping_closed' ? 'border-purple-400 bg-purple-50 hover:bg-purple-100' : ''}
            ${holiday?.holiday_type === 'task' ? 'border-green-400 bg-green-50 hover:bg-green-100' : ''}
            ${holiday?.holiday_type === 'product_info' ? 'border-orange-400 bg-orange-50 hover:bg-orange-100' : ''}
            ${!holiday ? 'hover:bg-blue-50 hover:border-blue-300' : ''}
            hover:shadow-lg hover:z-10
          `}
        >
          <div className="mb-1">
            <div className={`
              text-xs font-bold
              ${isToday ? 'w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white' : ''}
              ${!isToday && dayOfWeek === 0 ? 'text-red-600' : ''}
              ${!isToday && dayOfWeek === 6 ? 'text-blue-600' : ''}
              ${!isToday && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-gray-700' : ''}
            `}>
              {day}
            </div>
          </div>
          {holiday && (
            <div className="space-y-0.5">
              <div className={`
                text-[10px] font-bold px-1 py-0.5 rounded inline-block
                ${holiday.holiday_type === 'national' ? 'bg-red-500 text-white' : ''}
                ${holiday.holiday_type === 'temporary' ? 'bg-blue-500 text-white' : ''}
                ${holiday.holiday_type === 'shipping_closed' ? 'bg-purple-500 text-white' : ''}
                ${holiday.holiday_type === 'task' ? 'bg-green-500 text-white' : ''}
                ${holiday.holiday_type === 'product_info' ? 'bg-orange-500 text-white' : ''}
              `}>
                {holiday.holiday_type === 'national' && '국공휴일'}
                {holiday.holiday_type === 'temporary' && '임시공휴일'}
                {holiday.holiday_type === 'shipping_closed' && '발송휴무'}
                {holiday.holiday_type === 'task' && '할일'}
                {holiday.holiday_type === 'product_info' && '상품정보'}
              </div>
              <div className="text-[10px] font-semibold text-gray-900 break-words leading-tight">
                {holiday.holiday_name}
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 팝업 배경 */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div
          ref={popupRef}
          className="absolute bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden pointer-events-auto"
          style={{
            left: `calc(50% + ${position.x}px)`,
            top: `calc(50% + ${position.y}px)`,
            transform: 'translate(-50%, -50%)',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl p-6 flex items-center justify-between drag-handle cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-3">
              <Move className="w-5 h-5 text-white/70" />
              <h2 className="text-2xl font-bold text-white">일정 관리</h2>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(95vh-88px)]">
            {/* 컨트롤 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>

                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <select
                      value={`${year}-${month}`}
                      onChange={(e) => {
                        const [y, m] = e.target.value.split('-');
                        setYear(parseInt(y));
                        setMonth(parseInt(m));
                      }}
                      className="px-3 py-1.5 text-gray-800 font-bold rounded border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(y =>
                        Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={`${y}-${m}`} value={`${y}-${m}`}>
                            {y}년 {m}월
                          </option>
                        ))
                      ).flat()}
                    </select>
                  </div>

                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                <button
                  onClick={handleLoadHolidays}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  {year}년 국공휴일 불러오기
                </button>
              </div>
            </div>

            {/* 달력 */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 bg-gray-100 border-b">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                  <div
                    key={day}
                    className={`p-2 text-center text-sm font-semibold ${
                      idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7">
                {renderCalendar()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 일정 모달 */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {modalMode === 'view' ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {selectedDate} 일정
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* 해당 날짜의 일정 목록 */}
                <div className="space-y-2 mb-4">
                  {holidays
                    .filter(h => h.holiday_date === selectedDate)
                    .map(holiday => (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className={`
                            text-xs font-bold px-2 py-1 rounded inline-block mb-1
                            ${holiday.holiday_type === 'national' ? 'bg-red-500 text-white' : ''}
                            ${holiday.holiday_type === 'temporary' ? 'bg-blue-500 text-white' : ''}
                            ${holiday.holiday_type === 'shipping_closed' ? 'bg-purple-500 text-white' : ''}
                            ${holiday.holiday_type === 'task' ? 'bg-green-500 text-white' : ''}
                            ${holiday.holiday_type === 'product_info' ? 'bg-orange-500 text-white' : ''}
                          `}>
                            {holiday.holiday_type === 'national' && '국공휴일'}
                            {holiday.holiday_type === 'temporary' && '임시공휴일'}
                            {holiday.holiday_type === 'shipping_closed' && '발송휴무'}
                            {holiday.holiday_type === 'task' && '할일'}
                            {holiday.holiday_type === 'product_info' && '상품정보'}
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {holiday.holiday_name}
                          </div>
                        </div>
                        {holiday.holiday_type !== 'national' && (
                          <button
                            onClick={() => handleDeleteHoliday(holiday)}
                            className="ml-3 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    ))}

                  {holidays.filter(h => h.holiday_date === selectedDate).length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      등록된 일정이 없습니다
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setModalMode('add')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  일정 추가
                </button>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 -m-6 mb-6 p-6 rounded-t-lg">
                  <h2 className="text-xl font-bold text-white">일정 추가</h2>
                  <p className="text-blue-100 text-sm mt-1">{selectedDate}</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      유형
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'temporary', label: '임시공휴일', color: 'blue' },
                        { value: 'shipping_closed', label: '발송휴무일', color: 'purple' },
                        { value: 'task', label: '할일', color: 'green' },
                        { value: 'product_info', label: '상품정보', color: 'orange' }
                      ].map(type => (
                        <label key={type.value} className={`
                          relative flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all
                          ${modalType === type.value
                            ? `border-${type.color}-500 bg-${type.color}-50`
                            : 'border-gray-200 bg-white hover:border-' + type.color + '-300'}
                        `}>
                          <input
                            type="radio"
                            value={type.value}
                            checked={modalType === type.value}
                            onChange={(e) => setModalType(e.target.value as any)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                            ${modalType === type.value ? `border-${type.color}-500` : 'border-gray-300'}
                          `}>
                            {modalType === type.value && (
                              <div className={`w-2 h-2 rounded-full bg-${type.color}-500`}></div>
                            )}
                          </div>
                          <span className={`font-medium ${modalType === type.value ? `text-${type.color}-700` : 'text-gray-700'}`}>
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      일정 이름
                    </label>
                    <input
                      type="text"
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="예: 회사 임시휴무, 재고정리일 등"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => {
                      setModalMode('view');
                      setHolidayName('');
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddHoliday}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    추가하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
