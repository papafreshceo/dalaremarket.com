'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [show, setShow] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      // 페이드 아웃 애니메이션을 위해 약간의 지연
      const timer = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isLoading ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* 유리 효과 카드 */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '48px 64px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* 로고 */}
        <div
          className="animate-pulse"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          <Image
            src="/DalraeMarket_loge_trans.png"
            alt="달래마켓"
            width={240}
            height={80}
            priority
            style={{
              objectFit: 'contain',
            }}
          />
        </div>

        {/* 로딩 텍스트 */}
        <div
          style={{
            marginTop: '32px',
            color: '#1a202c',
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '0.05em',
          }}
        >
          데이터를 불러오는 중...
        </div>

        {/* 로딩 바 */}
        <div
          style={{
            marginTop: '24px',
            width: '300px',
            height: '4px',
            background: 'rgba(66, 153, 225, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #4299e1, transparent)',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        </div>
      </div>

      {/* 애니메이션 키프레임 */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
