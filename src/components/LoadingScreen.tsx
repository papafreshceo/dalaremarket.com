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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isLoading ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
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
          src="/logo.png"
          alt="달래마켓"
          width={200}
          height={60}
          priority
          style={{
            filter: 'brightness(0) invert(1)', // 흰색으로 변환
          }}
        />
      </div>

      {/* 로딩 텍스트 */}
      <div
        style={{
          marginTop: '32px',
          color: '#ffffff',
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
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
            animation: 'shimmer 1.5s infinite',
          }}
        />
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
