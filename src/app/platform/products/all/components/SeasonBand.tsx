'use client';

import { useState } from 'react';

interface SeasonBandProps {
  seasonStart?: string; // YYYY-MM-DD
  seasonEnd?: string;   // YYYY-MM-DD
  className?: string;
}

export default function SeasonBand({ seasonStart, seasonEnd, className = '' }: SeasonBandProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  console.log('🎯 SeasonBand received:', { seasonStart, seasonEnd });

  // 시즌 날짜가 없으면 플레이스홀더 표시 (디버그용)
  if (!seasonStart || !seasonEnd) {
    return (
      <div className={`${className}`}>
        <div className="h-2 w-full rounded-full bg-gray-100" />
        <div className="mt-1 flex justify-between text-[9px] sm:text-[10px] text-gray-400 select-none px-0.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </div>
    );
  }

  // MM-DD 형식에서 월과 일 추출
  const parseMonthDay = (dateStr: string): { month: number; day: number } => {
    const [month, day] = dateStr.split('-').map(Number);
    return { month, day };
  };

  const start = parseMonthDay(seasonStart);
  const end = parseMonthDay(seasonEnd);

  // 월 내 비율 계산 (0-1)
  const getMonthProgress = (month: number, day: number): number => {
    const daysInMonth = new Date(2024, month, 0).getDate(); // 윤년 고려한 일수
    return day / daysInMonth;
  };

  const startProgress = getMonthProgress(start.month, start.day);
  const endProgress = getMonthProgress(end.month, end.day);

  // 연도를 넘어가는지 확인
  const isYearCrossing = end.month < start.month;

  // 시즌 구간 계산
  let seasonBands: Array<{ start: number; width: number }> = [];

  if (isYearCrossing) {
    // 연도를 넘어가는 경우: 두 구간으로 분리
    // 1) 시작월~12월 말까지
    const firstBandStart = ((start.month - 1 + startProgress) / 12) * 100;
    const firstBandWidth = ((12 - start.month + 1 - startProgress) / 12) * 100;

    // 2) 1월 초~종료월까지
    const secondBandStart = 0;
    const secondBandWidth = ((end.month - 1 + endProgress) / 12) * 100;

    seasonBands = [
      { start: firstBandStart, width: firstBandWidth },
      { start: secondBandStart, width: secondBandWidth }
    ];
  } else {
    // 같은 해 내: 한 구간
    const bandStart = ((start.month - 1 + startProgress) / 12) * 100;
    const bandWidth = ((end.month - start.month + (endProgress - startProgress)) / 12) * 100;
    seasonBands = [{ start: bandStart, width: bandWidth }];
  }

  // 날짜 포맷팅 (MM월 DD일)
  const formatDate = (dateStr: string): string => {
    const [month, day] = dateStr.split('-').map(Number);
    return `${month}월 ${day}일`;
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
        <div className="h-2 w-full rounded-full bg-gray-100 relative">
          {/* 활성 시즌 구간 (한 개 또는 두 개) */}
          {seasonBands.map((band, index) => (
            <div
              key={index}
              className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200 hover:shadow-md absolute top-0"
              style={{
                width: `${Math.max(band.width, 2)}%`, // 최소 2%
                left: `${band.start}%`
              }}
            />
          ))}
        </div>

        {/* 툴팁 */}
        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-gray-900 text-white text-xs px-3 py-1.5 whitespace-nowrap shadow-lg z-[9999] animate-fade-in">
            <div className="flex items-center gap-2">
              <span>{formatDate(seasonStart)}</span>
              <span>~</span>
              <span>{formatDate(seasonEnd)}</span>
            </div>
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
