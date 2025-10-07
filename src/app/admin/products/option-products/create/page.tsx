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
  const [selectedCategory1, setSelectedCategory1] = useState('')
  const [selectedCategory2, setSelectedCategory2] = useState('')
  const [selectedCategory3, setSelectedCategory3] = useState('')
  const [selectedItemType, setSelectedItemType] = useState('')
  const [selectedVariety, setSelectedVariety] = useState('')
  const [subdivisionUnit, setSubdivisionUnit] = useState('')
  const [baseCode, setBaseCode] = useState('')
  const [materialName, setMaterialName] = useState('')
  const [materialCount, setMaterialCount] = useState('1')
  const [standardQuantity, setStandardQuantity] = useState('')
  const [standardUnit, setStandardUnit] = useState('')
  const [baseOptionName, setBaseOptionName] = useState('')
  const [optionsPerMaterial, setOptionsPerMaterial] = useState('1')
  const [usageAmount, setUsageAmount] = useState('')
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])
  const [materialPlans, setMaterialPlans] = useState<{[key: string]: any}>({})
  const [generatedMaterials, setGeneratedMaterials] = useState<any[]>([])
  const [generatedOptions, setGeneratedOptions] = useState<any[]>([])
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
    // 카테고리는 단순 입력용, 필터링 없음
    setFilteredMaterials([])
    setMaterialPlans({})
  }, [])

  const handleGenerate = () => {
    const matCount = parseInt(materialCount) || 1
    const optCount = parseInt(optionsPerMaterial) || 1
    const usageAmounts = usageAmount.split(',').map(v => v.trim()).filter(Boolean)

    // 원물 생성
    const materials: any[] = []
    const unitFirstChar = standardUnit ? standardUnit.charAt(0) : ''
    const generatedCode = `${baseCode}${standardQuantity}${unitFirstChar}`

    for (let i = 0; i < matCount; i++) {
      materials.push({
        id: `mat-${Date.now()}-${i}`,
        code: generatedCode,
        name: `${materialName}${standardQuantity}${standardUnit}`,
        materialName,
        standardQuantity,
        standardUnit,
        spec1: `${standardQuantity}${standardUnit}`,
        spec2: '',
        spec3: ''
      })
    }

    // 옵션 생성
    const options: any[] = []
    const standardQty = parseFloat(standardQuantity) || 1
    materials.forEach((material) => {
      for (let i = 0; i < optCount; i++) {
        const usageValue = usageAmounts[i] || ''
        options.push({
          id: `opt-${Date.now()}-${material.id}-${i}`,
          materialId: material.id,
          code: '',
          name: `${baseOptionName}${usageValue}${standardUnit}`,
          baseOptionName,
          usageAmount: usageValue,
          spec1: `${usageValue}${standardUnit}`,
          spec1Value: parseFloat(usageValue) || 0,
          spec2: '',
          spec3: ''
        })
      }
    })

    setGeneratedMaterials(materials)
    setGeneratedOptions(options)
  }

  // 범위 문자열 파싱 및 계산 함수
  const parseAndCalculateRange = (rangeStr: string, ratio: number) => {
    if (!rangeStr) return ''

    // 괄호 제거
    let cleaned = rangeStr.replace(/[()]/g, '').trim()

    // ~로 분리
    const parts = cleaned.split('~').map(p => p.trim())
    if (parts.length !== 2) return ''

    // 첫 번째 값에서 숫자 추출
    const firstMatch = parts[0].match(/(\d+(\.\d+)?)/)
    if (!firstMatch) return ''
    const firstNum = parseFloat(firstMatch[1])

    // 두 번째 값에서 숫자 추출
    const secondMatch = parts[1].match(/(\d+(\.\d+)?)/)
    if (!secondMatch) return ''
    const secondNum = parseFloat(secondMatch[1])

    // 단위 추출 (두 번째 값에서)
    const unitMatch = parts[1].match(/[^\d.~]+$/)
    const unit = unitMatch ? unitMatch[0].trim() : ''

    // 계산 (반올림하여 정수로)
    const calcFirst = Math.round(firstNum * ratio)
    const calcSecond = Math.round(secondNum * ratio)

    // 원본 형식 유지
    const hasParentheses = rangeStr.trim().startsWith('(')
    const hasUnitInFirst = /[^\d.~]+/.test(parts[0].replace(/^\d+(\.\d+)?/, ''))

    let result = ''
    if (hasParentheses) {
      if (hasUnitInFirst) {
        result = `(${calcFirst}${unit}~${calcSecond}${unit})`
      } else {
        result = `(${calcFirst}~${calcSecond}${unit})`
      }
    } else {
      if (hasUnitInFirst) {
        result = `${calcFirst}${unit}~${calcSecond}${unit}`
      } else {
        result = `${calcFirst}~${calcSecond}${unit}`
      }
    }

    return result
  }

  // 원물 규격 변경 시 옵션 규격 자동 계산
  const updateMaterialSpec = (materialId: string, field: string, value: string) => {
    const updated = generatedMaterials.map(m =>
      m.id === materialId ? { ...m, [field]: value } : m
    )
    setGeneratedMaterials(updated)

    // 해당 원물의 옵션들 자동 계산
    const material = updated.find(m => m.id === materialId)
    if (material) {
      const updatedOptions = generatedOptions.map(opt => {
        if (opt.materialId === materialId) {
          if (field === 'spec1') {
            // 원물 규격1 변경 시, 옵션 규격2, 규격3 재계산
            const materialSpec1Match = value.match(/(\d+(\.\d+)?)/)
            const materialSpec1Value = materialSpec1Match ? parseFloat(materialSpec1Match[1]) : 0
            const optionSpec1Value = opt.spec1Value || 0

            let newSpec2 = material.spec2
            let newSpec3 = ''

            if (materialSpec1Value !== 0 && material.spec3) {
              const ratio = optionSpec1Value / materialSpec1Value
              newSpec3 = parseAndCalculateRange(material.spec3, ratio)
            }

            return { ...opt, spec2: newSpec2, spec3: newSpec3 }
          } else if (field === 'spec2') {
            // 원물 규격2 변경 시 - 그대로 상속
            return { ...opt, spec2: value }
          } else if (field === 'spec3') {
            // 원물 규격3 변경 시
            const materialSpec1Match = material.spec1.match(/(\d+(\.\d+)?)/)
            const materialSpec1Value = materialSpec1Match ? parseFloat(materialSpec1Match[1]) : 0
            const optionSpec1Value = opt.spec1Value || 0

            let newSpec3 = ''
            if (materialSpec1Value !== 0 && value) {
              const ratio = optionSpec1Value / materialSpec1Value
              console.log('Calculating spec3:', { value, materialSpec1Value, optionSpec1Value, ratio })
              newSpec3 = parseAndCalculateRange(value, ratio)
              console.log('Result spec3:', newSpec3)
            }

            return { ...opt, spec3: newSpec3 }
          }
        }
        return opt
      })
      setGeneratedOptions(updatedOptions)
    }
  }

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

  // 카테고리별 고유값 추출
  const uniqueCategory1 = [...new Set(rawMaterials.map(m => m.category_1).filter(Boolean))]

  const uniqueCategory2 = selectedCategory1
    ? [...new Set(rawMaterials.filter(m => m.category_1 === selectedCategory1).map(m => m.category_2).filter(Boolean))]
    : [...new Set(rawMaterials.map(m => m.category_2).filter(Boolean))]

  const uniqueCategory3 = [...new Set(rawMaterials.filter(m => {
    let match = true
    if (selectedCategory1 && m.category_1 !== selectedCategory1) match = false
    if (selectedCategory2 && m.category_2 !== selectedCategory2) match = false
    return match
  }).map(m => m.category_3).filter(Boolean))]

  const uniqueItems = [...new Set(rawMaterials.filter(m => {
    let match = true
    if (selectedCategory1 && m.category_1 !== selectedCategory1) match = false
    if (selectedCategory2 && m.category_2 !== selectedCategory2) match = false
    if (selectedCategory3 && m.category_3 !== selectedCategory3) match = false
    return match
  }).map(m => m.category_4).filter(Boolean))]

  const filteredVarieties = [...new Set(rawMaterials.filter(m => {
    let match = true
    if (selectedCategory1 && m.category_1 !== selectedCategory1) match = false
    if (selectedCategory2 && m.category_2 !== selectedCategory2) match = false
    if (selectedCategory3 && m.category_3 !== selectedCategory3) match = false
    if (selectedItemType && m.category_4 !== selectedItemType) match = false
    return match
  }).map(m => m.category_5).filter(Boolean))]

  return (
    <PageLayout
      title="옵션상품 생성"
      showBack
      actions={<>
        <Button variant="outline" size="xs" onClick={() => router.back()}>취소</Button>
        <Button size="xs" onClick={handleSave}>저장</Button>
      </>}
    >
      <div className="flex gap-4">
        {/* Main Content - Left Side */}
        <div className="flex-1 space-y-4">
          {/* 카테고리 입력 */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>1. 카테고리 입력</h2>

            <div className="flex items-center gap-3">
              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-700 mb-1">대분류</label>
                <input
                  type="text"
                  value={selectedCategory1}
                  onChange={(e) => setSelectedCategory1(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-700 mb-1">중분류</label>
                <input
                  type="text"
                  value={selectedCategory2}
                  onChange={(e) => setSelectedCategory2(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-700 mb-1">소분류</label>
                <input
                  type="text"
                  value={selectedCategory3}
                  onChange={(e) => setSelectedCategory3(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-700 mb-1">품목</label>
                <input
                  type="text"
                  value={selectedItemType}
                  onChange={(e) => setSelectedItemType(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-700 mb-1">품종</label>
                <input
                  type="text"
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-700 mb-1">기본코드</label>
                <input
                  type="text"
                  value={baseCode}
                  onChange={(e) => setBaseCode(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-center"
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-700 mb-1">원물명</label>
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-center"
                />
              </div>

              <div className="w-12">
                <label className="block text-xs font-semibold text-gray-700 mb-1">표준량</label>
                <input
                  type="number"
                  step="0.1"
                  value={standardQuantity}
                  onChange={(e) => setStandardQuantity(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-700 mb-1">표준단위</label>
                <input
                  type="text"
                  value={standardUnit}
                  onChange={(e) => setStandardUnit(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-center"
                />
              </div>

              <div className="w-12">
                <label className="block text-xs font-semibold text-gray-700 mb-1">원물수</label>
                <input
                  type="number"
                  value={materialCount}
                  onChange={(e) => setMaterialCount(e.target.value)}
                  placeholder="1"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-700 mb-1">기본옵션명</label>
                <input
                  type="text"
                  value={baseOptionName}
                  onChange={(e) => setBaseOptionName(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-center"
                />
              </div>

              <div className="w-12">
                <label className="block text-xs font-semibold text-gray-700 mb-1">옵션수</label>
                <input
                  type="number"
                  value={optionsPerMaterial}
                  onChange={(e) => setOptionsPerMaterial(e.target.value)}
                  placeholder="1"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-700 mb-1">사용량(콤마로 구분)</label>
                <input
                  type="text"
                  value={usageAmount}
                  onChange={(e) => setUsageAmount(e.target.value)}
                  placeholder="입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">&nbsp;</label>
                <Button size="xs" onClick={handleGenerate}>생성</Button>
              </div>
            </div>
          </div>

          {/* 생성된 다이어그램 */}
          {generatedMaterials.length > 0 && (
            <div className="space-y-4 mt-12">
              <div className="flex gap-8">
                {/* 원물 컬럼 */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 mb-2">
                    <div style={{ width: '120px' }} className="text-xs font-semibold text-gray-700 text-center">원물코드</div>
                    <div style={{ width: '120px' }} className="text-xs font-semibold text-gray-700 text-center">원물</div>
                    <div style={{ width: '80px' }} className="text-xs font-semibold text-gray-700 text-center">규격1</div>
                    <div style={{ width: '80px' }} className="text-xs font-semibold text-gray-700 text-center">규격2</div>
                    <div style={{ width: '80px' }} className="text-xs font-semibold text-gray-700 text-center">규격3</div>
                  </div>
                  {generatedMaterials.map((material, idx) => {
                    const materialOptions = generatedOptions.filter(opt => opt.materialId === material.id)
                    return (
                      <div key={material.id} className="relative" style={{ height: `${materialOptions.length * 36}px` }}>
                        <div className="absolute top-1/2 -translate-y-1/2 flex gap-2">
                          <input
                            type="text"
                            value={material.code}
                            onChange={(e) => {
                              const updated = generatedMaterials.map(m =>
                                m.id === material.id ? { ...m, code: e.target.value } : m
                              )
                              setGeneratedMaterials(updated)
                            }}
                            style={{ width: '120px' }}
                            placeholder="코드"
                            className="border border-gray-300 bg-white rounded px-1 py-1 text-xs text-center"
                          />
                          <input
                            type="text"
                            value={material.name}
                            onChange={(e) => {
                              const updated = generatedMaterials.map(m =>
                                m.id === material.id ? { ...m, name: e.target.value } : m
                              )
                              setGeneratedMaterials(updated)
                            }}
                            style={{ width: '120px' }}
                            className="border-2 border-blue-400 bg-blue-50 rounded px-1 py-1 text-xs text-center font-semibold"
                          />
                          <input
                            type="text"
                            value={material.spec1}
                            onChange={(e) => updateMaterialSpec(material.id, 'spec1', e.target.value)}
                            style={{ width: '80px' }}
                            className="border border-gray-300 bg-white rounded px-1 py-1 text-xs text-center"
                          />
                          <input
                            type="text"
                            value={material.spec2}
                            onChange={(e) => updateMaterialSpec(material.id, 'spec2', e.target.value)}
                            style={{ width: '80px' }}
                            className="border border-gray-300 bg-white rounded px-1 py-1 text-xs text-center"
                          />
                          <input
                            type="text"
                            value={material.spec3}
                            onChange={(e) => updateMaterialSpec(material.id, 'spec3', e.target.value)}
                            style={{ width: '80px' }}
                            className="border border-gray-300 bg-white rounded px-1 py-1 text-xs text-center"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 연결선과 옵션 컬럼 */}
                <div className="relative flex gap-4" style={{ flex: 1 }}>
                  <svg className="absolute left-0 pointer-events-none" style={{ width: '100px', height: '100%' }}>
                    {generatedMaterials.map((material, matIdx) => {
                      const materialOptions = generatedOptions.filter(opt => opt.materialId === material.id)
                      const prevOptionsCount = generatedMaterials
                        .slice(0, matIdx)
                        .reduce((sum, m) => sum + generatedOptions.filter(opt => opt.materialId === m.id).length, 0)

                      const materialY = prevOptionsCount * 36 + (materialOptions.length * 36) / 2 + 32

                      return materialOptions.map((option, optIdx) => {
                        const optionY = (prevOptionsCount + optIdx) * 36 + 18 + 32
                        return (
                          <line
                            key={option.id}
                            x1="0"
                            y1={materialY}
                            x2="100"
                            y2={optionY}
                            stroke="#93c5fd"
                            strokeWidth="2"
                          />
                        )
                      })
                    })}
                  </svg>

                  <div className="flex flex-col gap-2" style={{ marginLeft: '100px' }}>
                    <div className="flex gap-2 mb-2">
                      <div style={{ width: '120px' }} className="text-xs font-semibold text-gray-700 text-center">옵션코드</div>
                      <div style={{ width: '120px' }} className="text-xs font-semibold text-gray-700 text-center">옵션</div>
                      <div style={{ width: '80px' }} className="text-xs font-semibold text-gray-700 text-center">규격1</div>
                      <div style={{ width: '80px' }} className="text-xs font-semibold text-gray-700 text-center">규격2</div>
                      <div style={{ width: '80px' }} className="text-xs font-semibold text-gray-700 text-center">규격3</div>
                    </div>
                    {generatedMaterials.map((material) => {
                      const materialOptions = generatedOptions.filter(opt => opt.materialId === material.id)
                      return materialOptions.map((option) => (
                        <div key={option.id} className="flex gap-2">
                          <input
                            type="text"
                            value={option.code}
                            onChange={(e) => {
                              const updated = generatedOptions.map(o =>
                                o.id === option.id ? { ...o, code: e.target.value } : o
                              )
                              setGeneratedOptions(updated)
                            }}
                            style={{ width: '120px' }}
                            placeholder="코드"
                            className="border border-gray-300 bg-white rounded px-1 py-1 text-xs text-center"
                          />
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => {
                              const updated = generatedOptions.map(o =>
                                o.id === option.id ? { ...o, name: e.target.value } : o
                              )
                              setGeneratedOptions(updated)
                            }}
                            style={{ width: '120px' }}
                            className="border border-gray-300 bg-white rounded px-1 py-1 text-xs text-center"
                          />
                          <input
                            type="text"
                            value={option.spec1}
                            readOnly
                            style={{ width: '80px' }}
                            className="border border-gray-300 bg-gray-50 rounded px-1 py-1 text-xs text-center cursor-not-allowed"
                          />
                          <input
                            type="text"
                            value={option.spec2}
                            readOnly
                            style={{ width: '80px' }}
                            className="border border-gray-300 bg-gray-50 rounded px-1 py-1 text-xs text-center cursor-not-allowed"
                          />
                          <input
                            type="text"
                            value={option.spec3}
                            readOnly
                            style={{ width: '80px' }}
                            className="border border-gray-300 bg-gray-50 rounded px-1 py-1 text-xs text-center cursor-not-allowed"
                          />
                        </div>
                      ))
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 헤더 행 */}
          <div className="grid gap-2 px-2" style={{ gridTemplateColumns: '200px 150px 100px 100px 100px 200px 120px' }}>
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
                {(selectedCategory1 || selectedCategory2 || selectedCategory3 || selectedItemType || selectedVariety) ? '해당하는 원물이 없습니다' : '카테고리를 선택하세요'}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[280px] space-y-3">
          {/* 가격 정책 설정 */}
          <div className="p-3 pr-1.5 bg-primary-100 rounded-lg border border-blue-200 dark:border-blue-800">
            <h2 className="text-xs font-semibold mb-3 text-blue-900">가격 정책 설정</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">원물가 정책</label>
                <select
                  value={commonCosts.material_cost_policy}
                  onChange={(e) => setCommonCosts({ ...commonCosts, material_cost_policy: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs"
                  style={{ width: '100px' }}
                >
                  <option value="auto">자동</option>
                  <option value="fixed">고정</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">셀러공급가</label>
                <select
                  value={commonCosts.seller_supply_price_mode}
                  onChange={(e) => setCommonCosts({ ...commonCosts, seller_supply_price_mode: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs"
                  style={{ width: '100px' }}
                >
                  <option value="자동">자동</option>
                  <option value="수동">수동</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">네이버</label>
                <select
                  value={commonCosts.naver_price_mode}
                  onChange={(e) => setCommonCosts({ ...commonCosts, naver_price_mode: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs"
                  style={{ width: '100px' }}
                >
                  <option value="자동">자동</option>
                  <option value="수동">수동</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">쿠팡</label>
                <select
                  value={commonCosts.coupang_price_mode}
                  onChange={(e) => setCommonCosts({ ...commonCosts, coupang_price_mode: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs"
                  style={{ width: '100px' }}
                >
                  <option value="자동">자동</option>
                  <option value="수동">수동</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">셀러 마진율</label>
                <input
                  type="number"
                  value={commonCosts.seller_margin_rate}
                  onChange={(e) => setCommonCosts({ ...commonCosts, seller_margin_rate: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                  placeholder="%"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">목표 마진율</label>
                <input
                  type="number"
                  value={commonCosts.target_margin_rate}
                  onChange={(e) => setCommonCosts({ ...commonCosts, target_margin_rate: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                  placeholder="%"
                />
              </div>
            </div>
          </div>

          {/* 공통 비용 설정 */}
          <div className="p-3 pr-1.5 bg-background-secondary rounded-lg border border-border">
            <h2 className="text-xs font-semibold mb-3 text-gray-900">공통 비용 설정</h2>

            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">인건비</label>
                <input
                  type="number"
                  value={commonCosts.labor_cost}
                  onChange={(e) => setCommonCosts({ ...commonCosts, labor_cost: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">택배비</label>
                <input
                  type="number"
                  value={commonCosts.shipping_fee}
                  onChange={(e) => setCommonCosts({ ...commonCosts, shipping_fee: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">기타비용</label>
                <input
                  type="number"
                  value={commonCosts.misc_cost}
                  onChange={(e) => setCommonCosts({ ...commonCosts, misc_cost: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">박스비</label>
                <input
                  type="number"
                  value={commonCosts.packaging_box_price}
                  onChange={(e) => setCommonCosts({ ...commonCosts, packaging_box_price: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">팩</label>
                <input
                  type="number"
                  value={commonCosts.pack_price}
                  onChange={(e) => setCommonCosts({ ...commonCosts, pack_price: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">봉지/비닐</label>
                <input
                  type="number"
                  value={commonCosts.bag_vinyl_price}
                  onChange={(e) => setCommonCosts({ ...commonCosts, bag_vinyl_price: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">완충재</label>
                <input
                  type="number"
                  value={commonCosts.cushioning_price}
                  onChange={(e) => setCommonCosts({ ...commonCosts, cushioning_price: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">스티커</label>
                <input
                  type="number"
                  value={commonCosts.sticker_price}
                  onChange={(e) => setCommonCosts({ ...commonCosts, sticker_price: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">아이스팩</label>
                <input
                  type="number"
                  value={commonCosts.ice_pack_price}
                  onChange={(e) => setCommonCosts({ ...commonCosts, ice_pack_price: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">기타자재</label>
                <input
                  type="number"
                  value={commonCosts.other_material_price}
                  onChange={(e) => setCommonCosts({ ...commonCosts, other_material_price: e.target.value })}
                  className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: '100px' }}
                />
              </div>
            </div>

            {/* 거래처 및 출고 정보 */}
            <div className="mb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">원물거래처</label>
                  <select
                    value={commonCosts.supplier_id}
                    onChange={(e) => setCommonCosts({ ...commonCosts, supplier_id: e.target.value })}
                    className="border border-gray-300 rounded px-1 py-1 text-xs" style={{ width: '100px' }}
                  >
                    <option value="">선택</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">출고처</label>
                  <select
                    value={commonCosts.shipping_vendor_id}
                    onChange={(e) => setCommonCosts({ ...commonCosts, shipping_vendor_id: e.target.value })}
                    className="border border-gray-300 rounded px-1 py-1 text-xs" style={{ width: '100px' }}
                  >
                    <option value="">선택</option>
                    {shippingVendors.map(sv => (
                      <option key={sv.id} value={sv.id}>{sv.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">송장주체</label>
                  <select
                    value={commonCosts.invoice_entity}
                    onChange={(e) => setCommonCosts({ ...commonCosts, invoice_entity: e.target.value })}
                    className="border border-gray-300 rounded px-1 py-1 text-xs" style={{ width: '100px' }}
                  >
                    <option value="">선택</option>
                    {invoiceEntities.map(ie => (
                      <option key={ie.id} value={ie.name}>{ie.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">벤더사</label>
                  <select
                    value={commonCosts.vendor_id}
                    onChange={(e) => setCommonCosts({ ...commonCosts, vendor_id: e.target.value })}
                    className="border border-gray-300 rounded px-1 py-1 text-xs" style={{ width: '100px' }}
                  >
                    <option value="">선택</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 기타 */}
            <div className="mb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">택배비부가수량</label>
                  <input
                    type="number"
                    value={commonCosts.shipping_additional_quantity}
                    onChange={(e) => setCommonCosts({ ...commonCosts, shipping_additional_quantity: e.target.value })}
                    className="border border-gray-300 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ width: '100px' }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">상태</label>
                  <select
                    value={commonCosts.status}
                    onChange={(e) => setCommonCosts({ ...commonCosts, status: e.target.value })}
                    className="border border-gray-300 rounded px-1 py-1 text-xs" style={{ width: '100px' }}
                  >
                    <option value="">선택</option>
                    {supplyStatuses.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 옵션 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">옵션</label>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">셀러공급Y/N</label>
                  <button
                    onClick={() => setCommonCosts({ ...commonCosts, is_seller_supply: !commonCosts.is_seller_supply })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      commonCosts.is_seller_supply
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {commonCosts.is_seller_supply ? 'Y' : 'N'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">베스트Y/N</label>
                  <button
                    onClick={() => setCommonCosts({ ...commonCosts, is_best: !commonCosts.is_best })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      commonCosts.is_best
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {commonCosts.is_best ? 'Y' : 'N'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">추천상품Y/N</label>
                  <button
                    onClick={() => setCommonCosts({ ...commonCosts, is_recommended: !commonCosts.is_recommended })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      commonCosts.is_recommended
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {commonCosts.is_recommended ? 'Y' : 'N'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">상세페이지제공</label>
                  <button
                    onClick={() => setCommonCosts({ ...commonCosts, has_detail_page: !commonCosts.has_detail_page })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      commonCosts.has_detail_page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {commonCosts.has_detail_page ? 'Y' : 'N'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">이미지제공</label>
                  <button
                    onClick={() => setCommonCosts({ ...commonCosts, has_images: !commonCosts.has_images })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      commonCosts.has_images
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {commonCosts.has_images ? 'Y' : 'N'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
