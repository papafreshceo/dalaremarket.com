'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.min.css'

registerAllModules()

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
  const hotTableRef = useRef<any>(null)
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
      const hotInstance = hotTableRef.current?.hotInstance
      if (!hotInstance) return

      const tableData = hotInstance.getData()
      const updates = []

      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i]
        const originalRow = data[i]

        if (!originalRow) continue

        const update = {
          id: originalRow.id,
          option_name: row[1],
          item_type: row[2],
          variety: row[3],
          specification_1: row[4],
          specification_2: row[5],
          specification_3: row[6],
          weight: parseFloat(row[7]) || 0,
          weight_unit: row[8],
          packaging_box_price: parseFloat(row[9]) || 0,
          cushioning_price: parseFloat(row[10]) || 0,
          raw_material_cost: parseFloat(row[11]) || 0,
          labor_cost: parseFloat(row[12]) || 0,
          shipping_fee: parseFloat(row[13]) || 0,
          seller_supply_price: parseFloat(row[14]) || 0,
          naver_paid_shipping_price: parseFloat(row[15]) || 0,
          naver_free_shipping_price: parseFloat(row[16]) || 0,
          coupang_paid_shipping_price: parseFloat(row[17]) || 0,
          coupang_free_shipping_price: parseFloat(row[18]) || 0,
          supply_status: row[19]
        }

        updates.push(update)
      }

      // Batch update
      for (const update of updates) {
        const { id, ...updateData } = update
        const { error } = await supabase
          .from('option_products')
          .update(updateData)
          .eq('id', id)

        if (error) {
          console.error('Error updating row:', error)
          alert(`Failed to update ${update.id}`)
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
    { data: 'option_code', title: 'Option Code', readOnly: true, width: 120 },
    { data: 'option_name', title: 'Name', width: 200 },
    { data: 'item_type', title: 'Item Type', width: 100 },
    { data: 'variety', title: 'Variety', width: 100 },
    { data: 'specification_1', title: 'Spec 1', width: 80 },
    { data: 'specification_2', title: 'Spec 2', width: 80 },
    { data: 'specification_3', title: 'Spec 3', width: 80 },
    { data: 'weight', title: 'Weight', type: 'numeric', width: 80 },
    { data: 'weight_unit', title: 'Unit', width: 60 },
    { data: 'packaging_box_price', title: 'Box Price', type: 'numeric', width: 100 },
    { data: 'cushioning_price', title: 'Cushion', type: 'numeric', width: 100 },
    { data: 'raw_material_cost', title: 'Material Cost', type: 'numeric', width: 120 },
    { data: 'labor_cost', title: 'Labor Cost', type: 'numeric', width: 100 },
    { data: 'shipping_fee', title: 'Shipping Fee', type: 'numeric', width: 100 },
    { data: 'seller_supply_price', title: 'Seller Price', type: 'numeric', width: 120, className: 'htCenter htMiddle bg-blue-50' },
    { data: 'naver_paid_shipping_price', title: 'Naver Paid', type: 'numeric', width: 100, className: 'htCenter htMiddle bg-green-50' },
    { data: 'naver_free_shipping_price', title: 'Naver Free', type: 'numeric', width: 100, className: 'htCenter htMiddle bg-green-50' },
    { data: 'coupang_paid_shipping_price', title: 'Coupang Paid', type: 'numeric', width: 100, className: 'htCenter htMiddle bg-purple-50' },
    { data: 'coupang_free_shipping_price', title: 'Coupang Free', type: 'numeric', width: 100, className: 'htCenter htMiddle bg-purple-50' },
    {
      data: 'supply_status',
      title: 'Status',
      type: 'dropdown',
      source: ['PREPARING', 'SUPPLYING', 'PAUSED', 'STOPPED', 'SEASON_END'],
      width: 120
    },
    { data: 'vendor_name', title: 'Vendor', readOnly: true, width: 150 }
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
        <HotTable
          ref={hotTableRef}
          data={data}
          columns={columns}
          colHeaders={true}
          rowHeaders={true}
          width="100%"
          height={600}
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          autoWrapRow={true}
          autoWrapCol={true}
          manualColumnResize={true}
          manualRowResize={true}
          contextMenu={true}
          filters={true}
          dropdownMenu={true}
          columnSorting={true}
          afterChange={(changes, source) => {
            if (source === 'loadData') return
            console.log('Data changed:', changes)
          }}
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
