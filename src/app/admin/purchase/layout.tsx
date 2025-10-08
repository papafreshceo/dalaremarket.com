'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { key: 'saiup', label: '사입', path: '/admin/purchase/saiup' },
    { key: 'buy', label: '지출', path: '/admin/purchase/buy' },
  ]

  const activeTab = tabs.find(tab => pathname.includes(tab.path))?.key || 'saiup'

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">구매관리</h1>
        <p className="mt-1 text-sm text-gray-600">구매 관련 업무를 관리합니다</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => router.push(tab.path)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 페이지 컨텐츠 */}
      {children}
    </div>
  )
}
