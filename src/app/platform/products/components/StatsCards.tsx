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
}

export default function StatsCards({ stats, isMobile = false }: StatsCardsProps) {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

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
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: isMobile ? '8px' : '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: hoveredStat === idx ? 'translateY(-2px)' : 'none',
            boxShadow: hoveredStat === idx
              ? '0 4px 12px rgba(0,0,0,0.1)'
              : '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: '500',
            color: '#6c757d'
          }}>
            {stat.label}
          </div>
          <div style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700',
            background: stat.bgGradient,
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
