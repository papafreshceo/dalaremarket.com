'use client'

import { useMemo } from 'react';

interface Order {
  id: string;
  confirmedAt?: string | null;
  registeredAt?: string | null;
  supplyPrice?: number;
  [key: string]: any;
}

interface WeeklyOrderChartProps {
  orders: Order[];
  isMobile?: boolean;
}

// UTC to KST 변환
function toKst(utcDate: Date): Date {
  const kst = new Date(utcDate);
  kst.setHours(kst.getHours() + 9);
  return kst;
}

// DB UTC string to Date
function fromDbUTC(dbUtc: string): Date | null {
  if (!dbUtc) return null;
  return new Date(dbUtc);
}

// 날짜 포맷 (KST)
function ymdKst(date: Date): string {
  const k = toKst(date);
  const y = k.getUTCFullYear();
  const m = String(k.getUTCMonth() + 1).padStart(2, '0');
  const d = String(k.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 같은 날짜인지 비교 (KST)
function isSameYmdKst(date1: Date, date2: Date): boolean {
  return ymdKst(date1) === ymdKst(date2);
}

export default function WeeklyOrderChart({ orders, isMobile = false }: WeeklyOrderChartProps) {
  const getBaseDate = (o: Order) => {
    const date = fromDbUTC(o.confirmedAt as any) || fromDbUTC(o.registeredAt as any);
    return date;
  };

  // 이번 주 통계 (일요일~토요일, KST)
  const weeklyStats = useMemo(() => {
    const stats: { day: string; date: string; value: number; amount: number; count: number }[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // 이번 주 일요일 찾기
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0(일) ~ 6(토)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek); // 이번 주 일요일

    // 일요일(0)부터 토요일(6)까지 순회
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);

      let amount = 0;
      let count = 0;

      orders.forEach(o => {
        const base = getBaseDate(o);
        if (!base) return;
        if (isSameYmdKst(base, d)) {
          amount += o.supplyPrice || 0;
          count += 1;
        }
      });

      const k = toKst(d);
      stats.push({
        day: dayNames[i], // i가 0이면 '일', 1이면 '월'...
        date: `${k.getUTCMonth() + 1}/${k.getUTCDate()}`,
        value: 0,
        amount,
        count
      });
    }

    const maxAmount = Math.max(...stats.map(s => s.amount), 1);
    stats.forEach(s => {
      s.value = (s.amount / maxAmount) * 100;
    });

    return stats;
  }, [orders]);

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(222, 226, 230, 0.1)', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text)' }}>
        이번 주 발주 현황
      </h3>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '180px',
          gap: '8px',
          position: 'relative'
        }}
      >
        {weeklyStats.map((item, idx) => {
          const barHeight = item.amount > 0 ? Math.max(item.value * 1.2, 10) : 2;
          // 오늘 요일 계산 (일요일=0 부터 시작)
          const today = new Date();
          const todayDayOfWeek = today.getDay();
          const isToday = idx === todayDayOfWeek;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                height: '100%',
                justifyContent: 'flex-end'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  marginBottom: '4px'
                }}
              >
                <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{item.count}건</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text)', fontWeight: '500' }}>
                  ₩{item.amount.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  background: isToday ? '#10b981' : '#93c5fd',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  marginTop: '4px'
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    color: idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : 'var(--color-text-secondary)'
                  }}
                >
                  {item.date}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '500',
                    color: idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : 'var(--color-text)'
                  }}
                >
                  {item.day}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
