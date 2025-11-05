'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface Holiday {
  id: string;
  holiday_date: string;
  holiday_name: string;
  holiday_type: 'national' | 'temporary' | 'shipping_closed' | 'task' | 'product_info';
}

export default function HolidaysPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add'>('view');
  const [modalType, setModalType] = useState<'temporary' | 'shipping_closed' | 'task' | 'product_info'>('temporary');
  const [holidayName, setHolidayName] = useState('');

  useEffect(() => {
    fetchHolidays();
  }, [year]);

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

  const handleDeleteHoliday = async (holiday: Holiday, fromModal: boolean = false) => {
    if (holiday.holiday_type === 'national') {
      toast.error('국공휴일은 삭제할 수 없습니다.');
      return;
    }

    const typeName = holiday.holiday_type === 'temporary' ? '임시공휴일' : '발송휴무일';
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
      days.push(<div key={`empty-${i}`} className="p-3 bg-gray-50"></div>);
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
            relative p-3 min-h-[100px] border cursor-pointer transition-all duration-200
            ${isWeekend && !holiday ? 'bg-gray-50' : 'bg-white'}
            ${holiday ? 'border-2' : 'border-gray-200'}
            ${holiday?.holiday_type === 'national' ? 'border-red-400 bg-red-50 hover:bg-red-100' : ''}
            ${holiday?.holiday_type === 'temporary' ? 'border-blue-400 bg-blue-50 hover:bg-blue-100' : ''}
            ${holiday?.holiday_type === 'shipping_closed' ? 'border-purple-400 bg-purple-50 hover:bg-purple-100' : ''}
            ${holiday?.holiday_type === 'task' ? 'border-green-400 bg-green-50 hover:bg-green-100' : ''}
            ${holiday?.holiday_type === 'product_info' ? 'border-orange-400 bg-orange-50 hover:bg-orange-100' : ''}
            ${!holiday ? 'hover:bg-blue-50 hover:border-blue-300' : ''}
            hover:shadow-xl hover:z-10 hover:scale-105
          `}
        >
          <div className="mb-2">
            <div className={`
              text-sm font-bold
              ${isToday ? 'w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white' : ''}
              ${!isToday && dayOfWeek === 0 ? 'text-red-600' : ''}
              ${!isToday && dayOfWeek === 6 ? 'text-blue-600' : ''}
              ${!isToday && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-gray-700' : ''}
            `}>
              {day}
            </div>
          </div>
          {holiday && (
            <div className="space-y-1">
              <div className={`
                text-xs font-bold px-2 py-1 rounded inline-block
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
              <div className="text-xs font-semibold text-gray-900 break-words leading-snug mt-1">
                {holiday.holiday_name}
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/settings')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← 설정으로 돌아가기
        </button>
        <h1 className="text-3xl font-bold">일정 관리</h1>
        <p className="text-gray-600 mt-2">
          달력에서 날짜를 클릭하여 공휴일, 휴무일, 할일 등을 관리합니다
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <select
                value={`${year}-${month}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-');
                  setYear(parseInt(y));
                  setMonth(parseInt(m));
                }}
                className="px-4 py-2 bg-white text-gray-800 font-bold rounded-lg border-0 focus:ring-2 focus:ring-white/50"
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
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          <button
            onClick={handleLoadHolidays}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            {year}년 국공휴일 불러오기
          </button>
        </div>
      </div>

      {/* 달력 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-gray-100 border-b">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div
              key={day}
              className={`p-3 text-center font-semibold ${
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

      {/* 범례 */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">범례</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
            <span>국공휴일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
            <span>임시공휴일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-500 rounded"></div>
            <span>발송휴무일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
            <span>할일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded"></div>
            <span>상품정보</span>
          </div>
        </div>
      </div>

      {/* 안내사항 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">사용 방법</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>날짜를 클릭하면 해당 날짜의 일정을 확인하고 관리할 수 있습니다</li>
              <li>모달에서 일정 추가 또는 삭제가 가능합니다 (국공휴일 제외)</li>
              <li>임시공휴일/발송휴무일: 영업일에서 제외되며 연속발주 보너스 계산에 영향을 줍니다</li>
              <li>할일/상품정보: 참고용 일정으로 영업일 계산에는 영향을 주지 않습니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 일정 모달 */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            {modalMode === 'view' ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {selectedDate} 일정
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedDate(null);
                    }}
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
                            onClick={() => handleDeleteHoliday(holiday, true)}
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
                      <label className={`
                        relative flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all
                        ${modalType === 'temporary'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'}
                      `}>
                        <input
                          type="radio"
                          value="temporary"
                          checked={modalType === 'temporary'}
                          onChange={(e) => setModalType(e.target.value as 'temporary' | 'shipping_closed' | 'task' | 'product_info')}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${modalType === 'temporary' ? 'border-blue-500' : 'border-gray-300'}
                        `}>
                          {modalType === 'temporary' && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <span className={`font-medium ${modalType === 'temporary' ? 'text-blue-700' : 'text-gray-700'}`}>
                          임시공휴일
                        </span>
                      </label>
                      <label className={`
                        relative flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all
                        ${modalType === 'shipping_closed'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'}
                      `}>
                        <input
                          type="radio"
                          value="shipping_closed"
                          checked={modalType === 'shipping_closed'}
                          onChange={(e) => setModalType(e.target.value as 'temporary' | 'shipping_closed' | 'task' | 'product_info')}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${modalType === 'shipping_closed' ? 'border-purple-500' : 'border-gray-300'}
                        `}>
                          {modalType === 'shipping_closed' && (
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          )}
                        </div>
                        <span className={`font-medium ${modalType === 'shipping_closed' ? 'text-purple-700' : 'text-gray-700'}`}>
                          발송휴무일
                        </span>
                      </label>
                      <label className={`
                        relative flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all
                        ${modalType === 'task'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-green-300'}
                      `}>
                        <input
                          type="radio"
                          value="task"
                          checked={modalType === 'task'}
                          onChange={(e) => setModalType(e.target.value as 'temporary' | 'shipping_closed' | 'task' | 'product_info')}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${modalType === 'task' ? 'border-green-500' : 'border-gray-300'}
                        `}>
                          {modalType === 'task' && (
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          )}
                        </div>
                        <span className={`font-medium ${modalType === 'task' ? 'text-green-700' : 'text-gray-700'}`}>
                          할일
                        </span>
                      </label>
                      <label className={`
                        relative flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all
                        ${modalType === 'product_info'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-orange-300'}
                      `}>
                        <input
                          type="radio"
                          value="product_info"
                          checked={modalType === 'product_info'}
                          onChange={(e) => setModalType(e.target.value as 'temporary' | 'shipping_closed' | 'task' | 'product_info')}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${modalType === 'product_info' ? 'border-orange-500' : 'border-gray-300'}
                        `}>
                          {modalType === 'product_info' && (
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          )}
                        </div>
                        <span className={`font-medium ${modalType === 'product_info' ? 'text-orange-700' : 'text-gray-700'}`}>
                          상품정보
                        </span>
                      </label>
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
    </div>
  );
}
