'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Modal } from '@/components/ui'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.css'

// 모든 Handsontable 모듈 등록
registerAllModules()

// ===== 타입 =====
interface PurchaseItem {
  id: string
  purchase_id: string
  purchase_date?: string
  supplier_id?: string
  supplier_name?: string
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  category_5: string | null
  shipper_name: string | null
  classification: string | null
  quantity: number
  unit_price: number
  amount: number
  commission: number
  total_amount: number
  task: string | null
  taste: string | null
  notes: string | null
}

interface Supplier {
  id: string
  name: string
  commission_rate: number
  commission_type: string
}

interface ItemMaster {
  id: string
  item_name: string
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
}

export default function SaiupManagementPage() {
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [records, setRecords] = useState<PurchaseItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<ItemMaster[]>([])
  const [supplierTypes, setSupplierTypes] = useState<string[]>([])
  const [tableData, setTableData] = useState<any[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isVarietyModalOpen, setIsVarietyModalOpen] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    code: '',
    name: '',
    business_number: '',
    representative: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    supplier_type: '농가',
    commission_type: '정액',
    commission_rate: 0,
    notes: ''
  })

  const [newVariety, setNewVariety] = useState({
    item_name: '',
    category_1: '',
    category_2: '',
    category_3: '',
    notes: ''
  })

  const hotTableRef = useRef<any>(null)
  const supabase = createClient()

  // 사용자 정보
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) setCurrentUserId(data.user.id)
    }
    getUser()
  }, [])

  // 데이터 로드
  useEffect(() => {
    fetchRecords()
    fetchSuppliers()
    fetchItems()
    fetchSupplierTypes()
  }, [])

  // 테이블 데이터 변환
  useEffect(() => {
    const filtered = records.filter(r => {
      const recordDate = new Date(r.purchase_date || '')
      const start = new Date(startDate)
      const end = new Date(endDate)
      const inDateRange = recordDate >= start && recordDate <= end

      if (!inDateRange) return false

      if (searchTerm) {
        return (
          r.supplier_name?.includes(searchTerm) ||
          r.category_4?.includes(searchTerm) ||
          r.category_5?.includes(searchTerm) ||
          r.shipper_name?.includes(searchTerm) ||
          r.classification?.includes(searchTerm)
        )
      }
      return true
    })

    setTableData(filtered)
  }, [records, startDate, endDate, searchTerm])

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_items')
      .select(`
        *,
        purchase:purchases!purchase_id(
          purchase_date,
          supplier_id,
          supplier:suppliers!supplier_id(name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('데이터 로드 오류:', error)
      setLoading(false)
      return
    }

    if (data) {
      const mapped = data.map(row => ({
        id: row.id,
        purchase_id: row.purchase_id,
        purchase_date: row.purchase?.purchase_date || '',
        supplier_id: row.purchase?.supplier_id || '',
        supplier_name: row.purchase?.supplier?.name || '',
        category_1: row.category_1 || '',
        category_2: row.category_2 || '',
        category_3: row.category_3 || '',
        category_4: row.category_4 || '',
        category_5: row.category_5 || '',
        shipper_name: row.shipper_name || '',
        classification: row.classification || '',
        quantity: row.quantity || 0,
        unit_price: row.unit_price || 0,
        amount: row.amount || 0,
        commission: row.commission || 0,
        total_amount: row.total_amount || 0,
        task: row.task || '',
        taste: row.taste || '',
        notes: row.notes || ''
      }))
      console.log('로드된 데이터:', mapped)
      setRecords(mapped)
    }
    setLoading(false)
  }

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('partners').select('id, name, commission_rate, commission_type').eq('is_active', true).order('name')
    if (data) setSuppliers(data)
  }

  const fetchItems = async () => {
    const { data } = await supabase.from('item_master').select('*').eq('is_active', true).order('item_name')
    if (data) setItems(data)
  }

  const fetchSupplierTypes = async () => {
    const { data } = await supabase.from('partner_types').select('type_name').eq('is_active', true).order('type_name')
    if (data) setSupplierTypes(data.map(t => t.type_name))
  }

  const handleAddRow = () => {
    const newRow = {
      id: `temp_${Date.now()}`,
      purchase_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      supplier_name: '',
      category_1: '',
      category_2: '',
      category_3: '',
      category_4: '',
      category_5: '',
      shipper_name: '',
      classification: '',
      quantity: 0,
      unit_price: 0,
      amount: 0,
      commission: 0,
      total_amount: 0,
      task: '',
      taste: '',
      notes: ''
    }
    setTableData([newRow, ...tableData])
  }

  const handleSave = async () => {
    if (!hotTableRef.current) return

    const hotInstance = hotTableRef.current.hotInstance
    const data = hotInstance.getData()
    const sourceData = hotInstance.getSourceData()

    try {
      for (let i = 0; i < sourceData.length; i++) {
        const row = sourceData[i]

        if (row.id.startsWith('temp_')) {
          // 신규 데이터
          const purchaseNumber = `SA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
          const supplier = suppliers.find(s => s.name === row.supplier_name)

          const { data: purchase } = await supabase
            .from('purchases')
            .insert([{
              purchase_number: purchaseNumber,
              supplier_id: supplier?.id || null,
              purchase_date: row.purchase_date,
              total_amount: row.quantity * row.unit_price,
              final_amount: row.quantity * row.unit_price + (row.commission || 0),
              status: 'confirmed',
              created_by: currentUserId
            }])
            .select()
            .single()

          if (purchase) {
            await supabase.from('purchase_items').insert([{
              purchase_id: purchase.id,
              item_type: 'raw_material',
              category_1: row.category_1,
              category_2: row.category_2,
              category_3: row.category_3,
              category_4: row.category_4,
              category_5: row.category_5,
              item_name: row.category_4 || '사입품목',
              unit: 'kg',
              shipper_name: row.shipper_name,
              classification: row.classification,
              quantity: row.quantity,
              unit_price: row.unit_price,
              amount: row.quantity * row.unit_price,
              commission: row.commission || 0,
              task: row.task,
              taste: row.taste,
              notes: row.notes
            }])
          }
        } else {
          // 기존 데이터 업데이트
          await supabase.from('purchase_items').update({
            category_1: row.category_1,
            category_2: row.category_2,
            category_3: row.category_3,
            category_4: row.category_4,
            category_5: row.category_5,
            shipper_name: row.shipper_name,
            classification: row.classification,
            quantity: row.quantity,
            unit_price: row.unit_price,
            amount: row.quantity * row.unit_price,
            commission: row.commission || 0,
            task: row.task,
            taste: row.taste,
            notes: row.notes
          }).eq('id', row.id)

          // purchase 날짜/거래처 업데이트
          const supplier = suppliers.find(s => s.name === row.supplier_name)
          await supabase.from('purchases').update({
            purchase_date: row.purchase_date,
            supplier_id: supplier?.id || null
          }).eq('id', row.purchase_id)
        }
      }

      await fetchRecords()
      alert('저장되었습니다.')
    } catch (error) {
      console.error(error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (rowIndex: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const row = tableData[rowIndex]
    if (row.id.startsWith('temp_')) {
      // 임시 행 삭제
      const newData = [...tableData]
      newData.splice(rowIndex, 1)
      setTableData(newData)
    } else {
      // DB에서 삭제
      await supabase.from('purchase_items').delete().eq('id', row.id)
      await fetchRecords()
    }
  }

  const handleSupplierSubmit = async () => {
    if (!newSupplier.code || !newSupplier.name) {
      alert('거래처 코드와 이름은 필수입니다.')
      return
    }

    const { error } = await supabase.from('partners').insert([{
      code: newSupplier.code,
      name: newSupplier.name,
      business_number: newSupplier.business_number || null,
      representative: newSupplier.representative || null,
      contact_person: newSupplier.contact_person || null,
      phone: newSupplier.phone || null,
      email: newSupplier.email || null,
      address: newSupplier.address || null,
      partner_type: newSupplier.supplier_type,
      partner_category: '공급자',
      commission_type: newSupplier.commission_type,
      commission_rate: newSupplier.commission_rate || 0,
      is_active: true,
      notes: newSupplier.notes || null
    }])

    if (error) {
      alert('거래처 등록 실패: ' + error.message)
      return
    }

    alert('거래처가 등록되었습니다.')
    setIsSupplierModalOpen(false)
    setNewSupplier({
      code: '',
      name: '',
      business_number: '',
      representative: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      supplier_type: '농가',
      commission_type: '정액',
      commission_rate: 0,
      notes: ''
    })
    await fetchSuppliers()
  }

  const handleVarietySubmit = async () => {
    if (!newVariety.item_name) {
      alert('품종명은 필수입니다.')
      return
    }

    const { error } = await supabase.from('item_master').insert([{
      item_name: newVariety.item_name,
      category_1: newVariety.category_1 || null,
      category_2: newVariety.category_2 || null,
      category_3: newVariety.category_3 || null,
      category_4: newVariety.item_name,
      is_active: true,
      notes: newVariety.notes || null
    }])

    if (error) {
      alert('품종 등록 실패: ' + error.message)
      return
    }

    alert('품종이 등록되었습니다.')
    setIsVarietyModalOpen(false)
    setNewVariety({
      item_name: '',
      category_1: '',
      category_2: '',
      category_3: '',
      notes: ''
    })
    await fetchItems()
  }

  const columns: any[] = [
    {
      data: 'purchase_date',
      title: '날짜',
      width: 100,
      className: 'htCenter bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        td.innerHTML = value || ''
        td.className = 'htCenter bg-blue-50'
        return td
      }
    },
    {
      data: 'supplier_name',
      title: '거래처',
      type: 'dropdown',
      source: suppliers.map(s => s.name),
      width: 120,
      className: 'htCenter bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        td.innerHTML = value || ''
        td.className = 'htCenter bg-blue-50'
        return td
      }
    },
    { data: 'category_1', title: '대분류', width: 80, className: 'htCenter' },
    { data: 'category_2', title: '중분류', width: 80, className: 'htCenter' },
    { data: 'category_3', title: '소분류', width: 80, className: 'htCenter' },
    { data: 'category_4', title: '품목', width: 100, className: 'htCenter' },
    {
      data: 'category_5',
      title: '품종',
      width: 100,
      className: 'htCenter bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        td.innerHTML = value || ''
        td.className = 'htCenter bg-blue-50'
        return td
      }
    },
    {
      data: 'classification',
      title: '구분',
      width: 80,
      className: 'htCenter bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        td.innerHTML = value || ''
        td.className = 'htCenter bg-blue-50'
        return td
      }
    },
    {
      data: 'shipper_name',
      title: '출하자',
      width: 100,
      className: 'htCenter bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        td.innerHTML = value || ''
        td.className = 'htCenter bg-blue-50'
        return td
      }
    },
    {
      data: 'quantity',
      title: '수량',
      type: 'numeric',
      numericFormat: { pattern: '0,0.00' },
      width: 80,
      className: 'htCenter bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        td.innerHTML = value || ''
        td.className = 'htCenter bg-blue-50'
        return td
      }
    },
    {
      data: 'unit_price',
      title: '단가',
      type: 'numeric',
      numericFormat: { pattern: '0,0' },
      width: 100,
      className: 'htRight bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        const formatted = value ? Number(value).toLocaleString('ko-KR') : ''
        td.innerHTML = formatted
        td.className = 'htRight bg-blue-50'
        return td
      }
    },
    {
      data: 'amount',
      title: '금액',
      type: 'numeric',
      numericFormat: { pattern: '0,0' },
      width: 100,
      className: 'htRight bg-pink-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        const formatted = value ? Number(value).toLocaleString('ko-KR') : ''
        td.innerHTML = formatted
        td.className = 'htRight bg-pink-50'
        return td
      }
    },
    {
      data: 'commission',
      title: '수수료',
      type: 'numeric',
      numericFormat: { pattern: '0,0' },
      width: 80,
      className: 'htRight bg-pink-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        const formatted = value ? Number(value).toLocaleString('ko-KR') : ''
        td.innerHTML = formatted
        td.className = 'htRight bg-pink-50'
        return td
      }
    },
    {
      data: 'total_amount',
      title: '합계',
      type: 'numeric',
      numericFormat: { pattern: '0,0' },
      readOnly: true,
      width: 100,
      className: 'htRight bg-pink-50 font-semibold',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        const formatted = value ? Number(value).toLocaleString('ko-KR') : ''
        td.innerHTML = formatted
        td.className = 'htRight bg-pink-50 font-semibold'
        return td
      }
    },
    {
      data: 'task',
      title: '작업',
      width: 100,
      className: 'htCenter bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        td.innerHTML = value || ''
        td.className = 'htCenter bg-blue-50'
        return td
      }
    },
    {
      data: 'taste',
      title: '맛',
      width: 100,
      className: 'htCenter bg-blue-50',
      renderer: function(instance: any, td: any, row: any, col: any, prop: any, value: any) {
        td.innerHTML = value || ''
        td.className = 'htCenter bg-blue-50'
        return td
      }
    },
  ]

  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <Card>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="거래처, 품목, 출하자 등"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleAddRow} variant="ghost" className="flex-1">
              + 행 추가
            </Button>
            <Button onClick={handleSave} className="flex-1">
              저장
            </Button>
          </div>
        </div>
      </Card>

      {/* 테이블 */}
      <Card>
        <HotTable
          ref={hotTableRef}
          data={tableData}
          columns={columns}
          colHeaders={true}
          rowHeaders={true}
          height="600"
          width="100%"
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          autoColumnSize={false}
          manualColumnResize={true}
          contextMenu={true}
          afterChange={(changes, source) => {
            if (source === 'edit' && changes) {
              changes.forEach(([row, prop, oldValue, newValue]) => {
                const data = hotTableRef.current?.hotInstance?.getSourceData()
                if (data && data[row]) {
                  // 품종(category_5) 입력 시 대분류/중분류/소분류/품목 자동 입력
                  if (prop === 'category_5') {
                    const item = items.find(i => i.item_name === newValue)
                    if (item) {
                      data[row].category_1 = item.category_1 || ''
                      data[row].category_2 = item.category_2 || ''
                      data[row].category_3 = item.category_3 || ''
                      data[row].category_4 = item.category_4 || ''
                      hotTableRef.current?.hotInstance?.render()
                    }
                  }
                  // 거래처 변경 시 수수료 자동 적용
                  if (prop === 'supplier_name') {
                    const supplier = suppliers.find(s => s.name === newValue)
                    if (supplier) {
                      const qty = Number(data[row].quantity) || 0
                      const amount = Number(data[row].amount) || 0

                      // 수수료 계산: 정액(수량×수수료) vs 정율(금액×수수료%)
                      if (supplier.commission_type === '정액') {
                        data[row].commission = qty * (supplier.commission_rate || 0)
                      } else { // 정율
                        data[row].commission = amount * (supplier.commission_rate || 0) / 100
                      }

                      data[row].total_amount = amount + data[row].commission
                      hotTableRef.current?.hotInstance?.render()
                    }
                  }
                  // 수량 또는 단가 변경 시 금액/수수료/합계 자동 계산
                  if (prop === 'quantity' || prop === 'unit_price') {
                    const qty = Number(data[row].quantity) || 0
                    const price = Number(data[row].unit_price) || 0
                    data[row].amount = qty * price

                    // 수수료 자동 계산
                    const supplier = suppliers.find(s => s.name === data[row].supplier_name)
                    if (supplier) {
                      if (supplier.commission_type === '정액') {
                        // 정액: 수량 × 수수료
                        data[row].commission = qty * (supplier.commission_rate || 0)
                      } else {
                        // 정율: 금액 × 수수료% / 100
                        data[row].commission = data[row].amount * (supplier.commission_rate || 0) / 100
                      }
                    }

                    data[row].total_amount = data[row].amount + (Number(data[row].commission) || 0)
                    hotTableRef.current?.hotInstance?.render()
                  }
                }
              })
            }
          }}
        />
      </Card>

      {/* 버튼 영역 */}
      <div className="flex justify-start gap-2">
        <Button
          onClick={() => setIsSupplierModalOpen(true)}
          variant="ghost"
        >
          + 거래처 등록
        </Button>
        <Button
          onClick={() => setIsVarietyModalOpen(true)}
          variant="ghost"
        >
          + 품종 등록
        </Button>
      </div>

      {/* 거래처 등록 모달 */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="거래처 등록"
        size="md"
        footer={
          <>
            <Button onClick={() => setIsSupplierModalOpen(false)} variant="ghost">
              취소
            </Button>
            <Button onClick={handleSupplierSubmit}>
              등록
            </Button>
          </>
        }
      >
        <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거래처 코드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSupplier.code}
                    onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="SUP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거래처명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="거래처명"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호</label>
                  <input
                    type="text"
                    value={newSupplier.business_number}
                    onChange={(e) => setNewSupplier({ ...newSupplier, business_number: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="123-45-67890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
                  <input
                    type="text"
                    value={newSupplier.representative}
                    onChange={(e) => setNewSupplier({ ...newSupplier, representative: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="홍길동"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자명</label>
                  <input
                    type="text"
                    value={newSupplier.contact_person}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="김담당"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">거래처 유형</label>
                  <select
                    value={newSupplier.supplier_type}
                    onChange={(e) => setNewSupplier({ ...newSupplier, supplier_type: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {supplierTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수수료 방식</label>
                  <select
                    value={newSupplier.commission_type}
                    onChange={(e) => setNewSupplier({ ...newSupplier, commission_type: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="정액">정액 (원/kg)</option>
                    <option value="정율">정율 (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    수수료 {newSupplier.commission_type === '정액' ? '(원/kg)' : '(%)'}
                  </label>
                  <input
                    type="number"
                    value={newSupplier.commission_rate}
                    onChange={(e) => setNewSupplier({ ...newSupplier, commission_rate: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder={newSupplier.commission_type === '정액' ? '100' : '5'}
                    step={newSupplier.commission_type === '정액' ? '1' : '0.1'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="주소를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                <textarea
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="비고사항을 입력하세요"
                />
              </div>
        </div>
      </Modal>

      {/* 품종 등록 모달 */}
      <Modal
        isOpen={isVarietyModalOpen}
        onClose={() => setIsVarietyModalOpen(false)}
        title="품종 등록"
        size="sm"
        footer={
          <>
            <Button onClick={() => setIsVarietyModalOpen(false)} variant="ghost">
              취소
            </Button>
            <Button onClick={handleVarietySubmit}>
              등록
            </Button>
          </>
        }
      >
        <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품종명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newVariety.item_name}
                  onChange={(e) => setNewVariety({ ...newVariety, item_name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="예: 양파, 감자, 사과"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대분류</label>
                <input
                  type="text"
                  value={newVariety.category_1}
                  onChange={(e) => setNewVariety({ ...newVariety, category_1: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="예: 채소류, 과일류"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">중분류</label>
                <input
                  type="text"
                  value={newVariety.category_2}
                  onChange={(e) => setNewVariety({ ...newVariety, category_2: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="예: 양념채소, 이과류"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소분류</label>
                <input
                  type="text"
                  value={newVariety.category_3}
                  onChange={(e) => setNewVariety({ ...newVariety, category_3: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="예: 구근채소, 사과류"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                <textarea
                  value={newVariety.notes}
                  onChange={(e) => setNewVariety({ ...newVariety, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="비고사항을 입력하세요"
                />
              </div>
        </div>
      </Modal>
    </div>
  )
}
