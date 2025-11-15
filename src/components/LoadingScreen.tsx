'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [show, setShow] = useState(isLoading);

  // 컴포넌트 마운트 시 즉시 저장된 테마 적용 (platform/orders와 admin만)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // platform/orders 또는 admin 페이지에서만 테마 적용
      if (path.startsWith('/admin') || path.startsWith('/platform/orders')) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } else {
        // 다른 페이지에서는 다크모드 강제 해제
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

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
    <>
      <style jsx>{`
        .loading-screen-bg {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.98) 100%);
        }

        .dark .loading-screen-bg {
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.98) 100%);
        }

        .loading-card {
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .dark .loading-card {
          background: rgba(31, 41, 55, 0.7);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(75, 85, 99, 0.3);
        }

        .loading-text {
          color: #1a202c;
        }

        .dark .loading-text {
          color: #e5e7eb;
        }

        .loading-bar-bg {
          background: rgba(66, 153, 225, 0.2);
        }

        .dark .loading-bar-bg {
          background: rgba(59, 130, 246, 0.2);
        }

        .loading-bar-fill {
          background: linear-gradient(90deg, transparent, #4299e1, transparent);
        }

        .dark .loading-bar-fill {
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

      <div
        className="loading-screen-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
          className="loading-card"
          style={{
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '48px 64px',
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
            className="loading-text"
            style={{
              marginTop: '32px',
              fontSize: '18px',
              fontWeight: '600',
              letterSpacing: '0.05em',
            }}
          >
            데이터를 불러오는 중...
          </div>

          {/* 로딩 바 */}
          <div
            className="loading-bar-bg"
            style={{
              marginTop: '24px',
              width: '300px',
              height: '4px',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              className="loading-bar-fill"
              style={{
                width: '100%',
                height: '100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
