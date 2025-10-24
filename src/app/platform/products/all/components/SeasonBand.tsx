'use client';

import { useState } from 'react';

interface SeasonBandProps {
  seasonStart?: string; // YYYY-MM-DD
  seasonEnd?: string;   // YYYY-MM-DD
  className?: string;
}

export default function SeasonBand({ seasonStart, seasonEnd, className = '' }: SeasonBandProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // 시즌 날짜가 없으면 렌더링하지 않음
  if (!seasonStart || !seasonEnd) return null;

  // 날짜를 월로 변환 (1-12)
  const getMonth = (dateStr: string): number => {
    const date = new Date(dateStr);
    return date.getMonth() + 1; // 0-11 -> 1-12
  };

  // 날짜를 월 내 비율로 변환 (0-1)
  const getMonthProgress = (dateStr: string): number => {
    const date = new Date(dateStr);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return date.getDate() / daysInMonth;
  };

  const startMonth = getMonth(seasonStart);
  const endMonth = getMonth(seasonEnd);
  const startProgress = getMonthProgress(seasonStart);
  const endProgress = getMonthProgress(seasonEnd);

  // 전체 12개월 중 시작 위치 계산 (%)
  const startPosition = ((startMonth - 1 + startProgress) / 12) * 100;

  // 시즌 길이 계산 (%)
  let duration: number;
  if (endMonth >= startMonth) {
    // 같은 해 내
    duration = ((endMonth - startMonth + (endProgress - startProgress)) / 12) * 100;
  } else {
    // 연도를 넘어가는 경우 (예: 12월~2월)
    duration = ((12 - startMonth + endMonth + (endProgress - startProgress)) / 12) * 100;
  }

  // 날짜 포맷팅 (MM월 DD일)
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  return (
    <div className={`relative ${className}`}>
      {/* 시즌 밴드 */}
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* 배경 바 */}
        <div className="h-2 w-full rounded-full bg-gray-100">
          {/* 활성 시즌 구간 */}
          <div
            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200 hover:shadow-md"
            style={{
              width: `${Math.max(duration, 2)}%`, // 최소 2% (너무 작으면 보이지 않음)
              marginLeft: `${startPosition}%`
            }}
          />
        </div>

        {/* 툴팁 */}
        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg z-10 animate-fade-in">
            <div className="flex items-center gap-2">
              <span>{formatDate(seasonStart)}</span>
              <span>~</span>
              <span>{formatDate(seasonEnd)}</span>
            </div>
            {/* 툴팁 화살표 */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        )}
      </div>

      {/* 월 레이블 */}
      <div className="mt-1 flex justify-between text-[9px] sm:text-[10px] text-gray-400 select-none px-0.5">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}
