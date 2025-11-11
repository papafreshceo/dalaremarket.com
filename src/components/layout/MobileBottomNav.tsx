'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 모바일이 아니면 하단 네비게이션 숨김
  if (!isMobile) return null;

  const navItems = [
    {
      path: '/platform/products',
      label: '공급상품'
    },
    {
      path: '/platform/orders',
      label: '발주시스템'
    },
    {
      path: '/platform/tools',
      label: '업무도구'
    },
    {
      path: '/platform/organization',
      label: '조직관리'
    },
    {
      path: '/platform/seller-feed',
      label: '셀러피드'
    },
    {
      path: '/platform/notice',
      label: '공지사항'
    },
    {
      path: '/platform/mypage',
      label: '나의정보'
    }
  ];

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'white',
        borderTop: '1px solid #e0e0e0',
        zIndex: 1000,
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <style jsx>{`
        nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          minWidth: 'fit-content',
          padding: '0 8px'
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '70px',
              padding: '4px 8px',
              textDecoration: 'none',
              color: isActive(item.path) ? '#2563eb' : '#6b7280',
              transition: 'color 0.2s'
            }}
          >
            {item.isImage ? (
              <img
                src={item.imageUrl}
                alt={item.label}
                style={{
                  height: '20px',
                  width: 'auto',
                  filter: isActive(item.path) ? 'none' : 'grayscale(100%)',
                  opacity: isActive(item.path) ? 1 : 0.6
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: '15.4px',
                  fontWeight: isActive(item.path) ? '600' : '400',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
