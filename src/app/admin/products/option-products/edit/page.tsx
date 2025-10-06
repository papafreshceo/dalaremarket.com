'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'

interface OptionProductRow {
  id: string
  option_code: string
  option_name: string
  item_type: string
  variety: string
  specification_1: string
  specification_2: string
  specification_3: string
  weight: number
  weight_unit: string
  packaging_box_price: number
  cushioning_price: number
  raw_material_cost: number
  labor_cost: number
  shipping_fee: number
  seller_supply_price: number
  naver_paid_shipping_price: number
  naver_free_shipping_price: number
  coupang_paid_shipping_price: number
  coupang_free_shipping_price: number
  supply_status: string
  vendor_name?: string
}

export default function OptionProductsEditPage() {
  const [data, setData] = useState<OptionProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: products, error } = await supabase
      .from('option_products')
      .select('*, vendor:partners(name)')
      .order('option_code')

    if (error) {
      console.error('Error loading data:', error)
    } else if (products) {
      const formattedData = products.map((item: any) => ({
        id: item.id,
        option_code: item.option_code,
        option_name: item.option_name,
        item_type: item.item_type,
        variety: item.variety,
        specification_1: item.specification_1,
        specification_2: item.specification_2,
        specification_3: item.specification_3,
        weight: item.weight,
        weight_unit: item.weight_unit,
        packaging_box_price: item.packaging_box_price || 0,
        cushioning_price: item.cushioning_price || 0,
        raw_material_cost: item.raw_material_cost || 0,
        labor_cost: item.labor_cost || 0,
        shipping_fee: item.shipping_fee || 0,
        seller_supply_price: item.seller_supply_price || 0,
        naver_paid_shipping_price: item.naver_paid_shipping_price || 0,
        naver_free_shipping_price: item.naver_free_shipping_price || 0,
        coupang_paid_shipping_price: item.coupang_paid_shipping_price || 0,
        coupang_free_shipping_price: item.coupang_free_shipping_price || 0,
        supply_status: item.supply_status,
        vendor_name: item.vendor?.name || '-'
      }))
      setData(formattedData)
    }

    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      for (const row of data) {
        const { id, vendor_name, ...updateData } = row
        const { error } = await supabase
          .from('option_products')
          .update(updateData)
          .eq('id', id)

        if (error) {
          console.error('Error updating row:', error)
          alert(`Failed to update ${id}`)
          setSaving(false)
          return
        }
      }

      alert('All changes saved successfully!')
      await fetchData()
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save changes')
    }

    setSaving(false)
  }

  const columns = [
    { key: 'option_code', title: 'Option Code', readOnly: true, width: 120 },
    { key: 'option_name', title: 'Name', width: 200 },
    { key: 'item_type', title: 'Item Type', width: 100 },
    { key: 'variety', title: 'Variety', width: 100 },
    { key: 'specification_1', title: 'Spec 1', width: 80 },
    { key: 'specification_2', title: 'Spec 2', width: 80 },
    { key: 'specification_3', title: 'Spec 3', width: 80 },
    { key: 'weight', title: 'Weight', type: 'number' as const, width: 80 },
    { key: 'weight_unit', title: 'Unit', width: 60 },
    { key: 'packaging_box_price', title: 'Box Price', type: 'number' as const, width: 100 },
    { key: 'cushioning_price', title: 'Cushion', type: 'number' as const, width: 100 },
    { key: 'raw_material_cost', title: 'Material Cost', type: 'number' as const, width: 120 },
    { key: 'labor_cost', title: 'Labor Cost', type: 'number' as const, width: 100 },
    { key: 'shipping_fee', title: 'Shipping Fee', type: 'number' as const, width: 100 },
    { key: 'seller_supply_price', title: 'Seller Price', type: 'number' as const, width: 120, className: 'text-center bg-blue-50' },
    { key: 'naver_paid_shipping_price', title: 'Naver Paid', type: 'number' as const, width: 100, className: 'text-center bg-green-50' },
    { key: 'naver_free_shipping_price', title: 'Naver Free', type: 'number' as const, width: 100, className: 'text-center bg-green-50' },
    { key: 'coupang_paid_shipping_price', title: 'Coupang Paid', type: 'number' as const, width: 100, className: 'text-center bg-purple-50' },
    { key: 'coupang_free_shipping_price', title: 'Coupang Free', type: 'number' as const, width: 100, className: 'text-center bg-purple-50' },
    {
      key: 'supply_status',
      title: 'Status',
      type: 'dropdown' as const,
      source: ['PREPARING', 'SUPPLYING', 'PAUSED', 'STOPPED', 'SEASON_END'],
      width: 120
    },
    { key: 'vendor_name', title: 'Vendor', readOnly: true, width: 150 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">옵션상품 대량 편집</h1>
          <p className="text-gray-600 mt-1">엑셀처럼 편집 가능 - {data.length}개 상품</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="ghost" disabled={saving}>
            새로고침
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <EditableAdminGrid
          data={data}
          columns={columns}
          onDataChange={setData}
          height="600px"
          enableFilter={true}
          enableSort={true}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">사용 방법:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• 셀을 더블클릭하여 편집</li>
          <li>• Ctrl+C / Ctrl+V로 복사/붙여넣기</li>
          <li>• 우클릭으로 행 추가/삭제</li>
          <li>• 컬럼 헤더 클릭으로 정렬 및 필터링</li>
          <li>• 변경사항은 "저장" 버튼을 클릭해야 DB에 반영됩니다</li>
        </ul>
      </div>
    </div>
  )
}
