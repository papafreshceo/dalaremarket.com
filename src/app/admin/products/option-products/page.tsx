// app/admin/products/option-products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Modal } from '@/components/ui'
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
  standard_quantity: number | null
  standard_unit: string | null
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
  // 가격 정책 필드
  material_cost_policy?: 'auto' | 'fixed' | null
  seller_supply_price_mode?: 'auto' | 'manual' | null
  naver_price_mode?: 'auto' | 'manual' | null
  coupang_price_mode?: 'auto' | 'manual' | null
  // 마진 계산 필드
  seller_margin_rate?: number | null  // 실제 셀러마진율 (계산값, readOnly)
  seller_margin_amount?: number | null  // 실제 셀러마진액 (계산값, readOnly)
  target_seller_margin_rate?: number | null  // 목표 셀러마진율 (입력값)
  target_margin_rate?: number | null  // 목표 직판마진율
  target_margin_amount?: number | null  // 목표 직판마진액
  margin_calculation_type?: 'rate' | 'amount' | null
  average_material_price?: number | null  // 사용원물 평균가
  calculated_material_cost?: number | null  // 원물원가 (계산값)
  created_at?: string
  [key: string]: any
}

interface SupplyStatus {
  code: string
  name: string
  color: string
  display_order?: number
}


export default function OptionProductsManagementPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [products, setProducts] = useState<OptionProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<OptionProduct[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [supplyStatuses, setSupplyStatuses] = useState<SupplyStatus[]>([])

  const [stats, setStats] = useState<Record<string, number>>({})

  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchInput, setSearchInput] = useState<string>('')
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('')

  // 뷰 모드
  const [viewMode, setViewMode] = useState<'basic' | 'cost' | 'price' | 'supply_policy' | 'direct_policy' | 'shipping' | 'full'>('full')

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const [modalType, setModalType] = useState<string | null>(null)

  const supabase = createClient()
  const fmtInt = new Intl.NumberFormat('ko-KR')

  // 가격 계산 로직을 별도 함수로 분리
  const calculatePrices = (item: any) => {
    // 한글 값을 DB 값으로 변환
    const marginCalcTypeRaw = (item as any).margin_calculation_type
    const marginCalcType = marginCalcTypeRaw === '마진율' ? 'rate'
      : marginCalcTypeRaw === '마진액' ? 'amount'
      : marginCalcTypeRaw || 'rate'

    // 1. 총원가 계산 (무조건 자동, 택배비 제외)
    const totalCost = (
      (Number(item.raw_material_cost) || 0) +
      (Number(item.packaging_box_price) || 0) +
      (Number(item.pack_price) || 0) +
      (Number(item.bag_vinyl_price) || 0) +
      (Number(item.cushioning_price) || 0) +
      (Number(item.sticker_price) || 0) +
      (Number(item.ice_pack_price) || 0) +
      (Number(item.other_material_price) || 0) +
      (Number(item.labor_cost) || 0) +
      (Number(item.misc_cost) || 0)
    )

    // 마진 계산용 총비용 (총원가 + 택배비)
    const shippingFee = Number(item.shipping_fee) || 0
    const totalCostWithShipping = totalCost + shippingFee

    // 2. 셀러공급가 자동 계산 (모드가 'auto'일 때)
    let sellerSupplyPrice = item.seller_supply_price
    if (item.seller_supply_price_mode === 'auto') {
      const targetMarginRate = Number(item.target_seller_margin_rate) || 0
      if (targetMarginRate > 0 && targetMarginRate < 100) {
        sellerSupplyPrice = Math.round(totalCostWithShipping / (1 - targetMarginRate / 100))
      } else {
        sellerSupplyPrice = totalCostWithShipping
      }
    }

    // 3. 실제 셀러마진율 & 셀러마진액 계산 (항상 계산, 택배비 포함)
    let actualSellerMarginRate = 0
    let actualSellerMarginAmount = 0
    if (sellerSupplyPrice && sellerSupplyPrice > 0 && totalCostWithShipping > 0) {
      actualSellerMarginRate = ((sellerSupplyPrice - totalCostWithShipping) / sellerSupplyPrice) * 100
      actualSellerMarginAmount = sellerSupplyPrice - totalCostWithShipping
    }

    // 4. 네이버 직판가 자동 계산
    let naverPaidPrice = item.naver_paid_shipping_price
    let naverFreePrice = item.naver_free_shipping_price
    if (item.naver_price_mode === 'auto') {
      if (marginCalcType === 'rate') {
        const targetMarginRate = Number(item.target_margin_rate) || 0
        if (targetMarginRate > 0 && targetMarginRate < 100) {
          const basePrice = Math.round(totalCost / (1 - targetMarginRate / 100))
          naverPaidPrice = basePrice
          naverFreePrice = basePrice
        } else {
          naverPaidPrice = totalCost
          naverFreePrice = totalCost
        }
      } else if (marginCalcType === 'amount') {
        const targetMarginAmount = Number(item.target_margin_amount) || 0
        naverPaidPrice = totalCost + targetMarginAmount
        naverFreePrice = totalCost + targetMarginAmount
      }
    }

    // 5. 쿠팡 직판가 자동 계산
    let coupangPaidPrice = item.coupang_paid_shipping_price
    let coupangFreePrice = item.coupang_free_shipping_price
    if (item.coupang_price_mode === 'auto') {
      if (marginCalcType === 'rate') {
        const targetMarginRate = Number(item.target_margin_rate) || 0
        if (targetMarginRate > 0 && targetMarginRate < 100) {
          const basePrice = Math.round(totalCost / (1 - targetMarginRate / 100))
          coupangPaidPrice = basePrice
          coupangFreePrice = basePrice
        } else {
          coupangPaidPrice = totalCost
          coupangFreePrice = totalCost
        }
      } else if (marginCalcType === 'amount') {
        const targetMarginAmount = Number(item.target_margin_amount) || 0
        coupangPaidPrice = totalCost + targetMarginAmount
        coupangFreePrice = totalCost + targetMarginAmount
      }
    }

    return {
      total_cost: totalCost,
      seller_supply_price: sellerSupplyPrice,
      seller_margin_rate: Math.round(actualSellerMarginRate * 10) / 10,
      seller_margin_amount: Math.round(actualSellerMarginAmount),
      margin_calculation_type: marginCalcType,
      naver_paid_shipping_price: naverPaidPrice,
      naver_free_shipping_price: naverFreePrice,
      coupang_paid_shipping_price: coupangPaidPrice,
      coupang_free_shipping_price: coupangFreePrice
    }
  }

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
    standard_quantity: '표준수량',
    standard_unit: '단위',

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
    average_material_price: '원물가',
    calculated_material_cost: '원물원가',
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
    seller_margin_rate: '셀러마진(%)',
    seller_margin_amount: '셀러마진(원)',
    target_seller_margin_rate: '목표셀러마진%',
    seller_supply_price_mode: '셀러모드',
    seller_supply_price: '셀러공급가',

    target_margin_rate: '목표직판마진%',
    target_margin_amount: '목표직판마진액',
    margin_calculation_type: '마진계산방식',
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
        return ['option_code','option_name','item_type','variety','specification_1','weight','standard_unit','total_cost','shipping_fee','seller_supply_price','status','vendor_id']
      case 'cost':
        return ['option_code','option_name','raw_material_cost','packaging_box_price','pack_price','bag_vinyl_price','cushioning_price','sticker_price','ice_pack_price','other_material_price','labor_cost','misc_cost','total_material_cost','total_cost','shipping_fee','seller_supply_price','status']
      case 'price':
        return ['option_code','option_name','total_cost','shipping_fee','seller_supply_price','naver_paid_shipping_price','naver_free_shipping_price','coupang_paid_shipping_price','coupang_free_shipping_price','status']
      case 'supply_policy':
        return ['option_code','option_name','average_material_price','calculated_material_cost','material_cost_policy','total_cost','shipping_fee','seller_supply_price_mode','target_seller_margin_rate','seller_supply_price','seller_margin_rate','seller_margin_amount','status']
      case 'direct_policy':
        return ['option_code','option_name','total_cost','seller_supply_price','margin_calculation_type','target_margin_rate','target_margin_amount','naver_price_mode','naver_paid_shipping_price','naver_free_shipping_price','coupang_price_mode','coupang_paid_shipping_price','coupang_free_shipping_price','status']
      case 'shipping':
        return ['option_code','option_name','supplier_id','shipping_vendor_id','invoice_entity','vendor_id','shipping_location_name','shipping_location_address','shipping_location_contact','shipping_deadline','total_cost','shipping_fee','seller_supply_price','status']
      case 'full':
      default:
        return FIELD_ORDER
    }
  }

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


  // ===== 데이터 로드 =====
  useEffect(() => { void fetchAll() }, [])

  const fetchAll = async () => {
    await Promise.all([fetchProducts(), fetchVendors(), fetchSupplyStatuses()])
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

          // 사용원물 평균가 계산
          const materialPrices = enrichedMaterials
            .map(m => Number(m.latest_price) || 0)
            .filter(price => price > 0)
          const averageMaterialPrice = materialPrices.length > 0
            ? Math.round(materialPrices.reduce((sum, p) => sum + p, 0) / materialPrices.length)
            : null

          // 원물원가 계산: (옵션 standard_quantity / 원물 standard_quantity) × 원물 latest_price
          const optionStandardQty = Number(product.standard_quantity) || 0
          let calculatedMaterialCost = 0

          if (optionStandardQty > 0) {
            enrichedMaterials.forEach(m => {
              const materialStandardQty = Number(m.standard_quantity) || 0
              const materialPrice = Number(m.latest_price) || 0
              if (materialStandardQty > 0 && materialPrice > 0) {
                calculatedMaterialCost += (optionStandardQty / materialStandardQty) * materialPrice
              }
            })
          }

          return {
            ...product,
            vendor_name: product.vendor?.name || null,
            // 사용원물 정보 추가
            used_materials: enrichedMaterials,
            // 사용원물1, 2, 3 (표시용)
            used_material_1: enrichedMaterials[0]?.material_name || '',
            used_material_2: enrichedMaterials[1]?.material_name || '',
            used_material_3: enrichedMaterials[2]?.material_name || '',
            // 사용원물 평균가
            average_material_price: averageMaterialPrice,
            // 원물원가 (계산값)
            calculated_material_cost: calculatedMaterialCost > 0 ? Math.round(calculatedMaterialCost) : null
          }
        })
      )

      // 초기 로드 시에도 가격 계산 적용
      const productsWithCalculations = productsWithMaterials.map(product => ({
        ...product,
        ...calculatePrices(product)
      }))

      setProducts(productsWithCalculations)
      setFilteredProducts(productsWithCalculations)
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

    // temp_ ID 행들을 products에서 제거
    if (tempIds.length > 0) {
      const idsToRemove = new Set(tempIds)
      setProducts(prev => prev.filter(p => !idsToRemove.has(p.id)))
    }

    setSelectedRows(new Set())
    setSelectAll(false)
    setModalType(null)

    // DB 삭제가 있었으면 다시 fetch
    if (realIds.length > 0) {
      await fetchProducts()
    }

    if (tempIds.length > 0) {
      showToast(`삭제되었습니다. (실제 삭제: ${realIds.length}건, 임시 행 제거: ${tempIds.length}건)`, 'success')
    } else {
      showToast(`${realIds.length}건이 삭제되었습니다.`, 'success')
    }
  }



  const handleSave = async () => {
    try {
      // 유효한 행만 필터링 (id가 있고 필수 필드가 있는 행)
      const validRows = filteredProducts.filter(p => p.id && (p.option_code || p.option_name))

      if (validRows.length === 0) {
        showToast('저장할 데이터가 없습니다.', 'warning')
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
        standard_quantity: p.standard_quantity != null ? Number(p.standard_quantity) : null,
        standard_unit: p.standard_unit || null,
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

      showToast('저장되었습니다.', 'success')
      await fetchProducts()
    } catch (e) {
      console.error(e)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    }
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
                { value: 'supply_policy', label: '공급가정책' },
                { value: 'direct_policy', label: '직판가정책' },
                { value: 'shipping', label: '발송' },
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
              {/* 버튼들 */}
              <button
                onClick={() => router.push('/admin/products/option-products/create')}
                className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 transition-colors"
                style={{ fontSize: '14px', height: '32px' }}
              >
                상품 추가
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
                     'coupang_free_shipping_price', 'weight', 'seller_margin_rate', 'target_seller_margin_rate', 'target_margin_rate', 'target_margin_amount'].includes(field) ? 'number' as const
                : ['material_cost_policy', 'seller_supply_price_mode', 'naver_price_mode', 'coupang_price_mode', 'margin_calculation_type', 'status',
                   'standard_unit', 'item_type', 'variety'].includes(field) ? 'dropdown' as const
                : 'text' as const,
              source: field === 'material_cost_policy' ? ['자동', '고정']
                : field === 'seller_supply_price_mode' || field === 'naver_price_mode' || field === 'coupang_price_mode' ? ['자동', '수동']
                : field === 'margin_calculation_type' ? ['마진율', '마진액']
                : field === 'status' ? supplyStatuses.map(s => s.name)
                : field === 'standard_unit' ? ['kg', 'g', 'box', '개']
                : undefined,
              readOnly: ['option_code', 'vendor_id', 'used_material_1', 'used_material_2', 'used_material_3', 'total_cost', 'average_material_price', 'calculated_material_cost', 'seller_margin_rate', 'seller_margin_amount'].includes(field)
                ? true
                : field === 'target_margin_rate' ? (row: OptionProduct) => {
                    const calcType = (row as any).margin_calculation_type
                    return calcType !== 'rate' && calcType !== '마진율'
                  }
                : field === 'target_margin_amount' ? (row: OptionProduct) => {
                    const calcType = (row as any).margin_calculation_type
                    return calcType !== 'amount' && calcType !== '마진액'
                  }
                : false,
              align: ['material_cost_policy', 'seller_supply_price_mode', 'naver_price_mode', 'coupang_price_mode', 'margin_calculation_type', 'seller_margin_rate', 'target_seller_margin_rate', 'target_margin_rate'].includes(field) ? 'center' as const : undefined,
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
              } : field === 'vendor_id' ? (value: any, row: OptionProduct) => (
                  <span style={{ fontSize: '13px' }}>{row.vendor_name || ''}</span>
                )
                : field === 'option_name' ? (value: any, row: OptionProduct) => {
                  const policyBadge = row.material_cost_policy === 'fixed' ? ' 🔒' : ''
                  return <span style={{ fontSize: '13px' }}>{(row.option_name || '-') + policyBadge}</span>
                }
                : field === 'material_cost_policy' ? (value: any, _row: OptionProduct, _rowIndex: number, handleDropdownArrowClick?: (e: React.MouseEvent) => void) => (
                  <div className="relative flex items-center justify-center h-full w-full">
                    <span style={{ fontSize: '13px' }}>{value === 'auto' ? '자동' : value === 'fixed' ? '고정' : value || ''}</span>
                    <div
                      className="absolute right-1 w-5 h-full flex items-center justify-center cursor-pointer"
                      onClick={handleDropdownArrowClick}
                      style={{ zIndex: 10 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )
                : field === 'seller_supply_price_mode' || field === 'naver_price_mode' || field === 'coupang_price_mode' ? (value: any, _row: OptionProduct, _rowIndex: number, handleDropdownArrowClick?: (e: React.MouseEvent) => void) => (
                  <div className="relative flex items-center justify-center h-full w-full">
                    <span style={{ fontSize: '13px' }}>{value === 'auto' ? '자동' : value === 'manual' ? '수동' : value || ''}</span>
                    <div
                      className="absolute right-1 w-5 h-full flex items-center justify-center cursor-pointer"
                      onClick={handleDropdownArrowClick}
                      style={{ zIndex: 10 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )
                : field === 'margin_calculation_type' ? (value: any, _row: OptionProduct, _rowIndex: number, handleDropdownArrowClick?: (e: React.MouseEvent) => void) => (
                  <div className="relative flex items-center justify-center h-full w-full">
                    <span style={{ fontSize: '13px' }}>{value === 'rate' ? '마진율' : value === 'amount' ? '마진액' : value || ''}</span>
                    <div
                      className="absolute right-1 w-5 h-full flex items-center justify-center cursor-pointer"
                      onClick={handleDropdownArrowClick}
                      style={{ zIndex: 10 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )
                : field === 'seller_margin_rate' ? (value: any) => (
                  <span style={{ fontSize: '13px', color: '#059669', fontWeight: '500' }}>{value != null ? `${Number(value).toFixed(1)}%` : '-'}</span>
                )
                : field === 'seller_margin_amount' ? (value: any) => (
                  <span style={{ fontSize: '13px', color: '#059669', fontWeight: '500' }}>{value != null ? value.toLocaleString() : '-'}</span>
                )
                : field === 'target_seller_margin_rate' || field === 'target_margin_rate' ? (value: any) => (
                  <span style={{ fontSize: '13px' }}>{value != null ? value : ''}</span>
                )
                : field === 'seller_supply_price' ? (value: any, row: OptionProduct) => {
                  const badge = row.seller_supply_price_mode === 'manual' ? '⚙️' : '🅰️'
                  return (
                    <span style={{ fontSize: '13px' }}>
                      {value != null ? value.toLocaleString() : ''}
                      <span style={{ marginLeft: '4px', opacity: 0.6 }}>{badge}</span>
                    </span>
                  )
                }
                : field === 'naver_paid_shipping_price' || field === 'naver_free_shipping_price' ? (value: any, row: OptionProduct) => {
                  const badge = row.naver_price_mode === 'manual' ? '⚙️' : '🅰️'
                  return (
                    <span style={{ fontSize: '13px' }}>
                      {value != null ? value.toLocaleString() : ''}
                      <span style={{ marginLeft: '4px', opacity: 0.6 }}>{badge}</span>
                    </span>
                  )
                }
                : field === 'coupang_paid_shipping_price' || field === 'coupang_free_shipping_price' ? (value: any, row: OptionProduct) => {
                  const badge = row.coupang_price_mode === 'manual' ? '⚙️' : '🅰️'
                  return (
                    <span style={{ fontSize: '13px' }}>
                      {value != null ? value.toLocaleString() : ''}
                      <span style={{ marginLeft: '4px', opacity: 0.6 }}>{badge}</span>
                    </span>
                  )
                }
                : undefined
            }))
          })()}
          onDataChange={(newData) => {
            // 가격 계산 함수 사용
            const dataWithCalculations = newData.map(item => ({
              ...item,
              ...calculatePrices(item)
            }))

            // 새로 추가된 행도 products에 포함시킴
            setProducts(prevProducts => {
              const existingIds = new Set(prevProducts.map(p => p.id))
              const updatedMap = new Map(dataWithCalculations.map(item => [item.id, item]))

              // 기존 행 업데이트
              const updated = prevProducts.map(item => updatedMap.get(item.id) || item)

              // 새로 추가된 행 추가 (temp_로 시작하는 ID)
              const newItems = dataWithCalculations.filter(item => !existingIds.has(item.id))

              return [...updated, ...newItems]
            })

            // filteredProducts도 업데이트
            setFilteredProducts(dataWithCalculations)
          }}
          onSave={handleSave}
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

    </div>
  )
}
