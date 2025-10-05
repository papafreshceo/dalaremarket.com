'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  path: string;
  text: string;
  hasSubmenu?: boolean;
  submenu?: { path: string; text: string }[];
  special?: boolean;
  isImage?: boolean;
  imageUrl?: string;
}

export default function UserHeader() {
  const pathname = usePathname();
  const [showSubmenu, setShowSubmenu] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems: NavItem[] = [
    {
      path: '/platform/products',
      text: '공급상품',
      hasSubmenu: true,
      submenu: [
        { path: '/platform/products/all', text: '전체상품' },
        { path: '/platform/products/calendar', text: '상품캘린더' },
        { path: '/platform/products/images', text: '이미지다운로드' }
      ]
    },
    { path: '/platform/orders', text: '발주시스템' },
    {
      path: '/platform/tools',
      text: '업무도구',
      hasSubmenu: true,
      submenu: [
        { path: '/platform/tools/margin-calculator', text: '마진계산기' },
        { path: '/platform/tools/price-simulator', text: '판매가 시뮬레이터' },
        { path: '/platform/tools/order-integration', text: '주문통합 (Excel)' },
        { path: '/platform/tools/option-pricing', text: '옵션가 세팅' },
        { path: '/platform/tools/inventory-tracker', text: '재고 추적기' },
        { path: '/platform/tools/discount-calculator', text: '할인율 계산기' },
        { path: '/platform/tools/sales-analytics', text: '매출 분석' },
        { path: '/platform/tools/customer-message', text: '고객 메시지' },
        { path: '/platform/tools/barcode-generator', text: '바코드 생성기' },
        { path: '/platform/tools/transaction-statement', text: '거래명세서 즉시 발급' },
        { path: '/platform/tools/trend-analysis', text: '트렌드 분석' },
        { path: '/platform/tools/competitor-monitor', text: '경쟁사 모니터링' },
        { path: '/platform/tools/product-name-optimizer', text: '상품명 최적화 도구' },
        { path: '/platform/tools/review-analyzer', text: '리뷰 분석' },
        { path: '/platform/tools/price-recommender', text: '판매가/할인가 추천기' },
        { path: '/platform/tools/category-rank-checker', text: '카테고리 순위 확인' }
      ]
    },
    { path: '/platform/pricing', text: '요금제' },
    { path: '/platform/winwin', text: 'Win-Win', special: true },
    { path: '/platform/notice', text: '공지사항' },
    {
      path: '/platform/seller-feed',
      text: 'Seller Feed',
      isImage: true,
      imageUrl: 'https://res.cloudinary.com/dde1hpbrp/image/upload/v1758988139/Seller_Feed_cgnxok.png'
    },
  ];

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <div style={{ height: '70px' }} />
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        zIndex: 1000
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <Link href="/platform">
              <img
                src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
                alt="달래마켓"
                style={{ height: '30px' }}
              />
            </Link>

            <nav style={{ display: 'flex', gap: '24px' }}>
              {navItems.map(item => (
                <div
                  key={item.path}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => item.hasSubmenu && setShowSubmenu(item.path)}
                  onMouseLeave={() => setShowSubmenu(null)}
                >
                  <Link
                    href={item.path}
                    style={{
                      fontSize: '14px',
                      color: isActive(item.path) ? '#2563eb' : '#212529',
                      fontWeight: isActive(item.path) ? '600' : '400',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {item.isImage ? (
                      <img
                        src={item.imageUrl}
                        alt={item.text}
                        style={{
                          height: '24px',
                          width: 'auto',
                          objectFit: 'contain',
                          filter: isActive(item.path) ? 'none' : 'grayscale(0)',
                          opacity: isActive(item.path) ? 1 : 0.8,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = isActive(item.path) ? '1' : '0.8';
                        }}
                      />
                    ) : (
                      <>
                        {item.text}
                        {item.hasSubmenu && (
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </>
                    )}
                  </Link>

                  {/* Submenu dropdown */}
                  {item.hasSubmenu && showSubmenu === item.path && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '8px',
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      border: '1px solid #e0e0e0',
                      minWidth: item.text === '업무도구' ? '600px' : '200px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      zIndex: 1001,
                      padding: item.text === '업무도구' ? '16px' : '0'
                    }}>
                      {item.text === '업무도구' ? (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0'
                        }}>
                          {item.submenu?.map(subItem => (
                            <Link
                              key={subItem.path}
                              href={subItem.path}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                fontSize: '13px',
                                color: '#212529',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8f9fa';
                                e.currentTarget.style.color = '#2563eb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#212529';
                              }}
                            >
                              <span>{subItem.text}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        item.submenu?.map(subItem => (
                          <Link
                            key={subItem.path}
                            href={subItem.path}
                            style={{
                              display: 'block',
                              padding: '10px 16px',
                              fontSize: '13px',
                              color: '#212529',
                              textDecoration: 'none',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.color = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#212529';
                            }}
                          >
                            {subItem.text}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ fontSize: '14px', color: '#495057' }}>
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 20px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#212529',
                    cursor: 'pointer'
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  style={{
                    padding: '8px 20px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#212529',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  로그인
                </Link>

                <Link
                  href="/auth/register"
                  style={{
                    padding: '8px 20px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
