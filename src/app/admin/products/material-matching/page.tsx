'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface OptionProduct {
  id: string
  option_code: string
  option_name: string
  standard_quantity: number | null
  standard_unit: string | null
  has_materials?: boolean
}

interface RawMaterial {
  id: string
  material_code: string
  material_name: string
  latest_price: number | null
  standard_quantity: number | null
  standard_unit: string | null
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  category_5: string | null
}

interface MaterialLink {
  id: string
  option_product_id: string
  raw_material_id: string
  quantity: number
  unit_price: number | null
  material_name?: string
  material_code?: string
  material_standard_quantity?: number | null
  material_standard_unit?: string | null
  percentage?: number
}

export default function MaterialMatchingPage() {
  const [optionProducts, setOptionProducts] = useState<OptionProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<OptionProduct | null>(null)
  const [linkedMaterials, setLinkedMaterials] = useState<MaterialLink[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('')
  const [varietyFilter, setVarietyFilter] = useState<string>('')

  useEffect(() => {
    fetchOptionProducts()
    fetchRawMaterials()
  }, [])

  const fetchOptionProducts = async () => {
    const { data: products, error } = await supabase
      .from('option_products')
      .select('id, option_code, option_name, standard_quantity, standard_unit')
      .order('option_code')

    if (error) {
      console.error('Error fetching option products:', error)
      return
    }

    // 각 옵션상품에 대해 원물 연결 여부 확인
    if (products) {
      const productsWithStatus = await Promise.all(
        products.map(async (p) => {
          const { data: materials } = await supabase
            .from('option_product_materials')
            .select('id')
            .eq('option_product_id', p.id)
            .limit(1)

          return {
            ...p,
            has_materials: materials && materials.length > 0
          }
        })
      )
      setOptionProducts(productsWithStatus)
    }
  }

  const fetchRawMaterials = async () => {
    const { data, error } = await supabase
      .from('raw_materials')
      .select('id, material_code, material_name, latest_price, standard_quantity, standard_unit, category_1, category_2, category_3, category_4, category_5')
      .order('material_code')

    if (error) {
      console.error('Error fetching raw materials:', error)
      return
    }

    setRawMaterials(data || [])
  }

  const fetchLinkedMaterials = async (productId: string) => {
    const { data, error } = await supabase
      .from('option_product_materials')
      .select('id, option_product_id, raw_material_id, quantity, unit_price')
      .eq('option_product_id', productId)
      .order('display_order')

    if (error) {
      console.error('Error fetching linked materials:', error)
      return
    }

    const enriched = (data || []).map((link) => {
      const material = rawMaterials.find(m => m.id === link.raw_material_id)

      return {
        ...link,
        material_name: material?.material_name || '',
        material_code: material?.material_code || '',
        material_standard_quantity: material?.standard_quantity || null,
        material_standard_unit: material?.standard_unit || null,
        percentage: 0
      }
    })

    setLinkedMaterials(enriched)
  }

  const handleProductSelect = (product: OptionProduct) => {
    setSelectedProduct(product)
    fetchLinkedMaterials(product.id)
  }

  const handleAddMaterial = async (materialId: string) => {
    if (!selectedProduct) return

    const material = rawMaterials.find(m => m.id === materialId)
    if (!material) return

    const { data, error } = await supabase
      .from('option_product_materials')
      .insert([{
        option_product_id: selectedProduct.id,
        raw_material_id: materialId,
        quantity: 0,
        unit_price: material.latest_price
      }])
      .select()

    if (error) {
      console.error('Error adding material:', error)
      alert('원물 추가 중 오류가 발생했습니다.')
      return
    }

    setShowMaterialSelector(false)
    await fetchLinkedMaterials(selectedProduct.id)
    await fetchOptionProducts() // 매칭 상태 업데이트
    autoDistributePercentages()
  }

  const handleDeleteMaterial = async (linkId: string) => {
    if (!confirm('이 원물 연결을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('option_product_materials')
      .delete()
      .eq('id', linkId)

    if (error) {
      console.error('Error deleting material link:', error)
      alert('삭제 중 오류가 발생했습니다.')
      return
    }

    if (selectedProduct) {
      await fetchLinkedMaterials(selectedProduct.id)
      await fetchOptionProducts() // 매칭 상태 업데이트
    }
  }

  const handleSaveLinks = async () => {
    for (const link of linkedMaterials) {
      const roundedQuantity = Math.ceil((link.quantity || 0) * 10) / 10

      const { error } = await supabase
        .from('option_product_materials')
        .update({
          quantity: roundedQuantity,
          unit_price: link.unit_price
        })
        .eq('id', link.id)

      if (error) {
        console.error('Error updating link:', error)
        alert('저장 중 오류가 발생했습니다.')
        return
      }
    }

    alert('저장되었습니다.')
    if (selectedProduct) {
      fetchLinkedMaterials(selectedProduct.id)
    }
  }

  // 퍼센트 기준 자동 균등 배분
  const autoDistributePercentages = () => {
    if (!selectedProduct || linkedMaterials.length === 0) return

    const perMaterial = 100 / linkedMaterials.length
    const standardQty = selectedProduct.standard_quantity || 0

    const updated = linkedMaterials.map(link => ({
      ...link,
      percentage: perMaterial,
      quantity: Math.ceil((standardQty * perMaterial / 100) * 10) / 10
    }))

    setLinkedMaterials(updated)
  }

  // 볼륨바로 퍼센트 조절 (합계 100% 유지)
  const handlePercentageChange = (linkId: string, newPercentage: number) => {
    if (linkedMaterials.length < 2 || !selectedProduct) return

    const standardQty = selectedProduct.standard_quantity || 0
    const targetLink = linkedMaterials.find(l => l.id === linkId)
    if (!targetLink) return

    const oldPercentage = targetLink.percentage || 0
    const delta = newPercentage - oldPercentage

    // 다른 원물들에게 비율대로 분배
    const otherLinks = linkedMaterials.filter(l => l.id !== linkId)
    const totalOtherPercentage = otherLinks.reduce((sum, l) => sum + (l.percentage || 0), 0)

    const updated = linkedMaterials.map(link => {
      if (link.id === linkId) {
        const qty = Math.ceil((standardQty * newPercentage / 100) * 10) / 10
        return { ...link, percentage: newPercentage, quantity: qty }
      } else {
        // 다른 원물들은 비율대로 감소
        const ratio = totalOtherPercentage > 0 ? (link.percentage || 0) / totalOtherPercentage : 1 / otherLinks.length
        const adjustedPercentage = Math.max(0, (link.percentage || 0) - (delta * ratio))
        const qty = Math.ceil((standardQty * adjustedPercentage / 100) * 10) / 10
        return { ...link, percentage: adjustedPercentage, quantity: qty }
      }
    })

    setLinkedMaterials(updated)
  }

  // 필터링된 원물
  const filteredMaterials = rawMaterials.filter(m =>
    m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.material_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 품목/품종 필터 옵션
  const itemTypes = Array.from(new Set(rawMaterials.map(m => m.category_4).filter(Boolean)))
  const varieties = useMemo(() => {
    if (itemTypeFilter) {
      return Array.from(new Set(
        rawMaterials
          .filter(m => m.category_4 === itemTypeFilter)
          .map(m => m.category_5)
          .filter(Boolean)
      ))
    }
    return Array.from(new Set(rawMaterials.map(m => m.category_5).filter(Boolean)))
  }, [rawMaterials, itemTypeFilter])

  // 필터링된 옵션상품 목록
  const filteredProducts = useMemo(() => {
    return optionProducts.filter(p => {
      // 원물 정보는 아직 없으므로 일단 모두 표시
      return true
    })
  }, [optionProducts, itemTypeFilter, varietyFilter])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">원물매칭</h1>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '35% 65%' }}>
        {/* 좌측: 옵션상품 리스트 */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
          <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">옵션상품</h2>

              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-600 dark:text-gray-400 whitespace-nowrap">품목</span>
                <select
                  value={itemTypeFilter}
                  onChange={(e) => {
                    setItemTypeFilter(e.target.value)
                    setVarietyFilter('')
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-[13px]"
                >
                  <option value="">전체</option>
                  {itemTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <span className="text-[13px] text-gray-600 dark:text-gray-400 whitespace-nowrap">품종</span>
                <select
                  value={varietyFilter}
                  onChange={(e) => setVarietyFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-[13px]"
                >
                  <option value="">전체</option>
                  {varieties.map(variety => (
                    <option key={variety} value={variety}>{variety}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '100px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '50px' }} />
              </colgroup>
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium text-left" style={{ fontSize: '14px', padding: '20px 12px' }}>옵션코드</th>
                  <th className="border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium text-left" style={{ fontSize: '14px', padding: '20px 12px' }}>상품명</th>
                  <th className="border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium text-right" style={{ fontSize: '14px', padding: '20px 12px' }}>표준수량</th>
                  <th className="border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium text-center" style={{ fontSize: '14px', padding: '20px 12px' }}>매칭</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedProduct?.id === product.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                  >
                    <td className="border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: '14px', padding: '18px 12px' }}>{product.option_code}</td>
                    <td className="border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: '14px', padding: '18px 12px' }}>{product.option_name}</td>
                    <td className="border-b border-gray-200 dark:border-gray-700 text-right text-gray-900 dark:text-gray-100" style={{ fontSize: '14px', padding: '18px 12px' }}>
                      {product.standard_quantity || '-'} {product.standard_unit || ''}
                    </td>
                    <td className="border-b border-gray-200 dark:border-gray-700 text-center" style={{ fontSize: '14px', padding: '18px 12px' }}>
                      {product.has_materials ? (
                        <span className="text-[#10b981] dark:text-[#34d399] font-medium">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 우측: 연결된 원물 */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
          <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {selectedProduct ? selectedProduct.option_name : '연결된 원물'}
                </h2>
                {selectedProduct && (
                  <span className="text-[13px] text-gray-600 dark:text-gray-400">
                    표준수량 {selectedProduct.standard_quantity || 0}{selectedProduct.standard_unit || ''}
                  </span>
                )}
              </div>
              {selectedProduct && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMaterialSelector(!showMaterialSelector)}
                    className="px-3 py-1.5 text-[13px] bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    원물 추가
                  </button>
                  {linkedMaterials.length > 0 && (
                    <button
                      onClick={handleSaveLinks}
                      className="px-3 py-1.5 text-[13px] bg-[#10b981] text-white rounded hover:bg-[#059669] transition-colors"
                    >
                      저장
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {!selectedProduct ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <span className="text-[13px]">좌측에서 옵션상품을 선택하세요</span>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* 원물 선택 모달 */}
              {showMaterialSelector && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="mb-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="원물명 또는 원물코드 검색"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-[13px]"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-[13px]">
                      <thead className="bg-gray-100 dark:bg-gray-600 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">원물코드</th>
                          <th className="px-3 py-2 text-left border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">원물명</th>
                          <th className="px-3 py-2 text-center border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">표준수량</th>
                          <th className="px-3 py-2 text-center border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">선택</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaterials.map((material) => (
                          <tr key={material.id} className="hover:bg-gray-200 dark:hover:bg-gray-600">
                            <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">{material.material_code}</td>
                            <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">{material.material_name}</td>
                            <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-center text-gray-900 dark:text-gray-100">
                              {material.standard_quantity || '-'} {material.standard_unit || ''}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-center">
                              <button
                                onClick={() => handleAddMaterial(material.id)}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                추가
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 연결된 원물 테이블 */}
              {linkedMaterials.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-gray-500 dark:text-gray-400">
                  연결된 원물이 없습니다
                </div>
              ) : (
                <>
                  <div className="mb-3 flex justify-end">
                    <button
                      onClick={autoDistributePercentages}
                      className="px-3 py-1.5 text-[13px] bg-[#10b981] text-white rounded hover:bg-[#059669] transition-colors"
                    >
                      자동 균등배분
                    </button>
                  </div>

                  <div className="space-y-2">
                    {linkedMaterials.map((link, index) => {
                      const requiredPerOne = link.quantity || 0
                      const percentage = link.percentage || 0

                      return (
                        <div key={link.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800">
                          <div className="flex items-center gap-3">
                            {/* 원물명 | 원물코드 | 표준 */}
                            <div className="text-[13px] text-gray-900 dark:text-gray-100 flex-shrink-0" style={{ width: '350px' }}>
                              {link.material_name} <span className="mx-2">|</span> {link.material_code} <span className="mx-2">|</span> 표준 {link.material_standard_quantity || '-'}{link.material_standard_unit || ''}
                            </div>

                            {/* 필요량 */}
                            <div className="text-[13px] flex-shrink-0" style={{ width: '120px' }}>
                              <span className="text-gray-600 dark:text-gray-400">필요량 </span>
                              <span className="font-medium text-[#10b981] dark:text-[#34d399]">
                                {requiredPerOne.toFixed(1)} {link.material_standard_unit || ''}
                              </span>
                            </div>

                            {/* 볼륨바 */}
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.1"
                                value={percentage}
                                onChange={(e) => handlePercentageChange(link.id, parseFloat(e.target.value))}
                                className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                              <span className="text-[13px] font-medium text-blue-600 dark:text-blue-400 w-12 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>

                            {/* 구분선 */}
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => handleDeleteMaterial(link.id)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-[13px] flex-shrink-0"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 요약 정보 */}
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-3 space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-600 dark:text-gray-400">총 사용 원물:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{linkedMaterials.length}개</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-600 dark:text-gray-400">총 비율:</span>
                      <span className={`font-medium ${
                        Math.abs(linkedMaterials.reduce((sum, l) => sum + (l.percentage || 0), 0) - 100) < 0.1
                          ? 'text-[#10b981] dark:text-[#34d399]'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {linkedMaterials.reduce((sum, l) => sum + (l.percentage || 0), 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
