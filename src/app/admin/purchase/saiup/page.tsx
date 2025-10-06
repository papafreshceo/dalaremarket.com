'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Modal } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'

// ===== 타입 =====
interface PurchaseItem {
  id: string
  purchase_id: string
  purchase_date?: string
  supplier_id?: string
  supplier_name?: string
  purchase_category?: string
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

// 날짜에 요일 추가 함수
const formatDateWithDay = (dateStr: string): string => {
  if (!dateStr) return ''
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(dateStr)
  const dayOfWeek = days[date.getDay()]
  return `${dateStr} (${dayOfWeek})`
}

export default function SaiupManagementPage() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [records, setRecords] = useState<PurchaseItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<ItemMaster[]>([])
  const [supplierTypes, setSupplierTypes] = useState<string[]>([])
  const [tableData, setTableData] = useState<any[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [filterCategory, setFilterCategory] = useState<'전체' | '중매인' | '농가' | '기타'>('전체')

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isVarietyModalOpen, setIsVarietyModalOpen] = useState(false)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
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

      // 필터 카테고리 체크
      if (filterCategory !== '전체' && r.purchase_category !== filterCategory) {
        return false
      }

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
  }, [records, startDate, endDate, searchTerm, filterCategory])

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_items')
      .select(`
        *,
        purchase:purchases!purchase_id(
          purchase_date,
          supplier_id,
          supplier:partners!supplier_id(name)
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
      purchase_category: filterCategory === '전체' ? '중매인' : filterCategory,
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
    try {
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i]

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
      showToast('저장되었습니다.', 'success')
    } catch (error) {
      console.error(error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleDelete = async (rowIndex: number) => {
    const confirmed = await confirm({
      title: '삭제 확인',
      message: '정말 삭제하시겠습니까?',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    })
    if (!confirmed) return

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
      showToast('거래처 코드와 이름은 필수입니다.', 'warning')
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
      showToast('거래처 등록 실패: ' + error.message, 'error')
      return
    }

    showToast('거래처가 등록되었습니다.', 'success')
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
      showToast('품종명은 필수입니다.', 'warning')
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
      showToast('품종 등록 실패: ' + error.message, 'error')
      return
    }

    showToast('품종이 등록되었습니다.', 'success')
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

  const handleCellEdit = (rowIndex: number, columnKey: string, newValue: any) => {
    const newData = [...tableData]
    const row = newData[rowIndex]

    row[columnKey] = newValue

    // 품종(category_5) 입력 시 대분류/중분류/소분류/품목 자동 입력
    if (columnKey === 'category_5') {
      const item = items.find(i => i.item_name === newValue)
      if (item) {
        row.category_1 = item.category_1 || ''
        row.category_2 = item.category_2 || ''
        row.category_3 = item.category_3 || ''
        row.category_4 = item.category_4 || ''
      }
    }

    // 구분 변경 시 수수료 재계산
    if (columnKey === 'purchase_category') {
      const category = newValue as string
      const qty = Number(row.quantity) || 0
      const amount = Number(row.amount) || 0

      // 농가, 기타는 수수료 0
      if (category === '농가' || category === '기타') {
        row.commission = 0
        row.total_amount = amount
      } else if (category === '중매인') {
        // 중매인은 거래처 수수료 적용
        const supplier = suppliers.find(s => s.name === row.supplier_name)
        if (supplier) {
          if (supplier.commission_type === '정액') {
            row.commission = qty * (supplier.commission_rate || 0)
          } else {
            row.commission = amount * (supplier.commission_rate || 0) / 100
          }
          row.total_amount = amount + row.commission
        }
      }
    }

    // 거래처 변경 시 수수료 자동 적용
    if (columnKey === 'supplier_name') {
      const supplier = suppliers.find(s => s.name === newValue)
      if (supplier) {
        const qty = Number(row.quantity) || 0
        const amount = Number(row.amount) || 0
        const category = row.purchase_category

        // 농가, 기타는 수수료 0
        if (category === '농가' || category === '기타') {
          row.commission = 0
          row.total_amount = amount
        } else {
          // 중매인은 수수료 계산
          if (supplier.commission_type === '정액') {
            row.commission = qty * (supplier.commission_rate || 0)
          } else {
            row.commission = amount * (supplier.commission_rate || 0) / 100
          }
          row.total_amount = amount + row.commission
        }
      }
    }

    // 수량 또는 단가 변경 시 금액/수수료/합계 자동 계산
    if (columnKey === 'quantity' || columnKey === 'unit_price') {
      const qty = Number(row.quantity) || 0
      const price = Number(row.unit_price) || 0
      row.amount = qty * price

      const category = row.purchase_category

      // 농가, 기타는 수수료 0
      if (category === '농가' || category === '기타') {
        row.commission = 0
      } else {
        // 중매인은 수수료 자동 계산
        const supplier = suppliers.find(s => s.name === row.supplier_name)
        if (supplier) {
          if (supplier.commission_type === '정액') {
            row.commission = qty * (supplier.commission_rate || 0)
          } else {
            row.commission = row.amount * (supplier.commission_rate || 0) / 100
          }
        }
      }

      row.total_amount = row.amount + (Number(row.commission) || 0)
    }

    setTableData(newData)
  }

  const columns = [
    { key: 'purchase_date', title: '날짜', width: 100, className: 'text-center bg-blue-50', readOnly: !isEditMode },
    { key: 'purchase_category', title: '구분', type: 'dropdown' as const, source: ['중매인', '농가', '기타'], width: 80, className: 'text-center bg-blue-50', readOnly: !isEditMode },
    { key: 'supplier_name', title: '거래처', type: 'dropdown' as const, source: suppliers.map(s => s.name), width: 120, className: 'text-center bg-blue-50', readOnly: !isEditMode },
    { key: 'category_1', title: '대분류', width: 80, className: 'text-center bg-amber-50', readOnly: true },
    { key: 'category_2', title: '중분류', width: 80, className: 'text-center bg-amber-50', readOnly: true },
    { key: 'category_3', title: '소분류', width: 80, className: 'text-center bg-amber-50', readOnly: true },
    { key: 'category_4', title: '품목', width: 100, className: 'text-center bg-amber-50', readOnly: true },
    { key: 'category_5', title: '품종', width: 100, className: 'text-center bg-blue-50', readOnly: !isEditMode },
    { key: 'classification', title: '구분', width: 80, className: 'text-center bg-blue-50', readOnly: !isEditMode },
    { key: 'shipper_name', title: '출하자', width: 100, className: 'text-center bg-blue-50', readOnly: !isEditMode },
    { key: 'quantity', title: '수량', type: 'number' as const, width: 80, className: 'text-center bg-blue-50', readOnly: !isEditMode },
    { key: 'unit_price', title: '단가', type: 'number' as const, width: 100, className: 'text-right bg-blue-50', readOnly: !isEditMode, renderer: (value: any) => <span>{value ? Number(value).toLocaleString('ko-KR') : ''}</span> },
    { key: 'amount', title: '금액', type: 'number' as const, width: 100, className: 'text-right bg-pink-50', readOnly: true, renderer: (value: any) => <span>{value ? Number(value).toLocaleString('ko-KR') : ''}</span> },
    { key: 'commission', title: '수수료', type: 'number' as const, width: 80, className: 'text-right bg-pink-50', readOnly: true, renderer: (value: any) => <span>{value ? Number(value).toLocaleString('ko-KR') : ''}</span> },
    { key: 'total_amount', title: '합계', type: 'number' as const, width: 100, className: 'text-right bg-pink-50 font-semibold', readOnly: true, renderer: (value: any) => <span className="font-semibold">{value ? Number(value).toLocaleString('ko-KR') : ''}</span> },
    { key: 'task', title: '작업', width: 100, className: 'text-center bg-blue-50', readOnly: !isEditMode },
    { key: 'taste', title: '맛', width: 100, className: 'text-center bg-blue-50', readOnly: !isEditMode },
  ]

  return (
    <div className="space-y-4">
      {/* 필터 버튼 */}
      <div className="flex gap-2">
        <Button
          onClick={() => setFilterCategory('전체')}
          variant={filterCategory === '전체' ? 'default' : 'ghost'}
          className={filterCategory === '전체' ? 'underline' : ''}
        >
          전체
        </Button>
        <Button
          onClick={() => setFilterCategory('중매인')}
          variant={filterCategory === '중매인' ? 'default' : 'ghost'}
          className={filterCategory === '중매인' ? 'underline' : ''}
        >
          중매인
        </Button>
        <Button
          onClick={() => setFilterCategory('농가')}
          variant={filterCategory === '농가' ? 'default' : 'ghost'}
          className={filterCategory === '농가' ? 'underline' : ''}
        >
          농가
        </Button>
        <Button
          onClick={() => setFilterCategory('기타')}
          variant={filterCategory === '기타' ? 'default' : 'ghost'}
          className={filterCategory === '기타' ? 'underline' : ''}
        >
          기타
        </Button>
      </div>

      {/* 필터 영역 */}
      <div className="grid grid-cols-12 gap-4">
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
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="거래처, 품목, 출하자 등"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              variant="ghost"
              className={`w-full h-[38px] border focus:outline-none focus:ring-0 ${isEditMode ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-purple-500 text-purple-700 hover:bg-purple-50'}`}
            >
              {isEditMode ? '🔒 조회' : '✏️ 작성/수정'}
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAddRow}
              variant="ghost"
              className="w-full border border-blue-500 h-[38px]"
              disabled={!isEditMode}
            >
              + 행 추가
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleSave}
              className="w-full h-[38px]"
              disabled={!isEditMode}
            >
              저장
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setIsStatementModalOpen(true)}
              variant="ghost"
              className="w-full h-[38px] border border-green-500 text-green-700 hover:bg-green-50"
            >
              거래명세서
            </Button>
          </div>
        </div>

      {/* 테이블 */}
      <div>
        <EditableAdminGrid
          data={tableData}
          columns={columns}
          onDataChange={setTableData}
          onCellEdit={handleCellEdit}
          height="600px"
        />
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-start gap-2 pt-4 border-t border-gray-200">
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

      {/* 거래명세서 모달 */}
      <Modal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        title=""
        size="xl"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          {/* 캡처 영역 시작 */}
          <div id="statement-capture-area" className="bg-white p-6">
            {/* 거래명세서 헤더 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">거래명세서</h2>
              <p className="text-sm text-gray-600 mt-2">
                기간: {startDate === endDate ? formatDateWithDay(startDate) : `${formatDateWithDay(startDate)} ~ ${formatDateWithDay(endDate)}`}
              </p>
            </div>

            {/* 거래처별 명세 */}
            <div className="space-y-6">
              {(() => {
                // 거래처별로 그룹화
                const groupedBySupplier = tableData.reduce((acc, item) => {
                  const supplierName = item.supplier_name || '미지정'
                  if (!acc[supplierName]) {
                    acc[supplierName] = []
                  }
                  acc[supplierName].push(item)
                  return acc
                }, {} as Record<string, any[]>)

                return Object.entries(groupedBySupplier).map(([supplierName, items]) => {
                  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
                  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                  const totalCommission = items.reduce((sum, item) => sum + (Number(item.commission) || 0), 0)
                  const totalSum = items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0)

                  // 농가인지 확인 (첫 번째 아이템의 구분으로 판단)
                  const isNongga = items[0]?.purchase_category === '농가'

                  return (
                    <div key={supplierName} className="border border-gray-200 rounded p-4">
                      <div className="mb-3 pb-3 border-b">
                        <h3 className="text-lg font-bold">{supplierName}</h3>
                      </div>

                      {/* 테이블 */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border px-2 py-2">날짜</th>
                              {!isNongga && <th className="border px-2 py-2">출하자</th>}
                              <th className="border px-2 py-2">품명</th>
                              <th className="border px-2 py-2">수량</th>
                              <th className="border px-2 py-2">단가</th>
                              <th className="border px-2 py-2">금액</th>
                              {!isNongga && <th className="border px-2 py-2">수수료</th>}
                              <th className="border px-2 py-2">합계</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="border px-2 py-1 text-center">{formatDateWithDay(item.purchase_date)}</td>
                                {!isNongga && <td className="border px-2 py-1 text-center">{item.shipper_name}</td>}
                                <td className="border px-2 py-1 text-center">{item.category_5}</td>
                                <td className="border px-2 py-1 text-right">{Number(item.quantity).toLocaleString()}</td>
                                <td className="border px-2 py-1 text-right">{Number(item.unit_price).toLocaleString()}</td>
                                <td className="border px-2 py-1 text-right">{Number(item.amount).toLocaleString()}</td>
                                {!isNongga && <td className="border px-2 py-1 text-right">{Number(item.commission).toLocaleString()}</td>}
                                <td className="border px-2 py-1 text-right font-semibold">{Number(item.total_amount).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold">
                              <td colSpan={isNongga ? 2 : 3} className="border px-2 py-2 text-center">소계</td>
                              <td className="border px-2 py-2 text-right">{totalQuantity.toLocaleString()}</td>
                              <td className="border px-2 py-2 text-center">-</td>
                              <td className="border px-2 py-2 text-right">{totalAmount.toLocaleString()}</td>
                              {!isNongga && <td className="border px-2 py-2 text-right">{totalCommission.toLocaleString()}</td>}
                              <td className="border px-2 py-2 text-right">{totalSum.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {/* 총 합계 */}
            <div className="bg-blue-50 p-4 rounded mt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">총 수량</div>
                  <div className="text-xl font-bold text-purple-700">
                    {tableData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">총 금액</div>
                  <div className="text-xl font-bold text-blue-700">
                    {tableData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">총 합계</div>
                  <div className="text-xl font-bold text-green-700">
                    {tableData.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 캡처 영역 끝 */}
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 mt-4">
            <Button variant="ghost" onClick={() => setIsStatementModalOpen(false)}>
              닫기
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const element = document.getElementById('statement-capture-area')
                  if (!element) return

                  showToast('캡처 중...', 'info')

                  const { toBlob } = await import('html-to-image')
                  const blob = await toBlob(element, {
                    quality: 0.95,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff'
                  })

                  if (blob) {
                    await navigator.clipboard.write([
                      new ClipboardItem({ 'image/png': blob })
                    ])
                    showToast('클립보드에 복사되었습니다', 'success')
                  }
                } catch (error) {
                  console.error('캡처 실패:', error)
                  showToast('캡처 중 오류가 발생했습니다.', 'error')
                }
              }}
            >
              📸 캡처
            </Button>
            <Button
              onClick={async () => {
                try {
                  const element = document.getElementById('statement-capture-area')
                  if (!element) return

                  showToast('저장 중...', 'info')

                  const firstSupplier = tableData[0]?.supplier_name || '거래처'
                  const dateStr = startDate === endDate ? startDate : `${startDate}~${endDate}`
                  const filename = `${firstSupplier}-${dateStr}.jpg`

                  const { toJpeg } = await import('html-to-image')
                  const dataUrl = await toJpeg(element, {
                    quality: 0.95,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff'
                  })

                  const link = document.createElement('a')
                  link.download = filename
                  link.href = dataUrl
                  link.click()

                  showToast('저장 완료', 'success')
                } catch (error) {
                  console.error('저장 실패:', error)
                  showToast('저장 중 오류가 발생했습니다.', 'error')
                }
              }}
            >
              💾 저장
            </Button>
        </div>
      </Modal>
    </div>
  )
}
