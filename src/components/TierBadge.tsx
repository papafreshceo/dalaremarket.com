'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

type Tier = 'light' | 'standard' | 'advance' | 'elite' | 'legend';

const TIER_META: Record<Tier, {
  label: string;
  color: string;     // main neon color
  discount: string;  // 할인율
  Icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
}> = {
  light: {
    label: 'LIGHT',
    color: '#7BE9FF',
    discount: '0.5%',
    Icon: (p) => (
      <svg viewBox="0 0 24 24" {...p}>
        {/* 물방울 외곽 */}
        <path d="M12 2 C9 6 6 9 6 13 C6 16.5 8.5 20 12 20 C15.5 20 18 16.5 18 13 C18 9 15 6 12 2 Z" fill="currentColor" opacity="0.9"/>
        {/* 물방울 하이라이트 */}
        <ellipse cx="10" cy="10" rx="2" ry="3" fill="currentColor" opacity="0.3"/>
      </svg>
    )
  },
  standard: {
    label: 'STANDARD',
    color: '#4BB3FF',
    discount: '1%',
    Icon: (p) => (
      <svg viewBox="0 0 24 24" {...p}>
        {/* 방패 외곽 */}
        <path d="M12 2 L5 6 L5 12 C5 16.5 8 20 12 22 C16 20 19 16.5 19 12 L19 6 Z" fill="currentColor" opacity="0.9"/>
        {/* 방패 내부 강조 라인 */}
        <path d="M12 4 L7 7 L7 12 C7 15.5 9.5 18.5 12 20 C14.5 18.5 17 15.5 17 12 L17 7 Z" fill="currentColor" opacity="0.4"/>
      </svg>
    )
  },
  advance: {
    label: 'ADVANCE',
    color: '#B05CFF',
    discount: '1.5%',
    Icon: (p) => (
      <svg viewBox="0 0 24 24" {...p}>
        {/* 로켓 본체 */}
        <path d="M12 2C12 2 9 6 9 10v7l3 3 3-3v-7C15 6 12 2 12 2z" fill="currentColor"/>
        {/* 왼쪽 날개 */}
        <path d="M9 12L6 14v4l3-2v-4z" fill="currentColor" opacity="0.7"/>
        {/* 오른쪽 날개 */}
        <path d="M15 12l3 2v4l-3-2v-4z" fill="currentColor" opacity="0.7"/>
        {/* 창문 */}
        <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.3"/>
        {/* 불꽃 - 왼쪽 */}
        <path d="M10 20l-1 2 1-1.5z" fill="currentColor" opacity="0.5"/>
        {/* 불꽃 - 중앙 */}
        <path d="M12 20v3l0-2z" fill="currentColor" opacity="0.6"/>
        {/* 불꽃 - 오른쪽 */}
        <path d="M14 20l1 2-1-1.5z" fill="currentColor" opacity="0.5"/>
      </svg>
    )
  },
  elite: {
    label: 'ELITE',
    color: '#24E3A8',
    discount: '2%',
    Icon: (p) => (
      <svg viewBox="0 0 24 24" {...p}>
        <path d="M12 2l2.5 5.5 6 .9-4.3 4.2 1 6-5.2-3-5.2 3 1-6-4.3-4.2 6-.9L12 2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    )
  },
  legend: {
    label: 'LEGEND',
    color: '#FFD447',
    discount: '2.5%',
    Icon: (p) => (
      <svg viewBox="0 0 24 24" {...p}>
        {/* 왕관 베이스 */}
        <path d="M4 16h16v2H4v-2z" fill="currentColor" opacity="0.9"/>
        {/* 왕관 본체 */}
        <path d="M5 8l2.5 3 2-4.5 2.5 4.5 2.5-4.5 2 4.5 2.5-3v8H5v-8z" fill="currentColor"/>
        {/* 중앙 큰 보석 */}
        <circle cx="12" cy="6.5" r="1.5" fill="currentColor" opacity="0.4"/>
        {/* 좌측 보석 */}
        <circle cx="8" cy="9" r="1" fill="currentColor" opacity="0.4"/>
        {/* 우측 보석 */}
        <circle cx="16" cy="9" r="1" fill="currentColor" opacity="0.4"/>
        {/* 왕관 꼭지점 장식 - 좌 */}
        <path d="M7 7l.5-1.5L8 7z" fill="currentColor" opacity="0.8"/>
        {/* 왕관 꼭지점 장식 - 중앙 */}
        <path d="M11.5 4l.5-2 .5 2z" fill="currentColor" opacity="0.8"/>
        {/* 왕관 꼭지점 장식 - 우 */}
        <path d="M16 7l.5-1.5L17 7z" fill="currentColor" opacity="0.8"/>
      </svg>
    )
  },
};

type Props = {
  tier: Tier;
  /** 높이 축약형 배지 (디폴트 true) */
  compact?: boolean;
  /** 라벨 숨김 */
  hideLabel?: boolean;
  /** 애니메이션 강도 (0=없음,1=기본,2=강함) */
  glow?: 0 | 1 | 2;
  /** 아이콘만 표시 (사각형 배경 제거) */
  iconOnly?: boolean;
  className?: string;
};

export default function TierBadge({
  tier, compact = true, hideLabel = false, glow = 1, iconOnly = false, className = ''
}: Props) {
  const meta = TIER_META[tier] || TIER_META['light']; // 기본값 fallback
  const [showTooltip, setShowTooltip] = useState(false);
  const pulse = glow === 0 ? {} : {
    animate: { boxShadow: [
      `0 0 18px 0 ${meta.color}55`,
      `0 0 28px 2px ${meta.color}AA`,
      `0 0 18px 0 ${meta.color}55`
    ]},
    transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const }
  };

  // 아이콘만 표시하는 경우
  if (iconOnly) {
    return (
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer"
          style={{
            // @ts-ignore
            '--tier': meta.color,
            background: '#0b1020',
            border: `1.5px solid ${meta.color}`,
            boxShadow: `0 0 6px ${meta.color}55`
          }}
        >
          {/* Icon */}
          <meta.Icon
            width={16}
            height={16}
            className="relative z-10"
            style={{ color: meta.color, filter: `drop-shadow(0 0 4px ${meta.color})` }}
          />
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 12px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              zIndex: 10000,
              border: `1px solid ${meta.color}40`
            }}
          >
            <div style={{ color: meta.color, marginBottom: '2px', fontSize: '11px', fontWeight: '700' }}>{meta.label}</div>
            <div style={{ color: '#fff', fontSize: '13px' }}>{meta.discount} 할인</div>
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '5px solid rgba(0, 0, 0, 0.9)'
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      style={{
        // CSS 변수로 색 전달
        // @ts-ignore
        '--tier': meta.color,
        borderColor: meta.color
      }}
      {...pulse}
      className={[
        "relative flex items-center gap-2 border rounded-[14px]",
        "bg-[#0b1020] border-[1.5px] px-5",
        compact ? "h-[56px]" : "h-[72px]",
        "text-white tracking-wide",
        className
      ].join(' ')}
    >
      {/* Icon 컨테이너 - 원과 아이콘을 함께 중앙 정렬 */}
      <div className="relative flex items-center justify-center w-9 h-9">
        {/* circle glow ring behind icon */}
        <span
          className="absolute w-9 h-9 rounded-full border-2"
          style={{
            borderColor: 'var(--tier)',
            boxShadow: `0 0 8px var(--tier)`,
            opacity: .5
          }}
        />
        {/* Icon */}
        <meta.Icon
          width={22}
          height={22}
          className="relative z-10"
          style={{ color: 'var(--tier)', filter: 'drop-shadow(0 0 6px var(--tier))' }}
        />
      </div>
      {/* Label */}
      {!hideLabel && (
        <span
          className="font-bold uppercase text-[14px]"
          style={{ color: 'var(--tier)' }}
        >
          {meta.label}
        </span>
      )}
    </motion.div>
  );
}

/** 가로 배열 편의 컴포넌트 */
export function TierRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 p-7 bg-[#0b1020] ${className}`}>
      <TierBadge tier="light" glow={0} />
      <TierBadge tier="standard" glow={0} />
      <TierBadge tier="advance" glow={0} />
      <TierBadge tier="elite" glow={0} />
      <TierBadge tier="legend" glow={0} />
    </div>
  );
}
