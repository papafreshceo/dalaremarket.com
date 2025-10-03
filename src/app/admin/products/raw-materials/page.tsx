// app/admin/products/raw-materials/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Modal, Badge } from '@/components/ui'

// ===== 타입 =====
interface Supplier {
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
interface RawMaterial {
  id: string
  material_code: string
  material_name: string
  category_1: string | null  // 대분류
  category_2: string | null  // 중분류
  category_3: string | null  // 소분류
  category_4: string | null  // 품목
  category_5: string | null  // 품종
  standard_unit: string
  supply_status: string
  main_supplier_id: string | null
  latest_price?: number
  unit_quantity?: number
  last_trade_date?: string
  supplier_name?: string
  season?: string
  season_start_date?: string
  season_peak_date?: string
  season_end_date?: string
  color_code?: string
  created_at?: string
  [key: string]: any
}
interface SupplyStatus {
  id?: string
  code: string
  name: string
  color: string
  display_order?: number
  is_active?: boolean
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

export default function RawMaterialsManagementPage() {
  const [loading, setLoading] = useState(false)

  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<RawMaterial[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplyStatuses, setSupplyStatuses] = useState<SupplyStatus[]>([])

  const [stats, setStats] = useState({ totalMaterials: 0, shippingMaterials: 0, seasonEndMaterials: 0, todayPriceUpdates: 0 })

  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchInput, setSearchInput] = useState<string>('')
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('')

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const [modalType, setModalType] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<FormData>({})

  // 엑셀식 편집
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null) // 1클릭 = 선택
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)   // 같은 셀 2클릭 = 편집(커서만)
  const originalValues = useRef<Map<string, any>>(new Map())
  const [modifiedMaterials, setModifiedMaterials] = useState<Set<string>>(new Set())

  // IME 조합 상태
  const [isComposing, setIsComposing] = useState(false)

  // 되돌리기 스택
  const [undoStack, setUndoStack] = useState<EditAction[]>([])

  // 원본 스냅샷(변경 표시/디프 기준)
  const originalSnapshot = useRef<Map<string, RawMaterial>>(new Map())

  // 저장 컨펌 모달
  const [saveDiffs, setSaveDiffs] = useState<DiffItem[]>([])
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const supabase = createClient()
  const fmtInt = new Intl.NumberFormat('ko-KR')
  const fmtMD = new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit' })
  const getKey = (id: string, field: string) => `${id}-${field}`

  const FIELD_LABELS: Record<string,string> = {
    material_code: '원물코드',
    material_name: '원물명',
    category_1: '대분류',
    category_2: '중분류',
    category_3: '소분류',
    category_4: '품목',
    category_5: '품종',
    standard_unit: '단위',
    latest_price: '현재시세',
    unit_quantity: '단위수량',
    last_trade_date: '최근거래',
    main_supplier_id: '주거래처',
    season: '시즌',
    season_start_date: '시작일',
    season_peak_date: '피크시기',
    season_end_date: '종료일',
    supply_status: '상태',
    color_code: '색코드',
  }

  const FIELD_ORDER = [
    'material_code','material_name','category_1','category_2','category_3','category_4','category_5',
    'standard_unit','latest_price','unit_quantity','last_trade_date','main_supplier_id','season',
    'season_start_date','season_peak_date','season_end_date','supply_status','color_code'
  ]

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#039;')

  // ===== 유틸 =====
  const resolveStatusName = (name?: string | null) => {
    if (!name) return null
    const hit = supplyStatuses.find(s => s.name === name.trim())
    return hit?.name || null
  }
  const resolveSupplierIdByName = (name?: string | null) => {
    if (!name) return null
    const t = name.trim()
    const exact = suppliers.find(s => s.name === t)
    if (exact) return exact.id
    const part = suppliers.filter(s => s.name.includes(t)).sort((a,b)=>a.name.length-b.name.length)[0]
    return part?.id || null
  }

  // 표시용
  const displayValue = (field: string, m: RawMaterial) => {
    switch (field) {
      case 'latest_price': return m.latest_price != null ? fmtInt.format(Number(m.latest_price)) : '-'
      case 'unit_quantity': return m.unit_quantity != null ? String(m.unit_quantity) : '1'
      case 'last_trade_date':
      case 'season_start_date':
      case 'season_peak_date':
      case 'season_end_date': return m[field] ? fmtMD.format(new Date(m[field]!)) : '-'
      case 'main_supplier_id': return m.supplier_name || '-'
      default: return (m as any)[field] ?? ((m as any)[field] === 0 ? '0' : '-')
    }
  }

  // 원시값(복사/편집용)
  const rawValue = (field: string, m: RawMaterial) => {
    switch (field) {
      case 'latest_price': return m.latest_price != null ? String(m.latest_price) : ''
      case 'unit_quantity': return m.unit_quantity != null ? String(m.unit_quantity) : '1'
      case 'last_trade_date':
      case 'season_start_date':
      case 'season_peak_date':
      case 'season_end_date': return m[field] || ''
      case 'main_supplier_id': return m.supplier_name || ''
      default: return (m as any)[field] != null ? String((m as any)[field]) : ''
    }
  }

  const rawValueFromSnapshot = (field: string, id: string): string => {
    const snap = originalSnapshot.current.get(id)
    if (!snap) return ''
    return rawValue(field, snap)
  }

  const isCellModified = (m: RawMaterial, field: string) => {
    const before = rawValueFromSnapshot(field, m.id)
    const after = rawValue(field, m)
    return (before ?? '') !== (after ?? '')
  }

  const parseAndAssign = (field: string, text: string, src: RawMaterial): RawMaterial => {
    const m = { ...src }
    const t = (text ?? '').trim()

    if (['latest_price', 'unit_quantity'].includes(field)) {
      const n = t === '' ? null : Number(t.replace(/,/g, ''))
      ;(m as any)[field] = Number.isFinite(n as number) ? n : null
      return m
    }
    if (['last_trade_date','season_start_date','season_peak_date','season_end_date'].includes(field)) {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(t)
      ;(m as any)[field] = ok ? t : (t === '' ? null : src[field])
      return m
    }
    if (field === 'supply_status') {
      const v = resolveStatusName(t)
      if (v) m.supply_status = v
      return m
    }
    if (field === 'main_supplier_id') {
      const id = resolveSupplierIdByName(t)
      m.main_supplier_id = id
      m.supplier_name = t || (id ? suppliers.find(s => s.id === id)?.name : null) || null
      return m
    }
    if (field === 'color_code') {
      const ok = /^#([0-9A-Fa-f]{6})$/.test(t)
      m.color_code = t === '' ? null : (ok ? t : src.color_code || null)
      return m
    }
    ;(m as any)[field] = t === '' ? null : t
    return m
  }

  // ===== 데이터 로드 =====
  useEffect(() => { void fetchAll() }, [])
  const fetchAll = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchMaterials(), fetchSuppliers(), fetchSupplyStatuses()])
    } finally { setLoading(false) }
  }

  const captureSnapshot = (rows: RawMaterial[]) => {
    originalSnapshot.current.clear()
    rows.forEach(r => {
      originalSnapshot.current.set(r.id, { ...r })
    })
  }

  const fetchMaterials = async () => {
    // raw_materials 테이블에서 직접 조회하고 supplier name은 JOIN으로 가져오기
    const { data } = await supabase
      .from('raw_materials')
      .select(`
        *,
        supplier:suppliers!main_supplier_id(name)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      // supplier name을 supplier_name 필드로 매핑
      const mapped = data.map(row => ({
        ...row,
        supplier_name: row.supplier?.name || null
      }))
      setMaterials(mapped)
      setFilteredMaterials(mapped)
      captureSnapshot(mapped) // 스냅샷 갱신
      setModifiedMaterials(new Set())
      originalValues.current.clear()
      setUndoStack([]) // 저장/로드 시 되돌리기 초기화
    }
  }
  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').eq('is_active', true).order('name')
    if (data) setSuppliers(data)
  }
  const fetchSupplyStatuses = async () => {
    const { data } = await supabase.from('supply_status_settings').select('*').eq('status_type', 'raw_material').eq('is_active', true).order('display_order')
    if (data) setSupplyStatuses(data)
  }

  // 통계
  useEffect(() => { void refreshStats(materials) }, [materials])
  const refreshStats = async (snapshot: RawMaterial[]) => {
    const today = new Date().toISOString().split('T')[0]
    try {
      const [{ count: total }, { count: shipping }, { count: seasonEnd }, { count: todayCnt }] = await Promise.all([
        supabase.from('raw_materials').select('*', { count: 'exact', head: true }),
        supabase.from('raw_materials').select('*', { count: 'exact', head: true }).eq('supply_status', '출하중'),
        supabase.from('raw_materials').select('*', { count: 'exact', head: true }).eq('supply_status', '시즌종료'),
        supabase.from('material_price_history').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`)
      ])
      setStats({ totalMaterials: total || 0, shippingMaterials: shipping || 0, seasonEndMaterials: seasonEnd || 0, todayPriceUpdates: todayCnt || 0 })
    } catch {
      setStats({
        totalMaterials: snapshot.length,
        shippingMaterials: snapshot.filter(m => m.supply_status === '출하중').length,
        seasonEndMaterials: snapshot.filter(m => m.supply_status === '시즌종료').length,
        todayPriceUpdates: 0
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
    let f = [...materials]
    if (globalSearchTerm) {
      const s = globalSearchTerm.toLowerCase()
      f = f.filter(m => {
        const arr = [
          m.material_code, m.material_name,
          m.category_1, m.category_2, m.category_3, m.category_4, m.category_5,
          m.standard_unit, m.supply_status, m.supplier_name, m.season, m.color_code,
          m.latest_price?.toString(), m.unit_quantity?.toString(),
          m.last_trade_date, m.season_start_date, m.season_peak_date, m.season_end_date
        ]
        return arr.some(v => (v ?? '').toString().toLowerCase().includes(s))
      })
    }
    if (selectedStatus !== 'all') f = f.filter(m => m.supply_status === selectedStatus)
    setFilteredMaterials(f)
    setSelectedRows(new Set()); setSelectAll(false)
  }, [materials, selectedStatus, globalSearchTerm])

  // ===== 선택/삭제 =====
  const handleSelectAll = () => {
    if (selectAll) setSelectedRows(new Set())
    else setSelectedRows(new Set(filteredMaterials.map(m => m.id)))
    setSelectAll(!selectAll)
  }
  const handleSelectRow = (id: string) => {
    const next = new Set(selectedRows)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedRows(next); setSelectAll(next.size === filteredMaterials.length)
  }
  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) {
      alert('선택된 항목이 없습니다.')
      setModalType(null)
      return
    }
    const ids = Array.from(selectedRows)
    const { error } = await supabase.from('raw_materials').delete().in('id', ids)
    if (error) {
      alert('삭제 중 오류가 발생했습니다.')
      return
    }
    setSelectedRows(new Set())
    setSelectAll(false)
    setModalType(null)
    await fetchMaterials()
    alert('삭제되었습니다.')
  }

  // ===== 엑셀식 편집: td contentEditable =====
  const handleCellClick = (rowIndex: number, colIndex: number, field: string) => {
    const m = filteredMaterials[rowIndex]
    if (!m) return
    const isSame = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex && selectedCell.field === field
    if (isSame) {
      const key = getKey(m.id, field)
      if (!originalValues.current.has(key)) originalValues.current.set(key, rawValue(field, m))
      setEditingCell({ row: rowIndex, col: colIndex, field })
    } else {
      setSelectedCell({ row: rowIndex, col: colIndex, field })
      setEditingCell(null)
    }
  }

  // 한 행의 전체 변경 여부 재평가
  const recomputeRowModifiedFlag = (row: RawMaterial) => {
    const anyChanged = FIELD_ORDER.some(f => {
      const before = rawValueFromSnapshot(f, row.id)
      const after = rawValue(f, row)
      return (before ?? '') !== (after ?? '')
    })
    setModifiedMaterials(prev => {
      const s = new Set(prev)
      if (anyChanged) s.add(row.id); else s.delete(row.id)
      return s
    })
  }

  const commitEdit = (rowIndex: number, field: string, text: string) => {
    const m = filteredMaterials[rowIndex]
    if (!m) return

    const key = getKey(m.id, field)
    const orig = originalValues.current.get(key) ?? rawValueFromSnapshot(field, m.id)
    const nextText = (text ?? '').trim()

    setEditingCell(null)

    if (nextText === (orig ?? '')) {
      // 동일 → 변경 플래그 정리
      let hasOther = false
      originalValues.current.forEach((o, k) => {
        if (k.startsWith(m.id) && k !== key) {
          const f = k.split('-')[1]
          if ((m as any)[f] !== o) hasOther = true
        }
      })
      if (!hasOther) {
        setModifiedMaterials(prev => { const s=new Set(prev); s.delete(m.id); return s })
      }
      return
    }

    // 되돌리기 스택 push (원시 문자열 기준)
    setUndoStack(prev => [...prev, { id: m.id, field, before: orig ?? '', after: nextText }])

    const updated = parseAndAssign(field, nextText, m)

    // filteredMaterials와 materials 둘 다 업데이트
    setFilteredMaterials(prev => {
      const next = [...prev]
      next[rowIndex] = updated
      return next
    })

    setMaterials(prev => prev.map(item => item.id === updated.id ? updated : item))

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
        const idx = filteredMaterials.findIndex(r => r.id === last.id)
        if (idx >= 0) {
          const row = filteredMaterials[idx]
          // before 값으로 되돌림
          const reverted = parseAndAssign(last.field, last.before, row)
          const nextRows = [...filteredMaterials]
          nextRows[idx] = reverted
          setFilteredMaterials(nextRows)
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
        const m = filteredMaterials[row]
        try { await navigator.clipboard.writeText(rawValue(field, m)) } catch {}
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
  }, [selectedCell, editingCell, filteredMaterials, undoStack])

  // ===== 저장(컨펌 모달) =====
  const buildDiffs = (): DiffItem[] => {
    const diffs: DiffItem[] = []
    filteredMaterials
      .filter(m => modifiedMaterials.has(m.id))
      .forEach(m => {
        FIELD_ORDER.forEach(field => {
          const before = rawValueFromSnapshot(field, m.id)
          const after = rawValue(field, m)
          if ((before ?? '') !== (after ?? '')) {
            diffs.push({
              id: m.id,
              name: m.material_name || m.material_code || '(이름없음)',
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
    if (modifiedMaterials.size === 0) {
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
      const rows = filteredMaterials.filter(m => modifiedMaterials.has(m.id)).map(m => ({
        id: m.id,
        material_code: m.material_code || null,
        material_name: m.material_name || null,
        category_1: m.category_1 || null,
        category_2: m.category_2 || null,
        category_3: m.category_3 || null,
        category_4: m.category_4 || null,
        category_5: m.category_5 || null,
        standard_unit: m.standard_unit || 'kg',
        supply_status: resolveStatusName(m.supply_status) || m.supply_status || '출하중',
        main_supplier_id: m.main_supplier_id || null,
        unit_quantity: m.unit_quantity != null ? Number(m.unit_quantity) : null,
        last_trade_date: m.last_trade_date || null,
        season: m.season || null,
        season_start_date: m.season_start_date || null,
        season_peak_date: m.season_peak_date || null,
        season_end_date: m.season_end_date || null,
        color_code: m.color_code || null,
      }))
      const { error: upErr } = await supabase.from('raw_materials').upsert(rows, { onConflict: 'id' })
      if (upErr) throw upErr

      const today = new Date().toISOString().split('T')[0]
      const priceRows = filteredMaterials
        .filter(m => modifiedMaterials.has(m.id) && m.latest_price != null && m.latest_price !== '')
        .map(m => ({
          material_id: m.id,
          price: Number(m.latest_price),
          unit_quantity: Number(m.unit_quantity || 1),
          effective_date: today,
          price_type: 'PURCHASE'
        }))
      if (priceRows.length) {
        const { error: phErr } = await supabase.from('material_price_history').insert(priceRows)
        if (phErr) throw phErr
      }

      // 저장 성공 → 스냅샷 갱신 & 표시 리셋 & 되돌리기 초기화
      captureSnapshot(filteredMaterials)
      setModifiedMaterials(new Set())
      originalValues.current.clear()
      setUndoStack([])
      alert('저장되었습니다.')
      await fetchMaterials()
    } catch (e) {
      console.error(e); alert('저장 중 오류가 발생했습니다.')
    }
  }

  // ===== CRUD 모달 =====
  const openModal = (type: string, item?: any) => { setModalType(type); setEditingItem(item || null); setFormData(item || {}) }
  const closeModal = () => { setModalType(null); setEditingItem(null); setFormData({}) }
  const handleSaveMaterial = async () => {
    try {
      if (editingItem) await supabase.from('raw_materials').update(formData).eq('id', editingItem.id)
      else await supabase.from('raw_materials').insert([formData])
      await fetchMaterials(); closeModal(); alert('저장되었습니다.')
    } catch { alert('저장 중 오류가 발생했습니다.') }
  }
  const handleDelete = async (table: string, id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return alert('삭제 중 오류가 발생했습니다.')
    if (table === 'raw_materials') await fetchMaterials()
    alert('삭제되었습니다.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">원물관리</h1>
        <p className="mt-1 text-sm text-gray-600">원물 정보와 시세를 통합 관리합니다</p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-600">전체 원물</p>
              <p className="text-2xl font-bold">{stats.totalMaterials.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-600">출하중</p>
              <p className="text-2xl font-bold text-green-600">{stats.shippingMaterials.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-600">시즌종료</p>
              <p className="text-2xl font-bold text-orange-600">{stats.seasonEndMaterials.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-600">오늘 시세 등록</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayPriceUpdates.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => openModal('material-register')} className="text-left">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">모달</span>
            </div>
            <h3 className="font-semibold text-lg mb-1">원물등록관리</h3>
            <p className="text-sm text-gray-600">새로운 원물을 등록하고 정보를 수정합니다</p>
          </Card>
        </button>
        <button onClick={() => openModal('price-record')} className="text-left">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">모달</span>
            </div>
            <h3 className="font-semibold text-lg mb-1">시세기록</h3>
            <p className="text-sm text-gray-600">원물별 시세를 기록하고 이력을 관리합니다</p>
          </Card>
        </button>
        <button onClick={() => openModal('price-analysis')} className="text-left">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">모달</span>
            </div>
            <h3 className="font-semibold text-lg mb-1">시세분석</h3>
            <p className="text-sm text-gray-600">시세 변동 추이를 분석하고 예측합니다</p>
          </Card>
        </button>
      </div>

      {/* 상태 필터 */}
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedStatus('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>전체 ({materials.length})</button>
          {supplyStatuses.map(s => (
            <button key={s.code} onClick={() => setSelectedStatus(s.name)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedStatus === s.name ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              {s.name} ({materials.filter(m => m.supply_status === s.name).length})
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">원물 목록</h3>
              <span className="text-sm text-gray-500">총 {filteredMaterials.length}건</span>

              {/* 검색 - 타이틀 옆 */}
              <div className="relative ml-4">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-[200px] pl-3 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {modifiedMaterials.size > 0 && (
                <span className="text-sm font-semibold px-3 py-1.5 rounded-md" style={{ color: '#c2410c', backgroundColor: '#fed7aa' }}>
                  {modifiedMaterials.size}개 수정됨
                </span>
              )}
              {selectedRows.size > 0 && (
                <span className="text-sm font-semibold px-3 py-1.5 rounded-md" style={{ color: '#1d4ed8', backgroundColor: '#bfdbfe' }}>
                  {selectedRows.size}개 선택됨
                </span>
              )}

              {/* 버튼들 */}
              <button
                onClick={() => openModal('material')}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: '#2563eb' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                원물 추가
              </button>

              {selectedRows.size > 0 && (
                <button
                  onClick={() => setModalType('delete-confirm')}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#dc2626' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#b91c1c'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  삭제
                </button>
              )}

              <button
                onClick={handleOpenConfirm}
                disabled={modifiedMaterials.size === 0}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: modifiedMaterials.size === 0 ? '#9ca3af' : '#16a34a' }}
                onMouseEnter={(e) => {
                  if (modifiedMaterials.size > 0) {
                    e.currentTarget.style.backgroundColor = '#15803d'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (modifiedMaterials.size > 0) {
                    e.currentTarget.style.backgroundColor = '#16a34a'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed text-center">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '110px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-2 py-3">
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="cursor-pointer" />
                </th>
                {['원물코드','원물명','대분류','중분류','소분류','품목','품종','단위','현재시세','단위수량','최근거래','주거래처','시즌','시작일','피크시기','종료일','상태','색코드','작업'].map((h, i)=>(
                  <th key={i} className="px-2 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((m, rowIndex) => {
                // 다음 행과 품목이 다른지 확인 (마지막 행이거나 다음 행의 category_4가 다르면 true)
                const isLastInGroup =
                  rowIndex === filteredMaterials.length - 1 ||
                  filteredMaterials[rowIndex + 1]?.category_4 !== m.category_4

                const borderClass = isLastInGroup
                  ? 'border-b border-gray-300'
                  : 'border-b border-gray-100'

                return (
                <tr key={m.id} className={`hover:bg-gray-50 ${borderClass} ${modifiedMaterials.has(m.id) ? 'bg-yellow-50' : ''} ${selectedRows.has(m.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-2 py-2">
                    <input type="checkbox" checked={!!selectedRows.has(m.id)} onChange={() => handleSelectRow(m.id)} className="cursor-pointer" />
                  </td>

                  {[
                    { field: 'material_code' },
                    { field: 'material_name', bold: true },
                    { field: 'category_1' },
                    { field: 'category_2' },
                    { field: 'category_3' },
                    { field: 'category_4' },
                    { field: 'category_5' },
                    { field: 'standard_unit' },
                    { field: 'latest_price' },
                    { field: 'unit_quantity' },
                    { field: 'last_trade_date' },
                    { field: 'main_supplier_id' },    // 표시: supplier_name
                    { field: 'season' },
                    { field: 'season_start_date' },
                    { field: 'season_peak_date' },
                    { field: 'season_end_date' },
                    { field: 'supply_status', isStatus: true },
                    { field: 'color_code', isColor: true },
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

                    const key = `${m.id}-${col.field}`
                    const base = 'px-2 py-2 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap align-middle'
                    const selectedCls = isSelected ? ' ring-2 ring-emerald-500 ring-inset' : ''
                    const textCls = col.bold ? ' font-medium' : ''
                    const modifiedCls = isCellModified(m, col.field) ? ' text-red-600' : ''

                    // 편집 모드: contentEditable
                    if (isEditing) {
                      return (
                        <td
                          key={key}
                          className={`${base}${textCls}${selectedCls}${modifiedCls}`}
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
                          {rawValue(col.field, m) || ''}
                        </td>
                      )
                    }

                    // 보기 모드 (상태/색상 커스텀)
                    if (col.isStatus) {
                      const st = supplyStatuses.find(s => s.name === m.supply_status)
                      const bg = st?.color || '#6B7280'
                      return (
                        <td
                          key={key}
                          className={`${base}${selectedCls}`}
                          onClick={() => handleCellClick(rowIndex, colIndex, col.field)}
                          title="같은 셀을 다시 클릭하면 입력모드"
                        >
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: bg }}>
                            {m.supply_status || '-'}
                          </span>
                          {isCellModified(m, col.field) && <span className="ml-1 text-red-600">•</span>}
                        </td>
                      )
                    }
                    if (col.isColor) {
                      const isMod = isCellModified(m, col.field)
                      return (
                        <td
                          key={key}
                          className={`${base}${selectedCls}`}
                          onClick={() => handleCellClick(rowIndex, colIndex, col.field)}
                          title="같은 셀을 다시 클릭하면 입력모드"
                        >
                          {m.color_code ? (
                            <div
                              className={`w-6 h-6 mx-auto rounded border ${isMod ? 'ring-2 ring-red-500' : ''}`}
                              style={{ backgroundColor: m.color_code }}
                              title={m.color_code}
                            />
                          ) : '-'}
                        </td>
                      )
                    }

                    return (
                      <td
                        key={key}
                        className={`${base}${textCls}${selectedCls}${modifiedCls}`}
                        onClick={() => handleCellClick(rowIndex, colIndex, col.field)}
                        title="같은 셀을 다시 클릭하면 입력모드"
                      >
                        {displayValue(col.field, m)}
                      </td>
                    )
                  })}

                  <td className="px-2 py-2 text-xs">
                    <div className="flex gap-1 justify-center">
                      <Badge variant="primary" size="sm" className="cursor-pointer" onClick={() => openModal('material', m)}>수정</Badge>
                      <Badge variant="danger" size="sm" className="cursor-pointer" onClick={() => handleDelete('raw_materials', m.id)}>삭제</Badge>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>• <b>같은 셀을 두 번 클릭</b>하면 입력모드(커서만 보임)</p>
          <p>• <b>Enter</b> 저장, <b>Esc</b> 취소, <b>포커스 아웃</b> 저장</p>
          <p>• 선택된 셀에서 <b>Ctrl/Cmd + C</b> 복사, <b>Ctrl/Cmd + V</b> 붙여넣기, <b>Ctrl/Cmd + Z</b> 되돌리기</p>
        </div>
      </Card>

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
                    <th className="p-2 text-left">원물</th>
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
              선택한 <strong className="text-red-600">{selectedRows.size}개</strong>의 원물을 삭제하시겠습니까?
            </p>
            <div className="max-h-[40vh] overflow-auto bg-gray-50 rounded-lg p-3">
              <ul className="space-y-2">
                {Array.from(selectedRows).map(id => {
                  const item = filteredMaterials.find(m => m.id === id)
                  if (!item) return null
                  return (
                    <li key={id} className="text-sm flex items-center gap-2">
                      <span className="text-red-500">•</span>
                      <span className="font-medium">{item.material_name || item.material_code}</span>
                      <span className="text-gray-500 text-xs">
                        ({item.category_1} &gt; {item.category_2} &gt; {item.category_4})
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

      {/* CRUD 모달들 (간단 유지) */}
      {modalType === 'material' && (
        <Modal isOpen={true} onClose={closeModal} title={editingItem ? '원물 수정' : '원물 추가'} size="lg"
          footer={<><Button variant="ghost" onClick={closeModal}>취소</Button><Button onClick={handleSaveMaterial}>저장</Button></>}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">원물코드</label>
              <input value={formData.material_code || ''} onChange={(e)=>setFormData({...formData, material_code: e.target.value})} className="w-full border rounded px-2 py-1 text-sm text-center"/></div>
            <div><label className="block text-xs text-gray-500 mb-1">원물명</label>
              <input value={formData.material_name || ''} onChange={(e)=>setFormData({...formData, material_name: e.target.value})} className="w-full border rounded px-2 py-1 text-sm text-center"/></div>
            <div><label className="block text-xs text-gray-500 mb-1">표준단위</label>
              <input value={formData.standard_unit || 'kg'} onChange={(e)=>setFormData({...formData, standard_unit: e.target.value})} className="w-full border rounded px-2 py-1 text-sm text-center"/></div>
            <div><label className="block text-xs text-gray-500 mb-1">공급상태</label>
              <input value={formData.supply_status || '출하중'} onChange={(e)=>setFormData({...formData, supply_status: e.target.value})} className="w-full border rounded px-2 py-1 text-sm text-center" placeholder="출하중"/></div>
          </div>
        </Modal>
      )}
      {modalType === 'material-register' && (<Modal isOpen={true} onClose={closeModal} title="원물등록관리" size="xl"><div className="space-y-4"><p className="text-gray-600">원물 등록 및 관리 기능이 구현될 예정입니다.</p></div></Modal>)}
      {modalType === 'price-record' && (<Modal isOpen={true} onClose={closeModal} title="시세기록" size="xl"><div className="space-y-4"><p className="text-gray-600">시세 기록 기능이 구현될 예정입니다.</p></div></Modal>)}
      {modalType === 'price-analysis' && (<Modal isOpen={true} onClose={closeModal} title="시세분석" size="xl"><div className="space-y-4"><p className="text-gray-600">시세 변동 추이를 분석하고 예측합니다</p></div></Modal>)}

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
