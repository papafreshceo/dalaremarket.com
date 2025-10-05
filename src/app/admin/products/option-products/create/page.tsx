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
  const [supplyStatuses, setSupplyStatuses] = useState<any[]>([])
  const [selectedItemType, setSelectedItemType] = useState('')
  const [selectedVariety, setSelectedVariety] = useState('')
  const [subdivisionUnit, setSubdivisionUnit] = useState('')
  const [selectionType, setSelectionType] = useState<'item' | 'variety'>('item')
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])
  const [materialPlans, setMaterialPlans] = useState<{[key: string]: any}>({})
  const [commonCosts, setCommonCosts] = useState({
    packaging_box_price: '0',
    cushioning_price: '0',
    labor_cost: '1000',
    status: '',
    vendor_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: materials } = await supabase.from('raw_materials').select('*').eq('is_active', true)
    const { data: vendorData } = await supabase.from('partners').select('*').eq('is_active', true)
    const { data: statuses } = await supabase
      .from('supply_status_settings')
      .select('*')
      .eq('status_type', 'optional_product')
      .eq('is_active', true)
      .order('display_order')

    if (materials) setRawMaterials(materials)
    if (vendorData) setVendors(vendorData)
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

        const productData = {
          ...plan,
          option_code: `OPT${Date.now()}_${materialId}`,
          weight: plan.weight ? Number(plan.weight) : null,
          packaging_box_price: Number(plan.packaging_box_price),
          cushioning_price: Number(plan.cushioning_price),
          labor_cost: Number(plan.labor_cost),
          shipping_fee: Number(plan.shipping_fee),
          raw_material_cost: rawMaterialCost
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
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#1d4ed8' }}>공통 비용 설정</h2>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">박스비</label>
            <input
              type="number"
              value={commonCosts.packaging_box_price}
              onChange={(e) => setCommonCosts({ ...commonCosts, packaging_box_price: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">완충재</label>
            <input
              type="number"
              value={commonCosts.cushioning_price}
              onChange={(e) => setCommonCosts({ ...commonCosts, cushioning_price: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">인건비</label>
            <input
              type="number"
              value={commonCosts.labor_cost}
              onChange={(e) => setCommonCosts({ ...commonCosts, labor_cost: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">상태</label>
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
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">벤더</label>
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

      <div className="grid grid-cols-9 gap-4">
        {/* Column 1: 품목/품종 선택 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>1. 품목/품종</h2>

          <div className="space-y-3">
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

        {/* Column 2: 소분 단위 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>2. 소분 단위</h2>

          {(selectedItemType || selectedVariety) ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">소분 단위</label>
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

        {/* Column 2: 원물 리스트 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>3. 원물명</h2>

          {filteredMaterials.length > 0 ? (
            <div className="space-y-1.5">
              {filteredMaterials.map(material => (
                <div key={material.id} className="bg-gray-50 px-2 py-1.5 rounded border border-gray-200 flex items-center justify-between">
                  <div className="text-xs font-semibold">{material.material_name}</div>
                  <div className="text-xs text-gray-600">
                    {material.latest_price?.toLocaleString()}원/{material.standard_quantity}{material.standard_unit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-4">
              {(selectedItemType || selectedVariety) ? '해당하는 원물이 없습니다' : '품목/품종을 선택하세요'}
            </div>
          )}
        </div>

        {/* Column 3: 옵션상품명 (기본) */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>4. 옵션상품명</h2>

          {filteredMaterials.length > 0 ? (
            <div className="space-y-1.5">
              {filteredMaterials.map(material => {
                const plan = materialPlans[material.id] || {}

                return (
                  <div key={material.id} className="bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                    <div className="text-xs font-semibold">{plan.base_name || ''}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-4">
              원물을 먼저 선택하세요
            </div>
          )}
        </div>

        {/* Column 4: 규격1 입력 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>규격1</h2>

          {filteredMaterials.length > 0 ? (
            <div className="space-y-1.5">
              {filteredMaterials.map(material => {
                const plan = materialPlans[material.id] || {}

                const updateSpec = (value: string) => {
                  const updatedPlan = { ...plan, spec1: value }
                  const finalName = [
                    updatedPlan.base_name,
                    updatedPlan.spec1
                  ].filter(Boolean).join(' ')

                  setMaterialPlans({
                    ...materialPlans,
                    [material.id]: { ...updatedPlan, option_name: finalName }
                  })
                }

                return (
                  <div key={material.id} className="bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                    <div className="text-xs font-semibold">
                      <input
                        type="text"
                        value={plan.spec1 || ''}
                        onChange={(e) => updateSpec(e.target.value)}
                        placeholder="규격 입력"
                        className="w-full bg-transparent border-none outline-none p-0 m-0"
                        style={{ font: 'inherit' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-4">
              원물을 먼저 선택하세요
            </div>
          )}
        </div>

        {/* Column 5: 규격2 입력 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>규격2</h2>

          {filteredMaterials.length > 0 ? (
            <div className="space-y-1.5">
              {filteredMaterials.map(material => {
                const plan = materialPlans[material.id] || {}

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

                return (
                  <div key={material.id} className="bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                    <div className="text-xs font-semibold">
                      <input
                        type="text"
                        value={plan.spec2 || ''}
                        onChange={(e) => updateSpec2(e.target.value)}
                        placeholder="규격2 입력"
                        className="w-full bg-transparent border-none outline-none p-0 m-0"
                        style={{ font: 'inherit' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-4">
              원물을 먼저 선택하세요
            </div>
          )}
        </div>

        {/* Column 6: 규격3 입력 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>규격3</h2>

          {filteredMaterials.length > 0 ? (
            <div className="space-y-1.5">
              {filteredMaterials.map(material => {
                const plan = materialPlans[material.id] || {}

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
                  <div key={material.id} className="bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                    <div className="text-xs font-semibold">
                      <input
                        type="text"
                        value={plan.spec3 || ''}
                        onChange={(e) => updateSpec3(e.target.value)}
                        placeholder="규격3 입력"
                        className="w-full bg-transparent border-none outline-none p-0 m-0"
                        style={{ font: 'inherit' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-4">
              원물을 먼저 선택하세요
            </div>
          )}
        </div>

        {/* Column 7: 최종 옵션명 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>최종 옵션명</h2>

          {filteredMaterials.length > 0 ? (
            <div className="space-y-1.5">
              {filteredMaterials.map(material => {
                const plan = materialPlans[material.id] || {}
                const finalName = plan.option_name || ''

                return (
                  <div key={material.id} className="bg-blue-50 px-2 py-1.5 rounded border border-blue-200">
                    <div className="text-xs font-semibold text-blue-900">{finalName}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-4">
              원물을 먼저 선택하세요
            </div>
          )}
        </div>

        {/* Column 8: 옵션가격 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>옵션가격</h2>

          {filteredMaterials.length > 0 ? (
            <div className="space-y-1.5">
              {filteredMaterials.map(material => {
                const subdivisionQty = subdivisionUnit ? parseFloat(subdivisionUnit) : material.standard_quantity
                const rawMaterialCost = subdivisionQty
                  ? ((subdivisionQty / material.standard_quantity) * material.latest_price)
                  : 0
                const boxPrice = parseFloat(commonCosts.packaging_box_price) || 0
                const cushionPrice = parseFloat(commonCosts.cushioning_price) || 0
                const laborCost = parseFloat(commonCosts.labor_cost) || 0
                const totalPrice = rawMaterialCost + boxPrice + cushionPrice + laborCost

                return (
                  <div key={material.id} className="bg-gray-50 px-2 py-1.5 rounded border border-gray-200 text-right">
                    <div className="text-xs text-gray-600">
                      {totalPrice.toLocaleString()}원/{subdivisionQty}{material.standard_unit}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-4">
              원물을 먼저 선택하세요
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
