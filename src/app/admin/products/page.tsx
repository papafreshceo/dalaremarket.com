// app/admin/products/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui'

export default function ProductsMainPage() {
  const router = useRouter()

  const menuItems = [
    {
      title: '원물관리',
      description: '원물 정보, 시세, 거래처를 통합 관리합니다',
      href: '/admin/products/raw-materials',
      icon: '🌾',
      color: 'bg-green-500',
      stats: {
        label: '등록 원물',
        value: '1,234개'
      }
    },
    {
      title: '옵션상품관리',
      description: '판매 상품의 옵션과 가격을 관리합니다',
      href: '/admin/products/option-products',
      icon: '📦',
      color: 'bg-blue-500',
      stats: {
        label: '등록 상품',
        value: '456개'
      }
    },
    {
      title: '카테고리 설정',
      description: '상품 분류 체계를 관리합니다',
      href: '/admin/settings/categories',
      icon: '📂',
      color: 'bg-purple-500',
      stats: {
        label: '카테고리',
        value: '12개'
      }
    },
    {
      title: '가격표 관리',
      description: '고객별 가격표를 생성하고 관리합니다',
      href: '/admin/products/price-table',
      icon: '💰',
      color: 'bg-yellow-500',
      stats: {
        label: '가격표',
        value: '8개'
      }
    },
    {
      title: '재고 현황',
      description: '실시간 재고 현황을 확인합니다',
      href: '/admin/products/inventory',
      icon: '📊',
      color: 'bg-indigo-500',
      stats: {
        label: '총 재고',
        value: '₩2.5억'
      }
    },
    {
      title: '일괄 업로드',
      description: '엑셀로 상품 정보를 일괄 등록합니다',
      href: '/admin/products/bulk-upload',
      icon: '📤',
      color: 'bg-orange-500',
      stats: {
        label: '최근 업로드',
        value: '3일 전'
      }
    },
    {
      title: '바코드 관리',
      description: '상품 바코드를 생성하고 출력합니다',
      href: '/admin/products/barcode',
      icon: '🏷️',
      color: 'bg-pink-500',
      stats: {
        label: '바코드',
        value: '890개'
      }
    },
    {
      title: '시세 분석',
      description: '원물 시세 변동 추이를 분석합니다',
      href: '/admin/products/price-analysis',
      icon: '📈',
      color: 'bg-teal-500',
      stats: {
        label: '평균 변동률',
        value: '+2.3%'
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">상품관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          원물과 상품을 체계적으로 관리합니다
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 원물</p>
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-xs text-green-600">+12% 전월 대비</p>
            </div>
            <div className="text-3xl">🌾</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">활성 상품</p>
              <p className="text-2xl font-bold">456</p>
              <p className="text-xs text-blue-600">+8% 전월 대비</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">오늘 시세 등록</p>
              <p className="text-2xl font-bold">23</p>
              <p className="text-xs text-orange-600">업데이트 필요: 45</p>
            </div>
            <div className="text-3xl">💱</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">재고 부족</p>
              <p className="text-2xl font-bold">15</p>
              <p className="text-xs text-red-600">즉시 확인 필요</p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </Card>
      </div>

      {/* 메뉴 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block group"
          >
            <div className="bg-white shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center text-white text-2xl`}>
                  {item.icon}
                </div>
                {item.stats && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{item.stats.label}</p>
                    <p className="text-sm font-bold text-gray-900">{item.stats.value}</p>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {item.description}
              </p>
              
              <div className="flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span>바로가기</span>
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 빠른 작업 */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">빠른 작업</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/admin/products/raw-materials')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              🌾 원물 등록
            </button>
            <button
              onClick={() => router.push('/admin/products/option-products')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              📦 상품 등록
            </button>
            <button
              onClick={() => router.push('/admin/products/bulk-upload')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
            >
              📤 엑셀 업로드
            </button>
            <button
              onClick={() => router.push('/admin/products/price-analysis')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm"
            >
              📈 시세 분석
            </button>
            <button
              onClick={() => alert('재고 실사를 시작합니다')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              📋 재고 실사
            </button>
          </div>
        </div>
      </Card>

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="최근 등록 원물">
          <div className="space-y-3">
            {[
              { name: '양파', code: 'VEG001', time: '10분 전', status: '공급중' },
              { name: '대파', code: 'VEG002', time: '30분 전', status: '공급중' },
              { name: '당근', code: 'VEG003', time: '1시간 전', status: '일시중단' },
              { name: '감자', code: 'VEG004', time: '2시간 전', status: '공급중' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{item.time}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.status === '공급중' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="시세 변동 알림">
          <div className="space-y-3">
            {[
              { name: '양파', change: '+15%', price: '2,500원/kg', alert: 'high' },
              { name: '마늘', change: '+8%', price: '8,000원/kg', alert: 'medium' },
              { name: '배추', change: '-5%', price: '1,200원/포기', alert: 'low' },
              { name: '무', change: '-12%', price: '800원/개', alert: 'low' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.price}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    item.change.startsWith('+') ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {item.change}
                  </p>
                  {item.alert === 'high' && (
                    <span className="text-xs text-red-600">급등</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}