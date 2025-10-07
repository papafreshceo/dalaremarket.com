// app/admin/products/option-products/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { PageLayout } from '@/components/layouts'

export default function CreateOptionProductPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    option_name: '',
    item_type: '',
    variety: '',
    weight: '',
    weight_unit: 'kg',
    packaging_box_price: '0',
    cushioning_price: '0',
    labor_cost: '1000',
    shipping_fee: '3000',
    status: '',
    vendor_id: ''
  })

  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [shippingVendors, setShippingVendors] = useState<any[]>([])
  const [invoiceEntities, setInvoiceEntities] = useState<any[]>([])
  const [supplyStatuses, setSupplyStatuses] = useState<any[]>([])
  const [selectedItemType, setSelectedItemType] = useState('')
  const [selectedVariety, setSelectedVariety] = useState('')
  const [subdivisionUnit, setSubdivisionUnit] = useState('')
  const [selectionType, setSelectionType] = useState<'item' | 'variety'>('item')
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])
  const [materialPlans, setMaterialPlans] = useState<{[key: string]: any}>({})
  const [commonCosts, setCommonCosts] = useState({
    // 자재비
    packaging_box_price: '0',
    pack_price: '0',
    bag_vinyl_price: '0',
    cushioning_price: '0',
    sticker_price: '0',
    ice_pack_price: '0',
    other_material_price: '0',
    labor_cost: '1000',
    // 거래처 및 출고 정보
    supplier_id: '',
    shipping_vendor_id: '',
    invoice_entity: '',
    vendor_id: '',
    shipping_location_name: '',
    shipping_location_address: '',
    shipping_location_contact: '',
    shipping_deadline: '',
    // 택배비 및 부가
    shipping_fee: '3000',
    shipping_additional_quantity: '0',
    misc_cost: '0',
    // 셀러공급
    is_seller_supply: false,
    // 상태
    status: '',
    // 썸네일 및 설명
    thumbnail_url: '',
    description: '',
    notes: '',
    // Y/N 옵션
    is_best: false,
    is_recommended: false,
    has_detail_page: false,
    has_images: false,
    // 가격 정책
    material_cost_policy: 'auto',
    seller_supply_price_mode: '자동',
    naver_price_mode: '자동',
    coupang_price_mode: '자동',
    // 마진율
    seller_margin_rate: '10',
    target_margin_rate: '20'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: materials } = await supabase.from('raw_materials').select('*').eq('is_active', true)
    const { data: vendorData } = await supabase.from('partners').select('*').eq('partner_category', 'eq', '벤더사').eq('is_active', true)
    const { data: supplierData } = await supabase.from('partners').select('*').eq('partner_category', 'eq', '공급자').eq('is_active', true)
    const { data: shippingVendorData } = await supabase.from('shipping_vendors').select('*').eq('is_active', true).order('display_order')
    const { data: invoiceEntityData } = await supabase.from('invoice_entities').select('*').eq('is_active', true).order('display_order')
    const { data: statuses } = await supabase
      .from('supply_status_settings')
      .select('*')
      .eq('status_type', 'optional_product')
      .eq('is_active', true)
      .order('display_order')

    // 각 원물의 최신 시세 가져오기
    if (materials) {
      const materialsWithPrice = await Promise.all(
        materials.map(async (material) => {
          const { data: priceHistory } = await supabase
            .from('material_price_history')
            .select('price')
            .eq('material_id', material.id)
            .order('effective_date', { ascending: false })
            .limit(1)
            .maybeSingle()

          return {
            ...material,
            latest_price: priceHistory?.price || material.latest_price || 0
          }
        })
      )
      setRawMaterials(materialsWithPrice)
    }
    if (vendorData) setVendors(vendorData)
    if (supplierData) setSuppliers(supplierData)
    if (shippingVendorData) setShippingVendors(shippingVendorData)
    if (invoiceEntityData) setInvoiceEntities(invoiceEntityData)
    if (statuses) setSupplyStatuses(statuses)
  }

  useEffect(() => {
    if (selectedItemType || selectedVariety) {
      const filtered = rawMaterials.filter(m => {
        if (selectionType === 'item') {
          return selectedVariety
            ? (m.category_4 === selectedItemType && m.category_5 === selectedVariety)
            : m.category_4 === selectedItemType
        } else {
          return m.category_5 === selectedVariety
        }
      })
      setFilteredMaterials(filtered)

      const plans: {[key: string]: any} = {}
      filtered.forEach(material => {
        const subdivisionQty = subdivisionUnit ? parseFloat(subdivisionUnit) : material.standard_quantity
        const baseOptionName = material.category_4 + ' ' + subdivisionQty + material.standard_unit

        plans[material.id] = {
          base_name: baseOptionName,
          spec1: '',
          spec2: '',
          spec3: '',
          option_name: baseOptionName,
          item_type: material.category_4 || '',
          variety: material.category_5 || '',
          weight: subdivisionQty.toString(),
          weight_unit: material.standard_unit,
          ...commonCosts
        }
      })
      setMaterialPlans(plans)
    } else {
      setFilteredMaterials([])
      setMaterialPlans({})
    }
  }, [selectedItemType, selectedVariety, selectionType, subdivisionUnit, rawMaterials, commonCosts])

  const handleSave = async () => {
    try {
      const plansToSave = Object.entries(materialPlans).filter(([materialId, plan]) => plan.option_name)

      if (plansToSave.length === 0) {
        alert('저장할 옵션상품이 없습니다.')
        return
      }

      for (const [materialId, plan] of plansToSave) {
        const material = filteredMaterials.find(m => m.id === materialId)
        if (!material) continue

        const subdivisionQty = subdivisionUnit ? parseFloat(subdivisionUnit) : material.standard_quantity
        const rawMaterialCost = subdivisionQty
          ? ((subdivisionQty / material.standard_quantity) * material.latest_price)
          : 0

        // 총 원가 계산
        const totalCost = rawMaterialCost +
          Number(plan.packaging_box_price) +
          Number(plan.cushioning_price) +
          Number(plan.labor_cost)

        // 자동 가격 계산
        const sellerMarginRate = Number(commonCosts.seller_margin_rate) || 10
        const targetMarginRate = Number(commonCosts.target_margin_rate) || 20
        const sellerAutoPrice = Math.round(totalCost / (1 - sellerMarginRate / 100))
        const naverPaidAuto = Math.round(totalCost / (1 - targetMarginRate / 100))
        const naverFreeAuto = Math.round((totalCost + Number(plan.shipping_fee)) / (1 - targetMarginRate / 100))

        const productData = {
          ...plan,
          option_code: `OPT${Date.now()}_${materialId}`,
          weight: plan.weight ? Number(plan.weight) : null,
          packaging_box_price: Number(plan.packaging_box_price),
          cushioning_price: Number(plan.cushioning_price),
          labor_cost: Number(plan.labor_cost),
          shipping_fee: Number(plan.shipping_fee),
          // 원가
          raw_material_cost: rawMaterialCost,
          total_cost: totalCost,
          // 가격 정책
          material_cost_policy: commonCosts.material_cost_policy,
          fixed_material_cost: commonCosts.material_cost_policy === 'fixed' ? rawMaterialCost : 0,
          // 마진율
          seller_margin_rate: sellerMarginRate,
          target_margin_rate: targetMarginRate,
          // 셀러공급가
          seller_supply_price_mode: commonCosts.seller_supply_price_mode,
          seller_supply_auto_price: sellerAutoPrice,
          seller_supply_price: sellerAutoPrice,
          // 네이버 가격
          naver_price_mode: commonCosts.naver_price_mode,
          naver_paid_shipping_auto: naverPaidAuto,
          naver_free_shipping_auto: naverFreeAuto,
          naver_paid_shipping_price: naverPaidAuto,
          naver_free_shipping_price: naverFreeAuto,
          // 쿠팡 가격
          coupang_price_mode: commonCosts.coupang_price_mode,
          coupang_paid_shipping_auto: naverPaidAuto,
          coupang_free_shipping_auto: naverFreeAuto,
          coupang_paid_shipping_price: naverPaidAuto,
          coupang_free_shipping_price: naverFreeAuto
        }

        const { data: newProduct, error: productError } = await supabase
          .from('option_products')
          .insert([productData])
          .select()
          .single()

        if (productError) throw productError

        if (newProduct) {
          await supabase.from('option_product_materials').insert([{
            option_product_id: newProduct.id,
            raw_material_id: materialId,
            quantity: subdivisionQty,
            unit_price: material.latest_price
          }])
        }
      }

      alert('저장되었습니다.')
      router.push('/admin/products/option-products')
    } catch (e) {
      console.error(e)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const uniqueItems = [...new Set(rawMaterials.map(m => m.category_4).filter(Boolean))]
  const filteredVarieties = selectedItemType
    ? [...new Set(rawMaterials.filter(m => m.category_4 === selectedItemType).map(m => m.category_5).filter(Boolean))]
    : [...new Set(rawMaterials.map(m => m.category_5).filter(Boolean))]

  return (
    <PageLayout
      title="옵션상품 생성"
      showBack
      actions={<>
        <Button variant="outline" size="xs" onClick={() => router.back()}>취소</Button>
        <Button size="xs" onClick={handleSave}>저장</Button>
      </>}
    >
      {/* 가격 정책 설정 */}
      <div className="mb-4 p-4 bg-primary-100 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#1d4ed8' }}>💰 가격 정책 설정</h2>
        <div className="grid grid-cols-6 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">원물가 정책</label>
            <select
              value={commonCosts.material_cost_policy}
              onChange={(e) => setCommonCosts({ ...commonCosts, material_cost_policy: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="auto">자동 (최신시세 반영)</option>
              <option value="fixed">고정 (시세 무시)</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">
              {commonCosts.material_cost_policy === 'auto'
                ? '시세 변경 시 반영 가능'
                : '시세가 변경되어도 고정가 유지'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">셀러공급가</label>
            <select
              value={commonCosts.seller_supply_price_mode}
              onChange={(e) => setCommonCosts({ ...commonCosts, seller_supply_price_mode: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="자동">자동</option>
              <option value="수동">수동</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">네이버</label>
            <select
              value={commonCosts.naver_price_mode}
              onChange={(e) => setCommonCosts({ ...commonCosts, naver_price_mode: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="자동">자동</option>
              <option value="수동">수동</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">쿠팡</label>
            <select
              value={commonCosts.coupang_price_mode}
              onChange={(e) => setCommonCosts({ ...commonCosts, coupang_price_mode: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="자동">자동</option>
              <option value="수동">수동</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">셀러 마진율 (%)</label>
            <input
              type="number"
              value={commonCosts.seller_margin_rate}
              onChange={(e) => setCommonCosts({ ...commonCosts, seller_margin_rate: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">목표 마진율 (%)</label>
            <input
              type="number"
              value={commonCosts.target_margin_rate}
              onChange={(e) => setCommonCosts({ ...commonCosts, target_margin_rate: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-background-secondary rounded-lg border border-border">
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#1d4ed8' }}>공통 비용 설정</h2>

        {/* 자재비 */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-2">자재비</label>
          <div className="grid grid-cols-7 gap-3">
            <div>
              <label className="block text-xs text-gray-700 mb-1">박스비</label>
              <input
                type="number"
                value={commonCosts.packaging_box_price}
                onChange={(e) => setCommonCosts({ ...commonCosts, packaging_box_price: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">팩</label>
              <input
                type="number"
                value={commonCosts.pack_price}
                onChange={(e) => setCommonCosts({ ...commonCosts, pack_price: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">봉지/비닐</label>
              <input
                type="number"
                value={commonCosts.bag_vinyl_price}
                onChange={(e) => setCommonCosts({ ...commonCosts, bag_vinyl_price: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">완충재</label>
              <input
                type="number"
                value={commonCosts.cushioning_price}
                onChange={(e) => setCommonCosts({ ...commonCosts, cushioning_price: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">스티커</label>
              <input
                type="number"
                value={commonCosts.sticker_price}
                onChange={(e) => setCommonCosts({ ...commonCosts, sticker_price: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">아이스팩</label>
              <input
                type="number"
                value={commonCosts.ice_pack_price}
                onChange={(e) => setCommonCosts({ ...commonCosts, ice_pack_price: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">기타자재</label>
              <input
                type="number"
                value={commonCosts.other_material_price}
                onChange={(e) => setCommonCosts({ ...commonCosts, other_material_price: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 거래처 및 출고 정보 */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-2">거래처 및 출고 정보</label>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-700 mb-1">원물거래처</label>
              <select
                value={commonCosts.supplier_id}
                onChange={(e) => setCommonCosts({ ...commonCosts, supplier_id: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value="">선택</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">출고처</label>
              <select
                value={commonCosts.shipping_vendor_id}
                onChange={(e) => setCommonCosts({ ...commonCosts, shipping_vendor_id: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value="">선택</option>
                {shippingVendors.map(sv => (
                  <option key={sv.id} value={sv.id}>{sv.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">송장주체</label>
              <select
                value={commonCosts.invoice_entity}
                onChange={(e) => setCommonCosts({ ...commonCosts, invoice_entity: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value="">선택</option>
                {invoiceEntities.map(ie => (
                  <option key={ie.id} value={ie.name}>{ie.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">벤더사</label>
              <select
                value={commonCosts.vendor_id}
                onChange={(e) => setCommonCosts({ ...commonCosts, vendor_id: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value="">선택</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 기타 비용 */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-2">기타</label>
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-700 mb-1">인건비</label>
              <input
                type="number"
                value={commonCosts.labor_cost}
                onChange={(e) => setCommonCosts({ ...commonCosts, labor_cost: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">택배비</label>
              <input
                type="number"
                value={commonCosts.shipping_fee}
                onChange={(e) => setCommonCosts({ ...commonCosts, shipping_fee: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">택배비부가수량</label>
              <input
                type="number"
                value={commonCosts.shipping_additional_quantity}
                onChange={(e) => setCommonCosts({ ...commonCosts, shipping_additional_quantity: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">기타비용</label>
              <input
                type="number"
                value={commonCosts.misc_cost}
                onChange={(e) => setCommonCosts({ ...commonCosts, misc_cost: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">상태</label>
              <select
                value={commonCosts.status}
                onChange={(e) => setCommonCosts({ ...commonCosts, status: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value="">선택</option>
                {supplyStatuses.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Y/N 옵션 */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">옵션</label>
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="flex items-center text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={commonCosts.is_seller_supply}
                  onChange={(e) => setCommonCosts({ ...commonCosts, is_seller_supply: e.target.checked })}
                  className="mr-2"
                />
                셀러공급Y/N
              </label>
            </div>
            <div>
              <label className="flex items-center text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={commonCosts.is_best}
                  onChange={(e) => setCommonCosts({ ...commonCosts, is_best: e.target.checked })}
                  className="mr-2"
                />
                베스트Y/N
              </label>
            </div>
            <div>
              <label className="flex items-center text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={commonCosts.is_recommended}
                  onChange={(e) => setCommonCosts({ ...commonCosts, is_recommended: e.target.checked })}
                  className="mr-2"
                />
                추천상품Y/N
              </label>
            </div>
            <div>
              <label className="flex items-center text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={commonCosts.has_detail_page}
                  onChange={(e) => setCommonCosts({ ...commonCosts, has_detail_page: e.target.checked })}
                  className="mr-2"
                />
                상세페이지제공
              </label>
            </div>
            <div>
              <label className="flex items-center text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={commonCosts.has_images}
                  onChange={(e) => setCommonCosts({ ...commonCosts, has_images: e.target.checked })}
                  className="mr-2"
                />
                이미지제공
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 품목/품종 선택 */}
      <div className="mb-4 space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>1. 품목/품종 선택</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectionType('item')
              setSelectedItemType('')
              setSelectedVariety('')
            }}
            className={`flex-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              selectionType === 'item' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            품목
          </button>
          <button
            onClick={() => {
              setSelectionType('variety')
              setSelectedItemType('')
              setSelectedVariety('')
            }}
            className={`flex-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              selectionType === 'variety' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            품종
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">품목</label>
            <select
              value={selectedItemType}
              onChange={(e) => {
                setSelectedItemType(e.target.value)
                setSelectedVariety('')
              }}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
            >
              <option value="">선택하세요</option>
              {uniqueItems.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {(selectionType === 'variety' || selectedItemType) && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">품종</label>
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
              >
                <option value="">선택하세요</option>
                {filteredVarieties.map(variety => (
                  <option key={variety} value={variety}>{variety}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 소분 단위 */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold mb-2" style={{ color: '#1d4ed8' }}>2. 소분 단위</h2>
        {(selectedItemType || selectedVariety) ? (
          <div>
            <input
              type="number"
              step="0.1"
              value={subdivisionUnit}
              onChange={(e) => setSubdivisionUnit(e.target.value)}
              placeholder="예: 1.5"
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
            />
            <div className="text-xs text-gray-500 mt-1">
              원물의 기준 단위를 상속받습니다
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 py-4">
            먼저 품목/품종을 선택하세요
          </div>
        )}
      </div>

      {/* 헤더 행 */}
      <div className="grid gap-2 mb-2 px-2" style={{ gridTemplateColumns: '200px 150px 100px 100px 100px 200px 120px' }}>
        <h2 className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>3. 원물명</h2>
        <h2 className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>4. 옵션명</h2>
        <h2 className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>5. 규격1</h2>
        <h2 className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>6. 규격2</h2>
        <h2 className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>7. 규격3</h2>
        <h2 className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>최종 옵션명</h2>
        <h2 className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>옵션가격</h2>
      </div>

      {/* 데이터 행들 */}
      <div className="space-y-2">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map(material => {
            const plan = materialPlans[material.id] || {}
            const subdivisionQty = subdivisionUnit ? parseFloat(subdivisionUnit) : material.standard_quantity
            const rawMaterialCost = subdivisionQty
              ? ((subdivisionQty / material.standard_quantity) * material.latest_price)
              : 0
            const boxPrice = parseFloat(commonCosts.packaging_box_price) || 0
            const cushionPrice = parseFloat(commonCosts.cushioning_price) || 0
            const laborCost = parseFloat(commonCosts.labor_cost) || 0
            const totalPrice = rawMaterialCost + boxPrice + cushionPrice + laborCost

            const updateSpec1 = (value: string) => {
              const updatedPlan = { ...plan, spec1: value }
              const finalName = [
                updatedPlan.base_name,
                updatedPlan.spec1,
                updatedPlan.spec2,
                updatedPlan.spec3
              ].filter(Boolean).join(' ')

              setMaterialPlans({
                ...materialPlans,
                [material.id]: { ...updatedPlan, option_name: finalName }
              })
            }

            const updateSpec2 = (value: string) => {
              const updatedPlan = { ...plan, spec2: value }
              const finalName = [
                updatedPlan.base_name,
                updatedPlan.spec1,
                updatedPlan.spec2,
                updatedPlan.spec3
              ].filter(Boolean).join(' ')

              setMaterialPlans({
                ...materialPlans,
                [material.id]: { ...updatedPlan, option_name: finalName }
              })
            }

            const updateSpec3 = (value: string) => {
              const updatedPlan = { ...plan, spec3: value }
              const finalName = [
                updatedPlan.base_name,
                updatedPlan.spec1,
                updatedPlan.spec2,
                updatedPlan.spec3
              ].filter(Boolean).join(' ')

              setMaterialPlans({
                ...materialPlans,
                [material.id]: { ...updatedPlan, option_name: finalName }
              })
            }

            return (
              <div key={material.id} className="grid gap-2 px-2" style={{ gridTemplateColumns: '200px 150px 100px 100px 100px 200px 120px' }}>
                {/* 원물명 */}
                <div className="bg-background-secondary px-2 py-1.5 rounded border border-border">
                  <div className="text-xs font-semibold">{material.material_name}</div>
                  <div className="text-xs text-gray-600">
                    {material.latest_price?.toLocaleString()}원/{material.standard_quantity}{material.standard_unit}
                  </div>
                </div>

                {/* 옵션명 (기본) */}
                <div className="bg-background-secondary px-2 py-1.5 rounded border border-border flex items-center">
                  <div className="text-xs font-semibold">{plan.base_name || ''}</div>
                </div>

                {/* 규격1 */}
                <div className="bg-background-secondary px-2 py-1.5 rounded border border-border">
                  <input
                    type="text"
                    value={plan.spec1 || ''}
                    onChange={(e) => updateSpec1(e.target.value)}
                    placeholder="규격1"
                    className="w-full bg-transparent border-none outline-none p-0 m-0 text-xs font-semibold"
                  />
                </div>

                {/* 규격2 */}
                <div className="bg-background-secondary px-2 py-1.5 rounded border border-border">
                  <input
                    type="text"
                    value={plan.spec2 || ''}
                    onChange={(e) => updateSpec2(e.target.value)}
                    placeholder="규격2"
                    className="w-full bg-transparent border-none outline-none p-0 m-0 text-xs font-semibold"
                  />
                </div>

                {/* 규격3 */}
                <div className="bg-background-secondary px-2 py-1.5 rounded border border-border">
                  <input
                    type="text"
                    value={plan.spec3 || ''}
                    onChange={(e) => updateSpec3(e.target.value)}
                    placeholder="규격3"
                    className="w-full bg-transparent border-none outline-none p-0 m-0 text-xs font-semibold"
                  />
                </div>

                {/* 최종 옵션명 */}
                <div className="bg-primary-100 px-2 py-1.5 rounded border border-blue-200 dark:border-blue-800 flex items-center">
                  <div className="text-xs font-semibold text-blue-900">{plan.option_name || ''}</div>
                </div>

                {/* 옵션가격 */}
                <div className="bg-background-secondary px-2 py-1.5 rounded border border-border flex items-center justify-end">
                  <div className="text-xs text-gray-600">
                    {totalPrice.toLocaleString()}원/{subdivisionQty}{material.standard_unit}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-xs text-gray-500 py-4 text-center">
            {(selectedItemType || selectedVariety) ? '해당하는 원물이 없습니다' : '품목/품종을 선택하세요'}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
