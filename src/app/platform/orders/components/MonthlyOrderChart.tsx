'use client'

import { useMemo } from 'react';

interface Order {
  id: string;
  confirmedAt?: string | null;
  registeredAt?: string | null;
  supplyPrice?: number;
  [key: string]: any;
}

interface MonthlyOrderChartProps {
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

export default function MonthlyOrderChart({ orders, isMobile = false }: MonthlyOrderChartProps) {
  const getBaseDate = (o: Order) => {
    const date = fromDbUTC(o.confirmedAt as any) || fromDbUTC(o.registeredAt as any);
    return date;
  };

  // 월별 발주 추이 (최근 7개월, KST)
  const monthlyStats = useMemo(() => {
    const stats: { month: string; value: number; amount: number; count: number }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    for (let i = 6; i >= 0; i--) {
      const monthStart = new Date(currentYear, currentMonth - 1 - i, 1);
      const ky = toKst(monthStart).getUTCFullYear();
      const km = toKst(monthStart).getUTCMonth();

      let amount = 0;
      let count = 0;

      orders.forEach(o => {
        const b = getBaseDate(o);
        if (!b) return;
        const k = toKst(b);
        if (k.getUTCFullYear() === ky && k.getUTCMonth() === km) {
          amount += o.supplyPrice || 0;
          count += 1;
        }
      });

      stats.push({
        month: `${km + 1}월`,
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
        월별 발주 추이 (최근 7개월)
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
        {monthlyStats.map((stat, idx) => {
          const barHeight = stat.amount > 0 ? Math.max(stat.value * 1.2, 10) : 2;
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
                <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{stat.count}건</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text)', fontWeight: '500' }}>
                  ₩{stat.amount.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  background: idx === monthlyStats.length - 1 ? '#2563eb' : '#93c5fd',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              <span style={{ fontSize: '10px', fontWeight: '500', marginTop: '4px', color: 'var(--color-text)' }}>
                {stat.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
