'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UserHeader() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const navItems = [
    {
      path: '/platform/products',
      text: '공급상품'
    },
    { path: '/platform/orders', text: '발주시스템' },
    {
      path: '/platform/tools',
      text: '업무도구'
    },
    { path: '/platform/pricing', text: '요금제' },
    { path: '/platform/notice', text: '공지사항' }
  ]

  const isActive = (path: string) => pathname?.startsWith(path)

  // 데스크톱 헤더
  if (!isMobile) {
    return (
      <>
        <div style={{ height: '70px' }} />
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          zIndex: 1000
        }}>
          <div style={{
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 40px'
          }}>
            {/* 로고 */}
            <Link href="/platform/dashboard">
              <img
                src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
                alt="달래마켓"
                style={{ height: '24px', cursor: 'pointer' }}
              />
            </Link>

            {/* 네비게이션 */}
            <nav style={{
              display: 'flex',
              gap: '32px',
              alignItems: 'center'
            }}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    fontSize: '15px',
                    fontWeight: isActive(item.path) ? '600' : '400',
                    color: isActive(item.path) ? '#2563eb' : '#374151',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    position: 'relative'
                  }}
                >
                  {item.text}
                  {isActive(item.path) && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-20px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: '#2563eb'
                    }} />
                  )}
                </Link>
              ))}
            </nav>

            {/* 로그인/로그아웃 */}
            <div>
              {user ? (
                <form action="/api/auth/logout" method="POST" style={{ display: 'inline' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    로그아웃
                  </button>
                </form>
              ) : (
                <Link
                  href="/auth/login"
                  style={{
                    display: 'inline-block',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'linear-gradient(135deg, #5b8def 0%, #2563eb 50%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: '500',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    textDecoration: 'none'
                  }}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </header>
      </>
    )
  }

  // 모바일 헤더
  return (
    <>
      <div style={{ height: '70px' }} />
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        zIndex: 1000,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}>
          {/* 햄버거 메뉴 */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ width: '20px', height: '2px', background: '#212529' }}></div>
            <div style={{ width: '20px', height: '2px', background: '#212529' }}></div>
            <div style={{ width: '20px', height: '2px', background: '#212529' }}></div>
          </button>

          {/* 로고 */}
          <Link href="/platform/dashboard" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <img
              src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
              alt="달래마켓"
              style={{ height: '20px' }}
            />
          </Link>

          {/* 로그인 버튼 */}
          {user ? (
            <form action="/api/auth/logout" method="POST" style={{ display: 'inline' }}>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}
              >
                로그아웃
              </button>
            </form>
          ) : (
            <Link
              href="/auth/login"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                background: 'linear-gradient(135deg, #5b8def 0%, #2563eb 50%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
                textDecoration: 'none'
              }}
            >
              로그인
            </Link>
          )}
        </div>

        {/* 모바일 메뉴 */}
        {showMobileMenu && (
          <div style={{
            position: 'absolute',
            top: '70px',
            left: 0,
            right: 0,
            background: 'white',
            borderBottom: '1px solid #e0e0e0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  fontSize: '15px',
                  color: isActive(item.path) ? '#2563eb' : '#374151',
                  fontWeight: isActive(item.path) ? '600' : '400',
                  textDecoration: 'none',
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                {item.text}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  )
}
