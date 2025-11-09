'use client'

import { useState, useEffect } from 'react'
import { Button, Badge } from '@/components/ui'
import { PageLayout, PageSection, InfoBanner } from '@/components/admin'
import { createClient } from '@/lib/supabase/client'

interface InventoryItem {
  id: string
  product_name: string
  sku: string
  category: string
  current_stock: number
  minimum_stock: number
  unit: string
  location: string
  last_updated: string
  status: 'sufficient' | 'low' | 'out'
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sufficient' | 'low' | 'out'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchInventory()
  }, [filter])

  const fetchInventory = async () => {
    setLoading(true)

    // TODO: 실제 재고 테이블에서 데이터 가져오기
    // 임시 더미 데이터
    const dummyData: InventoryItem[] = [
      {
        id: '1',
        product_name: '무농약 애호박',
        sku: 'VEG-001',
        category: '채소',
        current_stock: 150,
        minimum_stock: 50,
        unit: 'kg',
        location: '냉장창고 A-1',
        last_updated: '2025-01-16 14:30',
        status: 'sufficient'
      },
      {
        id: '2',
        product_name: '유기농 상추',
        sku: 'VEG-002',
        category: '채소',
        current_stock: 30,
        minimum_stock: 50,
        unit: 'kg',
        location: '냉장창고 A-2',
        last_updated: '2025-01-16 14:25',
        status: 'low'
      },
      {
        id: '3',
        product_name: '친환경 토마토',
        sku: 'VEG-003',
        category: '채소',
        current_stock: 0,
        minimum_stock: 30,
        unit: 'kg',
        location: '냉장창고 A-3',
        last_updated: '2025-01-16 14:20',
        status: 'out'
      },
      {
        id: '4',
        product_name: '신선한 파프리카',
        sku: 'VEG-004',
        category: '채소',
        current_stock: 200,
        minimum_stock: 80,
        unit: 'kg',
        location: '냉장창고 B-1',
        last_updated: '2025-01-16 14:15',
        status: 'sufficient'
      },
      {
        id: '5',
        product_name: '국내산 딸기',
        sku: 'FRT-001',
        category: '과일',
        current_stock: 45,
        minimum_stock: 60,
        unit: 'kg',
        location: '냉장창고 B-2',
        last_updated: '2025-01-16 14:10',
        status: 'low'
      },
    ]

    // 필터 적용
    let filteredData = dummyData
    if (filter !== 'all') {
      filteredData = dummyData.filter(item => item.status === filter)
    }

    setInventory(filteredData)
    setLoading(false)
  }

  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sufficient':
        return <Badge variant="success">정상</Badge>
      case 'low':
        return <Badge variant="warning">부족</Badge>
      case 'out':
        return <Badge variant="danger">품절</Badge>
      default:
        return <Badge variant="default">-</Badge>
    }
  }

  const lowStockCount = inventory.filter(item => item.status === 'low').length
  const outOfStockCount = inventory.filter(item => item.status === 'out').length

  return (
    <PageLayout
      title="재고관리"
      description="상품 재고 현황을 실시간으로 관리합니다"
      actions={
        <Button variant="primary" size="sm">
          재고 추가
        </Button>
      }
    >
      {/* 알림 배너 */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <InfoBanner
          type="warning"
          title="재고 부족 알림"
          message={`부족: ${lowStockCount}개 | 품절: ${outOfStockCount}개 상품이 있습니다.`}
        />
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">전체 상품</div>
          <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">정상 재고</div>
          <div className="text-2xl font-bold text-green-600">
            {inventory.filter(item => item.status === 'sufficient').length}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 mb-1">부족</div>
          <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-red-500">
          <div className="text-sm text-gray-600 mb-1">품절</div>
          <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
        </div>
      </div>

      <PageSection>
        {/* 필터 및 검색 */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('sufficient')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'sufficient'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              정상
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'low'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              부족
            </button>
            <button
              onClick={() => setFilter('out')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'out'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              품절
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="상품명 또는 SKU 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </Button>
          </div>
        </div>

        {/* 재고 테이블 */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">로딩 중...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-6 text-center text-gray-500">재고 데이터가 없습니다.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">현재 재고</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">최소 재고</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">보관 위치</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">최종 업데이트</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${
                        item.status === 'sufficient' ? 'text-green-600' :
                        item.status === 'low' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {item.current_stock} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.minimum_stock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.last_updated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button variant="outline" size="xs">
                          입고
                        </Button>
                        <Button variant="outline" size="xs">
                          출고
                        </Button>
                        <Button variant="ghost" size="xs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageSection>
    </PageLayout>
  )
}
