// app/admin/products/raw-materials/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Modal } from '@/components/ui'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'
import { useToast } from '@/components/ui/Toast'
import * as XLSX from 'xlsx'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

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
  category_1: string | null  // 대분류 (category_settings와 매칭)
  category_2: string | null  // 중분류 (category_settings와 매칭)
  category_3: string | null  // 소분류 (category_settings와 매칭)
  category_4: string | null  // 품목 (category_settings와 매칭)
  category_5: string | null  // 품종 (category_settings와 매칭)
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
  is_active?: boolean
  created_at?: string
  updated_at?: string
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
type DiffItem = { id: string; name: string; field: string; fieldLabel: string; before: string | null; after: string | null }

export default function RawMaterialsManagementPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<RawMaterial[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplyStatuses, setSupplyStatuses] = useState<SupplyStatus[]>([])
  const [categorySettings, setCategorySettings] = useState<any[]>([]) // 카테고리 설정 데이터

  const [stats, setStats] = useState({ totalMaterials: 0, shippingMaterials: 0, seasonEndMaterials: 0, todayPriceUpdates: 0, unregisteredCategories: 0 })

  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchInput, setSearchInput] = useState<string>('')
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('')

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const [modalType, setModalType] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [emptyRowsWarning, setEmptyRowsWarning] = useState<{emptyCount: number, validCount: number} | null>(null)

  // 시세기록 폼 데이터
  const [priceRecordForm, setPriceRecordForm] = useState({
    category_1: '',
    category_2: '',
    category_3: '',
    category_4: '',
    category_5: '',
    supplier_id: '',
    bulk_date: new Date().toISOString().split('T')[0],
    price_type: 'MARKET',
    notes: ''
  })

  // 원물별 가격 및 날짜
  const [materialPrices, setMaterialPrices] = useState<Record<string, {price: string, date: string}>>({})

  // 시세분석 필터 데이터
  const [priceAnalysisForm, setPriceAnalysisForm] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    category_4: '',
    category_5: '',
    material_id: ''
  })

  // 시세분석 결과 (복수 원물)
  const [priceHistoryData, setPriceHistoryData] = useState<{materialId: string, materialName: string, data: any[]}[]>([])
  const [showChart, setShowChart] = useState(false)

  // EditableAdminGrid에서 관리하는 데이터를 추적하기 위한 state
  const [gridData, setGridData] = useState<RawMaterial[]>([])

  // 원본 스냅샷(변경 표시/디프 기준)
  const originalSnapshot = useRef<Map<string, RawMaterial>>(new Map())

  // 저장 컨펌 모달
  const [saveDiffs, setSaveDiffs] = useState<DiffItem[]>([])
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // 삭제 확인 모달
  const [deleteConfirm, setDeleteConfirm] = useState<{ rowIndex: number } | null>(null)

  // 시세 기록 확인 모달
  const [priceRecordConfirm, setPriceRecordConfirm] = useState<{ records: any[], summary: string } | null>(null)

  // 엑셀 업로드 모달
  const [excelUploadModal, setExcelUploadModal] = useState<{ data: any[], mode: 'replace' | 'merge' | null } | null>(null)

  // 엑셀 업로드 결과 모달
  const [uploadResultModal, setUploadResultModal] = useState<{
    type: 'replace' | 'merge'
    added: string[]
    updated: string[]
    unchanged: string[]
  } | null>(null)

  // 엑셀 업로드 프리뷰 모달 (덮어쓰기 전)
  const [uploadPreview, setUploadPreview] = useState<{
    added: string[]
    updated: string[]
    deleted: string[]
    excelData: any[]
  } | null>(null)

  // 엑셀 업로드 결과 모달 (덮어쓰기 후)
  const [uploadResult, setUploadResult] = useState<{
    added: string[]
    updated: string[]
    deleted: string[]
  } | null>(null)

  const supabase = createClient()
  const fmtInt = new Intl.NumberFormat('ko-KR')
  const fmtMD = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }
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
      case 'current_price': return '-' // TODO: 현재시세 로직 추가
      case 'unit_quantity': return m.unit_quantity != null ? String(m.unit_quantity) : '-'
      case 'last_trade_date':
      case 'season_start_date':
      case 'season_peak_date':
      case 'season_end_date': return m[field] ? fmtMD(new Date(m[field]!)) : '-'
      case 'main_supplier_id': return m.supplier_name || '-'
      default: return (m as any)[field] ?? ((m as any)[field] === 0 ? '0' : '-')
    }
  }

  // 원시값(복사/편집용)
  const rawValue = (field: string, m: RawMaterial) => {
    switch (field) {
      case 'latest_price': return m.latest_price != null ? String(m.latest_price) : ''
      case 'current_price': return '' // TODO: 현재시세 로직 추가
      case 'unit_quantity': return m.unit_quantity != null ? String(m.unit_quantity) : ''
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

  // parseAndAssign 함수는 제거됨 - EditableAdminGrid에서 데이터 변환 처리

  // ===== 데이터 로드 =====
  useEffect(() => { void fetchAll() }, [])
  const fetchAll = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchMaterials(), fetchSuppliers(), fetchSupplyStatuses(), fetchCategorySettings()])
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
        supplier:partners!main_supplier_id(name)
      `)
      .order('material_code', { ascending: true })

    if (data) {
      // supplier name을 supplier_name 필드로 매핑하고 supplier 객체는 제거
      const mapped = data.map(row => {
        const { supplier, ...rest } = row
        return {
          ...rest,
          supplier_name: supplier?.name || null
        }
      })
      setMaterials(mapped)
      setFilteredMaterials(mapped)
      setGridData(mapped) // EditableAdminGrid 데이터 초기화
      captureSnapshot(mapped) // 스냅샷 갱신
    }
  }
  const fetchSuppliers = async () => {
    const { data } = await supabase.from('partners').select('*').eq('is_active', true).order('name')
    if (data) setSuppliers(data)
  }
  const fetchSupplyStatuses = async () => {
    const { data } = await supabase.from('supply_status_settings').select('*').eq('status_type', 'raw_material').eq('is_active', true).order('display_order')
    if (data) setSupplyStatuses(data)
  }
  const fetchCategorySettings = async () => {
    const { data } = await supabase.from('category_settings').select('*').eq('is_active', true)
    if (data) setCategorySettings(data)
  }

  // 카테고리 설정에 등록되어 있는지 확인하는 함수
  const isCategoryRegistered = (material: RawMaterial): boolean => {
    if (!material.category_5) return true // 품종이 없으면 체크 안함

    return categorySettings.some(cat =>
      cat.category_1 === material.category_1 &&
      cat.category_2 === material.category_2 &&
      cat.category_3 === material.category_3 &&
      cat.category_4 === material.category_4 &&
      cat.category_5 === material.category_5
    )
  }

  // 시세 데이터 가져오기 (카테고리별 복수 원물)
  const fetchPriceHistory = async () => {
    const { category_4, category_5, material_id, startDate, endDate } = priceAnalysisForm

    // 필터링된 원물 목록
    const targetMaterials = materials.filter(m => {
      if (material_id) return m.id === material_id
      if (category_4 && m.category_4 !== category_4) return false
      if (category_5 && m.category_5 !== category_5) return false
      return category_4 || category_5 // 최소한 카테고리 하나는 선택되어야 함
    })

    if (targetMaterials.length === 0) {
      showToast('조회할 원물을 선택하세요.', 'warning')
      setPriceHistoryData([])
      setShowChart(false)
      return
    }

    try {
      const results: {materialId: string, materialName: string, data: any[]}[] = []

      for (const material of targetMaterials) {
        const { data, error } = await supabase
          .from('material_price_history')
          .select('*')
          .eq('material_id', material.id)
          .gte('effective_date', startDate)
          .lte('effective_date', endDate)
          .order('effective_date', { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          results.push({
            materialId: material.id,
            materialName: `${material.material_name} (${material.category_4}/${material.category_5})`,
            data
          })
        }
      }

      if (results.length > 0) {
        setPriceHistoryData(results)
        setShowChart(true)
      } else {
        setPriceHistoryData([])
        setShowChart(false)
        showToast('선택한 기간에 시세 데이터가 없습니다.', 'info')
      }
    } catch (error) {
      console.error('시세 데이터 조회 오류:', error)
      showToast('시세 데이터를 불러오는 중 오류가 발생했습니다.', 'error')
      setPriceHistoryData([])
      setShowChart(false)
    }
  }

  // 통계
  useEffect(() => { void refreshStats(materials) }, [materials, categorySettings])
  const refreshStats = async (snapshot: RawMaterial[]) => {
    const today = new Date().toISOString().split('T')[0]

    // 미등록 카테고리 계산
    const unregisteredCount = snapshot.filter(m => !isCategoryRegistered(m)).length

    try {
      const [{ count: total }, { count: shipping }, { count: seasonEnd }, { count: todayCnt }] = await Promise.all([
        supabase.from('raw_materials').select('*', { count: 'exact', head: true }),
        supabase.from('raw_materials').select('*', { count: 'exact', head: true }).eq('supply_status', '출하중'),
        supabase.from('raw_materials').select('*', { count: 'exact', head: true }).eq('supply_status', '시즌종료'),
        supabase.from('material_price_history').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`)
      ])
      setStats({
        totalMaterials: total || 0,
        shippingMaterials: shipping || 0,
        seasonEndMaterials: seasonEnd || 0,
        todayPriceUpdates: todayCnt || 0,
        unregisteredCategories: unregisteredCount
      })
    } catch {
      setStats({
        totalMaterials: snapshot.length,
        shippingMaterials: snapshot.filter(m => m.supply_status === '출하중').length,
        seasonEndMaterials: snapshot.filter(m => m.supply_status === '시즌종료').length,
        todayPriceUpdates: 0,
        unregisteredCategories: unregisteredCount
      })
    }
  }

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    // 현재 필터링된 데이터 사용
    const exportData = filteredMaterials.map(m => ({
      '원물코드': m.material_code,
      '원물명': m.material_name,
      '대분류': m.category_1 || '',
      '중분류': m.category_2 || '',
      '소분류': m.category_3 || '',
      '품목': m.category_4 || '',
      '품종': m.category_5 || '',
      '규격단위': m.standard_unit,
      '단위수량': m.unit_quantity || '',
      '최근거래일': m.last_trade_date || '',
      '최근시세': m.latest_price || '',
      '현재시세': '', // TODO: 웹크롤링으로 가져올 예정
      '공급상태': m.supply_status,
      '주거래처': m.supplier_name || '',
      '시즌': m.season || '',
      '시즌시작일': m.season_start_date || '',
      '시즌성수기': m.season_peak_date || '',
      '시즌종료일': m.season_end_date || '',
      '컬러코드': m.color_code || ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '원물관리')

    const fileName = `원물관리_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // 엑셀 업로드 (1단계: 분석 및 프리뷰)
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        // 기존 DB 원물코드 세트
        const existingCodes = new Set(materials.map(m => m.material_code))

        // 엑셀 원물코드 세트
        const excelCodes = new Set(jsonData.map((row: any) => row['원물코드']))

        // 변경사항 분석
        const addedCodes: string[] = []
        const updatedCodes: string[] = []
        const deletedCodes: string[] = []

        excelCodes.forEach(code => {
          if (!existingCodes.has(code)) {
            addedCodes.push(code)
          } else {
            updatedCodes.push(code)
          }
        })

        existingCodes.forEach(code => {
          if (!excelCodes.has(code)) {
            deletedCodes.push(code)
          }
        })

        // 프리뷰 모달 표시 (확인 받기)
        setUploadPreview({
          added: addedCodes,
          updated: updatedCodes,
          deleted: deletedCodes,
          excelData: jsonData
        })
      } catch (error) {
        console.error('엑셀 파일 읽기 오류:', error)
        showToast('엑셀 파일 처리 중 오류가 발생했습니다.', 'error')
      }
    }
    reader.readAsArrayBuffer(file)

    // input 초기화
    e.target.value = ''
  }

  // 엑셀 업로드 (2단계: 실제 덮어쓰기)
  const confirmExcelUpload = async () => {
    if (!uploadPreview) return

    try {
      const { excelData } = uploadPreview

      // 1. 기존 데이터 모두 삭제
      await supabase.from('raw_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 날짜 유효성 검사 함수
      const validateDate = (dateStr: string | null | undefined): { valid: boolean; formatted: string | null; original: string } => {
        if (!dateStr || dateStr === '') return { valid: true, formatted: null, original: '' }
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            return { valid: false, formatted: null, original: String(dateStr) }
          }
          const formatted = date.toISOString().split('T')[0]
          return { valid: true, formatted, original: String(dateStr) }
        } catch {
          return { valid: false, formatted: null, original: String(dateStr) }
        }
      }

      const validateSeasonDate = (dateStr: string | null | undefined): { valid: boolean; formatted: string | null; original: string } => {
        if (!dateStr || dateStr === '') return { valid: true, formatted: null, original: '' }
        try {
          // 이미 MM-DD 형식인 경우
          if (/^\d{2}-\d{2}$/.test(String(dateStr))) {
            return { valid: true, formatted: String(dateStr), original: String(dateStr) }
          }
          // 날짜로 파싱해서 MM-DD 추출
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            return { valid: false, formatted: null, original: String(dateStr) }
          }
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const formatted = `${month}-${day}`
          return { valid: true, formatted, original: String(dateStr) }
        } catch {
          return { valid: false, formatted: null, original: String(dateStr) }
        }
      }

      // 2. 날짜 유효성 검사
      const dateErrors: string[] = []
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i]
        const rowNum = i + 2 // 엑셀 행 번호 (헤더 제외)

        const lastTrade = validateDate(row['최근거래일'])
        const seasonStart = validateSeasonDate(row['시즌시작일'])
        const seasonPeak = validateSeasonDate(row['시즌성수기'])
        const seasonEnd = validateSeasonDate(row['시즌종료일'])

        if (!lastTrade.valid) {
          dateErrors.push(`${rowNum}행 [${row['원물코드']}]: 최근거래일 "${lastTrade.original}"`)
        }
        if (!seasonStart.valid) {
          dateErrors.push(`${rowNum}행 [${row['원물코드']}]: 시즌시작일 "${seasonStart.original}"`)
        }
        if (!seasonPeak.valid) {
          dateErrors.push(`${rowNum}행 [${row['원물코드']}]: 시즌성수기 "${seasonPeak.original}"`)
        }
        if (!seasonEnd.valid) {
          dateErrors.push(`${rowNum}행 [${row['원물코드']}]: 시즌종료일 "${seasonEnd.original}"`)
        }
      }

      if (dateErrors.length > 0) {
        setUploadPreview(null)
        showToast(`잘못된 날짜 형식이 발견되었습니다:\n\n${dateErrors.slice(0, 10).join('\n')}${dateErrors.length > 10 ? `\n\n...외 ${dateErrors.length - 10}개` : ''}`, 'error')
        return
      }

      // 3. 엑셀 데이터 전체 삽입
      const insertData = []
      for (const row of excelData) {
        let supplierId = null
        if (row['주거래처']) {
          const supplier = suppliers.find(s => s.name === row['주거래처'])
          supplierId = supplier?.id || null
        }

        insertData.push({
          material_code: row['원물코드'],
          material_name: row['원물명'],
          category_1: row['대분류'] || null,
          category_2: row['중분류'] || null,
          category_3: row['소분류'] || null,
          category_4: row['품목'] || null,
          category_5: row['품종'] || null,
          standard_unit: row['규격단위'],
          supply_status: row['공급상태'],
          main_supplier_id: supplierId,
          latest_price: row['최근시세'] ? Number(row['최근시세']) : null,
          unit_quantity: row['단위수량'] ? Number(row['단위수량']) : null,
          last_trade_date: validateDate(row['최근거래일']).formatted,
          season: row['시즌'] || null,
          season_start_date: validateSeasonDate(row['시즌시작일']).formatted,
          season_peak_date: validateSeasonDate(row['시즌성수기']).formatted,
          season_end_date: validateSeasonDate(row['시즌종료일']).formatted,
          color_code: row['컬러코드'] || null
        })
      }

      if (insertData.length > 0) {
        const { error } = await supabase.from('raw_materials').insert(insertData)

        if (error) {
          console.error('삽입 오류:', error)
          showToast(`데이터 삽입 중 오류가 발생했습니다.\n${error.message || JSON.stringify(error)}`, 'error')
        } else {
          // 결과 모달 표시
          setUploadResult({
            added: uploadPreview.added,
            updated: uploadPreview.updated,
            deleted: uploadPreview.deleted
          })
          setUploadPreview(null) // 프리뷰 모달 닫기
          await fetchMaterials()
        }
      } else {
        showToast('업로드할 데이터가 없습니다.', 'warning')
      }
    } catch (error) {
      console.error('엑셀 업로드 오류:', error)
      showToast('엑셀 파일 처리 중 오류가 발생했습니다.', 'error')
      setUploadPreview(null)
    }
  }

  // 검색 디바운스
  useEffect(() => {
    const t = setTimeout(() => setGlobalSearchTerm(searchInput), 250)
    return () => clearTimeout(t)
  }, [searchInput])

  // 필터링 - materials 변경 시에만 gridData 업데이트
  useEffect(() => {
    let f = [...materials]

    // 검색어 필터
    if (globalSearchTerm && globalSearchTerm.trim()) {
      const s = globalSearchTerm.trim().toLowerCase()
      f = f.filter(m => {
        const arr = [
          m.material_code,
          m.material_name,
          m.category_1,
          m.category_2,
          m.category_3,
          m.category_4,
          m.category_5,
          m.standard_unit,
          m.supply_status,
          m.supplier_name,
          m.season,
          m.color_code,
          m.latest_price?.toString(),
          m.unit_quantity?.toString(),
          m.last_trade_date,
          m.season_start_date,
          m.season_peak_date,
          m.season_end_date
        ]
        return arr.some(v => {
          if (v == null || v === '') return false
          return String(v).toLowerCase().includes(s)
        })
      })
    }

    // 상태 필터 (빈 행도 항상 포함)
    if (selectedStatus === 'unregistered') {
      // 미등록 카테고리 필터
      f = f.filter(m => !isCategoryRegistered(m))
    } else if (selectedStatus !== 'all') {
      f = f.filter(m => {
        // supply_status가 없거나 빈 값이면 항상 포함
        if (!m.supply_status || m.supply_status === '') return true
        // 선택된 상태와 일치하면 포함
        return m.supply_status === selectedStatus
      })
    }

    setFilteredMaterials(f)
    setGridData(f) // EditableAdminGrid에 필터링된 데이터 전달
    setSelectedRows(new Set())
    setSelectAll(false)
  }, [materials, selectedStatus, globalSearchTerm, supplyStatuses, categorySettings])

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
      showToast('선택된 항목이 없습니다.', 'warning')
      setModalType(null)
      return
    }
    const ids = Array.from(selectedRows)

    // temp_ ID와 실제 ID 분리
    const realIds = ids.filter(id => !String(id).startsWith('temp_'))
    const tempIds = ids.filter(id => String(id).startsWith('temp_'))

    // 실제 DB에 있는 데이터만 삭제
    if (realIds.length > 0) {
      const { error } = await supabase.from('raw_materials').delete().in('id', realIds)
      if (error) {
        showToast('삭제 중 오류가 발생했습니다.', 'error')
        return
      }
    }

    // temp_ ID 행들을 materials와 gridData에서 제거
    if (tempIds.length > 0) {
      const idsToRemove = new Set(tempIds)
      setMaterials(prev => prev.filter(m => !idsToRemove.has(m.id)))
      setGridData(prev => prev.filter(m => !idsToRemove.has(m.id)))
    }

    setSelectedRows(new Set())
    setSelectAll(false)
    setModalType(null)

    // DB 삭제가 있었으면 다시 fetch
    if (realIds.length > 0) {
      await fetchMaterials()
    }

    if (tempIds.length > 0) {
      showToast(`삭제되었습니다. (실제 삭제: ${realIds.length}건, 임시 행 제거: ${tempIds.length}건)`, 'success')
    } else {
      showToast(`${realIds.length}건이 삭제되었습니다.`, 'success')
    }
  }

  // EditableAdminGrid의 데이터 변경을 처리하는 핸들러
  const handleGridDataChange = (newData: RawMaterial[]) => {
    // supplier_name 처리: 드롭다운에서 supplier name이 변경되면 supplier_id를 찾아서 업데이트
    const processedData = newData.map(item => {
      const updated = { ...item }
      // main_supplier_id가 supplier name인 경우 (드롭다운에서 선택한 경우)
      if (typeof updated.main_supplier_id === 'string' && !updated.main_supplier_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const supplierName = updated.main_supplier_id
        const supplier = suppliers.find(s => s.name === supplierName)
        updated.main_supplier_id = supplier?.id || null
        updated.supplier_name = supplierName
      }
      return updated
    })

    setGridData(processedData)
    // gridData의 변경사항을 materials에 반영 (새로 추가된 행도 포함)
    setMaterials(prevMaterials => {
      const updatedMap = new Map(processedData.map(item => [item.id, item]))
      const existingIds = new Set(prevMaterials.map(m => m.id))

      // 기존 행 업데이트
      const updated = prevMaterials.map(item => updatedMap.get(item.id) || item)

      // 새로 추가된 행 추가 (temp_로 시작하는 ID)
      const newItems = processedData.filter(item => !existingIds.has(item.id))

      return [...updated, ...newItems]
    })
  }

  // EditableAdminGrid가 복사/붙여넣기/되돌리기를 모두 처리하므로 여기서는 제거

  // ===== 저장(컨펌 모달) =====
  const buildDiffs = (): DiffItem[] => {
    const diffs: DiffItem[] = []
    // gridData를 사용하여 원본 스냅샷과 비교
    gridData.forEach(m => {
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
    const diffs = buildDiffs()
    if (diffs.length === 0) {
      showToast('변경사항이 없습니다.', 'info')
      return
    }
    setSaveDiffs(diffs)
    setIsConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    setIsConfirmOpen(false)
    await handleSaveAllConfirmed()
  }

  const handleSaveAllConfirmed = async (skipWarning = false) => {
    try {
      // gridData에서 변경된 행 찾기 (원본 스냅샷과 비교)
      const modifiedRows = gridData.filter(m => {
        return FIELD_ORDER.some(field => {
          const before = rawValueFromSnapshot(field, m.id)
          const after = rawValue(field, m)
          return (before ?? '') !== (after ?? '')
        })
      })

      // 유효한 행만 필터링 (id가 있고 필수 필드가 있는 행)
      const validRows = modifiedRows.filter(m => m.id && (m.material_code || m.material_name))
      const emptyRows = modifiedRows.filter(m => !m.id || (!m.material_code && !m.material_name))

      // 빈 행이 있으면 경고 모달 표시
      if (!skipWarning && emptyRows.length > 0) {
        setEmptyRowsWarning({ emptyCount: emptyRows.length, validCount: validRows.length })
        return
      }

      if (validRows.length === 0) {
        setModalType('no-data-warning')
        return
      }

      const rows = validRows.map(m => ({
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
      const priceRows = modifiedRows
        .filter(m => m.latest_price != null && m.latest_price !== '')
        .map(m => ({
          material_id: m.id,
          price: Number(m.latest_price),
          unit_quantity: m.unit_quantity ? Number(m.unit_quantity) : null,
          effective_date: today,
          price_type: 'PURCHASE'
        }))
      if (priceRows.length) {
        const { error: phErr } = await supabase.from('material_price_history').insert(priceRows)
        if (phErr) throw phErr
      }

      // 저장 성공 → 스냅샷 갱신
      showToast('저장되었습니다.', 'success')
      await fetchMaterials()
    } catch (e) {
      console.error(e); showToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  // ===== CRUD 모달 =====
  const openModal = (type: string, item?: any) => {
    setModalType(type)
    setEditingItem(item || null)
    setFormData(item || {})
    // 시세기록 모달을 열 때 폼 초기화
    if (type === 'price-record') {
      setPriceRecordForm({
        category_1: '',
        category_2: '',
        category_3: '',
        category_4: '',
        category_5: '',
        supplier_id: '',
        bulk_date: new Date().toISOString().split('T')[0],
        price_type: 'MARKET',
        notes: ''
      })
      setMaterialPrices({})
    }
    // 시세분석 모달을 열 때 초기화
    if (type === 'price-analysis') {
      setPriceAnalysisForm({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        category_4: '',
        category_5: '',
        material_id: ''
      })
      setPriceHistoryData([])
      setShowChart(false)
    }
  }
  const closeModal = () => {
    setModalType(null)
    setEditingItem(null)
    setFormData({})
    setPriceRecordForm({
      category_1: '',
      category_2: '',
      category_3: '',
      category_4: '',
      category_5: '',
      supplier_id: '',
      bulk_date: new Date().toISOString().split('T')[0],
      price_type: 'MARKET',
      notes: ''
    })
    setMaterialPrices({})
    setPriceHistoryData([])
    setShowChart(false)
  }

  const handleDeleteRow = async (rowIndex: number) => {
    setDeleteConfirm({ rowIndex })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const { rowIndex } = deleteConfirm
    const material = gridData[rowIndex]
    if (!material) return

    if (material.id.startsWith('temp_')) {
      // 임시 행 삭제 - gridData에서 제거
      const newGridData = gridData.filter((_, idx) => idx !== rowIndex)
      setGridData(newGridData)
      // materials에서도 제거
      const newMaterials = materials.filter(m => m.id !== material.id)
      setMaterials(newMaterials)
      showToast('삭제되었습니다.', 'success')
    } else {
      // DB에서 삭제
      const { error } = await supabase.from('raw_materials').delete().eq('id', material.id)
      if (error) return showToast('삭제 중 오류가 발생했습니다.', 'error')
      await fetchMaterials()
      showToast('삭제되었습니다.', 'success')
    }
    setDeleteConfirm(null)
  }

  // EditableAdminGrid 컬럼 정의
  const rawMaterialColumns = [
    { key: 'material_code', title: '원물코드', width: 120 },
    { key: 'material_name', title: '원물명', width: 160 },
    {
      key: 'category_1',
      title: '대분류',
      width: 100,
      className: (row: RawMaterial) => !isCategoryRegistered(row) ? 'bg-red-50' : ''
    },
    {
      key: 'category_2',
      title: '중분류',
      width: 100,
      className: (row: RawMaterial) => !isCategoryRegistered(row) ? 'bg-red-50' : ''
    },
    {
      key: 'category_3',
      title: '소분류',
      width: 100,
      className: (row: RawMaterial) => !isCategoryRegistered(row) ? 'bg-red-50' : ''
    },
    {
      key: 'category_4',
      title: '품목',
      width: 100,
      className: (row: RawMaterial) => !isCategoryRegistered(row) ? 'bg-red-50' : ''
    },
    {
      key: 'category_5',
      title: '품종',
      width: 100,
      className: (row: RawMaterial) => !isCategoryRegistered(row) ? 'bg-red-50' : '',
      renderer: (value: any, row: RawMaterial) => {
        const isUnregistered = !isCategoryRegistered(row)
        return (
          <span className={isUnregistered ? 'text-red-600 font-semibold' : ''}>
            {value}
            {isUnregistered && <span className="ml-1 text-xs">⚠️</span>}
          </span>
        )
      }
    },
    { key: 'standard_quantity', title: '표준량', width: 100, type: 'number' as const },
    { key: 'standard_unit', title: '표준규격', width: 100 },
    { key: 'last_trade_date', title: '최근거래', width: 100 },
    { key: 'latest_price', title: '최근시세', width: 110, type: 'number' as const },
    {
      key: 'main_supplier_id',
      title: '주거래처',
      width: 130,
      type: 'dropdown' as const,
      source: suppliers.map(s => s.name),
      renderer: (value: any, row: RawMaterial) => row.supplier_name || ''
    },
    { key: 'season_start_date', title: '시작일', width: 100 },
    { key: 'season_end_date', title: '종료일', width: 100 },
    {
      key: 'supply_status',
      title: '상태',
      width: 90,
      type: 'dropdown' as const,
      source: supplyStatuses.map(s => s.name),
      renderer: (value: any, row: RawMaterial) => {
        if (!row.supply_status) return ''
        const st = supplyStatuses.find(s => s.name === row.supply_status)
        const bg = st?.color || '#6B7280'
        return (
          <span style={{
            backgroundColor: bg,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {row.supply_status}
          </span>
        )
      }
    }
  ]

  // 엑셀 다운로드용 전체 컬럼 (DB의 모든 필드 포함, 화면 테이블과 동일한 헤더명 사용)
  const exportColumns = [
    { key: 'id', title: 'ID', width: 120 },
    { key: 'material_code', title: '원물코드', width: 120 },
    { key: 'material_name', title: '원물명', width: 160 },
    { key: 'category_1', title: '대분류', width: 100 },
    { key: 'category_2', title: '중분류', width: 100 },
    { key: 'category_3', title: '소분류', width: 100 },
    { key: 'category_4', title: '품목', width: 100 },
    { key: 'category_5', title: '품종', width: 100 },
    { key: 'standard_quantity', title: '표준량', width: 100 },
    { key: 'standard_unit', title: '표준규격', width: 100 },
    { key: 'last_trade_date', title: '최근거래', width: 100 },
    { key: 'latest_price', title: '최근시세', width: 110 },
    { key: 'supplier_name', title: '주거래처', width: 130 },
    { key: 'season_start_date', title: '시작일', width: 100 },
    { key: 'season_end_date', title: '종료일', width: 100 },
    { key: 'supply_status', title: '상태', width: 90 },
    { key: 'main_supplier_id', title: '주거래처ID', width: 130 },
    { key: 'notes', title: '메모', width: 200 },
    { key: 'metadata', title: '메타데이터', width: 200 },
    { key: 'is_active', title: '활성화', width: 80 },
    { key: 'created_at', title: '생성일시', width: 150 },
    { key: 'updated_at', title: '수정일시', width: 150 },
    { key: 'created_by', title: '생성자', width: 130 },
    { key: 'updated_by', title: '수정자', width: 130 }
  ]

  // 카테고리별 원물 필터링
  const getFilteredMaterialsByCategory = () => {
    return materials.filter(m => {
      if (priceRecordForm.category_1 && m.category_1 !== priceRecordForm.category_1) return false
      if (priceRecordForm.category_2 && m.category_2 !== priceRecordForm.category_2) return false
      if (priceRecordForm.category_3 && m.category_3 !== priceRecordForm.category_3) return false
      if (priceRecordForm.category_4 && m.category_4 !== priceRecordForm.category_4) return false
      if (priceRecordForm.category_5 && m.category_5 !== priceRecordForm.category_5) return false
      return true
    })
  }

  // 날짜 일괄 적용
  const applyBulkDate = () => {
    const date = priceRecordForm.bulk_date
    if (!date) {
      showToast('적용할 날짜를 선택하세요.', 'warning')
      return
    }
    const filtered = getFilteredMaterialsByCategory()
    const newPrices = { ...materialPrices }
    filtered.forEach(m => {
      if (!newPrices[m.id]) {
        newPrices[m.id] = { price: '', date }
      } else {
        newPrices[m.id] = { ...newPrices[m.id], date }
      }
    })
    setMaterialPrices(newPrices)
    showToast(`${filtered.length}개 원물에 ${date} 날짜가 적용되었습니다.`, 'success')
  }

  // 시세기록 저장
  const handleSavePriceRecord = async () => {
    const recordsToInsert = Object.entries(materialPrices)
      .filter(([_, data]) => data.price && Number(data.price) > 0)
      .map(([materialId, data]) => ({
        material_id: materialId,
        supplier_id: priceRecordForm.supplier_id || null,
        price: Number(data.price),
        currency: 'KRW',
        unit_quantity: 1,
        effective_date: data.date || priceRecordForm.bulk_date,
        price_type: priceRecordForm.price_type,
        notes: priceRecordForm.notes || null,
        created_by: null
      }))

    if (recordsToInsert.length === 0) {
      showToast('가격이 입력된 원물이 없습니다.', 'warning')
      return
    }

    console.log('저장할 데이터:', recordsToInsert)

    // 변경사항 안내
    const summary = recordsToInsert.map((record, idx) => {
      const material = materials.find(m => m.id === record.material_id)
      return `${idx + 1}. ${material?.material_name} (${record.effective_date}) - ${record.price.toLocaleString()}원`
    }).join('\n')

    setPriceRecordConfirm({ records: recordsToInsert, summary })
  }

  const confirmPriceRecord = async () => {
    if (!priceRecordConfirm) return
    const { records } = priceRecordConfirm

    const { data, error } = await supabase.from('material_price_history').insert(records)

    if (error) {
      console.error('시세 기록 오류:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      console.error('에러 상세:', error.details)
      showToast(`시세 기록 중 오류가 발생했습니다.\n${error.message || JSON.stringify(error)}`, 'error')
      return
    }

    console.log('저장 성공:', data)
    showToast(`${records.length}개 원물의 시세가 기록되었습니다.`, 'success')
    setPriceRecordConfirm(null)
    closeModal()
  }

  return (
    <div className="space-y-6">
      {/* 타이틀과 통계 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-medium text-gray-900">원물관리</h1>
          {/* 통계 */}
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-600">전체 </span>
              <span className="font-bold">{stats.totalMaterials.toLocaleString()}</span>
            </div>
            {supplyStatuses.map(status => (
              <div key={status.code}>
                <span className="text-gray-600">{status.name} </span>
                <span className="font-bold" style={{ color: status.color }}>
                  {materials.filter(m => m.supply_status === status.name || m.supply_status === status.code).length}
                </span>
              </div>
            ))}
            <div>
              <span className="text-gray-600">오늘 시세 </span>
              <span className="font-bold text-blue-600">{stats.todayPriceUpdates.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 메뉴 버튼들 - 아웃라인 */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              // 필드명을 한글로 매핑
              const fieldMapping: Record<string, string> = {
                'id': 'ID',
                'material_code': '원물코드',
                'material_name': '원물명',
                'category_1': '대분류',
                'category_2': '중분류',
                'category_3': '소분류',
                'category_4': '품목',
                'category_5': '품종',
                'standard_quantity': '표준량',
                'standard_unit': '표준규격',
                'supply_status': '공급상태',
                'main_supplier_id': '주거래처ID',
                'latest_price': '최근가격',
                'last_trade_date': '최근거래일',
                'season': '시즌',
                'season_start_date': '시즌시작일',
                'season_peak_date': '시즌피크일',
                'season_end_date': '시즌종료일',
                'is_active': '활성화',
                'created_at': '생성일',
                'updated_at': '수정일',
                'created_by': '생성자',
                'updated_by': '수정자',
                'notes': '비고',
                'metadata': '메타데이터',
                'color_code': '색상코드',
                'unit_quantity': '단위수량'
              }

              // supplier_name 필드 제거하고 한글 헤더로 변환
              const exportData = materials.map(({ supplier_name, ...rest }) => {
                const koreanData: Record<string, any> = {}
                Object.keys(rest).forEach(key => {
                  const koreanKey = fieldMapping[key] || key
                  koreanData[koreanKey] = rest[key]
                })
                return koreanData
              })

              const ws = XLSX.utils.json_to_sheet(exportData)
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, '원물관리')
              const dateStr = new Date().toISOString().split('T')[0]
              XLSX.writeFile(wb, `원물관리_${dateStr}.xlsx`)
            }}
            className="p-2 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition-colors"
            title="엑셀 다운로드"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.xlsx,.xls'
              input.onchange = async (e: any) => {
                const file = e.target.files?.[0]
                if (!file) return

                const reader = new FileReader()
                reader.onload = async (e) => {
                  const data = e.target?.result
                  const workbook = XLSX.read(data, { type: 'binary', cellDates: true })
                  const sheetName = workbook.SheetNames[0]
                  const worksheet = workbook.Sheets[sheetName]
                  const jsonData = XLSX.utils.sheet_to_json(worksheet)

                  // 한글 헤더를 영문으로 매핑
                  const reverseFieldMapping: Record<string, string> = {
                    'ID': 'id',
                    '원물코드': 'material_code',
                    '원물명': 'material_name',
                    '대분류': 'category_1',
                    '중분류': 'category_2',
                    '소분류': 'category_3',
                    '품목': 'category_4',
                    '품종': 'category_5',
                    '표준량': 'standard_quantity',
                    '표준규격': 'standard_unit',
                    '공급상태': 'supply_status',
                    '주거래처ID': 'main_supplier_id',
                    '최근가격': 'latest_price',
                    '최근거래일': 'last_trade_date',
                    '시즌': 'season',
                    '시즌시작일': 'season_start_date',
                    '시즌피크일': 'season_peak_date',
                    '시즌종료일': 'season_end_date',
                    '활성화': 'is_active',
                    '생성일': 'created_at',
                    '수정일': 'updated_at',
                    '생성자': 'created_by',
                    '수정자': 'updated_by',
                    '비고': 'notes',
                    '메타데이터': 'metadata',
                    '색상코드': 'color_code',
                    '단위수량': 'unit_quantity'
                  }

                  // 한글 헤더를 영문으로 변환
                  const convertedData = jsonData.map((row: any) => {
                    const englishRow: any = {}
                    Object.keys(row).forEach(key => {
                      const englishKey = reverseFieldMapping[key] || key
                      englishRow[englishKey] = row[key]
                    })
                    return englishRow
                  })

                  // DB 테이블의 모든 필드 정의 (supplier_name 제외)
                  const dbFields = [
                    'id', 'material_code', 'material_name', 'standard_unit', 'supply_status',
                    'season', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by',
                    'category_1', 'category_2', 'category_3', 'category_4', 'category_5',
                    'last_trade_date', 'latest_price', 'standard_quantity',
                    'season_start_date', 'season_peak_date', 'season_end_date',
                    'main_supplier_id', 'notes', 'metadata', 'color_code', 'unit_quantity'
                  ]

                  // supplier_name 필드 제거 및 데이터 정제
                  const cleanData = convertedData.map((row: any) => {
                    const { supplier_name, ...rest } = row

                    // DB 스키마에 맞춰 모든 필드 초기화 (엑셀에 없는 필드는 null)
                    const normalizedRow: any = {}
                    dbFields.forEach(field => {
                      normalizedRow[field] = rest[field] !== undefined ? rest[field] : null
                    })

                    // 날짜 필드 변환 (Excel 숫자를 날짜 문자열로)
                    const dateFields = ['last_trade_date', 'season_start_date', 'season_peak_date', 'season_end_date', 'created_at', 'updated_at']
                    dateFields.forEach(field => {
                      if (normalizedRow[field]) {
                        if (typeof normalizedRow[field] === 'number') {
                          // Excel 날짜 숫자를 JavaScript Date로 변환
                          const date = new Date((normalizedRow[field] - 25569) * 86400 * 1000)
                          normalizedRow[field] = date.toISOString().split('T')[0]
                        } else if (normalizedRow[field] instanceof Date) {
                          normalizedRow[field] = normalizedRow[field].toISOString().split('T')[0]
                        } else if (typeof normalizedRow[field] === 'string' && normalizedRow[field].trim() === '') {
                          normalizedRow[field] = null
                        }
                      }
                    })

                    // 숫자 필드 변환 (콤마 제거)
                    const numericFields = ['latest_price', 'standard_quantity']
                    numericFields.forEach(field => {
                      if (normalizedRow[field]) {
                        if (typeof normalizedRow[field] === 'string') {
                          // 콤마 제거하고 숫자로 변환
                          normalizedRow[field] = parseFloat(normalizedRow[field].replace(/,/g, ''))
                        }
                      }
                    })

                    // 빈 문자열을 null로 변환
                    Object.keys(normalizedRow).forEach(key => {
                      if (normalizedRow[key] === '' || normalizedRow[key] === 'undefined' || normalizedRow[key] === 'null') {
                        normalizedRow[key] = null
                      }
                    })

                    return normalizedRow
                  })

                  // 디버깅: 업로드 데이터 확인
                  console.log('업로드할 데이터 샘플:', JSON.stringify(cleanData[0], null, 2))
                  const category5Check = cleanData.map(d => ({
                    material_code: d.material_code,
                    category_5: d.category_5,
                    category_5_type: typeof d.category_5,
                    has_category_5: 'category_5' in d
                  })).slice(0, 5)
                  console.log('category_5 필드 확인:', JSON.stringify(category5Check, null, 2))
                  console.log('전체 데이터 개수:', cleanData.length)

                  // 모달 열기 (교체/병합 선택)
                  setExcelUploadModal({ data: cleanData, mode: null })
                }
                reader.readAsBinaryString(file)
              }
              input.click()
            }}
            className="p-2 text-sm border border-green-500 text-green-600 rounded hover:bg-green-50 transition-colors"
            title="엑셀 업로드"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button onClick={() => openModal('material-register')} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            원물등록관리
          </button>
          <button onClick={() => openModal('price-record')} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            시세기록
          </button>
          <button onClick={() => openModal('price-analysis')} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            시세분석
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* 상태 필터 배지 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors text-white cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: selectedStatus === 'all' ? '#3b82f6' : '#3b82f630'
                  }}
                >
                  전체 ({materials.length})
                </button>
                <button
                  onClick={() => setSelectedStatus('unregistered')}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors text-white cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: selectedStatus === 'unregistered' ? '#ef4444' : '#ef444430'
                  }}
                >
                  미등록 카테고리 ({stats.unregisteredCategories})
                </button>
                {supplyStatuses.map(s => {
                  const isSelected = selectedStatus === s.name
                  return (
                    <button
                      key={s.code}
                      onClick={() => setSelectedStatus(s.name)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-colors text-white cursor-pointer hover:opacity-90"
                      style={{
                        backgroundColor: isSelected ? s.color : `${s.color}30`
                      }}
                    >
                      {s.name} ({materials.filter(m => m.supply_status === s.name || m.supply_status === s.code).length})
                    </button>
                  )
                })}
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

          </div>
        </div>

        <EditableAdminGrid
          data={gridData}
          columns={rawMaterialColumns}
          onDataChange={handleGridDataChange}
          onCellEdit={(rowIndex, columnKey, newValue) => {
            // 셀 편집 시 추가 처리 (필요한 경우)
            // 현재는 onDataChange에서 모두 처리
          }}
          onDelete={handleDeleteRow}
          onSave={handleOpenConfirm}
          globalSearchPlaceholder="원물코드, 원물명, 대분류, 중분류, 소분류, 품목, 품종 검색"
          enableCSVExport={false}
          enableCSVImport={false}
        />
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

      {/* 빈 행 경고 모달 */}
      {emptyRowsWarning && (
        <Modal
          isOpen={true}
          onClose={() => setEmptyRowsWarning(null)}
          title="빈 행 저장 경고"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEmptyRowsWarning(null)}>취소</Button>
              <Button onClick={() => {
                setEmptyRowsWarning(null)
                handleSaveAllConfirmed(true)
              }}>계속 저장</Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              빈 행 <strong className="text-amber-600">{emptyRowsWarning.emptyCount}개</strong>는 저장되지 않습니다.
            </p>
            <p className="text-sm text-gray-700">
              나머지 <strong className="text-blue-600">{emptyRowsWarning.validCount}개</strong> 행을 저장하시겠습니까?
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>빈 행은 저장 후 페이지를 새로고침하면 사라집니다.</span>
            </div>
          </div>
        </Modal>
      )}

      {/* 저장할 데이터 없음 경고 */}
      {modalType === 'no-data-warning' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title="저장 불가"
          size="sm"
          footer={<Button onClick={() => setModalType(null)}>확인</Button>}
        >
          <p className="text-sm text-gray-700">저장할 데이터가 없습니다.</p>
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
      {modalType === 'price-record' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="시세기록"
          size="xl"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>취소</Button>
              <Button variant="primary" onClick={handleSavePriceRecord}>저장</Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* 상단 필터 */}
            <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">대분류</label>
                <select
                  value={priceRecordForm.category_1}
                  onChange={(e) => setPriceRecordForm({...priceRecordForm, category_1: e.target.value, category_2: '', category_3: '', category_4: '', category_5: ''})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-7"
                >
                  <option value="">전체</option>
                  {Array.from(new Set(materials.map(m => m.category_1).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">중분류</label>
                <select
                  value={priceRecordForm.category_2}
                  onChange={(e) => setPriceRecordForm({...priceRecordForm, category_2: e.target.value, category_3: '', category_4: '', category_5: ''})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-7"
                >
                  <option value="">전체</option>
                  {Array.from(new Set(
                    materials
                      .filter(m => !priceRecordForm.category_1 || m.category_1 === priceRecordForm.category_1)
                      .map(m => m.category_2)
                      .filter(Boolean)
                  )).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">소분류</label>
                <select
                  value={priceRecordForm.category_3}
                  onChange={(e) => setPriceRecordForm({...priceRecordForm, category_3: e.target.value, category_4: '', category_5: ''})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-7"
                >
                  <option value="">전체</option>
                  {Array.from(new Set(
                    materials
                      .filter(m => (!priceRecordForm.category_1 || m.category_1 === priceRecordForm.category_1) &&
                                   (!priceRecordForm.category_2 || m.category_2 === priceRecordForm.category_2))
                      .map(m => m.category_3)
                      .filter(Boolean)
                  )).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">품목</label>
                <select
                  value={priceRecordForm.category_4}
                  onChange={(e) => setPriceRecordForm({...priceRecordForm, category_4: e.target.value, category_5: ''})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-7"
                >
                  <option value="">전체</option>
                  {Array.from(new Set(
                    materials
                      .filter(m => (!priceRecordForm.category_1 || m.category_1 === priceRecordForm.category_1) &&
                                   (!priceRecordForm.category_2 || m.category_2 === priceRecordForm.category_2) &&
                                   (!priceRecordForm.category_3 || m.category_3 === priceRecordForm.category_3))
                      .map(m => m.category_4)
                      .filter(Boolean)
                  )).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">품종</label>
                <select
                  value={priceRecordForm.category_5}
                  onChange={(e) => setPriceRecordForm({...priceRecordForm, category_5: e.target.value})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-7"
                >
                  <option value="">전체</option>
                  {Array.from(new Set(
                    materials
                      .filter(m => (!priceRecordForm.category_1 || m.category_1 === priceRecordForm.category_1) &&
                                   (!priceRecordForm.category_2 || m.category_2 === priceRecordForm.category_2) &&
                                   (!priceRecordForm.category_3 || m.category_3 === priceRecordForm.category_3) &&
                                   (!priceRecordForm.category_4 || m.category_4 === priceRecordForm.category_4))
                      .map(m => m.category_5)
                      .filter(Boolean)
                  )).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 공통 설정 */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">일자 일괄적용</label>
                <input
                  type="date"
                  value={priceRecordForm.bulk_date}
                  onChange={(e) => setPriceRecordForm({...priceRecordForm, bulk_date: e.target.value})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-7"
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" onClick={applyBulkDate} className="w-full h-7 text-xs">
                  적용
                </Button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">거래처</label>
                <select
                  value={priceRecordForm.supplier_id}
                  onChange={(e) => setPriceRecordForm({...priceRecordForm, supplier_id: e.target.value})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-7"
                >
                  <option value="">선택 (선택사항)</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">가격 유형</label>
                <select
                  value={priceRecordForm.price_type}
                  onChange={(e) => setPriceRecordForm({...priceRecordForm, price_type: e.target.value})}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-7"
                >
                  <option value="MARKET">시장시세</option>
                  <option value="PURCHASE">구매가격</option>
                  <option value="RETAIL">소매가격</option>
                </select>
              </div>
            </div>

            {/* 원물 테이블 */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '60px' }} />
                  </colgroup>
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-center border-b">원물코드</th>
                      <th className="px-3 py-2 text-center border-b">원물명</th>
                      <th className="px-3 py-2 text-center border-b">규격</th>
                      <th className="px-3 py-2 text-center border-b">최근시세</th>
                      <th className="px-3 py-2 text-center border-b">최근거래일</th>
                      <th className="px-3 py-2 text-center border-b">일자</th>
                      <th className="px-3 py-2 text-center border-b">가격</th>
                      <th className="px-3 py-2 text-center border-b">증감</th>
                      <th className="px-3 py-2 text-center border-b">복사</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredMaterialsByCategory().map((m, idx) => {
                      const priceData = materialPrices[m.id] || { price: '', date: priceRecordForm.bulk_date }
                      const currentPrice = priceData.price ? Number(priceData.price) : 0
                      const lastPrice = m.latest_price || 0
                      const priceDiff = currentPrice && lastPrice ? currentPrice - lastPrice : 0
                      const diffPercent = lastPrice > 0 && currentPrice > 0 ? ((priceDiff / lastPrice) * 100).toFixed(1) : '0'

                      return (
                        <tr key={m.id} className={currentPrice > 0 ? 'bg-blue-50' : ''}>
                          <td className="px-3 py-2 text-center border-b">{m.material_code}</td>
                          <td className="px-3 py-2 text-center border-b">{m.material_name}</td>
                          <td className="px-3 py-2 text-center border-b">{m.standard_unit || '-'}</td>
                          <td className="px-3 py-2 text-right border-b">
                            {m.latest_price != null ? fmtInt.format(Number(m.latest_price)) : '-'}
                          </td>
                          <td className="px-3 py-2 text-center border-b">
                            {m.last_trade_date ? new Date(m.last_trade_date).toLocaleDateString('ko-KR') : '-'}
                          </td>
                          <td className="px-3 py-2 border-b">
                            <input
                              type="date"
                              value={priceData.date}
                              onChange={(e) => setMaterialPrices({
                                ...materialPrices,
                                [m.id]: { ...priceData, date: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500"
                              style={{ outline: 'none' }}
                            />
                          </td>
                          <td className="px-3 py-2 border-b">
                            <input
                              type="number"
                              value={priceData.price}
                              onChange={(e) => setMaterialPrices({
                                ...materialPrices,
                                [m.id]: { ...priceData, price: e.target.value }
                              })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const filteredMaterials = getFilteredMaterialsByCategory()
                                  const nextIdx = idx + 1
                                  if (nextIdx < filteredMaterials.length) {
                                    const nextInput = document.querySelector(`input[data-price-input="${filteredMaterials[nextIdx].id}"]`) as HTMLInputElement
                                    if (nextInput) nextInput.focus()
                                  }
                                }
                              }}
                              data-price-input={m.id}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right text-sm focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              placeholder="0"
                              style={{ outline: 'none' }}
                            />
                          </td>
                          <td className="px-3 py-2 text-center border-b">
                            {currentPrice > 0 ? (
                              <span className={priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-blue-600' : 'text-gray-600'}>
                                {priceDiff > 0 ? '+' : ''}{fmtInt.format(priceDiff)} ({diffPercent}%)
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2 text-center border-b">
                            <button
                              onClick={() => duplicateRow(m.id)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">메모</label>
              <textarea
                value={priceRecordForm.notes}
                onChange={(e) => setPriceRecordForm({...priceRecordForm, notes: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs"
                rows={2}
                placeholder="추가 메모사항을 입력하세요"
              />
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              필터된 원물: {getFilteredMaterialsByCategory().length}개 | 가격 입력됨: {Object.values(materialPrices).filter(p => p.price && Number(p.price) > 0).length}개
            </div>
          </div>
        </Modal>
      )}
      {modalType === 'price-analysis' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="시세분석"
          size="xl"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                닫기
              </Button>
              <Button variant="primary" onClick={fetchPriceHistory}>
                조회
              </Button>
            </>
          }
        >
          <div className="space-y-6">
            {/* 필터 영역 */}
            <div className="space-y-3">
              {/* 카테고리 필터 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품목</label>
                  <select
                    value={priceAnalysisForm.category_4}
                    onChange={(e) => setPriceAnalysisForm({...priceAnalysisForm, category_4: e.target.value, category_5: '', material_id: ''})}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-xs h-7"
                    style={{ outline: 'none' }}
                  >
                    <option value="">전체</option>
                    {Array.from(new Set(materials.map(m => m.category_4).filter(Boolean))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품종</label>
                  <select
                    value={priceAnalysisForm.category_5}
                    onChange={(e) => setPriceAnalysisForm({...priceAnalysisForm, category_5: e.target.value, material_id: ''})}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-xs h-7"
                    style={{ outline: 'none' }}
                  >
                    <option value="">전체</option>
                    {Array.from(new Set(
                      materials
                        .filter(m => !priceAnalysisForm.category_4 || m.category_4 === priceAnalysisForm.category_4)
                        .map(m => m.category_5)
                        .filter(Boolean)
                    )).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 원물 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">원물 선택</label>
                <select
                  value={priceAnalysisForm.material_id}
                  onChange={(e) => setPriceAnalysisForm({...priceAnalysisForm, material_id: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-1 text-xs h-7"
                  style={{ outline: 'none' }}
                >
                  <option value="">원물을 선택하세요</option>
                  {materials
                    .filter(m => {
                      if (priceAnalysisForm.category_4 && m.category_4 !== priceAnalysisForm.category_4) return false
                      if (priceAnalysisForm.category_5 && m.category_5 !== priceAnalysisForm.category_5) return false
                      return true
                    })
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.material_code} - {m.material_name} ({m.category_4 || ''} / {m.category_5 || ''})
                      </option>
                    ))}
                </select>
              </div>

              {/* 날짜 범위 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    value={priceAnalysisForm.startDate}
                    onChange={(e) => setPriceAnalysisForm({...priceAnalysisForm, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-xs h-7"
                    style={{ outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input
                    type="date"
                    value={priceAnalysisForm.endDate}
                    onChange={(e) => setPriceAnalysisForm({...priceAnalysisForm, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-xs h-7"
                    style={{ outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* 차트 영역 - 원물별 그래프 */}
            {showChart && priceHistoryData.length > 0 ? (
              <div className="space-y-6">
                {priceHistoryData.map((item, index) => {
                  const prices = item.data.map(h => h.price)
                  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
                  const maxPrice = Math.max(...prices)
                  const minPrice = Math.min(...prices)
                  const latestPrice = prices[prices.length - 1]
                  const firstPrice = prices[0]
                  const priceChange = latestPrice - firstPrice
                  const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2)

                  const colors = [
                    { stroke: '#3b82f6', gradient: 'colorPrice0', stop1: '#3b82f6', stop2: '#3b82f6' },
                    { stroke: '#10b981', gradient: 'colorPrice1', stop1: '#10b981', stop2: '#10b981' },
                    { stroke: '#f59e0b', gradient: 'colorPrice2', stop1: '#f59e0b', stop2: '#f59e0b' },
                    { stroke: '#ef4444', gradient: 'colorPrice3', stop1: '#ef4444', stop2: '#ef4444' },
                    { stroke: '#8b5cf6', gradient: 'colorPrice4', stop1: '#8b5cf6', stop2: '#8b5cf6' },
                    { stroke: '#ec4899', gradient: 'colorPrice5', stop1: '#ec4899', stop2: '#ec4899' },
                    { stroke: '#06b6d4', gradient: 'colorPrice6', stop1: '#06b6d4', stop2: '#06b6d4' },
                  ]
                  const color = colors[index % colors.length]

                  return (
                    <div key={item.materialId} className="bg-white rounded-lg border border-gray-200">
                      {/* 통계 헤더 */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg px-4 py-3 border-b border-blue-100">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                            {item.materialName}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-gray-700">
                            <span>평균: <strong>{fmtInt.format(Math.round(avgPrice))}원</strong></span>
                            <span>최고: <strong className="text-red-600">{fmtInt.format(maxPrice)}원</strong></span>
                            <span>최저: <strong className="text-blue-600">{fmtInt.format(minPrice)}원</strong></span>
                            <span>최근: <strong>{fmtInt.format(latestPrice)}원</strong></span>
                            <span>변동: <strong className={priceChange >= 0 ? 'text-red-600' : 'text-blue-600'}>
                              {priceChange >= 0 ? '+' : ''}{fmtInt.format(priceChange)}원 ({priceChangePercent}%)
                            </strong></span>
                          </div>
                        </div>
                      </div>

                      {/* 차트 */}
                      <div className="p-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={item.data.map(h => ({
                            date: h.effective_date,
                            price: h.price,
                            displayDate: new Date(h.effective_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                          }))}>
                            <defs>
                              <linearGradient id={color.gradient} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color.stop1} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={color.stop2} stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="displayDate"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              tickLine={{ stroke: '#9ca3af' }}
                            />
                            <YAxis
                              tickFormatter={(value) => `${fmtInt.format(value)}원`}
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              tickLine={{ stroke: '#9ca3af' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px'
                              }}
                              formatter={(value: any) => [`${fmtInt.format(value)}원`, '시세']}
                              labelFormatter={(label) => `날짜: ${label}`}
                            />
                            <Area
                              type="monotone"
                              dataKey="price"
                              stroke={color.stroke}
                              strokeWidth={2}
                              fill={`url(#${color.gradient})`}
                              name="시세"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-600 text-sm">품목/품종 또는 원물을 선택한 후 조회 버튼을 눌러주세요</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 엑셀 업로드 프리뷰 모달 (덮어쓰기 전) */}
      {uploadPreview && (
        <Modal
          isOpen={true}
          onClose={() => setUploadPreview(null)}
          title="엑셀 업로드 확인"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setUploadPreview(null)}>
                취소
              </Button>
              <Button variant="danger" onClick={confirmExcelUpload}>
                덮어쓰기 실행
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-semibold">기존 DB를 완전히 삭제하고 엑셀 데이터로 대체합니다!</p>
              </div>
            </div>

            {/* 신규 추가 */}
            {uploadPreview.added.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 className="font-semibold text-green-800">신규 추가: {uploadPreview.added.length}개</h3>
                </div>
                <div className="max-h-32 overflow-auto bg-white rounded p-2">
                  <div className="flex flex-wrap gap-2">
                    {uploadPreview.added.map(code => (
                      <span key={code} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 기존 수정 */}
            {uploadPreview.updated.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <h3 className="font-semibold text-blue-800">수정됨: {uploadPreview.updated.length}개</h3>
                </div>
                <div className="max-h-32 overflow-auto bg-white rounded p-2">
                  <div className="flex flex-wrap gap-2">
                    {uploadPreview.updated.map(code => (
                      <span key={code} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 삭제됨 */}
            {uploadPreview.deleted.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <h3 className="font-semibold text-red-800">삭제됨: {uploadPreview.deleted.length}개</h3>
                </div>
                <div className="max-h-32 overflow-auto bg-white rounded p-2">
                  <div className="flex flex-wrap gap-2">
                    {uploadPreview.deleted.map(code => (
                      <span key={code} className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 요약 */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-700 text-center">
                총 <strong className="text-green-600">{uploadPreview.added.length}개 추가</strong>,
                <strong className="text-blue-600 ml-1">{uploadPreview.updated.length}개 수정</strong>,
                <strong className="text-red-600 ml-1">{uploadPreview.deleted.length}개 삭제</strong>
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* 엑셀 업로드 결과 모달 (덮어쓰기 후) */}
      {uploadResult && (
        <Modal
          isOpen={true}
          onClose={() => setUploadResult(null)}
          title="엑셀 업로드 완료"
          size="lg"
          footer={
            <Button variant="primary" onClick={() => setUploadResult(null)}>
              확인
            </Button>
          }
        >
          <div className="space-y-4">
            {/* 신규 추가 */}
            {uploadResult.added.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 className="font-semibold text-green-800">신규 추가: {uploadResult.added.length}개</h3>
                </div>
                <div className="max-h-32 overflow-auto bg-white rounded p-2">
                  <div className="flex flex-wrap gap-2">
                    {uploadResult.added.map(code => (
                      <span key={code} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 기존 수정 */}
            {uploadResult.updated.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <h3 className="font-semibold text-blue-800">수정됨: {uploadResult.updated.length}개</h3>
                </div>
                <div className="max-h-32 overflow-auto bg-white rounded p-2">
                  <div className="flex flex-wrap gap-2">
                    {uploadResult.updated.map(code => (
                      <span key={code} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 삭제됨 */}
            {uploadResult.deleted.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <h3 className="font-semibold text-red-800">삭제됨: {uploadResult.deleted.length}개</h3>
                </div>
                <div className="max-h-32 overflow-auto bg-white rounded p-2">
                  <div className="flex flex-wrap gap-2">
                    {uploadResult.deleted.map(code => (
                      <span key={code} className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 요약 */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-700 text-center">
                총 <strong className="text-green-600">{uploadResult.added.length}개 추가</strong>,
                <strong className="text-blue-600 ml-1">{uploadResult.updated.length}개 수정</strong>,
                <strong className="text-red-600 ml-1">{uploadResult.deleted.length}개 삭제</strong>
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* 단일 행 삭제 확인 모달 */}
      {deleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          title="삭제 확인"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>취소</Button>
              <Button variant="danger" onClick={confirmDelete}>삭제</Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-700">정말 삭제하시겠습니까?</p>
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>삭제된 데이터는 복구할 수 없습니다.</span>
            </div>
          </div>
        </Modal>
      )}

      {/* 시세 기록 확인 모달 */}
      {priceRecordConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setPriceRecordConfirm(null)}
          title={`시세 기록 확인 (${priceRecordConfirm.records.length}개)`}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setPriceRecordConfirm(null)}>취소</Button>
              <Button variant="primary" onClick={confirmPriceRecord}>기록</Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              다음 <strong className="text-blue-600">{priceRecordConfirm.records.length}개</strong> 원물의 시세를 기록하시겠습니까?
            </p>
            <div className="max-h-[40vh] overflow-auto bg-gray-50 rounded-lg p-3">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">{priceRecordConfirm.summary}</pre>
            </div>
          </div>
        </Modal>
      )}

      {/* 엑셀 업로드 결과 모달 */}
      {uploadResultModal && (
        <Modal
          isOpen={true}
          onClose={() => setUploadResultModal(null)}
          title={uploadResultModal.type === 'replace' ? '교체 완료' : '병합 완료'}
          size="lg"
        >
          <div className="space-y-4">
            {uploadResultModal.type === 'replace' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  <strong>교체 모드:</strong> 엑셀 파일의 데이터로 완전히 교체했습니다. 엑셀에 없는 원물은 삭제되었습니다.
                </p>
              </div>
            )}
            {uploadResultModal.type === 'merge' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  <strong>병합 모드:</strong> 기존 데이터를 유지하면서 엑셀 데이터를 추가/수정했습니다.
                </p>
              </div>
            )}

            <div className={`grid ${uploadResultModal.type === 'merge' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 text-center`}>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{uploadResultModal.added.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">추가</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResultModal.updated.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">수정</div>
              </div>
              {uploadResultModal.type === 'merge' && (
                <div className="bg-gray-500/10 border border-gray-500/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{uploadResultModal.unchanged.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">변경없음</div>
                </div>
              )}
            </div>

            {uploadResultModal.added.length > 0 && (
              <div>
                <div className="font-semibold text-blue-600 dark:text-blue-400 mb-2">추가된 원물 ({uploadResultModal.added.length}개)</div>
                <div className="max-h-40 overflow-auto bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                    {uploadResultModal.added.map((name, idx) => (
                      <li key={idx}>• {name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {uploadResultModal.updated.length > 0 && (
              <div>
                <div className="font-semibold text-green-600 dark:text-green-400 mb-2">수정된 원물 ({uploadResultModal.updated.length}개)</div>
                <div className="max-h-40 overflow-auto bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                    {uploadResultModal.updated.map((name, idx) => (
                      <li key={idx}>• {name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {uploadResultModal.unchanged.length > 0 && (
              <div>
                <div className="font-semibold text-gray-600 dark:text-gray-400 mb-2">변경없는 원물 ({uploadResultModal.unchanged.length}개)</div>
                <div className="max-h-40 overflow-auto bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
                  <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                    {uploadResultModal.unchanged.map((name, idx) => (
                      <li key={idx}>• {name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setUploadResultModal(null)}>확인</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 엑셀 업로드 모달 */}
      {excelUploadModal && (
        <Modal
          isOpen={true}
          onClose={() => setExcelUploadModal(null)}
          title="엑셀 업로드"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              총 <strong className="text-blue-600">{excelUploadModal.data.length}개</strong>의 데이터를 업로드합니다.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ 중요:</strong> 엑셀 파일의 <strong>id</strong> 컬럼을 삭제하지 마세요. id가 변경되면 옵션상품과의 연결이 끊어집니다.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  // 교체: 엑셀에 있는 material_code만 남기고 나머지는 삭제
                  const uploadCodes = excelUploadModal.data.map((row: any) => row.material_code).filter(Boolean)

                  // 기존 DB 데이터 조회 (전체 필드)
                  const { data: existingData } = await supabase.from('raw_materials').select('*')
                  const existingDataMap = new Map(existingData?.map(d => [d.material_code, d]) || [])

                  // 추가/수정 분류
                  const added: string[] = []
                  const updated: string[] = []

                  excelUploadModal.data.forEach((row: any) => {
                    if (existingDataMap.has(row.material_code)) {
                      const existing = existingDataMap.get(row.material_code)
                      // 실제로 값이 변경되었는지 비교
                      let hasChanges = false
                      for (const key in row) {
                        if (key === 'updated_at' || key === 'created_at') continue // 날짜 필드는 제외
                        if (JSON.stringify(row[key]) !== JSON.stringify(existing[key])) {
                          hasChanges = true
                          break
                        }
                      }
                      if (hasChanges) {
                        updated.push(`${row.material_name} (${row.material_code})`)
                      }
                    } else {
                      added.push(`${row.material_name} (${row.material_code})`)
                    }
                  })

                  // 1. 먼저 upsert로 데이터 업데이트/추가
                  const { error: upsertError } = await supabase.from('raw_materials').upsert(excelUploadModal.data, { onConflict: 'id' })
                  if (upsertError) {
                    showToast('업로드 중 오류가 발생했습니다.', 'error')
                    console.error(upsertError)
                    return
                  }

                  // 2. 엑셀에 없는 데이터만 삭제 (외래키 제약 조건 때문에 참조되는 데이터는 자동으로 삭제 실패하고 넘어감)
                  const { error: deleteError } = await supabase
                    .from('raw_materials')
                    .delete()
                    .not('material_code', 'in', `(${uploadCodes.map(c => `"${c}"`).join(',')})`)

                  if (deleteError && deleteError.code !== '23503') {
                    // 외래키 오류가 아닌 다른 오류만 표시
                    showToast('일부 데이터 삭제 중 오류가 발생했습니다.', 'warning')
                    console.warn(deleteError)
                  }

                  showToast('교체 완료!', 'success')
                  await fetchMaterials()
                  setExcelUploadModal(null)

                  // 결과 모달 표시
                  setUploadResultModal({
                    type: 'replace',
                    added,
                    updated,
                    unchanged: []
                  })
                }}
                className="w-full px-4 py-3 text-left border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div className="font-semibold text-red-600">교체</div>
                <div className="text-xs text-gray-600 mt-1">엑셀 파일의 데이터로 교체합니다. (다른 테이블에서 참조 중인 데이터는 유지)</div>
              </button>
              <button
                onClick={async () => {
                  // 병합: upsert로 기존 데이터 유지하면서 업데이트/추가

                  // 기존 DB 데이터 조회 (전체 필드)
                  const { data: existingData } = await supabase.from('raw_materials').select('*')
                  const existingDataMap = new Map(existingData?.map(d => [d.material_code, d]) || [])

                  // 추가/수정/변경없음 분류
                  const added: string[] = []
                  const updated: string[] = []
                  const unchanged: string[] = []

                  excelUploadModal.data.forEach((row: any) => {
                    if (existingDataMap.has(row.material_code)) {
                      const existing = existingDataMap.get(row.material_code)
                      // 실제로 값이 변경되었는지 비교
                      let hasChanges = false
                      for (const key in row) {
                        if (key === 'updated_at' || key === 'created_at') continue // 날짜 필드는 제외
                        if (JSON.stringify(row[key]) !== JSON.stringify(existing[key])) {
                          hasChanges = true
                          break
                        }
                      }
                      if (hasChanges) {
                        updated.push(`${row.material_name} (${row.material_code})`)
                      } else {
                        // 엑셀에 있지만 변경되지 않은 데이터
                        unchanged.push(`${row.material_name} (${row.material_code})`)
                      }
                    } else {
                      added.push(`${row.material_name} (${row.material_code})`)
                    }
                  })

                  // 엑셀에 없는 기존 데이터도 변경없음에 추가
                  const uploadCodesSet = new Set(excelUploadModal.data.map((row: any) => row.material_code))
                  existingData?.forEach(d => {
                    if (!uploadCodesSet.has(d.material_code)) {
                      unchanged.push(`${d.material_name} (${d.material_code})`)
                    }
                  })

                  const { error } = await supabase
                    .from('raw_materials')
                    .upsert(excelUploadModal.data, {
                      onConflict: 'id',
                      ignoreDuplicates: false
                    })
                  if (error) {
                    showToast('업로드 중 오류가 발생했습니다.', 'error')
                    console.error(error)
                  } else {
                    showToast('병합 완료!', 'success')
                    await fetchMaterials()
                    setExcelUploadModal(null)

                    // 결과 모달 표시
                    setUploadResultModal({
                      type: 'merge',
                      added,
                      updated,
                      unchanged
                    })
                  }
                }}
                className="w-full px-4 py-3 text-left border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-blue-600">병합</div>
                <div className="text-xs text-gray-600 mt-1">기존 데이터를 유지하면서 업데이트하거나 새 데이터를 추가합니다. (빈 값도 반영됩니다)</div>
              </button>
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
