'use client'

import { useState } from 'react';

interface Stat {
  label: string;
  value: string;
  color: string;
  bgGradient: string;
}

interface StatsCardsProps {
  stats: Stat[];
  isMobile?: boolean;
  designSettings?: any;
}

export default function StatsCards({ stats, isMobile = false, designSettings }: StatsCardsProps) {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  // 디자인 설정에서 값 가져오기
  const cardBackground = designSettings?.components?.card?.background || 'rgba(255, 255, 255, 0.1)';
  const borderColor = designSettings?.border?.light?.color || 'rgba(222, 226, 230, 0.1)';
  const borderRadius = designSettings?.border?.radius?.medium || '8px';
  const labelColor = designSettings?.colors?.neutral?.tones?.dark || '#6c757d';
  const shadowHover = designSettings?.shadow?.medium || '0 4px 12px rgba(0,0,0,0.1)';
  const shadowDefault = designSettings?.shadow?.small || '0 1px 3px rgba(0,0,0,0.05)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginBottom: '24px'
    }}>
      {stats.map((stat, idx) => (
        <div
          key={idx}
          onMouseEnter={() => setHoveredStat(idx)}
          onMouseLeave={() => setHoveredStat(null)}
          style={{
            position: 'relative',
            background: cardBackground,
            border: `1px solid ${borderColor}`,
            borderRadius: borderRadius,
            padding: isMobile ? '8px' : '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: hoveredStat === idx ? 'translateY(-2px)' : 'none',
            boxShadow: hoveredStat === idx ? shadowHover : shadowDefault
          }}
        >
          <div style={{
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: '500',
            color: labelColor
          }}>
            {stat.label}
          </div>
          <div style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700',
            backgroundImage: stat.bgGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
