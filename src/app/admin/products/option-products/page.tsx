// app/admin/products/option-products/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Modal, Badge } from '@/components/ui'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'
import { useToast } from '@/components/ui/Toast'

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
  misc_cost: number | null
  shipping_fee: number | null
  total_cost: number | null
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
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [products, setProducts] = useState<OptionProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<OptionProduct[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [supplyStatuses, setSupplyStatuses] = useState<SupplyStatus[]>([])
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [packagingMaterials, setPackagingMaterials] = useState<any[]>([])

  const [stats, setStats] = useState<Record<string, number>>({})

  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchInput, setSearchInput] = useState<string>('')
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('')

  // 뷰 모드
  const [viewMode, setViewMode] = useState<'basic' | 'price' | 'policy' | 'cost' | 'full'>('full')

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [emptyRowsWarning, setEmptyRowsWarning] = useState<{emptyCount: number, validCount: number} | null>(null)

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
    used_material_1: '사용원물1',
    used_material_2: '사용원물2',
    used_material_3: '사용원물3',
    weight: '중량',
    weight_unit: '단위',

    // 자재비
    packaging_box_price: '박스비',
    pack_price: '팩',
    bag_vinyl_price: '봉지/비닐',
    cushioning_price: '완충재',
    sticker_price: '스티커',
    ice_pack_price: '아이스팩',
    other_material_price: '기타자재',
    labor_cost: '인건비',

    // 원가
    raw_material_cost: '원물비용',
    total_material_cost: '총자재비',
    total_cost: '총원가',
    material_cost_policy: '원물가정책',
    fixed_material_cost: '고정원물가',

    // 거래처 및 출고 정보
    supplier_id: '원물거래처',
    shipping_vendor_id: '출고처',
    invoice_entity: '송장주체',
    vendor_id: '벤더사',
    shipping_location_name: '발송지명',
    shipping_location_address: '발송지주소',
    shipping_location_contact: '발송지연락처',
    shipping_deadline: '발송기한',

    // 택배비 및 부가
    shipping_fee: '택배비',
    additional_quantity: '부가수량',

    // 셀러공급
    is_seller_supply: '셀러공급Y/N',

    // 가격 정책
    seller_margin_rate: '셀러마진%',
    seller_supply_price_mode: '셀러모드',
    seller_supply_price: '셀러공급가',

    target_margin_rate: '목표마진%',
    naver_price_mode: '네이버모드',
    naver_paid_shipping_price: '네이버유료',
    naver_free_shipping_price: '네이버무료',

    coupang_price_mode: '쿠팡모드',
    coupang_paid_shipping_price: '쿠팡유료',
    coupang_free_shipping_price: '쿠팡무료',

    // 상태 및 기타
    status: '상태',
    thumbnail_url: '썸네일',
    description: '설명',
    notes: '비고',
    is_best: '베스트Y/N',
    is_recommended: '추천상품Y/N',
    has_detail_page: '상세페이지제공',
    has_images: '이미지제공',
    misc_cost: '기타비용',

    // 사용 옵션명
    option_name_1: '옵션명1',
    option_name_2: '옵션명2',
    option_name_3: '옵션명3',
  }

  const FIELD_ORDER = [
    'option_code','option_name','item_type','variety',
    'specification_1','specification_2','specification_3',
    'used_material_1','used_material_2','used_material_3',
    'weight','weight_unit',

    // 자재비
    'packaging_box_price','pack_price','bag_vinyl_price','cushioning_price','sticker_price','ice_pack_price','other_material_price','labor_cost',

    // 원가
    'raw_material_cost','total_material_cost','total_cost','material_cost_policy','fixed_material_cost',

    // 거래처 및 출고
    'supplier_id','shipping_vendor_id','invoice_entity','vendor_id',
    'shipping_location_name','shipping_location_address','shipping_location_contact','shipping_deadline',

    // 택배비 및 부가
    'shipping_fee','additional_quantity','misc_cost',

    // 셀러공급
    'is_seller_supply',

    // 가격 정책
    'seller_margin_rate','seller_supply_price_mode','seller_supply_price',
    'target_margin_rate',
    'naver_price_mode','naver_paid_shipping_price','naver_free_shipping_price',
    'coupang_price_mode','coupang_paid_shipping_price','coupang_free_shipping_price',

    // 상태 및 기타
    'status','thumbnail_url','description','notes',
    'is_best','is_recommended','has_detail_page','has_images',

    // 사용 옵션명
    'option_name_1','option_name_2','option_name_3'
  ]

  // 뷰 모드별 표시 컬럼
  const getVisibleFields = (mode: string) => {
    switch(mode) {
      case 'basic':
        return ['option_code','option_name','item_type','variety','specification_1','weight','weight_unit','status','vendor_id']
      case 'cost':
        return ['option_code','option_name','raw_material_cost','packaging_box_price','pack_price','bag_vinyl_price','cushioning_price','sticker_price','ice_pack_price','other_material_price','labor_cost','misc_cost','shipping_fee','total_material_cost','total_cost','status']
      case 'price':
        return ['option_code','option_name','seller_supply_price','naver_paid_shipping_price','naver_free_shipping_price','coupang_paid_shipping_price','coupang_free_shipping_price','status']
      case 'policy':
        return ['option_code','option_name','material_cost_policy','seller_supply_price_mode','seller_margin_rate','target_margin_rate','naver_price_mode','coupang_price_mode','status']
      case 'full':
      default:
        return FIELD_ORDER
    }
  }

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
      case 'option_name':
        // 상품명에 가격 정책 뱃지 표시
        const policyBadge = p.material_cost_policy === 'fixed'
          ? ' 🔒'
          : p.seller_supply_price_mode === '수동'
            ? ' ⚙️'
            : ''
        return (p.option_name || '-') + policyBadge
      case 'material_cost_policy':
        return p.material_cost_policy === 'auto' ? '자동' : '고정'
      case 'seller_supply_price_mode':
      case 'naver_price_mode':
      case 'coupang_price_mode':
        return p[field] === '자동' ? '자동' : '수동'
      case 'seller_margin_rate':
      case 'target_margin_rate':
        return p[field] != null ? String(p[field]) + '%' : '-'
      case 'total_cost':
      case 'packaging_box_price':
      case 'pack_price':
      case 'bag_vinyl_price':
      case 'cushioning_price':
      case 'sticker_price':
      case 'ice_pack_price':
      case 'other_material_price':
      case 'raw_material_cost':
      case 'labor_cost':
      case 'misc_cost':
      case 'shipping_fee':
      case 'total_material_cost':
      case 'fixed_material_cost':
      case 'additional_quantity':
      case 'seller_supply_price':
      case 'naver_paid_shipping_price':
      case 'naver_free_shipping_price':
      case 'coupang_paid_shipping_price':
      case 'coupang_free_shipping_price':
        return p[field] != null ? fmtInt.format(Number(p[field])) : '-'
      case 'weight':
        return p.weight != null ? String(p.weight) : '-'
      case 'is_seller_supply':
      case 'is_best':
      case 'is_recommended':
      case 'has_detail_page':
      case 'has_images':
        return p[field] ? 'Y' : 'N'
      case 'supplier_id':
      case 'shipping_vendor_id':
      case 'vendor_id':
        return p.vendor_name || '-'
      case 'status':
        const st = supplyStatuses.find(s => s.code === p.status)
        return st?.name || p.status || '-'
      default:
        return (p as any)[field] ?? ((p as any)[field] === 0 ? '0' : '-')
    }
  }

  // 원시값(복사/편집용) - 편집 모드에서도 한글로 표시
  const rawValue = (field: string, p: OptionProduct) => {
    switch (field) {
      case 'material_cost_policy':
        return p.material_cost_policy === 'fixed' ? '고정' : '자동'
      case 'seller_supply_price_mode':
      case 'naver_price_mode':
      case 'coupang_price_mode':
        return p[field] === '수동' ? '수동' : '자동'
      case 'seller_margin_rate':
      case 'target_margin_rate':
        return p[field] != null ? String(p[field]) : ''
      case 'packaging_box_price':
      case 'pack_price':
      case 'bag_vinyl_price':
      case 'cushioning_price':
      case 'sticker_price':
      case 'ice_pack_price':
      case 'other_material_price':
      case 'raw_material_cost':
      case 'labor_cost':
      case 'misc_cost':
      case 'shipping_fee':
      case 'total_material_cost':
      case 'fixed_material_cost':
      case 'additional_quantity':
      case 'seller_supply_price':
      case 'naver_paid_shipping_price':
      case 'naver_free_shipping_price':
      case 'coupang_paid_shipping_price':
      case 'coupang_free_shipping_price':
      case 'weight':
        return p[field] != null ? String(p[field]) : ''
      case 'is_seller_supply':
      case 'is_best':
      case 'is_recommended':
      case 'has_detail_page':
      case 'has_images':
        return p[field] ? 'Y' : 'N'
      case 'supplier_id':
      case 'shipping_vendor_id':
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
      'packaging_box_price','pack_price','bag_vinyl_price','cushioning_price','sticker_price','ice_pack_price','other_material_price',
      'raw_material_cost','labor_cost','misc_cost','shipping_fee','total_material_cost','fixed_material_cost','additional_quantity',
      'seller_supply_price',
      'naver_paid_shipping_price','naver_free_shipping_price',
      'coupang_paid_shipping_price','coupang_free_shipping_price','weight',
      'seller_margin_rate','target_margin_rate'
    ].includes(field)) {
      const n = t === '' ? null : Number(t.replace(/,/g, '').replace(/%/g, ''))
      ;(p as any)[field] = Number.isFinite(n as number) ? n : null
      return p
    }

    if (field === 'material_cost_policy') {
      p.material_cost_policy = t === '고정' || t === 'fixed' ? 'fixed' : 'auto'
      return p
    }

    if (['seller_supply_price_mode', 'naver_price_mode', 'coupang_price_mode'].includes(field)) {
      ;(p as any)[field] = t === '수동' ? '수동' : '자동'
      return p
    }

    if (['is_seller_supply', 'is_best', 'is_recommended', 'has_detail_page', 'has_images'].includes(field)) {
      ;(p as any)[field] = t.toUpperCase() === 'Y' || t === 'true' || t === '1'
      return p
    }

    if (field === 'status') {
      const code = resolveStatusCode(t)
      if (code) p.status = code
      return p
    }

    if (['vendor_id', 'supplier_id', 'shipping_vendor_id'].includes(field)) {
      const id = resolveVendorIdByName(t)
      ;(p as any)[field] = id
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
    const { data, error } = await supabase
      .from('option_products')
      .select(`
        *,
        vendor:partners!vendor_id(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error)
    }

    if (data) {
      // 각 상품에 대해 원물 정보를 별도로 가져오기
      const productsWithMaterials = await Promise.all(
        data.map(async (product) => {
          // option_product_materials와 raw_materials를 수동으로 조인
          const { data: materials, error: materialsError } = await supabase
            .from('option_product_materials')
            .select('id, quantity, unit_price, raw_material_id')
            .eq('option_product_id', product.id)

          if (materialsError) {
            console.error('Materials fetch error for product', product.id, materialsError)
          }

          let enrichedMaterials: any[] = []
          if (materials && materials.length > 0) {
            // 각 material에 대해 raw_materials 정보를 가져오기
            enrichedMaterials = await Promise.all(
              materials.map(async (m) => {
                const { data: rawMaterial } = await supabase
                  .from('raw_materials')
                  .select('*')
                  .eq('id', m.raw_material_id)
                  .single()

                return {
                  material_id: rawMaterial?.id,
                  material_name: rawMaterial?.material_name,
                  material_code: rawMaterial?.material_code,
                  quantity: m.quantity,
                  unit_price: m.unit_price,
                  category_1: rawMaterial?.category_1,
                  category_2: rawMaterial?.category_2,
                  item_type: rawMaterial?.item_type,
                  variety: rawMaterial?.variety,
                  standard_unit: rawMaterial?.standard_unit,
                  latest_price: rawMaterial?.latest_price,
                  standard_quantity: rawMaterial?.standard_quantity,
                  last_trade_date: rawMaterial?.last_trade_date,
                  season: rawMaterial?.season,
                  season_start_date: rawMaterial?.season_start_date,
                  season_peak_date: rawMaterial?.season_peak_date,
                  season_end_date: rawMaterial?.season_end_date,
                  supply_status: rawMaterial?.supply_status
                }
              })
            )
          }

          return {
            ...product,
            vendor_name: product.vendor?.name || null,
            // 사용원물 정보 추가
            used_materials: enrichedMaterials,
            // 사용원물1, 2, 3 (표시용)
            used_material_1: enrichedMaterials[0]?.material_name || '',
            used_material_2: enrichedMaterials[1]?.material_name || '',
            used_material_3: enrichedMaterials[2]?.material_name || ''
          }
        })
      )

      setProducts(productsWithMaterials)
      setFilteredProducts(productsWithMaterials)
      captureSnapshot(productsWithMaterials)
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
  useEffect(() => { void refreshStats(products) }, [products, supplyStatuses])

  const refreshStats = async (snapshot: OptionProduct[]) => {
    // 동적으로 모든 상태별 통계 계산
    const statusCounts: Record<string, number> = { total: snapshot.length }

    supplyStatuses.forEach(status => {
      const count = snapshot.filter(p => p.status === status.code || p.status === status.name).length
      statusCounts[status.code] = count
    })

    setStats(statusCounts)
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

    // 상태 필터 (빈 값도 항상 포함)
    if (selectedStatus !== 'all') {
      const selectedStatusObj = supplyStatuses.find(s => s.code === selectedStatus)
      f = f.filter(p =>
        p.status === selectedStatus ||
        (selectedStatusObj && p.status === selectedStatusObj.name) ||
        !p.status ||
        p.status === ''
      )
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
      const { error } = await supabase.from('option_products').delete().in('id', realIds)
      if (error) {
        showToast('삭제 중 오류가 발생했습니다.', 'error')
        return
      }
    }

    setSelectedRows(new Set())
    setSelectAll(false)
    setModalType(null)
    await fetchProducts()

    if (tempIds.length > 0) {
      showToast(`삭제되었습니다. (실제 삭제: ${realIds.length}건, 임시 행 제거: ${tempIds.length}건)`, 'success')
    } else {
      showToast(`${realIds.length}건이 삭제되었습니다.`, 'success')
    }
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

  const handleSaveAllConfirmed = async (skipWarning = false) => {
    try {
      // 수정된 행 중에서 유효한 행만 필터링 (id가 있고 필수 필드가 있는 행)
      const modifiedRows = filteredProducts.filter(p => modifiedProducts.has(p.id))
      const validRows = modifiedRows.filter(p => p.id && (p.option_code || p.option_name))
      const emptyRows = modifiedRows.filter(p => !p.id || (!p.option_code && !p.option_name))

      // 빈 행이 있으면 경고 모달 표시
      if (!skipWarning && emptyRows.length > 0) {
        setEmptyRowsWarning({ emptyCount: emptyRows.length, validCount: validRows.length })
        return
      }

      if (validRows.length === 0) {
        setModalType('no-data-warning')
        return
      }

      const rows = validRows.map(p => ({
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
        misc_cost: p.misc_cost != null ? Number(p.misc_cost) : null,
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
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-medium text-gray-900">옵션상품 관리</h1>
        {/* 통계 */}
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-600">전체 </span>
            <span className="font-bold">{(stats.total || 0).toLocaleString()}</span>
          </div>
          {supplyStatuses.map(status => (
            <div key={status.code}>
              <span className="text-gray-600">{status.name} </span>
              <span className="font-bold" style={{ color: status.color }}>
                {(stats[status.code] || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        {/* 범례 */}
        <div className="text-xs text-gray-500 ml-4">
          🔒 원물가 고정 | ⚙️ 수동 가격
        </div>
      </div>

      {/* 테이블 */}
      <div>
        <div className="px-6 py-4 border-b border-gray-100">
          {/* 뷰 모드 선택기 */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex gap-2">
              {[
                { value: 'basic', label: '간단히' },
                { value: 'cost', label: '원가' },
                { value: 'price', label: '가격' },
                { value: 'policy', label: '정책' },
                { value: 'full', label: '전체' }
              ].map(mode => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value as any)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === mode.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* 상태 필터 배지 */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setSelectedStatus('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>전체 ({products.length})</button>
                {supplyStatuses.map(s => {
                  const isSelected = selectedStatus === s.code
                  return (
                    <button
                      key={s.code}
                      onClick={() => setSelectedStatus(s.code)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-700 hover:opacity-80'}`}
                      style={{
                        backgroundColor: isSelected ? s.color : `${s.color}30`,
                      }}
                    >
                      {s.name} ({products.filter(p => p.status === s.code || p.status === s.name).length})
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
              <button
                onClick={() => router.push('/admin/products/option-products/create')}
                className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 transition-colors"
                style={{ fontSize: '14px', height: '32px' }}
              >
                상품 추가
              </button>

              {selectedRows.size > 0 && (
                <button
                  onClick={() => setModalType('delete-confirm')}
                  className="bg-red-600 text-white px-3 rounded hover:bg-red-700 transition-colors"
                  style={{ fontSize: '14px', height: '32px' }}
                >
                  삭제
                </button>
              )}

              <button
                onClick={handleOpenConfirm}
                disabled={modifiedProducts.size === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 rounded hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '14px', height: '32px' }}
              >
                저장
              </button>
            </div>
          </div>
        </div>

        <EditableAdminGrid
          data={filteredProducts}
          columns={(() => {
            const visibleFields = getVisibleFields(viewMode)
            return visibleFields.map(field => ({
              key: field,
              title: FIELD_LABELS[field] || field,
              width: field === 'option_code' ? 120
                : field === 'option_name' ? 200
                : field === 'status' ? 90
                : field === 'vendor_id' ? 130
                : 110,
              type: ['packaging_box_price', 'pack_price', 'bag_vinyl_price', 'cushioning_price', 'sticker_price', 'ice_pack_price', 'other_material_price',
                     'raw_material_cost', 'labor_cost', 'misc_cost', 'shipping_fee', 'total_material_cost', 'fixed_material_cost', 'additional_quantity',
                     'seller_supply_price', 'naver_paid_shipping_price', 'naver_free_shipping_price', 'coupang_paid_shipping_price',
                     'coupang_free_shipping_price', 'weight', 'seller_margin_rate', 'target_margin_rate'].includes(field) ? 'number' as const
                : ['material_cost_policy', 'seller_supply_price_mode', 'naver_price_mode', 'coupang_price_mode', 'status',
                   'weight_unit', 'item_type', 'variety'].includes(field) ? 'dropdown' as const
                : 'text' as const,
              source: field === 'material_cost_policy' ? ['자동', '고정']
                : field === 'seller_supply_price_mode' || field === 'naver_price_mode' || field === 'coupang_price_mode' ? ['자동', '수동']
                : field === 'status' ? supplyStatuses.map(s => s.name)
                : field === 'weight_unit' ? ['kg', 'g', 'box', '개']
                : undefined,
              readOnly: ['option_code', 'vendor_id', 'used_material_1', 'used_material_2', 'used_material_3', 'total_cost'].includes(field),
              renderer: field === 'status' ? (value: any, row: OptionProduct) => {
                if (!row.status) return ''
                const st = supplyStatuses.find(s => s.name === row.status || s.code === row.status)
                const bg = st?.color || '#6B7280'
                return (
                  <span style={{
                    backgroundColor: bg,
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {st?.name || row.status}
                  </span>
                )
              } : field === 'vendor_id' ? (value: any, row: OptionProduct) => row.vendor_name || ''
                : field === 'option_name' ? (value: any, row: OptionProduct) => {
                  const policyBadge = row.material_cost_policy === 'fixed' ? ' 🔒'
                    : row.seller_supply_price_mode === '수동' ? ' ⚙️' : ''
                  return (row.option_name || '-') + policyBadge
                }
                : undefined
            }))
          })()}
          onDataChange={(newData) => {
            setProducts(newData)
          }}
          onDelete={(index) => {
            const product = filteredProducts[index]
            if (product) handleDelete('option_products', product.id)
          }}
          onSave={handleSaveAllConfirmed}
          onDeleteSelected={(indices) => {
            const ids = indices.map(i => filteredProducts[i]?.id).filter(Boolean)
            setSelectedRows(new Set(ids))
            setModalType('delete-confirm')
          }}
          globalSearchPlaceholder="옵션코드, 상품명, 품목, 품종 검색"
          height="900px"
          rowHeight={26}
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

    </div>
  )
}
