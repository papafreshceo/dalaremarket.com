// app/admin/products/option-products/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Modal, Badge } from '@/components/ui'

// ===== 타입 =====
interface Vendor {
  id: string
  code: string
  name: string
  business_number?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  is_active: boolean
}

interface OptionProduct {
  id: string
  option_code: string
  option_name: string
  item_type: string | null
  variety: string | null
  specification_1: string | null
  specification_2: string | null
  specification_3: string | null
  weight: number | null
  weight_unit: string | null
  packaging_box_price: number | null
  cushioning_price: number | null
  raw_material_cost: number | null
  labor_cost: number | null
  shipping_fee: number | null
  seller_supply_price: number | null
  naver_paid_shipping_price: number | null
  naver_free_shipping_price: number | null
  coupang_paid_shipping_price: number | null
  coupang_free_shipping_price: number | null
  status: string
  vendor_id: string | null
  vendor_name?: string | null
  created_at?: string
  [key: string]: any
}

interface SupplyStatus {
  code: string
  name: string
  color: string
  display_order?: number
}

interface FormData { [key: string]: any }
interface CellPosition { row: number; col: number; field: string }
type DiffItem = { id: string; name: string; field: string; fieldLabel: string; before: string | null; after: string | null }

// 되돌리기 스택 액션
type EditAction = {
  id: string          // row id
  field: string
  before: string      // raw string 값
  after: string       // raw string 값
}

export default function OptionProductsManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [products, setProducts] = useState<OptionProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<OptionProduct[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [supplyStatuses, setSupplyStatuses] = useState<SupplyStatus[]>([])
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [packagingMaterials, setPackagingMaterials] = useState<any[]>([])

  const [stats, setStats] = useState({
    totalProducts: 0,
    supplyingProducts: 0,
    pausedProducts: 0,
    seasonEndProducts: 0
  })

  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchInput, setSearchInput] = useState<string>('')
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('')

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const [modalType, setModalType] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<FormData>({})

  // 옵션상품 생성 관련
  const [selectedMaterials, setSelectedMaterials] = useState<{materialId: string, quantity: number, price: number}[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)
  const [subdivisionQuantity, setSubdivisionQuantity] = useState<number>(1)

  // 엑셀식 편집
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null) // 1클릭 = 선택
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)   // 같은 셀 2클릭 = 편집(커서만)
  const originalValues = useRef<Map<string, any>>(new Map())
  const [modifiedProducts, setModifiedProducts] = useState<Set<string>>(new Set())

  // IME 조합 상태
  const [isComposing, setIsComposing] = useState(false)

  // 되돌리기 스택
  const [undoStack, setUndoStack] = useState<EditAction[]>([])

  // 원본 스냅샷(변경 표시/디프 기준)
  const originalSnapshot = useRef<Map<string, OptionProduct>>(new Map())

  // 저장 컨펌 모달
  const [saveDiffs, setSaveDiffs] = useState<DiffItem[]>([])
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const supabase = createClient()
  const fmtInt = new Intl.NumberFormat('ko-KR')
  const getKey = (id: string, field: string) => `${id}-${field}`

  const FIELD_LABELS: Record<string,string> = {
    option_code: '옵션코드',
    option_name: '상품명',
    item_type: '품목',
    variety: '품종',
    specification_1: '규격1',
    specification_2: '규격2',
    specification_3: '규격3',
    weight: '중량',
    weight_unit: '단위',
    packaging_box_price: '박스비',
    cushioning_price: '완충재',
    raw_material_cost: '원물비용',
    labor_cost: '인건비',
    shipping_fee: '배송비',
    seller_supply_price: '셀러공급가',
    naver_paid_shipping_price: '네이버유료',
    naver_free_shipping_price: '네이버무료',
    coupang_paid_shipping_price: '쿠팡유료',
    coupang_free_shipping_price: '쿠팡무료',
    status: '상태',
    vendor_id: '벤더사',
  }

  const FIELD_ORDER = [
    'option_code','option_name','item_type','variety',
    'specification_1','specification_2','specification_3',
    'weight','weight_unit',
    'packaging_box_price','cushioning_price','raw_material_cost','labor_cost','shipping_fee',
    'seller_supply_price',
    'naver_paid_shipping_price','naver_free_shipping_price',
    'coupang_paid_shipping_price','coupang_free_shipping_price',
    'status','vendor_id'
  ]

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#039;')

  // ===== 유틸 =====
  const resolveStatusCode = (input?: string | null) => {
    if (!input) return null
    const t = input.trim().toUpperCase()
    // 코드로 직접 입력한 경우
    const byCode = supplyStatuses.find(s => s.code === t)
    if (byCode) return byCode.code
    // 한글 이름으로 입력한 경우
    const byName = supplyStatuses.find(s => s.name === input.trim())
    if (byName) return byName.code
    return null
  }

  const resolveVendorIdByName = (name?: string | null) => {
    if (!name) return null
    const t = name.trim()
    const exact = vendors.find(v => v.name === t)
    if (exact) return exact.id
    const part = vendors.filter(v => v.name.includes(t)).sort((a,b)=>a.name.length-b.name.length)[0]
    return part?.id || null
  }

  // 표시용
  const displayValue = (field: string, p: OptionProduct) => {
    switch (field) {
      case 'packaging_box_price':
      case 'cushioning_price':
      case 'raw_material_cost':
      case 'labor_cost':
      case 'shipping_fee':
      case 'seller_supply_price':
      case 'naver_paid_shipping_price':
      case 'naver_free_shipping_price':
      case 'coupang_paid_shipping_price':
      case 'coupang_free_shipping_price':
        return p[field] != null ? fmtInt.format(Number(p[field])) : '-'
      case 'weight':
        return p.weight != null ? String(p.weight) : '-'
      case 'vendor_id':
        return p.vendor_name || '-'
      case 'status':
        const st = supplyStatuses.find(s => s.code === p.status)
        return st?.name || p.status || '-'
      default:
        return (p as any)[field] ?? ((p as any)[field] === 0 ? '0' : '-')
    }
  }

  // 원시값(복사/편집용)
  const rawValue = (field: string, p: OptionProduct) => {
    switch (field) {
      case 'packaging_box_price':
      case 'cushioning_price':
      case 'raw_material_cost':
      case 'labor_cost':
      case 'shipping_fee':
      case 'seller_supply_price':
      case 'naver_paid_shipping_price':
      case 'naver_free_shipping_price':
      case 'coupang_paid_shipping_price':
      case 'coupang_free_shipping_price':
      case 'weight':
        return p[field] != null ? String(p[field]) : ''
      case 'vendor_id':
        return p.vendor_name || ''
      case 'status':
        const st = supplyStatuses.find(s => s.code === p.status)
        return st?.name || p.status || ''
      default:
        return (p as any)[field] != null ? String((p as any)[field]) : ''
    }
  }

  const rawValueFromSnapshot = (field: string, id: string): string => {
    const snap = originalSnapshot.current.get(id)
    if (!snap) return ''
    return rawValue(field, snap)
  }

  const isCellModified = (p: OptionProduct, field: string) => {
    const before = rawValueFromSnapshot(field, p.id)
    const after = rawValue(field, p)
    return (before ?? '') !== (after ?? '')
  }

  const parseAndAssign = (field: string, text: string, src: OptionProduct): OptionProduct => {
    const p = { ...src }
    const t = (text ?? '').trim()

    if ([
      'packaging_box_price','cushioning_price','raw_material_cost','labor_cost','shipping_fee',
      'seller_supply_price','naver_paid_shipping_price','naver_free_shipping_price',
      'coupang_paid_shipping_price','coupang_free_shipping_price','weight'
    ].includes(field)) {
      const n = t === '' ? null : Number(t.replace(/,/g, ''))
      ;(p as any)[field] = Number.isFinite(n as number) ? n : null
      return p
    }

    if (field === 'status') {
      const code = resolveStatusCode(t)
      if (code) p.status = code
      return p
    }

    if (field === 'vendor_id') {
      const id = resolveVendorIdByName(t)
      p.vendor_id = id
      p.vendor_name = t || (id ? vendors.find(v => v.id === id)?.name : null) || null
      return p
    }

    ;(p as any)[field] = t === '' ? null : t
    return p
  }

  // ===== 데이터 로드 =====
  useEffect(() => { void fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      await Promise.all([fetchProducts(), fetchVendors(), fetchSupplyStatuses(), fetchRawMaterials(), fetchPackagingMaterials()])
    } finally { setLoading(false) }
  }

  const captureSnapshot = (rows: OptionProduct[]) => {
    originalSnapshot.current.clear()
    rows.forEach(r => {
      originalSnapshot.current.set(r.id, { ...r })
    })
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('option_products')
      .select(`
        *,
        vendor:partners!vendor_id(name)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      const mapped = data.map(row => ({
        ...row,
        vendor_name: row.vendor?.name || null
      }))
      setProducts(mapped)
      setFilteredProducts(mapped)
      captureSnapshot(mapped)
      setModifiedProducts(new Set())
      originalValues.current.clear()
      setUndoStack([])
    }
  }

  const fetchVendors = async () => {
    const { data } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (data) setVendors(data)
  }

  const fetchSupplyStatuses = async () => {
    const { data, error } = await supabase
      .from('supply_status_settings')
      .select('*')
      .eq('status_type', 'optional_product')
      .eq('is_active', true)
      .order('display_order')
    console.log('Supply Statuses:', data)
    if (error) console.error('Supply Status Error:', error)
    if (data) setSupplyStatuses(data)
  }

  const fetchRawMaterials = async () => {
    const { data } = await supabase
      .from('raw_materials')
      .select('*')
      .order('material_name')
    if (data) setRawMaterials(data)
  }

  const fetchPackagingMaterials = async () => {
    const { data } = await supabase
      .from('packaging_materials')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (data) setPackagingMaterials(data)
  }

  // 통계
  useEffect(() => { void refreshStats(products) }, [products])

  const refreshStats = async (snapshot: OptionProduct[]) => {
    try {
      const [{ count: total }, { count: supplying }, { count: paused }, { count: seasonEnd }] = await Promise.all([
        supabase.from('option_products').select('*', { count: 'exact', head: true }),
        supabase.from('option_products').select('*', { count: 'exact', head: true }).eq('status', 'SUPPLYING'),
        supabase.from('option_products').select('*', { count: 'exact', head: true }).eq('status', 'PAUSED'),
        supabase.from('option_products').select('*', { count: 'exact', head: true }).eq('status', 'SEASON_END')
      ])
      setStats({
        totalProducts: total || 0,
        supplyingProducts: supplying || 0,
        pausedProducts: paused || 0,
        seasonEndProducts: seasonEnd || 0
      })
    } catch {
      setStats({
        totalProducts: snapshot.length,
        supplyingProducts: snapshot.filter(p => p.status === 'SUPPLYING').length,
        pausedProducts: snapshot.filter(p => p.status === 'PAUSED').length,
        seasonEndProducts: snapshot.filter(p => p.status === 'SEASON_END').length
      })
    }
  }

  // 검색 디바운스
  useEffect(() => {
    const t = setTimeout(() => setGlobalSearchTerm(searchInput), 250)
    return () => clearTimeout(t)
  }, [searchInput])

  // 필터링
  useEffect(() => {
    let f = [...products]

    // 검색어 필터
    if (globalSearchTerm && globalSearchTerm.trim()) {
      const s = globalSearchTerm.trim().toLowerCase()
      f = f.filter(p => {
        const arr = [
          p.option_code,
          p.option_name,
          p.item_type,
          p.variety,
          p.specification_1,
          p.specification_2,
          p.specification_3,
          p.weight_unit,
          p.status,
          p.vendor_name,
          p.packaging_box_price?.toString(),
          p.cushioning_price?.toString(),
          p.raw_material_cost?.toString(),
          p.labor_cost?.toString(),
          p.shipping_fee?.toString(),
          p.seller_supply_price?.toString(),
          p.naver_paid_shipping_price?.toString(),
          p.naver_free_shipping_price?.toString(),
          p.coupang_paid_shipping_price?.toString(),
          p.coupang_free_shipping_price?.toString(),
        ]
        return arr.some(v => {
          if (v == null || v === '') return false
          return String(v).toLowerCase().includes(s)
        })
      })
    }

    // 상태 필터
    if (selectedStatus !== 'all') {
      f = f.filter(p => p.status === selectedStatus)
    }

    setFilteredProducts(f)
    setSelectedRows(new Set())
    setSelectAll(false)
  }, [products, selectedStatus, globalSearchTerm])

  // ===== 선택/삭제 =====
  const handleSelectAll = () => {
    if (selectAll) setSelectedRows(new Set())
    else setSelectedRows(new Set(filteredProducts.map(p => p.id)))
    setSelectAll(!selectAll)
  }

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedRows)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedRows(next); setSelectAll(next.size === filteredProducts.length)
  }

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) {
      alert('선택된 항목이 없습니다.')
      setModalType(null)
      return
    }
    const ids = Array.from(selectedRows)
    const { error } = await supabase.from('option_products').delete().in('id', ids)
    if (error) {
      alert('삭제 중 오류가 발생했습니다.')
      return
    }
    setSelectedRows(new Set())
    setSelectAll(false)
    setModalType(null)
    await fetchProducts()
    alert('삭제되었습니다.')
  }

  // ===== 엑셀식 편집: td contentEditable =====
  const handleCellClick = (rowIndex: number, colIndex: number, field: string) => {
    const p = filteredProducts[rowIndex]
    if (!p) return

    // option_code와 vendor_id는 읽기전용
    if (field === 'option_code' || field === 'vendor_id') return

    const isSame = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex && selectedCell.field === field
    if (isSame) {
      const key = getKey(p.id, field)
      if (!originalValues.current.has(key)) originalValues.current.set(key, rawValue(field, p))
      setEditingCell({ row: rowIndex, col: colIndex, field })
    } else {
      setSelectedCell({ row: rowIndex, col: colIndex, field })
      setEditingCell(null)
    }
  }

  // 한 행의 전체 변경 여부 재평가
  const recomputeRowModifiedFlag = (row: OptionProduct) => {
    const anyChanged = FIELD_ORDER.some(f => {
      const before = rawValueFromSnapshot(f, row.id)
      const after = rawValue(f, row)
      return (before ?? '') !== (after ?? '')
    })
    setModifiedProducts(prev => {
      const s = new Set(prev)
      if (anyChanged) s.add(row.id); else s.delete(row.id)
      return s
    })
  }

  const commitEdit = (rowIndex: number, field: string, text: string) => {
    const p = filteredProducts[rowIndex]
    if (!p) return

    const key = getKey(p.id, field)
    const orig = originalValues.current.get(key) ?? rawValueFromSnapshot(field, p.id)
    const nextText = (text ?? '').trim()

    setEditingCell(null)

    if (nextText === (orig ?? '')) {
      // 동일 → 변경 플래그 정리
      let hasOther = false
      originalValues.current.forEach((o, k) => {
        if (k.startsWith(p.id) && k !== key) {
          const f = k.split('-')[1]
          if ((p as any)[f] !== o) hasOther = true
        }
      })
      if (!hasOther) {
        setModifiedProducts(prev => { const s=new Set(prev); s.delete(p.id); return s })
      }
      return
    }

    // 되돌리기 스택 push (원시 문자열 기준)
    setUndoStack(prev => [...prev, { id: p.id, field, before: orig ?? '', after: nextText }])

    const updated = parseAndAssign(field, nextText, p)

    // filteredProducts와 products 둘 다 업데이트
    setFilteredProducts(prev => {
      const next = [...prev]
      next[rowIndex] = updated
      return next
    })

    setProducts(prev => prev.map(item => item.id === updated.id ? updated : item))

    recomputeRowModifiedFlag(updated)
  }

  const handleTdKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault()
      const txt = e.currentTarget.textContent ?? ''
      commitEdit(rowIndex, field, txt)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingCell(null)
    }
  }

  const handleTdBlur = (e: React.FocusEvent<HTMLTableCellElement>, rowIndex: number, field: string) => {
    const txt = e.currentTarget.textContent ?? ''
    commitEdit(rowIndex, field, txt)
  }

  // ===== 복사/붙여넣기(Ctrl/Cmd + C / V) & 되돌리기(Ctrl/Cmd+Z) =====
  useEffect(() => {
    const onKeyDown = async (ev: KeyboardEvent) => {
      const isMod = ev.ctrlKey || ev.metaKey
      if (!isMod) return

      // 편집 중이면 브라우저 기본 동작(undo/clipboard)을 유지
      const isEditingActive = !!editingCell

      // Undo (그리드 레벨)
      if (ev.key.toLowerCase() === 'z' && !isEditingActive) {
        if (undoStack.length === 0) return
        ev.preventDefault()
        const last = undoStack[undoStack.length - 1]
        // 해당 행 찾기
        const idx = filteredProducts.findIndex(r => r.id === last.id)
        if (idx >= 0) {
          const row = filteredProducts[idx]
          // before 값으로 되돌림
          const reverted = parseAndAssign(last.field, last.before, row)
          const nextRows = [...filteredProducts]
          nextRows[idx] = reverted
          setFilteredProducts(nextRows)
          recomputeRowModifiedFlag(reverted)
          // pop
          setUndoStack(prev => prev.slice(0, -1))
          // 선택 셀 포커스 유지(선택만 갱신)
          setSelectedCell({ row: idx, col: selectedCell?.col ?? 1, field: last.field })
        }
        return
      }

      // 복사 / 붙여넣기 (선택 셀에 대해서만, 편집 중이 아닐 때)
      if (!selectedCell || isEditingActive) return
      const { row, field } = selectedCell

      if (ev.key.toLowerCase() === 'c') {
        ev.preventDefault()
        const p = filteredProducts[row]
        try { await navigator.clipboard.writeText(rawValue(field, p)) } catch {}
      } else if (ev.key.toLowerCase() === 'v') {
        ev.preventDefault()
        try {
          const text = await navigator.clipboard.readText()
          // 붙여넣기는 즉시 커밋(되돌리기 스택에 올라감)
          commitEdit(row, field, (text || '').replace(/\r?\n/g, ''))
        } catch {}
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedCell, editingCell, filteredProducts, undoStack])

  // ===== 저장(컨펌 모달) =====
  const buildDiffs = (): DiffItem[] => {
    const diffs: DiffItem[] = []
    filteredProducts
      .filter(p => modifiedProducts.has(p.id))
      .forEach(p => {
        FIELD_ORDER.forEach(field => {
          const before = rawValueFromSnapshot(field, p.id)
          const after = rawValue(field, p)
          if ((before ?? '') !== (after ?? '')) {
            diffs.push({
              id: p.id,
              name: p.option_name || p.option_code || '(이름없음)',
              field,
              fieldLabel: FIELD_LABELS[field] || field,
              before: before ?? '',
              after: after ?? ''
            })
          }
        })
      })
    return diffs
  }

  const handleOpenConfirm = () => {
    if (modifiedProducts.size === 0) {
      alert('변경사항이 없습니다.')
      return
    }
    const diffs = buildDiffs()
    if (diffs.length === 0) {
      alert('변경사항이 없습니다.')
      return
    }
    setSaveDiffs(diffs)
    setIsConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    setIsConfirmOpen(false)
    await handleSaveAllConfirmed()
  }

  const handleSaveAllConfirmed = async () => {
    try {
      const rows = filteredProducts.filter(p => modifiedProducts.has(p.id)).map(p => ({
        id: p.id,
        option_code: p.option_code || null,
        option_name: p.option_name || null,
        item_type: p.item_type || null,
        variety: p.variety || null,
        specification_1: p.specification_1 || null,
        specification_2: p.specification_2 || null,
        specification_3: p.specification_3 || null,
        weight: p.weight != null ? Number(p.weight) : null,
        weight_unit: p.weight_unit || null,
        packaging_box_price: p.packaging_box_price != null ? Number(p.packaging_box_price) : null,
        cushioning_price: p.cushioning_price != null ? Number(p.cushioning_price) : null,
        raw_material_cost: p.raw_material_cost != null ? Number(p.raw_material_cost) : null,
        labor_cost: p.labor_cost != null ? Number(p.labor_cost) : null,
        shipping_fee: p.shipping_fee != null ? Number(p.shipping_fee) : null,
        seller_supply_price: p.seller_supply_price != null ? Number(p.seller_supply_price) : null,
        naver_paid_shipping_price: p.naver_paid_shipping_price != null ? Number(p.naver_paid_shipping_price) : null,
        naver_free_shipping_price: p.naver_free_shipping_price != null ? Number(p.naver_free_shipping_price) : null,
        coupang_paid_shipping_price: p.coupang_paid_shipping_price != null ? Number(p.coupang_paid_shipping_price) : null,
        coupang_free_shipping_price: p.coupang_free_shipping_price != null ? Number(p.coupang_free_shipping_price) : null,
        status: resolveStatusCode(p.status) || p.status || 'PREPARING',
        vendor_id: p.vendor_id || null,
      }))

      const { error: upErr } = await supabase.from('option_products').upsert(rows, { onConflict: 'id' })
      if (upErr) throw upErr

      // 저장 성공 → 스냅샷 갱신 & 표시 리셋 & 되돌리기 초기화
      captureSnapshot(filteredProducts)
      setModifiedProducts(new Set())
      originalValues.current.clear()
      setUndoStack([])
      alert('저장되었습니다.')
      await fetchProducts()
    } catch (e) {
      console.error(e); alert('저장 중 오류가 발생했습니다.')
    }
  }

  // ===== CRUD 모달 =====
  const openModal = (type: string, item?: any) => {
    setModalType(type)
    setEditingItem(item || null)
    setFormData(item || {})
  }

  const closeModal = () => {
    setModalType(null)
    setEditingItem(null)
    setFormData({})
    setSelectedMaterials([])
  }

  const handleSaveProduct = async () => {
    try {
      // 원물 비용 계산
      const rawMaterialCost = selectedMaterials.reduce((sum, m) => sum + (m.quantity * m.price), 0)

      // 옵션상품 데이터
      const productData = {
        ...formData,
        raw_material_cost: rawMaterialCost,
        option_code: formData.option_code || `OPT${Date.now()}`, // 임시 자동생성
      }

      if (editingItem) {
        await supabase.from('option_products').update(productData).eq('id', editingItem.id)
      } else {
        // 신규 생성
        const { data: newProduct, error: productError } = await supabase
          .from('option_products')
          .insert([productData])
          .select()
          .single()

        if (productError) throw productError

        // 원물 연결 정보 저장
        if (selectedMaterials.length > 0 && newProduct) {
          const materialLinks = selectedMaterials
            .filter(m => m.materialId)
            .map(m => ({
              option_product_id: newProduct.id,
              raw_material_id: m.materialId,
              quantity: m.quantity,
              unit_price: m.price
            }))

          await supabase.from('option_product_materials').insert(materialLinks)
        }
      }

      await fetchProducts()
      closeModal()
      alert('저장되었습니다.')
    } catch (e) {
      console.error(e)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return alert('삭제 중 오류가 발생했습니다.')
    if (table === 'option_products') await fetchProducts()
    alert('삭제되었습니다.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">옵션상품 관리</h1>
        <p className="mt-1 text-sm text-gray-600">옵션상품 정보를 통합 관리합니다</p>
      </div>

      {/* 통계 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-600">전체 상품: </span>
            <span className="font-bold">{stats.totalProducts.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">공급중: </span>
            <span className="font-bold text-green-600">{stats.supplyingProducts.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">일시중지: </span>
            <span className="font-bold text-orange-600">{stats.pausedProducts.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">시즌종료: </span>
            <span className="font-bold text-red-600">{stats.seasonEndProducts.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div>
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-[16px] font-semibold text-gray-900">옵션상품 목록</div>
              <span className="text-sm text-gray-500">총 {filteredProducts.length}건</span>

              {/* 상태 필터 배지 */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setSelectedStatus('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>전체 ({products.length})</button>
                {supplyStatuses.map(s => (
                  <button key={s.code} onClick={() => setSelectedStatus(s.code)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedStatus === s.code ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    {s.name} ({products.filter(p => p.status === s.code).length})
                  </button>
                ))}
              </div>

              {/* 검색 */}
              <div className="relative ml-4">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-[200px] h-[32px] pl-3 pr-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="검색..."
                  style={{ borderColor: '#d1d5db' }}
                />
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 상태 표시 */}
              {modifiedProducts.size > 0 && (
                <span className="text-sm font-semibold px-3 py-1.5 rounded-md" style={{ color: '#c2410c', backgroundColor: '#fed7aa' }}>
                  {modifiedProducts.size}개 수정됨
                </span>
              )}
              {selectedRows.size > 0 && (
                <span className="text-sm font-semibold px-3 py-1.5 rounded-md" style={{ color: '#1d4ed8', backgroundColor: '#bfdbfe' }}>
                  {selectedRows.size}개 선택됨
                </span>
              )}

              {/* 버튼들 */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/admin/products/option-products/create')}
              >
                상품 추가
              </Button>

              {selectedRows.size > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setModalType('delete-confirm')}
                >
                  삭제
                </Button>
              )}

              <Button
                variant="gradient-green"
                size="sm"
                onClick={handleOpenConfirm}
                disabled={modifiedProducts.size === 0}
              >
                저장
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[calc(42*30px)]">
          <table className="w-full border-collapse table-fixed text-center">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '110px' }} />
            </colgroup>
            <thead className="sticky top-0 z-30">
              <tr className="bg-gray-50">
                <th className="px-2 py-1 bg-gray-50 border-b border-gray-200 sticky left-0 z-30">
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="cursor-pointer" />
                </th>
                <th className="px-2 py-1.5 text-xs font-medium bg-gray-50 border-b border-gray-200 sticky left-[40px] z-30 text-gray-500">옵션코드</th>
                <th className="px-2 py-1.5 text-xs font-medium bg-gray-50 border-b border-gray-200 sticky left-[160px] z-30 text-gray-500">상품명</th>
                {['품목','품종','규격1','규격2','규격3','중량','단위','박스비','완충재','원물비용','인건비','배송비','셀러공급가','네이버유료','네이버무료','쿠팡유료','쿠팡무료','상태','벤더사','작업'].map((h, i)=>(
                  <th key={i} className="px-2 py-1.5 text-xs font-medium bg-gray-50 border-b border-gray-200 text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, rowIndex) => {
                const isLastInGroup = rowIndex === filteredProducts.length - 1 || filteredProducts[rowIndex + 1]?.item_type !== p.item_type
                const borderClass = isLastInGroup ? 'border-b border-gray-300' : 'border-b border-gray-100'
                const rowBgClass = modifiedProducts.has(p.id) ? 'bg-yellow-50' : selectedRows.has(p.id) ? 'bg-blue-50' : 'bg-gray-50'

                return (
                <tr key={p.id} className={`hover:bg-gray-50 ${borderClass} ${modifiedProducts.has(p.id) ? 'bg-yellow-50' : ''} ${selectedRows.has(p.id) ? 'bg-blue-50' : ''}`}>
                  <td className={`px-2 py-1 sticky left-0 z-20 ${rowBgClass}`}>
                    <input type="checkbox" checked={!!selectedRows.has(p.id)} onChange={() => handleSelectRow(p.id)} className="cursor-pointer" />
                  </td>

                  {[
                    { field: 'option_code', sticky: 'left-[40px]', readonly: true },
                    { field: 'option_name', bold: true, sticky: 'left-[160px]' },
                    { field: 'item_type' },
                    { field: 'variety' },
                    { field: 'specification_1' },
                    { field: 'specification_2' },
                    { field: 'specification_3' },
                    { field: 'weight' },
                    { field: 'weight_unit' },
                    { field: 'packaging_box_price' },
                    { field: 'cushioning_price' },
                    { field: 'raw_material_cost' },
                    { field: 'labor_cost' },
                    { field: 'shipping_fee' },
                    { field: 'seller_supply_price', bgColor: 'bg-blue-50' },
                    { field: 'naver_paid_shipping_price', bgColor: 'bg-green-50' },
                    { field: 'naver_free_shipping_price', bgColor: 'bg-green-50' },
                    { field: 'coupang_paid_shipping_price', bgColor: 'bg-purple-50' },
                    { field: 'coupang_free_shipping_price', bgColor: 'bg-purple-50' },
                    { field: 'status', isStatus: true },
                    { field: 'vendor_id', readonly: true },
                  ].map((col, colOffset) => {
                    const colIndex = colOffset + 1
                    const isSelected =
                      selectedCell?.row === rowIndex &&
                      selectedCell?.col === colIndex &&
                      selectedCell.field === col.field
                    const isEditing =
                      editingCell?.row === rowIndex &&
                      editingCell?.col === colIndex &&
                      editingCell.field === col.field

                    const key = `${p.id}-${col.field}`
                    const base = `px-2 py-1 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap align-middle ${col.bgColor || ''}`
                    const selectedCls = isSelected ? ' ring-2 ring-emerald-500 ring-inset' : ''
                    const textCls = col.bold ? ' font-medium' : ''
                    const modifiedCls = isCellModified(p, col.field) ? ' text-red-600' : ''
                    const stickyCls = col.sticky ? ` sticky ${col.sticky} z-20 ${rowBgClass}` : ''
                    const readonlyCls = col.readonly ? ' cursor-default' : ''

                    // 읽기전용 필드
                    if (col.readonly) {
                      return (
                        <td
                          key={key}
                          className={`${base}${textCls}${stickyCls}${readonlyCls} text-gray-600`}
                          title="읽기전용"
                        >
                          {displayValue(col.field, p)}
                        </td>
                      )
                    }

                    // 편집 모드: contentEditable
                    if (isEditing) {
                      return (
                        <td
                          key={key}
                          className={`${base}${textCls}${selectedCls}${modifiedCls}${stickyCls}`}
                          contentEditable
                          suppressContentEditableWarning
                          onClick={(e) => e.stopPropagation()}
                          onPaste={(e) => {
                            e.preventDefault()
                            const t = (e.clipboardData.getData('text/plain') || '').replace(/\r?\n/g, '')
                            document.execCommand('insertText', false, t)
                          }}
                          onCompositionStart={() => setIsComposing(true)}
                          onCompositionEnd={() => setIsComposing(false)}
                          onKeyDown={(e) => handleTdKeyDown(e, rowIndex, col.field)}
                          onBlur={(e) => handleTdBlur(e, rowIndex, col.field)}
                          title=""
                        >
                          {rawValue(col.field, p) || ''}
                        </td>
                      )
                    }

                    // 보기 모드 (상태 커스텀)
                    if (col.isStatus) {
                      const st = supplyStatuses.find(s => s.name === p.status)
                      const bg = st?.color || '#6B7280'
                      return (
                        <td
                          key={key}
                          className={`${base}${selectedCls}${stickyCls}`}
                          onClick={() => handleCellClick(rowIndex, colIndex, col.field)}
                          title="같은 셀을 다시 클릭하면 입력모드"
                        >
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: bg }}>
                            {st?.name || p.status || '-'}
                          </span>
                          {isCellModified(p, col.field) && <span className="ml-1 text-red-600">•</span>}
                        </td>
                      )
                    }

                    return (
                      <td
                        key={key}
                        className={`${base}${textCls}${selectedCls}${modifiedCls}${stickyCls}`}
                        onClick={() => handleCellClick(rowIndex, colIndex, col.field)}
                        title="같은 셀을 다시 클릭하면 입력모드"
                      >
                        {displayValue(col.field, p)}
                      </td>
                    )
                  })}

                  <td className={`px-2 py-1.5 text-xs ${rowBgClass}`}>
                    <div className="flex gap-1 justify-center">
                      <Button variant="primary" size="xs" onClick={() => openModal('product', p)}>수정</Button>
                      <Button variant="danger" size="xs" onClick={() => handleDelete('option_products', p.id)}>삭제</Button>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center px-6 pb-4">
          <p>• <b>같은 셀을 두 번 클릭</b>하면 입력모드(커서만 보임)</p>
          <p>• <b>Enter</b> 저장, <b>Esc</b> 취소, <b>포커스 아웃</b> 저장</p>
          <p>• 선택된 셀에서 <b>Ctrl/Cmd + C</b> 복사, <b>Ctrl/Cmd + V</b> 붙여넣기, <b>Ctrl/Cmd + Z</b> 되돌리기</p>
        </div>
      </div>

      {/* 변경사항 컨펌 모달 */}
      {isConfirmOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConfirmOpen(false)}
          title={`변경사항 확인 (${saveDiffs.length}개 필드)`}
          size="xl"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>취소</Button>
              <Button variant="primary" onClick={handleConfirmSave}>저장 진행</Button>
            </>
          }
        >
          <div className="max-h-[60vh] overflow-auto">
            {saveDiffs.length === 0 ? (
              <p className="text-sm text-gray-600">변경된 내용이 없습니다.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-2 text-left">상품</th>
                    <th className="p-2 text-left">필드</th>
                    <th className="p-2 text-left">변경 전</th>
                    <th className="p-2 text-left">변경 후</th>
                  </tr>
                </thead>
                <tbody>
                  {saveDiffs.map((d, i) => (
                    <tr key={`${d.id}-${d.field}-${i}`} className="border-b">
                      <td className="p-2">{d.name}</td>
                      <td className="p-2">{d.fieldLabel}</td>
                      <td className="p-2 text-gray-500">{d.before === '' ? '—' : d.before}</td>
                      <td className="p-2 text-red-600 font-medium">{d.after === '' ? '—' : d.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      {/* 삭제 컨펌 모달 */}
      {modalType === 'delete-confirm' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title="선택 항목 삭제"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalType(null)}>취소</Button>
              <Button variant="danger" onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">삭제</Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              선택한 <strong className="text-red-600">{selectedRows.size}개</strong>의 옵션상품을 삭제하시겠습니까?
            </p>
            <div className="max-h-[40vh] overflow-auto bg-gray-50 rounded-lg p-3">
              <ul className="space-y-2">
                {Array.from(selectedRows).map(id => {
                  const item = filteredProducts.find(p => p.id === id)
                  if (!item) return null
                  return (
                    <li key={id} className="text-sm flex items-center gap-2">
                      <span className="text-red-500">•</span>
                      <span className="font-medium">{item.option_name || item.option_code}</span>
                      <span className="text-gray-500 text-xs">
                        ({item.item_type} / {item.variety})
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>삭제된 데이터는 복구할 수 없습니다.</span>
            </div>
          </div>
        </Modal>
      )}

      {/* 옵션상품 생성 모달 */}
      {modalType === 'product' && !editingItem && (
        <Modal isOpen={true} onClose={closeModal} title="옵션상품 생성" size="xl"
          footer={<><Button variant="ghost" onClick={closeModal}>취소</Button><Button onClick={handleSaveProduct}>저장</Button></>}>
          <div className="space-y-6">
            {/* 1. 기본 정보 */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">기본 정보</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">옵션코드</label>
                  <input
                    value={formData.option_code || ''}
                    onChange={(e)=>setFormData({...formData, option_code: e.target.value})}
                    placeholder="자동생성"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">상품명 *</label>
                  <input
                    value={formData.option_name || ''}
                    onChange={(e)=>setFormData({...formData, option_name: e.target.value})}
                    placeholder="예: 복숭아 1.3kg 8과"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">품목</label>
                  <input
                    value={formData.item_type || ''}
                    onChange={(e)=>setFormData({...formData, item_type: e.target.value})}
                    placeholder="예: 복숭아"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">품종</label>
                  <input
                    value={formData.variety || ''}
                    onChange={(e)=>setFormData({...formData, variety: e.target.value})}
                    placeholder="예: 딱딱이"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">규격1</label>
                  <input
                    value={formData.specification_1 || ''}
                    onChange={(e)=>setFormData({...formData, specification_1: e.target.value})}
                    placeholder="예: 1.3kg"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. 원물 검색 및 선택 */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">원물 검색</h3>
              <div className="space-y-3">
                {/* 검색창 */}
                <input
                  type="text"
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  placeholder="원물명, 품목, 품종으로 검색..."
                  className="w-full border rounded px-3 py-2 text-sm"
                />

                {/* 검색 결과 */}
                {materialSearch && (
                  <div className="max-h-48 overflow-y-auto border rounded bg-gray-50">
                    {rawMaterials
                      .filter(m =>
                        m.material_name?.toLowerCase().includes(materialSearch.toLowerCase()) ||
                        m.category_4?.toLowerCase().includes(materialSearch.toLowerCase()) ||
                        m.category_5?.toLowerCase().includes(materialSearch.toLowerCase())
                      )
                      .map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMaterial(m)
                            setMaterialSearch('')
                            setSubdivisionQuantity(m.standard_quantity || 1)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                        >
                          <div className="text-sm font-medium">{m.material_name}</div>
                          <div className="text-xs text-gray-600">
                            {m.category_4} {m.category_5 && `/ ${m.category_5}`} - {m.standard_quantity}{m.standard_unit} - {m.latest_price?.toLocaleString()}원
                          </div>
                        </button>
                      ))
                    }
                  </div>
                )}

                {/* 선택된 원물 & 소분 설정 */}
                {selectedMaterial && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm">{selectedMaterial.material_name}</div>
                        <div className="text-xs text-gray-600">
                          기준: {selectedMaterial.standard_quantity}{selectedMaterial.standard_unit} / {selectedMaterial.latest_price?.toLocaleString()}원
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMaterial(null)
                          setSubdivisionQuantity(1)
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 소분 단위 입력 */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">소분 단위 (몇 {selectedMaterial.standard_unit}씩?)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={subdivisionQuantity}
                          onChange={(e) => setSubdivisionQuantity(Number(e.target.value))}
                          className="flex-1 border rounded px-3 py-2 text-sm"
                        />
                        <span className="text-sm text-gray-600">{selectedMaterial.standard_unit}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        → 1개당 중량: {subdivisionQuantity}{selectedMaterial.standard_unit}
                        / 가격: {((subdivisionQuantity / selectedMaterial.standard_quantity) * selectedMaterial.latest_price).toLocaleString()}원
                      </div>
                    </div>

                    {/* 추가 버튼 */}
                    <button
                      onClick={() => {
                        const unitPrice = (subdivisionQuantity / selectedMaterial.standard_quantity) * selectedMaterial.latest_price
                        setSelectedMaterials([...selectedMaterials, {
                          materialId: selectedMaterial.id,
                          quantity: 1, // 기본 1개
                          price: unitPrice
                        }])
                        setFormData({
                          ...formData,
                          weight: subdivisionQuantity,
                          weight_unit: selectedMaterial.standard_unit,
                          item_type: selectedMaterial.category_4 || formData.item_type,
                          variety: selectedMaterial.category_5 || formData.variety
                        })
                        setSelectedMaterial(null)
                      }}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      이 원물로 옵션상품 구성하기
                    </button>
                  </div>
                )}

                {/* 선택된 원물 목록 */}
                {selectedMaterials.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-700">구성 원물</div>
                    {selectedMaterials.map((mat, idx) => {
                      const material = rawMaterials.find(m => m.id === mat.materialId)
                      return (
                        <div key={idx} className="flex items-center gap-2 bg-gray-100 p-2 rounded text-xs">
                          <span className="flex-1">{material?.material_name}</span>
                          <span>{mat.quantity}개 × {mat.price.toLocaleString()}원</span>
                          <button
                            onClick={() => setSelectedMaterials(selectedMaterials.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. 포장자재 */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">포장자재</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">박스비용</label>
                  <input
                    type="number"
                    value={formData.packaging_box_price || 0}
                    onChange={(e)=>setFormData({...formData, packaging_box_price: Number(e.target.value)})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">완충재</label>
                  <input
                    type="number"
                    value={formData.cushioning_price || 0}
                    onChange={(e)=>setFormData({...formData, cushioning_price: Number(e.target.value)})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">인건비</label>
                  <input
                    type="number"
                    value={formData.labor_cost || 1000}
                    onChange={(e)=>setFormData({...formData, labor_cost: Number(e.target.value)})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 4. 공급 정보 */}
            <div>
              <h3 className="text-sm font-semibold mb-3">공급 정보</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">공급상태</label>
                  <select
                    value={formData.status || supplyStatuses[0]?.name}
                    onChange={(e)=>setFormData({...formData, status: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {supplyStatuses.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">벤더사</label>
                  <select
                    value={formData.vendor_id || ''}
                    onChange={(e)=>setFormData({...formData, vendor_id: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">선택안함</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 총 원가 표시 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">총 원가</span>
                <span className="text-lg font-bold text-blue-600">
                  {(
                    selectedMaterials.reduce((sum, m) => sum + (m.quantity * m.price), 0) +
                    (formData.packaging_box_price || 0) +
                    (formData.cushioning_price || 0) +
                    (formData.labor_cost || 0)
                  ).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* contentEditable 상태 보정: 입력란처럼 보이는 스타일 제거
          선택 테두리는 className의 ring-* 로만 표시 */}
      <style jsx global>{`
        td[contenteditable="true"] {
          outline: none !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  )
}
