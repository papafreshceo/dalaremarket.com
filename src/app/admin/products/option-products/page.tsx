// app/admin/products/option-products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Modal } from '@/components/ui'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'
import { useToast } from '@/components/ui/Toast'
import * as XLSX from 'xlsx'

// ===== 타입 =====
interface OptionProduct {
  id: string
  option_code: string
  option_name: string
  specification_1: string | null
  specification_2: string | null
  specification_3: string | null
  standard_quantity: number | null
  standard_unit: string | null
  packaging_box_price: number | null
  cushioning_price: number | null
  raw_material_cost: number | null
  labor_cost: number | null
  misc_cost: number | null
  shipping_cost: number | null
  shipping_fee: number | null
  total_cost: number | null
  seller_supply_price: number | null
  naver_paid_shipping_price: number | null
  naver_free_shipping_price: number | null
  coupang_paid_shipping_price: number | null
  coupang_free_shipping_price: number | null
  status: string
  // 가격 정책 필드
  material_cost_policy?: 'auto' | 'fixed' | '자동' | '고정' | null
  seller_supply_price_mode?: 'auto' | 'manual' | '자동' | '수동' | null
  naver_price_mode?: 'auto' | 'manual' | '자동' | '수동' | null
  coupang_price_mode?: 'auto' | 'manual' | '자동' | '수동' | null
  // 마진 계산 필드
  seller_margin_rate?: number | null  // 실제 셀러마진율 (계산값, readOnly)
  seller_margin_amount?: number | null  // 실제 셀러마진액 (계산값, readOnly)
  target_seller_margin_rate?: number | null  // 목표 셀러마진율 (입력값)
  target_margin_rate?: number | null  // 목표 직판마진율
  target_margin_amount?: number | null  // 목표 직판마진액
  margin_calculation_type?: 'rate' | 'amount' | '마진율' | '마진액' | null
  average_material_price?: number | null  // 사용원물 평균가
  calculated_material_cost?: number | null  // 원물원가 (계산값)
  raw_material_partner?: string | null  // 원물거래처 ID
  shipping_entity?: string | null  // 출고 (출고처 ID)
  shipping_vendor_id?: string | null  // 벤더사 ID
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
  const [verificationResults, setVerificationResults] = useState<any>(null)
  const [gridKey, setGridKey] = useState(0) // Grid 강제 리렌더링용

  // 엑셀 업로드 모달
  const [excelUploadModal, setExcelUploadModal] = useState<{ data: any[], mode: 'replace' | 'merge' | null } | null>(null)

  // 엑셀 업로드 결과 모달
  const [uploadResultModal, setUploadResultModal] = useState<{
    type: 'replace' | 'merge'
    added: string[]
    updated: string[]
    unchanged: string[]
  } | null>(null)

  const [vendorPartners, setVendorPartners] = useState<Array<{id: string, name: string}>>([])
  const [shippingVendors, setShippingVendors] = useState<Array<{id: string, name: string}>>([])
  const [invoiceEntities, setInvoiceEntities] = useState<Array<{id: string, name: string}>>([])

  const supabase = createClient()
  const fmtInt = new Intl.NumberFormat('ko-KR')

  // 가격 계산 로직을 별도 함수로 분리
  const calculatePrices = (item: any) => {
    // 한글 값을 DB 값으로 변환
    const marginCalcTypeRaw = (item as any).margin_calculation_type
    const marginCalcType = marginCalcTypeRaw === '마진율' ? 'rate'
      : marginCalcTypeRaw === '마진액' ? 'amount'
      : marginCalcTypeRaw || 'rate'

    // 0. 원물비용 계산 (원물가 × 표준수량)
    const averageMaterialPrice = Number(item.average_material_price) || 0
    const standardQuantity = Number(item.standard_quantity) || 0
    const rawMaterialCost = averageMaterialPrice * standardQuantity

    // 1. 총원가 계산 (무조건 자동, 택배비 제외)
    const totalCost = (
      rawMaterialCost +
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

    // 2. 셀러공급가 자동 계산 (모드가 'auto' 또는 '자동'일 때)
    let sellerSupplyPrice = item.seller_supply_price
    const sellerMode = item.seller_supply_price_mode
    if (sellerMode === 'auto' || sellerMode === '자동') {
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
    const naverMode = item.naver_price_mode
    if (naverMode === 'auto' || naverMode === '자동') {
      if (marginCalcType === 'rate') {
        const targetMarginRate = Number(item.target_margin_rate) || 0
        if (targetMarginRate > 0 && targetMarginRate < 100) {
          // 유료배송: 택배비 미포함
          naverPaidPrice = Math.round(totalCost / (1 - targetMarginRate / 100))
          // 무료배송: 택배비 포함
          naverFreePrice = Math.round(totalCostWithShipping / (1 - targetMarginRate / 100))
        } else {
          naverPaidPrice = totalCost
          naverFreePrice = totalCostWithShipping
        }
      } else if (marginCalcType === 'amount') {
        const targetMarginAmount = Number(item.target_margin_amount) || 0
        // 유료배송: 택배비 미포함
        naverPaidPrice = totalCost + targetMarginAmount
        // 무료배송: 택배비 포함
        naverFreePrice = totalCostWithShipping + targetMarginAmount
      }
    }

    // 5. 쿠팡 직판가 자동 계산
    let coupangPaidPrice = item.coupang_paid_shipping_price
    let coupangFreePrice = item.coupang_free_shipping_price
    const coupangMode = item.coupang_price_mode
    if (coupangMode === 'auto' || coupangMode === '자동') {
      if (marginCalcType === 'rate') {
        const targetMarginRate = Number(item.target_margin_rate) || 0
        if (targetMarginRate > 0 && targetMarginRate < 100) {
          // 유료배송: 택배비 미포함
          coupangPaidPrice = Math.round(totalCost / (1 - targetMarginRate / 100))
          // 무료배송: 택배비 포함
          coupangFreePrice = Math.round(totalCostWithShipping / (1 - targetMarginRate / 100))
        } else {
          coupangPaidPrice = totalCost
          coupangFreePrice = totalCostWithShipping
        }
      } else if (marginCalcType === 'amount') {
        const targetMarginAmount = Number(item.target_margin_amount) || 0
        // 유료배송: 택배비 미포함
        coupangPaidPrice = totalCost + targetMarginAmount
        // 무료배송: 택배비 포함
        coupangFreePrice = totalCostWithShipping + targetMarginAmount
      }
    }

    return {
      raw_material_cost: Math.round(rawMaterialCost),
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
    specification_1: '규격1',
    specification_2: '규격2',
    specification_3: '규격3',
    used_material_1: '사용원물1',
    used_material_2: '사용원물2',
    used_material_3: '사용원물3',
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
    calculated_material_cost: '원물비용',
    total_material_cost: '총자재비',
    total_cost: '총원가',
    material_cost_policy: '원물가정책',
    fixed_material_cost: '고정원물가',

    // 거래처 및 출고 정보
    raw_material_partner: '원물거래처',
    shipping_entity: '출고',
    shipping_vendor_id: '벤더사',
    invoice_entity: '송장',
    shipping_location_name: '발송지명',
    shipping_location_address: '발송지주소',
    shipping_location_contact: '발송지연락처',
    shipping_deadline: '발송기한',

    // 택배비 및 부가
    shipping_cost: '상품출고비용',
    shipping_fee: '택배비',
    shipping_additional_quantity: '택배비 부가수량',
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
    naver_margin_display: '네이버마진',

    coupang_price_mode: '쿠팡모드',
    coupang_paid_shipping_price: '쿠팡유료',
    coupang_free_shipping_price: '쿠팡무료',
    coupang_margin_display: '쿠팡마진',

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
    'option_code','option_name',
    'specification_1','specification_2','specification_3',
    'used_material_1','used_material_2','used_material_3',
    'standard_quantity','standard_unit',

    // 자재비
    'packaging_box_price','pack_price','bag_vinyl_price','cushioning_price','sticker_price','ice_pack_price','other_material_price','labor_cost',

    // 원가
    'raw_material_cost','total_material_cost','total_cost','material_cost_policy','fixed_material_cost',

    // 거래처 및 출고
    'raw_material_partner','shipping_entity','invoice_entity','shipping_vendor_id',
    'shipping_location_name','shipping_location_address','shipping_location_contact','shipping_deadline',

    // 택배비 및 부가
    'shipping_cost','shipping_fee','additional_quantity','misc_cost',

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
        return ['thumbnail_url','option_code','option_name','specification_1','standard_quantity','standard_unit','total_cost','shipping_fee','seller_supply_price','status']
      case 'cost':
        return ['option_code','option_name','raw_material_cost','packaging_box_price','pack_price','bag_vinyl_price','cushioning_price','sticker_price','ice_pack_price','other_material_price','labor_cost','misc_cost','total_material_cost','total_cost','shipping_cost','shipping_fee','seller_supply_price','status']
      case 'price':
        return ['option_code','option_name','total_cost','shipping_fee','seller_supply_price','naver_paid_shipping_price','naver_free_shipping_price','coupang_paid_shipping_price','coupang_free_shipping_price','status']
      case 'supply_policy':
        return ['option_code','option_name','average_material_price','calculated_material_cost','total_cost','shipping_fee','seller_supply_price_mode','target_seller_margin_rate','seller_supply_price','seller_margin_rate','seller_margin_amount','status']
      case 'direct_policy':
        return ['option_code','option_name','total_cost','seller_supply_price','margin_calculation_type','target_margin_rate','target_margin_amount','naver_price_mode','naver_paid_shipping_price','naver_free_shipping_price','naver_margin_display','coupang_price_mode','coupang_paid_shipping_price','coupang_free_shipping_price','coupang_margin_display']
      case 'shipping':
        return ['option_code','option_name','raw_material_partner','shipping_entity','shipping_vendor_id','invoice_entity','shipping_location_name','shipping_location_address','shipping_location_contact','shipping_deadline','total_cost','shipping_cost','shipping_fee','seller_supply_price','status']
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
        const val = p[field]
        return (val === 'auto' || val === '자동') ? '자동' : '수동'
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
      case 'is_seller_supply':
      case 'is_best':
      case 'is_recommended':
      case 'has_detail_page':
      case 'has_images':
        return p[field] ? 'Y' : 'N'
      case 'raw_material_partner':
        return (p as any).raw_material_partner_name || '-'
      case 'shipping_vendor_id':
        return '-' // TODO: 거래처 정보 표시 필요 시 구현
      case 'status':
        const st = supplyStatuses.find(s => s.code === p.status)
        return st?.name || p.status || '-'
      case 'naver_margin_display':
      case 'coupang_margin_display':
        // 프론트엔드 전용 - renderer에서 처리
        return ''
      default:
        return (p as any)[field] ?? ((p as any)[field] === 0 ? '0' : '-')
    }
  }


  // ===== 데이터 로드 =====
  useEffect(() => { void fetchAll() }, [])

  const fetchAll = async () => {
    await Promise.all([fetchProducts(), fetchSupplyStatuses(), fetchVendorPartners(), fetchShippingVendors(), fetchInvoiceEntities()])
  }

  const fetchVendorPartners = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (!error && data) {
      setVendorPartners(data)
    }
  }

  const fetchShippingVendors = async () => {
    const { data, error } = await supabase
      .from('shipping_vendors')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order')

    if (!error && data) {
      setShippingVendors(data)
    }
  }

  const fetchInvoiceEntities = async () => {
    const { data, error } = await supabase
      .from('invoice_entities')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order')

    if (!error && data) {
      setInvoiceEntities(data)
    }
  }


  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('option_products')
      .select('*')
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
                  .select('*, supplier:partners!main_supplier_id(id, name)')
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
                  category_3: rawMaterial?.category_3,
                  category_4: rawMaterial?.category_4,
                  category_5: rawMaterial?.category_5,
                  standard_unit: rawMaterial?.standard_unit,
                  latest_price: rawMaterial?.latest_price,
                  standard_quantity: rawMaterial?.standard_quantity,
                  last_trade_date: rawMaterial?.last_trade_date,
                  season: rawMaterial?.season,
                  season_start_date: rawMaterial?.season_start_date,
                  season_peak_date: rawMaterial?.season_peak_date,
                  season_end_date: rawMaterial?.season_end_date,
                  supply_status: rawMaterial?.supply_status,
                  main_supplier_id: rawMaterial?.main_supplier_id,
                  supplier: rawMaterial?.supplier
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

          // 대표 원물 (사용량이 가장 많은 원물, 같으면 첫 번째 원물)의 카테고리 사용
          const primaryMaterial = enrichedMaterials.length > 0
            ? enrichedMaterials.reduce((prev, current) => {
                const prevQty = prev.quantity || 0
                const currQty = current.quantity || 0
                // 사용량이 같으면 첫 번째 것 유지 (현재보다 클 때만 변경)
                if (currQty > prevQty) return current
                return prev
              })
            : null

          return {
            ...product,
            vendor_name: product.vendor?.name || null,
            // 사용원물 정보 추가
            used_materials: enrichedMaterials,
            // 사용원물1, 2, 3 (표시용)
            used_material_1: enrichedMaterials[0]?.material_name || '',
            used_material_2: enrichedMaterials[1]?.material_name || '',
            used_material_3: enrichedMaterials[2]?.material_name || '',
            // 원물에서 상속받은 카테고리
            category_1: primaryMaterial?.category_1 || null,
            category_2: primaryMaterial?.category_2 || null,
            category_3: primaryMaterial?.category_3 || null,
            category_4: primaryMaterial?.category_4 || null,
            category_5: primaryMaterial?.category_5 || null,
            // 사용원물 평균가
            average_material_price: averageMaterialPrice,
            // 원물원가 (계산값)
            calculated_material_cost: calculatedMaterialCost > 0 ? Math.round(calculatedMaterialCost) : null,
            // 원물거래처 (사용량이 가장 많은 원물의 거래처)
            raw_material_partner: primaryMaterial?.main_supplier_id || null,
            raw_material_partner_name: primaryMaterial?.supplier?.name || null
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
      const count = snapshot.filter(p => p.status === status.name).length
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
          p.specification_1,
          p.specification_2,
          p.specification_3,
          p.standard_unit,
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

      // 변경 전 상태 저장 (검증용)
      const beforeSave = new Map(validRows.map(p => [
        p.id,
        {
          option_code: p.option_code,
          option_name: p.option_name,
          total_cost: p.total_cost,
          shipping_fee: p.shipping_fee,
          material_cost_policy: p.material_cost_policy,
          seller_supply_price_mode: p.seller_supply_price_mode,
          naver_price_mode: p.naver_price_mode,
          coupang_price_mode: p.coupang_price_mode,
          margin_calculation_type: p.margin_calculation_type,
          target_seller_margin_rate: p.target_seller_margin_rate,
          target_margin_rate: p.target_margin_rate,
          target_margin_amount: p.target_margin_amount,
          seller_supply_price: p.seller_supply_price,
          naver_paid_shipping_price: p.naver_paid_shipping_price,
          naver_free_shipping_price: p.naver_free_shipping_price,
          coupang_paid_shipping_price: p.coupang_paid_shipping_price,
          coupang_free_shipping_price: p.coupang_free_shipping_price
        }
      ]))

      const rows = validRows.map(p => {
        // 한글 값을 DB 값으로 변환
        const marginCalcTypeRaw = (p as any).margin_calculation_type
        const marginCalcType = marginCalcTypeRaw === '마진율' ? 'rate'
          : marginCalcTypeRaw === '마진액' ? 'amount'
          : marginCalcTypeRaw || null

        // material_cost_policy는 영어 (auto/fixed)
        const materialCostPolicyRaw = (p as any).material_cost_policy
        const materialCostPolicy = materialCostPolicyRaw === '자동' ? 'auto'
          : materialCostPolicyRaw === '고정' ? 'fixed'
          : materialCostPolicyRaw || 'auto'

        // 가격 모드는 한글 그대로 저장 ('자동', '수동')
        const sellerPriceMode = (p as any).seller_supply_price_mode || '자동'
        const naverPriceMode = (p as any).naver_price_mode || '자동'
        const coupangPriceMode = (p as any).coupang_price_mode || '자동'

        // 벤더사 이름을 ID로 변환
        let shippingVendorId = p.shipping_vendor_id
        if (shippingVendorId && typeof shippingVendorId === 'string') {
          const vendor = vendorPartners.find(v => v.name === shippingVendorId)
          if (vendor) {
            shippingVendorId = vendor.id
          }
        }

        return {
          id: p.id,
          option_code: p.option_code || null,
          option_name: p.option_name || null,
          specification_1: p.specification_1 || null,
          specification_2: p.specification_2 || null,
          specification_3: p.specification_3 || null,
          standard_quantity: p.standard_quantity != null ? Number(p.standard_quantity) : null,
          standard_unit: p.standard_unit || null,
          raw_material_partner: p.raw_material_partner || null,
          shipping_entity: p.shipping_entity || null,
          shipping_vendor_id: shippingVendorId || null,
          invoice_entity: p.invoice_entity || null,
          shipping_location_name: p.shipping_location_name || null,
          shipping_location_address: p.shipping_location_address || null,
          shipping_location_contact: p.shipping_location_contact || null,
          shipping_deadline: p.shipping_deadline != null ? Number(p.shipping_deadline) : null,
          shipping_cost: p.shipping_cost != null ? Number(p.shipping_cost) : null,
          packaging_box_price: p.packaging_box_price != null ? Number(p.packaging_box_price) : null,
          pack_price: p.pack_price != null ? Number(p.pack_price) : null,
          bag_vinyl_price: p.bag_vinyl_price != null ? Number(p.bag_vinyl_price) : null,
          cushioning_price: p.cushioning_price != null ? Number(p.cushioning_price) : null,
          sticker_price: p.sticker_price != null ? Number(p.sticker_price) : null,
          ice_pack_price: p.ice_pack_price != null ? Number(p.ice_pack_price) : null,
          other_material_price: p.other_material_price != null ? Number(p.other_material_price) : null,
          raw_material_cost: p.raw_material_cost != null ? Number(p.raw_material_cost) : null,
          labor_cost: p.labor_cost != null ? Number(p.labor_cost) : null,
          misc_cost: p.misc_cost != null ? Number(p.misc_cost) : null,
          shipping_fee: p.shipping_fee != null ? Number(p.shipping_fee) : null,
          // total_cost는 GENERATED COLUMN이므로 제외
          // 가격 정책 필드 추가
          material_cost_policy: materialCostPolicy,
          fixed_material_cost: p.fixed_material_cost != null ? Number(p.fixed_material_cost) : null,
          seller_supply_price_mode: sellerPriceMode,
          target_seller_margin_rate: p.target_seller_margin_rate != null
            ? Math.min(Number(p.target_seller_margin_rate), 999) // 최대 999%로 제한
            : null,
          seller_supply_price: p.seller_supply_price != null ? Number(p.seller_supply_price) : null,
          // seller_margin_rate와 seller_margin_amount는 계산값이므로 제외 (readOnly)
          margin_calculation_type: marginCalcType,
          target_margin_rate: p.target_margin_rate != null
            ? Math.min(Number(p.target_margin_rate), 999) // 최대 999%로 제한
            : null,
          target_margin_amount: p.target_margin_amount != null ? Number(p.target_margin_amount) : null,
          naver_price_mode: naverPriceMode,
          naver_paid_shipping_price: p.naver_paid_shipping_price != null ? Number(p.naver_paid_shipping_price) : null,
          naver_free_shipping_price: p.naver_free_shipping_price != null ? Number(p.naver_free_shipping_price) : null,
          coupang_price_mode: coupangPriceMode,
          coupang_paid_shipping_price: p.coupang_paid_shipping_price != null ? Number(p.coupang_paid_shipping_price) : null,
          coupang_free_shipping_price: p.coupang_free_shipping_price != null ? Number(p.coupang_free_shipping_price) : null,
          status: resolveStatusCode(p.status) || p.status || 'PREPARING',
        }
      })

      const { error: upErr } = await supabase.from('option_products').upsert(rows, { onConflict: 'id' })
      if (upErr) {
        console.error('Upsert error:', upErr)
        console.error('Error details:', JSON.stringify(upErr, null, 2))
        throw upErr
      }

      // 토스트 메시지 제거 - 검증 모달에서 확인

      // 데이터 다시 불러오기
      await fetchProducts()

      // Grid 강제 리렌더링 - 히스토리 초기화
      setGridKey(prev => prev + 1)

      // 저장 후 계산 검증 (개발 모드에서만)
      if (process.env.NODE_ENV === 'development') {
        await verifyPriceCalculations(beforeSave)
      }
    } catch (e) {
      console.error('Save error:', e)
      console.error('Error message:', (e as any)?.message)
      console.error('Error details:', (e as any)?.details)
      console.error('Error hint:', (e as any)?.hint)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  // 프론트엔드와 백엔드 계산 결과 검증
  const verifyPriceCalculations = async (beforeSave: Map<string, any>) => {
    const savedProducts = Array.from(beforeSave.keys()).map(id => products.find(p => p.id === id)).filter(Boolean)

    const results: Array<{
      optionCode: string
      optionName: string
      changes: Array<{
        label: string
        beforeValue: string
        afterValue: string
        type: 'setting' | 'price' | 'validation'
      }>
    }> = []

    for (const p of savedProducts) {
      const before = beforeSave.get(p!.id)

      const { data: dbProduct } = await supabase
        .from('option_products')
        .select('*')
        .eq('id', p!.id)
        .single()

      if (dbProduct && before) {
        const changes: Array<{label: string, beforeValue: string, afterValue: string, type: 'setting' | 'price' | 'validation'}> = []

        // 설정 변경사항
        if (before.material_cost_policy !== dbProduct.material_cost_policy) {
          changes.push({
            label: '원물가정책',
            beforeValue: before.material_cost_policy === 'auto' ? '자동' : '고정',
            afterValue: dbProduct.material_cost_policy === 'auto' ? '자동' : '고정',
            type: 'setting'
          })
        }
        if (before.seller_supply_price_mode !== dbProduct.seller_supply_price_mode) {
          changes.push({
            label: '셀러모드',
            beforeValue: before.seller_supply_price_mode,
            afterValue: dbProduct.seller_supply_price_mode,
            type: 'setting'
          })
        }
        if (before.naver_price_mode !== dbProduct.naver_price_mode) {
          changes.push({
            label: '네이버모드',
            beforeValue: before.naver_price_mode,
            afterValue: dbProduct.naver_price_mode,
            type: 'setting'
          })
        }
        if (before.coupang_price_mode !== dbProduct.coupang_price_mode) {
          changes.push({
            label: '쿠팡모드',
            beforeValue: before.coupang_price_mode,
            afterValue: dbProduct.coupang_price_mode,
            type: 'setting'
          })
        }
        if (before.margin_calculation_type !== dbProduct.margin_calculation_type) {
          changes.push({
            label: '마진계산방식',
            beforeValue: before.margin_calculation_type === 'rate' ? '마진율' : '마진액',
            afterValue: dbProduct.margin_calculation_type === 'rate' ? '마진율' : '마진액',
            type: 'setting'
          })
        }
        if (Math.abs((before.target_seller_margin_rate || 0) - (dbProduct.target_seller_margin_rate || 0)) >= 0.1) {
          changes.push({
            label: '목표셀러마진%',
            beforeValue: (before.target_seller_margin_rate || 0) + '%',
            afterValue: (dbProduct.target_seller_margin_rate || 0) + '%',
            type: 'setting'
          })
        }
        if (Math.abs((before.target_margin_rate || 0) - (dbProduct.target_margin_rate || 0)) >= 0.1) {
          changes.push({
            label: '목표직판마진%',
            beforeValue: (before.target_margin_rate || 0) + '%',
            afterValue: (dbProduct.target_margin_rate || 0) + '%',
            type: 'setting'
          })
        }
        if (Math.abs((before.target_margin_amount || 0) - (dbProduct.target_margin_amount || 0)) >= 1) {
          changes.push({
            label: '목표직판마진액',
            beforeValue: (before.target_margin_amount || 0).toLocaleString() + '원',
            afterValue: (dbProduct.target_margin_amount || 0).toLocaleString() + '원',
            type: 'setting'
          })
        }

        // 가격 변경사항
        if (Math.abs((before.seller_supply_price || 0) - (dbProduct.seller_supply_price || 0)) >= 1) {
          changes.push({
            label: '셀러공급가',
            beforeValue: (before.seller_supply_price || 0).toLocaleString() + '원',
            afterValue: (dbProduct.seller_supply_price || 0).toLocaleString() + '원',
            type: 'price'
          })
        }
        if (Math.abs((before.naver_paid_shipping_price || 0) - (dbProduct.naver_paid_shipping_price || 0)) >= 1) {
          changes.push({
            label: '네이버유료',
            beforeValue: (before.naver_paid_shipping_price || 0).toLocaleString() + '원',
            afterValue: (dbProduct.naver_paid_shipping_price || 0).toLocaleString() + '원',
            type: 'price'
          })
        }
        if (Math.abs((before.naver_free_shipping_price || 0) - (dbProduct.naver_free_shipping_price || 0)) >= 1) {
          changes.push({
            label: '네이버무료',
            beforeValue: (before.naver_free_shipping_price || 0).toLocaleString() + '원',
            afterValue: (dbProduct.naver_free_shipping_price || 0).toLocaleString() + '원',
            type: 'price'
          })
        }
        if (Math.abs((before.coupang_paid_shipping_price || 0) - (dbProduct.coupang_paid_shipping_price || 0)) >= 1) {
          changes.push({
            label: '쿠팡유료',
            beforeValue: (before.coupang_paid_shipping_price || 0).toLocaleString() + '원',
            afterValue: (dbProduct.coupang_paid_shipping_price || 0).toLocaleString() + '원',
            type: 'price'
          })
        }
        if (Math.abs((before.coupang_free_shipping_price || 0) - (dbProduct.coupang_free_shipping_price || 0)) >= 1) {
          changes.push({
            label: '쿠팡무료',
            beforeValue: (before.coupang_free_shipping_price || 0).toLocaleString() + '원',
            afterValue: (dbProduct.coupang_free_shipping_price || 0).toLocaleString() + '원',
            type: 'price'
          })
        }

        // 검증: 자동 모드인 경우 프론트 계산값과 DB값 비교
        if (dbProduct.seller_supply_price_mode === '자동' || dbProduct.naver_price_mode === '자동' || dbProduct.coupang_price_mode === '자동') {
          const frontCalc = calculatePrices(dbProduct)

          if (dbProduct.seller_supply_price_mode === '자동') {
            const match = Math.abs((dbProduct.seller_supply_price || 0) - (frontCalc.seller_supply_price || 0)) < 1
            if (!match) {
              changes.push({
                label: '셀러공급가 검증',
                beforeValue: 'DB: ' + (dbProduct.seller_supply_price || 0).toLocaleString(),
                afterValue: '계산: ' + (frontCalc.seller_supply_price || 0).toLocaleString(),
                type: 'validation'
              })
            }
          }
        }

        if (changes.length > 0) {
          results.push({
            optionCode: dbProduct.option_code || '',
            optionName: dbProduct.option_name || '',
            changes: changes
          })
        }
      }
    }

    setVerificationResults({
      allChanges: results,
      hasChanges: results.length > 0
    })
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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

        {/* 엑셀 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              // 가상 필드 제거 (프론트엔드에서 추가한 필드들)
              const virtualFields = [
                'vendor_name', 'used_material_1', 'used_material_2', 'used_material_3',
                'used_materials', 'category_1', 'category_2', 'category_3', 'category_4', 'category_5',
                'average_material_price', 'calculated_material_cost', 'seller_margin_rate',
                'seller_margin_amount', 'target_margin_amount', 'margin_calculation_type',
                'total_material_cost', 'total_cost', 'vendor', 'raw_material_partner_name'
              ]

              // 추가 필드 매핑 (FIELD_LABELS에 없는 DB 필드들)
              const additionalMapping: Record<string, string> = {
                'id': 'ID',
                'item_type': '품목유형',
                'variety': '품종',
                'weight': '중량',
                'weight_unit': '중량단위',
                'shipping_type': '발송유형',
                'shipping_address': '발송주소',
                'shipping_contact': '발송연락처',
                'season': '시즌',
                'season_start_date': '시즌시작일',
                'season_peak_date': '시즌피크일',
                'season_end_date': '시즌종료일',
                'detail_page_url': '상세페이지URL',
                'is_active': '활성화',
                'created_at': '생성일',
                'updated_at': '수정일'
              }

              // 디버깅: FIELD_LABELS와 매핑 확인
              console.log('=== 엑셀 다운로드 디버깅 ===')
              console.log('FIELD_LABELS:', FIELD_LABELS)

              const exportData = products.map((product) => {
                const koreanData: Record<string, any> = {}
                Object.keys(product).forEach(key => {
                  // 가상 필드 제외
                  if (virtualFields.includes(key)) return

                  // FIELD_LABELS 우선 사용, 없으면 additionalMapping, 둘 다 없으면 영문 그대로
                  const koreanKey = FIELD_LABELS[key] || additionalMapping[key] || key

                  // status 값을 한글 이름으로 변환
                  let value = product[key]
                  if (key === 'status' && value) {
                    const statusObj = supplyStatuses.find(s => s.code === value || s.name === value)
                    value = statusObj?.name || value
                  }

                  koreanData[koreanKey] = value
                })
                return koreanData
              })

              // 첫 번째 행의 헤더 확인
              if (exportData.length > 0) {
                const headers = Object.keys(exportData[0])
                console.log('엑셀 헤더:', headers)
                console.log('헤더 개수:', headers.length)

                // 처음 10개 헤더만 alert로 표시
                alert(`엑셀 헤더 (총 ${headers.length}개):\n${headers.slice(0, 10).join('\n')}\n...`)
              }

              const ws = XLSX.utils.json_to_sheet(exportData)
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, '옵션상품관리')
              const dateStr = new Date().toISOString().split('T')[0]
              XLSX.writeFile(wb, `옵션상품관리_${dateStr}.xlsx`)
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

                  // 추가 필드 역매핑 (FIELD_LABELS에 없는 필드들)
                  const additionalReverseMapping: Record<string, string> = {
                    'ID': 'id',
                    '품목유형': 'item_type',
                    '품종': 'variety',
                    '중량': 'weight',
                    '중량단위': 'weight_unit',
                    '발송유형': 'shipping_type',
                    '발송주소': 'shipping_address',
                    '발송연락처': 'shipping_contact',
                    '시즌': 'season',
                    '시즌시작일': 'season_start_date',
                    '시즌피크일': 'season_peak_date',
                    '시즌종료일': 'season_end_date',
                    '상세페이지URL': 'detail_page_url',
                    '활성화': 'is_active',
                    '생성일': 'created_at',
                    '수정일': 'updated_at'
                  }

                  // 숫자로 변환해야 하는 필드 목록
                  const numericFields = [
                    'id', 'shipping_deadline', 'shipping_fee', 'shipping_additional_quantity',
                    'standard_quantity', 'packaging_box_price', 'pack_price', 'bag_vinyl_price',
                    'cushioning_price', 'sticker_price', 'ice_pack_price', 'other_material_price',
                    'raw_material_cost', 'labor_cost', 'misc_cost', 'target_margin_rate',
                    'target_seller_margin_rate', 'seller_supply_price', 'naver_paid_shipping_price',
                    'naver_free_shipping_price', 'coupang_paid_shipping_price', 'coupang_free_shipping_price',
                    'fixed_material_cost'
                  ]

                  // 한글 헤더를 영문으로 변환
                  const convertedData = jsonData.map((row: any) => {
                    const englishRow: any = {}
                    Object.keys(row).forEach(key => {
                      // FIELD_LABELS에서 한글 헤더에 해당하는 영문 필드명 찾기
                      const fieldLabelsEntry = Object.entries(FIELD_LABELS).find(([_, label]) => label === key)
                      let englishKey = fieldLabelsEntry ? fieldLabelsEntry[0] : (additionalReverseMapping[key] || key)

                      let value = row[key]

                      // 숫자 필드는 문자열이면 숫자로 변환
                      if (numericFields.includes(englishKey) && value !== null && value !== undefined && value !== '') {
                        const numValue = typeof value === 'string' ? Number(value) : value
                        value = isNaN(numValue) ? value : numValue
                      }

                      englishRow[englishKey] = value
                    })
                    return englishRow
                  })

                  // 엑셀에서 업로드된 데이터의 필드 그대로 사용
                  // (다운로드 시 이미 가상 필드를 제거했으므로 추가 필터링 불필요)
                  const dbFields = Object.keys(convertedData[0] || {})

                  // vendor_name 필드 제거 및 데이터 정제
                  const cleanData = convertedData.map((row: any) => {
                    const { vendor_name, ...rest } = row

                    // DB 스키마에 맞춰 모든 필드 초기화 (엑셀에 없는 필드는 null)
                    const normalizedRow: any = {}
                    dbFields.forEach(field => {
                      normalizedRow[field] = rest[field] !== undefined ? rest[field] : null
                    })

                    // 날짜 필드 변환
                    const dateFields = ['season_start_date', 'season_peak_date', 'season_end_date', 'created_at', 'updated_at']
                    dateFields.forEach(field => {
                      if (normalizedRow[field]) {
                        if (typeof normalizedRow[field] === 'number') {
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
                    const numericFields = [
                      'weight', 'standard_quantity', 'packaging_box_price', 'pack_price', 'bag_vinyl_price',
                      'cushioning_price', 'sticker_price', 'ice_pack_price', 'other_material_price',
                      'total_material_cost', 'raw_material_cost', 'labor_cost', 'total_cost',
                      'shipping_fee', 'target_margin_rate',
                      'seller_supply_auto_price', 'seller_supply_manual_price',
                      'seller_supply_price', 'naver_paid_shipping_auto', 'naver_free_shipping_auto',
                      'naver_paid_shipping_manual', 'naver_free_shipping_manual', 'naver_paid_shipping_price',
                      'naver_free_shipping_price', 'coupang_paid_shipping_auto', 'coupang_free_shipping_auto',
                      'coupang_paid_shipping_manual', 'coupang_free_shipping_manual', 'coupang_paid_shipping_price',
                      'coupang_free_shipping_price'
                    ]
                    numericFields.forEach(field => {
                      if (normalizedRow[field]) {
                        if (typeof normalizedRow[field] === 'string') {
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
        </div>
      </div>

      {/* 테이블 */}
      <div>
        <div className="px-6 py-4">
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
          key={gridKey}
          data={filteredProducts}
          columns={(() => {
            const visibleFields = getVisibleFields(viewMode)
            return visibleFields.map(field => ({
              key: field,
              title: FIELD_LABELS[field] || field,
              width: field === 'thumbnail_url' ? 80
                : field === 'option_code' ? 120
                : field === 'option_name' ? 200
                : field === 'status' ? 90
                : 110,
              type: ['packaging_box_price', 'pack_price', 'bag_vinyl_price', 'cushioning_price', 'sticker_price', 'ice_pack_price', 'other_material_price',
                     'raw_material_cost', 'labor_cost', 'misc_cost', 'shipping_fee', 'total_material_cost', 'fixed_material_cost', 'additional_quantity',
                     'seller_supply_price', 'naver_paid_shipping_price', 'naver_free_shipping_price', 'coupang_paid_shipping_price',
                     'coupang_free_shipping_price', 'standard_quantity', 'seller_margin_rate', 'target_seller_margin_rate', 'target_margin_rate', 'target_margin_amount'].includes(field) ? 'number' as const
                : ['material_cost_policy', 'margin_calculation_type', 'status', 'standard_unit', 'shipping_entity', 'invoice_entity', 'shipping_vendor_id'].includes(field) ? 'dropdown' as const
                : 'text' as const,
              source: field === 'material_cost_policy' ? ['자동', '고정']
                : field === 'margin_calculation_type' ? ['마진율', '마진액']
                : field === 'status' ? supplyStatuses.map(s => s.name)
                : field === 'standard_unit' ? ['kg', 'g', 'box', '개', 'L', 'ml']
                : field === 'shipping_entity' ? shippingVendors.map(v => v.name)
                : field === 'invoice_entity' ? invoiceEntities.map(e => e.name)
                : field === 'shipping_vendor_id' ? vendorPartners.map(p => p.name)
                : undefined,
              readOnly: ['thumbnail_url', 'option_code', 'used_material_1', 'used_material_2', 'used_material_3', 'total_cost', 'average_material_price', 'calculated_material_cost', 'seller_margin_rate', 'seller_margin_amount', 'category_1', 'category_2', 'category_3', 'category_4', 'category_5', 'naver_margin_display', 'coupang_margin_display', 'raw_material_partner'].includes(field)
                ? true
                : field === 'target_seller_margin_rate' ? (row: OptionProduct) => {
                    const mode = (row as any).seller_supply_price_mode
                    return mode === 'manual' || mode === '수동'
                  }
                : field === 'target_margin_rate' ? (row: OptionProduct) => {
                    const calcType = (row as any).margin_calculation_type
                    return calcType !== 'rate' && calcType !== '마진율'
                  }
                : field === 'target_margin_amount' ? (row: OptionProduct) => {
                    const calcType = (row as any).margin_calculation_type
                    return calcType !== 'amount' && calcType !== '마진액'
                  }
                : false,
              className: field === 'seller_supply_price' ? ((row: OptionProduct) => {
                const mode = (row as any).seller_supply_price_mode
                return mode === 'manual' || mode === '수동' ? '!text-purple-600' : ''
              }) : undefined,
              align: ['material_cost_policy', 'seller_supply_price_mode', 'naver_price_mode', 'coupang_price_mode', 'margin_calculation_type', 'seller_margin_rate', 'target_seller_margin_rate', 'target_margin_rate'].includes(field) ? 'center' as const : undefined,
              renderer: field === 'thumbnail_url' ? (value: any, _row: OptionProduct) => {
                if (!value) return <div style={{ width: '60px', height: '60px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
                return (
                  <img
                    src={value}
                    alt="썸네일"
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #E5E7EB'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) parent.innerHTML = '<div style="width: 60px; height: 60px; background-color: #F3F4F6; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9CA3AF;">이미지 없음</div>'
                    }}
                  />
                )
              } : field === 'target_seller_margin_rate' ? (value: any, row: OptionProduct) => {
                const mode = (row as any).seller_supply_price_mode
                const isReadOnly = mode === 'manual' || mode === '수동'
                const displayValue = value != null ? Number(value).toLocaleString('ko-KR') : ''
                return (
                  <span style={{ fontSize: '13px' }}>
                    {displayValue}
                    {isReadOnly && <span style={{ marginLeft: '4px', color: '#9CA3AF', fontSize: '11px' }}>✕</span>}
                  </span>
                )
              } : field === 'status' ? (value: any, row: OptionProduct) => {
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
              } : field === 'shipping_vendor_id' ? (_value: any, row: OptionProduct) => {
                const vendor = vendorPartners.find(p => p.id === row.shipping_vendor_id)
                return <span style={{ fontSize: '13px' }}>{vendor?.name || '-'}</span>
              } : field === 'option_name' ? (value: any, row: OptionProduct) => {
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
                : field === 'seller_supply_price_mode' || field === 'naver_price_mode' || field === 'coupang_price_mode' ? (value: any, row: OptionProduct, rowIndex: number) => {
                  const isAuto = value === 'auto' || value === '자동'
                  return (
                    <div className="flex items-center justify-center h-full w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newValue = isAuto ? '수동' : '자동'
                          // 데이터 직접 업데이트
                          const newData = [...filteredProducts]
                          newData[rowIndex] = { ...newData[rowIndex], [field]: newValue }

                          // products 전체 업데이트
                          setProducts(prev => {
                            const updated = [...prev]
                            const productIndex = updated.findIndex(p => p.id === newData[rowIndex].id)
                            if (productIndex !== -1) {
                              updated[productIndex] = { ...updated[productIndex], [field]: newValue }
                            }
                            return updated
                          })
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          isAuto
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {isAuto ? '자동' : '수동'}
                      </button>
                    </div>
                  )
                }
                : field === 'margin_calculation_type' ? (value: any, _row: OptionProduct, rowIndex: number) => {
                  const isRate = value === 'rate' || value === '마진율'
                  return (
                    <div className="flex items-center justify-center h-full w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newValue = isRate ? '마진액' : '마진율'
                          // 데이터 직접 업데이트
                          const newData = [...filteredProducts]
                          newData[rowIndex] = { ...newData[rowIndex], [field]: newValue }

                          // products 전체 업데이트
                          setProducts(prev => {
                            const updated = [...prev]
                            const productIndex = updated.findIndex(p => p.id === newData[rowIndex].id)
                            if (productIndex !== -1) {
                              updated[productIndex] = { ...updated[productIndex], [field]: newValue }
                            }
                            return updated
                          })
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          isRate
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {isRate ? '마진율' : '마진액'}
                      </button>
                    </div>
                  )
                }
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
                  const mode = row.seller_supply_price_mode
                  const badge = (mode === 'manual' || mode === '수동') ? '⚙️' : '🅰️'
                  return (
                    <span style={{ fontSize: '13px' }}>
                      {value != null ? value.toLocaleString() : ''}
                      <span style={{ marginLeft: '4px', opacity: 0.6 }}>{badge}</span>
                    </span>
                  )
                }
                : field === 'naver_paid_shipping_price' || field === 'naver_free_shipping_price' ? (value: any, row: OptionProduct) => {
                  const mode = row.naver_price_mode
                  const badge = (mode === 'manual' || mode === '수동') ? '⚙️' : '🅰️'
                  return (
                    <span style={{ fontSize: '13px' }}>
                      {value != null ? value.toLocaleString() : ''}
                      <span style={{ marginLeft: '4px', opacity: 0.6 }}>{badge}</span>
                    </span>
                  )
                }
                : field === 'coupang_paid_shipping_price' || field === 'coupang_free_shipping_price' ? (value: any, row: OptionProduct) => {
                  const mode = row.coupang_price_mode
                  const badge = (mode === 'manual' || mode === '수동') ? '⚙️' : '🅰️'
                  return (
                    <span style={{ fontSize: '13px' }}>
                      {value != null ? value.toLocaleString() : ''}
                      <span style={{ marginLeft: '4px', opacity: 0.6 }}>{badge}</span>
                    </span>
                  )
                }
                : field === 'naver_margin_display' ? (value: any, row: OptionProduct) => {
                  const freePrice = row.naver_free_shipping_price || 0
                  const totalCost = (row.total_cost || 0) + (row.shipping_fee || 0)
                  const marginAmount = freePrice - totalCost
                  // 올바른 마진율 계산: (판매가 - 원가) / 판매가 × 100
                  const marginRate = freePrice > 0 ? (marginAmount / freePrice) * 100 : 0

                  // 색상 계산
                  let textColor: string
                  if (marginRate < 0) {
                    // 마이너스: 분홍색
                    textColor = '#ec4899'
                  } else {
                    // 0~100% 초록색 진하기 (0% = 연한 초록, 100% = 진한 초록)
                    const normalizedRate = Math.min(100, marginRate)
                    const greenValue = Math.round(100 + (normalizedRate / 100) * 155) // 100~255
                    textColor = `rgb(0, ${greenValue}, 0)`
                  }

                  return (
                    <div style={{
                      fontSize: '13px',
                      color: textColor,
                      fontWeight: '600',
                      textAlign: 'right'
                    }}>
                      {marginAmount.toLocaleString()}({marginRate.toFixed(1)}%)
                    </div>
                  )
                }
                : field === 'coupang_margin_display' ? (value: any, row: OptionProduct) => {
                  const freePrice = row.coupang_free_shipping_price || 0
                  const totalCost = (row.total_cost || 0) + (row.shipping_fee || 0)
                  const marginAmount = freePrice - totalCost
                  // 올바른 마진율 계산: (판매가 - 원가) / 판매가 × 100
                  const marginRate = freePrice > 0 ? (marginAmount / freePrice) * 100 : 0

                  // 색상 계산
                  let textColor: string
                  if (marginRate < 0) {
                    // 마이너스: 분홍색
                    textColor = '#ec4899'
                  } else {
                    // 0~100% 초록색 진하기 (0% = 연한 초록, 100% = 진한 초록)
                    const normalizedRate = Math.min(100, marginRate)
                    const greenValue = Math.round(100 + (normalizedRate / 100) * 155) // 100~255
                    textColor = `rgb(0, ${greenValue}, 0)`
                  }

                  return (
                    <div style={{
                      fontSize: '13px',
                      color: textColor,
                      fontWeight: '600',
                      textAlign: 'right'
                    }}>
                      {marginAmount.toLocaleString()}({marginRate.toFixed(1)}%)
                    </div>
                  )
                }
                : undefined
            }))
          })()}
          onDataChange={(newData) => {
            // 벤더사 이름을 ID로 변환
            const dataWithVendorId = newData.map(item => {
              // shipping_vendor_id가 이름(문자열)인 경우 ID로 변환
              if (item.shipping_vendor_id && typeof item.shipping_vendor_id === 'string') {
                const vendor = vendorPartners.find(p => p.name === item.shipping_vendor_id)
                if (vendor) {
                  return { ...item, shipping_vendor_id: vendor.id }
                }
              }
              return item
            })

            // 가격 계산 함수 사용
            const dataWithCalculations = dataWithVendorId.map(item => ({
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
          globalSearchPlaceholder="옵션코드, 상품명, 품목, 품종 검색"
          height="900px"
          rowHeight={26}
          enableCSVExport={false}
          enableCSVImport={false}
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
                        ({(item as any).category_4 || '-'} / {(item as any).category_5 || '-'})
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

      {/* 저장 변경사항 모달 */}
      {verificationResults && (
        <Modal
          isOpen={true}
          onClose={() => setVerificationResults(null)}
          title="💾 저장 완료 - 변경사항"
          size="2xl"
          footer={
            <Button onClick={() => setVerificationResults(null)}>닫기</Button>
          }
        >
          <div className="space-y-4 max-h-[600px] overflow-y-auto p-6">
            {verificationResults.hasChanges ? (
              <>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  📊 {verificationResults.allChanges?.length || 0}개 옵션상품이 변경되었습니다
                </div>
                {verificationResults.allChanges?.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 space-y-3">
                    <div className="font-bold text-lg text-gray-900 dark:text-white pb-2">
                      📦 {item.optionCode} - {item.optionName}
                    </div>
                    <div className="space-y-2">
                      {item.changes.map((change: string, changeIdx: number) => (
                        <div key={changeIdx} className="flex items-start gap-3 text-sm">
                          <span className="text-blue-500 dark:text-blue-400">•</span>
                          <span className="text-gray-800 dark:text-gray-200 flex-1">
                            {change}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="text-center font-bold py-4 text-green-600 dark:text-green-400">
                  ✅ 모든 변경사항이 성공적으로 저장되었습니다
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                변경사항이 없습니다.
              </div>
            )}
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
                  <strong>교체 모드:</strong> 엑셀 파일의 데이터로 완전히 교체했습니다. 엑셀에 없는 옵션상품은 삭제되었습니다.
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
                <div className="font-semibold text-blue-600 dark:text-blue-400 mb-2">추가된 옵션상품 ({uploadResultModal.added.length}개)</div>
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
                <div className="font-semibold text-green-600 dark:text-green-400 mb-2">수정된 옵션상품 ({uploadResultModal.updated.length}개)</div>
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
                <div className="font-semibold text-gray-600 dark:text-gray-400 mb-2">변경없는 옵션상품 ({uploadResultModal.unchanged.length}개)</div>
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
            <p className="text-sm text-gray-700 dark:text-gray-300">
              총 <strong className="text-blue-600 dark:text-blue-400">{excelUploadModal.data.length}개</strong>의 데이터를 업로드합니다.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-400">
                <strong>⚠️ 중요:</strong> 엑셀 파일의 <strong>id</strong> 컬럼을 삭제하지 마세요. id가 변경되면 원물과의 연결이 끊어집니다.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  // 교체: 엑셀에 있는 option_code만 남기고 나머지는 삭제
                  const uploadCodes = excelUploadModal.data.map((row: any) => row.option_code).filter(Boolean)

                  // 기존 DB 데이터 조회 (전체 필드)
                  const { data: existingData } = await supabase.from('option_products').select('*')
                  const existingDataMap = new Map(existingData?.map(d => [d.option_code, d]) || [])

                  // 추가/수정 분류
                  const added: string[] = []
                  const updated: string[] = []

                  // 값 정규화 함수를 forEach 밖으로 이동
                  const normalizeValue = (val: any) => {
                    // null/undefined 체크
                    if (val === null || val === undefined || val === 'null' || val === 'undefined') return null

                    // 빈 문자열 체크 (숫자 변환 전에)
                    if (val === '') return null

                    // 숫자 문자열을 숫자로 변환 (Excel에서 "1"로 읽히는 경우 대비)
                    if (typeof val === 'string') {
                      const trimmed = val.trim()
                      if (trimmed !== '' && !isNaN(Number(trimmed))) {
                        return Number(trimmed)
                      }
                    }

                    // NaN 체크
                    if (typeof val === 'number' && isNaN(val)) return null

                    return val
                  }

                  excelUploadModal.data.forEach((row: any) => {
                    if (existingDataMap.has(row.option_code)) {
                      const existing = existingDataMap.get(row.option_code)
                      // 실제로 값이 변경되었는지 비교
                      let hasChanges = false
                      const changedFields: string[] = []

                      for (const key in row) {
                        if (key === 'updated_at' || key === 'created_at') continue

                        // 자동 계산 모드인 가격 필드는 비교 제외
                        const sellerMode = existing.seller_supply_price_mode
                        const naverMode = existing.naver_price_mode
                        const coupangMode = existing.coupang_price_mode

                        if (key === 'seller_supply_price' && (sellerMode === 'auto' || sellerMode === '자동')) continue
                        if ((key === 'naver_paid_shipping_price' || key === 'naver_free_shipping_price') && (naverMode === 'auto' || naverMode === '자동')) continue
                        if ((key === 'coupang_paid_shipping_price' || key === 'coupang_free_shipping_price') && (coupangMode === 'auto' || coupangMode === '자동')) continue

                        const newVal = normalizeValue(row[key])
                        const oldVal = normalizeValue(existing[key])

                        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                          hasChanges = true
                          changedFields.push(`${key}: ${JSON.stringify(oldVal)} → ${JSON.stringify(newVal)}`)
                        }
                      }

                      if (hasChanges) {
                        console.log(`변경감지: ${row.option_name}`, changedFields)
                        updated.push(`${row.option_name} (${row.option_code})`)
                      }
                    } else {
                      added.push(`${row.option_name} (${row.option_code})`)
                    }
                  })

                  // 1. upsert로 데이터 업데이트/추가
                  // 벤더사 이름을 ID로 변환
                  const dataToUpsert = excelUploadModal.data.map((row: any) => {
                    let shippingVendorId = row.shipping_vendor_id
                    if (shippingVendorId && typeof shippingVendorId === 'string') {
                      const vendor = vendorPartners.find(v => v.name === shippingVendorId)
                      if (vendor) {
                        shippingVendorId = vendor.id
                      }
                    }
                    return {
                      ...row,
                      shipping_vendor_id: shippingVendorId || null
                    }
                  })
                  const { error: upsertError } = await supabase.from('option_products').upsert(dataToUpsert, { onConflict: 'id' })
                  if (upsertError) {
                    console.error(upsertError)
                    return
                  }

                  // 2. 엑셀에 없는 데이터만 삭제
                  const { error: deleteError } = await supabase
                    .from('option_products')
                    .delete()
                    .not('option_code', 'in', `(${uploadCodes.map(c => `"${c}"`).join(',')})`)

                  if (deleteError && deleteError.code !== '23503') {
                    console.warn(deleteError)
                  }

                  await fetchProducts()
                  setExcelUploadModal(null)

                  // 결과 모달 표시
                  setUploadResultModal({
                    type: 'replace',
                    added,
                    updated,
                    unchanged: []
                  })
                }}
                className="w-full px-4 py-3 text-left border-2 border-red-300 dark:border-red-500/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <div className="font-semibold text-red-600 dark:text-red-400">교체</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">엑셀 파일의 데이터로 교체합니다. (다른 테이블에서 참조 중인 데이터는 유지)</div>
              </button>
              <button
                onClick={async () => {
                  // 병합: upsert로 기존 데이터 유지하면서 업데이트/추가

                  // 기존 DB 데이터 조회 (전체 필드)
                  const { data: existingData } = await supabase.from('option_products').select('*')
                  const existingDataMap = new Map(existingData?.map(d => [d.option_code, d]) || [])

                  // 추가/수정/변경없음 분류
                  const added: string[] = []
                  const updated: string[] = []
                  const unchanged: string[] = []

                  // 값 정규화 함수
                  const normalizeValue = (val: any) => {
                    // null/undefined 체크
                    if (val === null || val === undefined || val === 'null' || val === 'undefined') return null

                    // 빈 문자열 체크 (숫자 변환 전에)
                    if (val === '') return null

                    // 숫자 문자열을 숫자로 변환 (Excel에서 "1"로 읽히는 경우 대비)
                    if (typeof val === 'string') {
                      const trimmed = val.trim()
                      if (trimmed !== '' && !isNaN(Number(trimmed))) {
                        return Number(trimmed)
                      }
                    }

                    // NaN 체크
                    if (typeof val === 'number' && isNaN(val)) return null

                    return val
                  }

                  excelUploadModal.data.forEach((row: any) => {
                    if (existingDataMap.has(row.option_code)) {
                      const existing = existingDataMap.get(row.option_code)
                      // 실제로 값이 변경되었는지 비교
                      let hasChanges = false
                      for (const key in row) {
                        if (key === 'updated_at' || key === 'created_at') continue

                        // 자동 계산 모드인 가격 필드는 비교 제외
                        const sellerMode = existing.seller_supply_price_mode
                        const naverMode = existing.naver_price_mode
                        const coupangMode = existing.coupang_price_mode

                        if (key === 'seller_supply_price' && (sellerMode === 'auto' || sellerMode === '자동')) continue
                        if ((key === 'naver_paid_shipping_price' || key === 'naver_free_shipping_price') && (naverMode === 'auto' || naverMode === '자동')) continue
                        if ((key === 'coupang_paid_shipping_price' || key === 'coupang_free_shipping_price') && (coupangMode === 'auto' || coupangMode === '자동')) continue

                        const newVal = normalizeValue(row[key])
                        const oldVal = normalizeValue(existing[key])

                        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                          hasChanges = true
                          break
                        }
                      }
                      if (hasChanges) {
                        updated.push(`${row.option_name} (${row.option_code})`)
                      } else {
                        // 엑셀에 있지만 변경되지 않은 데이터
                        unchanged.push(`${row.option_name} (${row.option_code})`)
                      }
                    } else {
                      added.push(`${row.option_name} (${row.option_code})`)
                    }
                  })

                  // 엑셀에 없는 기존 데이터도 변경없음에 추가
                  const uploadCodesSet = new Set(excelUploadModal.data.map((row: any) => row.option_code))
                  existingData?.forEach(d => {
                    if (!uploadCodesSet.has(d.option_code)) {
                      unchanged.push(`${d.option_name} (${d.option_code})`)
                    }
                  })

                  // upsert
                  // 벤더사 이름을 ID로 변환
                  const dataToUpsert = excelUploadModal.data.map((row: any) => {
                    let shippingVendorId = row.shipping_vendor_id
                    if (shippingVendorId && typeof shippingVendorId === 'string') {
                      const vendor = vendorPartners.find(v => v.name === shippingVendorId)
                      if (vendor) {
                        shippingVendorId = vendor.id
                      }
                    }
                    return {
                      ...row,
                      shipping_vendor_id: shippingVendorId || null
                    }
                  })
                  const { error } = await supabase
                    .from('option_products')
                    .upsert(dataToUpsert, {
                      onConflict: 'id',
                      ignoreDuplicates: false
                    })
                  if (error) {
                    console.error(error)
                  } else {
                    await fetchProducts()
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
                className="w-full px-4 py-3 text-left border-2 border-blue-300 dark:border-blue-500/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
              >
                <div className="font-semibold text-blue-600 dark:text-blue-400">병합</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">기존 데이터를 유지하면서 업데이트하거나 새 데이터를 추가합니다. (빈 값도 반영됩니다)</div>
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
