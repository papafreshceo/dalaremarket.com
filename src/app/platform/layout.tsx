'use client'

import { useEffect } from 'react'
import UserHeader from '@/components/layout/UserHeader'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 플랫폼 화면 파비콘 설정
  useEffect(() => {
    // 기존 파비콘 제거
    const existingFavicons = document.querySelectorAll("link[rel*='icon']");
    existingFavicons.forEach(el => el.remove());

    // 플랫폼용 파비콘 추가
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = '/platform-favicon.png';
    document.head.appendChild(link);

    // 타이틀 변경
    document.title = '달래마켓';

    return () => {
      // 컴포넌트 언마운트 시 제거
      link.remove();
    };
  }, []);

  return (
    <>
      <UserHeader />
      {children}
      <MobileBottomNav />
    </>
  )
}
