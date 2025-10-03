'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const menuItems = [
    { name: '대시222보드', href: '/admin/dashboard', icon: '📊' },
    { name: '상품조회', href: '/admin/products', icon: '📦' },
    { name: '주문통합관리', href: '/admin/orders', icon: '📋' },
    { name: '구매관리', href: '/admin/purchase', icon: '🛒' },
    { name: '농가관리', href: '/admin/farms', icon: '🌾' },
    { name: '재고관리', href: '/admin/inventory', icon: '📦' },
    { name: '고객관리', href: '/admin/customers', icon: '👥' },
    { name: '거래처관리', href: '/admin/partners', icon: '🤝' },
    { name: '지출관리', href: '/admin/expense', icon: '💰' },
    { name: '근로자관리', href: '/admin/workers', icon: '👷' },
    { name: '전자문서', href: '/admin/documents', icon: '📄' },
    { name: '업무계획', href: '/admin/planning', icon: '📅' },
    { name: '설정', href: '/admin/settings', icon: '⚙️' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 - relative 포지션으로 변경 */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-semibold">달래마켓 관리자</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">관리자님</span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 본문 영역 */}
      <div className="flex flex-1">
        {/* 사이드바 - sticky로 변경 */}
        <aside className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } bg-white shadow-sm border-r border-gray-200 sticky top-0 h-screen transition-all duration-300`}>
          <nav className="p-4 overflow-y-auto h-full">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">{item.name}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 bg-gray-100">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}