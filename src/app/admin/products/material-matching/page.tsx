'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui'

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
  const { showToast } = useToast()

  const [optionProducts, setOptionProducts] = useState<OptionProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<OptionProduct | null>(null)
  const [linkedMaterials, setLinkedMaterials] = useState<MaterialLink[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)

  const [itemTypeFilter, setItemTypeFilter] = useState<string>('')
  const [varietyFilter, setVarietyFilter] = useState<string>('')
  const [allMaterialLinks, setAllMaterialLinks] = useState<Record<string, MaterialLink[]>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (rawMaterials.length > 0) {
      fetchAllMaterialLinks()
    }
  }, [rawMaterials])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchOptionProducts(),
        fetchRawMaterials()
      ])
    } catch (error) {
      showToast('데이터 로딩 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchOptionProducts = async () => {
    const { data: products, error } = await supabase
      .from('option_products')
      .select('id, option_code, option_name, standard_quantity, standard_unit')
      .order('option_code')

    if (error) {
      console.error('Error fetching option products:', error)
      return
    }

    const { data: allLinks } = await supabase
      .from('option_product_materials')
      .select('option_product_id')

    const linkedProductIds = new Set(allLinks?.map(link => link.option_product_id) || [])

    const productsWithStatus = (products || []).map(p => ({
      ...p,
      has_materials: linkedProductIds.has(p.id)
    }))

    setOptionProducts(productsWithStatus)
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

  const fetchAllMaterialLinks = async () => {
    const { data, error } = await supabase
      .from('option_product_materials')
      .select('id, option_product_id, raw_material_id, quantity, unit_price')

    if (error) {
      console.error('Error fetching all material links:', error)
      return
    }

    const grouped: Record<string, MaterialLink[]> = {}
    data?.forEach((link) => {
      if (!grouped[link.option_product_id]) {
        grouped[link.option_product_id] = []
      }

      const material = rawMaterials.find(m => m.id === link.raw_material_id)
      grouped[link.option_product_id].push({
        ...link,
        material_name: material?.material_name || '',
        material_code: material?.material_code || '',
        material_standard_quantity: material?.standard_quantity || null,
        material_standard_unit: material?.standard_unit || null,
        percentage: 0
      })
    })

    setAllMaterialLinks(grouped)
  }

  const fetchLinkedMaterials = async (productId: string) => {
    const { data, error } = await supabase
      .from('option_product_materials')
      .select('id, option_product_id, raw_material_id, quantity, unit_price')
      .eq('option_product_id', productId)

    if (error) {
      console.error('Error fetching linked materials:', error)
      return
    }

    const product = optionProducts.find(p => p.id === productId)
    const standardQty = product?.standard_quantity || 0

    const enriched = (data || []).map((link) => {
      const material = rawMaterials.find(m => m.id === link.raw_material_id)
      const percentage = standardQty > 0 ? (link.quantity / standardQty) * 100 : 0

      return {
        ...link,
        material_name: material?.material_name || '',
        material_code: material?.material_code || '',
        material_standard_quantity: material?.standard_quantity || null,
        material_standard_unit: material?.standard_unit || null,
        percentage: Math.round(percentage * 10) / 10
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

    const alreadyLinked = linkedMaterials.some(link => link.raw_material_id === materialId)
    if (alreadyLinked) {
      showToast('이미 추가된 원물입니다.', 'warning')
      return
    }

    const material = rawMaterials.find(m => m.id === materialId)
    if (!material) return

    try {
      // 1. 원물 링크 추가
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
        showToast('원물 추가 중 오류가 발생했습니다.', 'error')
        return
      }

      // 2. 옵션상품에 원물의 카테고리 자동 복사
      const { error: updateError } = await supabase
        .from('option_products')
        .update({
          category_1: material.category_1,
          category_2: material.category_2,
          category_3: material.category_3,
          category_4: material.category_4,
          category_5: material.category_5
        })
        .eq('id', selectedProduct.id)

      if (updateError) {
        console.error('Error updating categories:', updateError)
        // 카테고리 업데이트 실패해도 원물 추가는 성공으로 처리
        showToast('원물이 추가되었으나 카테고리 업데이트에 실패했습니다.', 'warning')
      } else {
        showToast('원물이 추가되고 카테고리가 자동 설정되었습니다.', 'success')
      }

      setShowMaterialSelector(false)
      setSearchTerm('')
      await fetchLinkedMaterials(selectedProduct.id)
      await fetchOptionProducts()
    } catch (error) {
      console.error('Error in handleAddMaterial:', error)
      showToast('처리 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleDeleteMaterial = async (linkId: string) => {
    const { error } = await supabase
      .from('option_product_materials')
      .delete()
      .eq('id', linkId)

    if (error) {
      console.error('Error deleting material link:', error)
      showToast('삭제 중 오류가 발생했습니다.', 'error')
      return
    }

    showToast('원물이 삭제되었습니다.', 'success')
    if (selectedProduct) {
      await fetchLinkedMaterials(selectedProduct.id)
      await fetchOptionProducts()
    }
  }

  const handleSaveLinks = async () => {
    setSaving(true)
    try {
      const updates = linkedMaterials.map(link => ({
        id: link.id,
        quantity: Math.ceil((link.quantity || 0) * 10) / 10,
        unit_price: link.unit_price
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('option_product_materials')
          .update({
            quantity: update.quantity,
            unit_price: update.unit_price
          })
          .eq('id', update.id)

        if (error) throw error
      }

      showToast('저장되었습니다.', 'success')
      if (selectedProduct) {
        await fetchLinkedMaterials(selectedProduct.id)
      }
    } catch (error) {
      console.error('Error saving:', error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const autoDistributePercentages = () => {
    if (!selectedProduct || linkedMaterials.length === 0) return

    const perMaterial = 100 / linkedMaterials.length
    const standardQty = selectedProduct.standard_quantity || 0

    const updated = linkedMaterials.map(link => ({
      ...link,
      percentage: Math.round(perMaterial * 10) / 10,
      quantity: Math.ceil((standardQty * perMaterial / 100) * 10) / 10
    }))

    setLinkedMaterials(updated)
    showToast('균등 배분되었습니다.', 'success')
  }

  const handlePercentageChange = (linkId: string, newPercentage: number) => {
    if (linkedMaterials.length < 2 || !selectedProduct) return

    const standardQty = selectedProduct.standard_quantity || 0
    const targetLink = linkedMaterials.find(l => l.id === linkId)
    if (!targetLink) return

    const oldPercentage = targetLink.percentage || 0
    const delta = newPercentage - oldPercentage

    const otherLinks = linkedMaterials.filter(l => l.id !== linkId)
    const totalOtherPercentage = otherLinks.reduce((sum, l) => sum + (l.percentage || 0), 0)

    const updated = linkedMaterials.map(link => {
      if (link.id === linkId) {
        const qty = Math.ceil((standardQty * newPercentage / 100) * 10) / 10
        return { ...link, percentage: newPercentage, quantity: qty }
      } else {
        const ratio = totalOtherPercentage > 0 ? (link.percentage || 0) / totalOtherPercentage : 1 / otherLinks.length
        const adjustedPercentage = Math.max(0, (link.percentage || 0) - (delta * ratio))
        const qty = Math.ceil((standardQty * adjustedPercentage / 100) * 10) / 10
        return { ...link, percentage: adjustedPercentage, quantity: qty }
      }
    })

    setLinkedMaterials(updated)
  }

  const filteredProducts = useMemo(() => {
    let filtered = optionProducts

    if (productSearchTerm) {
      filtered = filtered.filter(p =>
        p.option_name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        p.option_code.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
    }

    if (itemTypeFilter || varietyFilter) {
      filtered = filtered.filter(p => {
        const links = allMaterialLinks[p.id]
        if (!links || links.length === 0) return false

        return links.some(link => {
          const material = rawMaterials.find(m => m.id === link.raw_material_id)
          if (!material) return false

          const matchesItemType = !itemTypeFilter || material.category_4 === itemTypeFilter
          const matchesVariety = !varietyFilter || material.category_5 === varietyFilter

          return matchesItemType && matchesVariety
        })
      })
    }

    return filtered
  }, [optionProducts, productSearchTerm, itemTypeFilter, varietyFilter, allMaterialLinks, rawMaterials])

  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter(m => {
      const matchesSearch = m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.material_code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesItemType = !itemTypeFilter || m.category_4 === itemTypeFilter
      const matchesVariety = !varietyFilter || m.category_5 === varietyFilter

      return matchesSearch && matchesItemType && matchesVariety
    })
  }, [rawMaterials, searchTerm, itemTypeFilter, varietyFilter])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-[14px] text-text-secondary">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const totalPercentage = linkedMaterials.reduce((sum, l) => sum + (l.percentage || 0), 0)
  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.1

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-[20px] font-bold text-text">원물매칭</h1>
      </div>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 옵션상품 목록 */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-[16px] font-semibold text-text">옵션상품</h2>

            {/* 검색창 */}
            <input
              type="text"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              placeholder="옵션명 또는 옵션코드 검색"
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-text text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* 필터 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] text-text-secondary whitespace-nowrap">품목</span>
              <select
                value={itemTypeFilter}
                onChange={(e) => {
                  setItemTypeFilter(e.target.value)
                  setVarietyFilter('')
                }}
                className="border border-border rounded-lg px-3 py-1.5 bg-surface text-text text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">전체</option>
                {itemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <span className="text-[14px] text-text-secondary whitespace-nowrap">품종</span>
              <select
                value={varietyFilter}
                onChange={(e) => setVarietyFilter(e.target.value)}
                className="border border-border rounded-lg px-3 py-1.5 bg-surface text-text text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">전체</option>
                {varieties.map(variety => (
                  <option key={variety} value={variety}>{variety}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 옵션상품 테이블 */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-[14px]">
                <thead className="bg-background-secondary sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-text">옵션코드</th>
                    <th className="px-3 py-2 text-left font-semibold text-text">상품명</th>
                    <th className="px-3 py-2 text-right font-semibold text-text">표준수량</th>
                    <th className="px-3 py-2 text-center font-semibold text-text">매칭</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-[14px] text-text-tertiary">
                        옵션상품이 없습니다
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'bg-primary/10'
                            : 'hover:bg-surface-hover'
                        }`}
                      >
                        <td className="px-3 py-2 text-text">{product.option_code}</td>
                        <td className="px-3 py-2 text-text truncate max-w-xs" title={product.option_name}>
                          {product.option_name}
                        </td>
                        <td className="px-3 py-2 text-right text-text">
                          {product.standard_quantity || '-'} {product.standard_unit || ''}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {product.has_materials ? (
                            <span className="text-green-600 font-medium text-[16px]">✓</span>
                          ) : (
                            <span className="text-gray-400 text-[14px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 우측: 연결된 원물 */}
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-[16px] font-semibold text-text">
                {selectedProduct ? selectedProduct.option_name : '연결된 원물'}
              </h2>
              {selectedProduct && (
                <span className="text-[14px] text-text-secondary">
                  표준수량: {selectedProduct.standard_quantity || 0}{selectedProduct.standard_unit || ''}
                </span>
              )}
            </div>
            {selectedProduct && (
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={() => setShowMaterialSelector(true)}
                  className="px-4 py-2 text-[14px] bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  + 원물 추가
                </Button>
                <Button
                  onClick={handleSaveLinks}
                  disabled={saving || !isPercentageValid}
                  className="px-4 py-2 text-[14px] bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            )}
          </div>

          {!selectedProduct ? (
            <div className="p-12 text-center bg-surface border border-border rounded-lg">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-[14px] text-text-secondary">좌측에서 옵션상품을 선택하세요</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
              {linkedMaterials.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[14px] text-text-tertiary mb-4">연결된 원물이 없습니다</p>
                  <Button
                    onClick={() => setShowMaterialSelector(true)}
                    className="px-4 py-2 text-[14px] bg-primary text-white rounded-lg hover:bg-primary-hover"
                  >
                    원물 추가하기
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-medium text-text">
                      총 {linkedMaterials.length}개 원물
                    </span>
                    <Button
                      onClick={autoDistributePercentages}
                      className="px-3 py-1.5 text-[14px] bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      자동 균등배분
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {linkedMaterials.map((link) => {
                      const requiredPerOne = link.quantity || 0
                      const percentage = link.percentage || 0

                      return (
                        <div
                          key={link.id}
                          className="border border-border rounded-lg p-3 bg-background space-y-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-[14px] text-text truncate" title={link.material_name}>
                                {link.material_name}
                              </div>
                              <div className="text-[12px] text-text-secondary mt-0.5">
                                {link.material_code} | 표준 {link.material_standard_quantity || '-'}{link.material_standard_unit || ''}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteMaterial(link.id)}
                              className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                              title="삭제"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.1"
                                value={percentage}
                                onChange={(e) => handlePercentageChange(link.id, parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                            </div>
                            <div className="flex items-center gap-3 text-[14px] flex-shrink-0">
                              <span className="font-semibold text-primary w-14 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                              <span className="text-text-secondary">→</span>
                              <span className="font-medium text-green-600 w-20 text-right">
                                {requiredPerOne.toFixed(1)} {link.material_standard_unit || ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 요약 정보 */}
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between text-[14px]">
                      <span className="text-text-secondary">총 비율:</span>
                      <span className={`font-semibold ${
                        isPercentageValid ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {totalPercentage.toFixed(1)}%
                      </span>
                    </div>
                    {!isPercentageValid && (
                      <p className="text-[12px] text-orange-600">
                        ⚠️ 총 비율이 100%가 되어야 저장할 수 있습니다.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 원물 선택 모달 */}
      {showMaterialSelector && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMaterialSelector(false)
              setSearchTerm('')
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            {/* 모달 헤더 */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
              <h3 className="text-[16px] font-semibold text-text">원물 선택</h3>
              <button
                onClick={() => {
                  setShowMaterialSelector(false)
                  setSearchTerm('')
                }}
                className="text-text-tertiary hover:text-text transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 검색창 */}
            <div className="p-4 border-b border-border bg-surface">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="원물명 또는 원물코드 검색"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-text text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>

            {/* 테이블 */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
              <table className="w-full text-[14px]">
                <thead className="bg-background-secondary sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-text">원물코드</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">원물명</th>
                    <th className="px-4 py-3 text-center font-semibold text-text">표준수량</th>
                    <th className="px-4 py-3 text-center font-semibold text-text w-24">선택</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-[14px] text-text-tertiary">
                        검색 결과가 없습니다
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((material) => (
                      <tr key={material.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-text">{material.material_code}</td>
                        <td className="px-4 py-3 text-text">{material.material_name}</td>
                        <td className="px-4 py-3 text-center text-text">
                          {material.standard_quantity || '-'} {material.standard_unit || ''}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleAddMaterial(material.id)}
                            className="px-4 py-1.5 text-[14px] bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                          >
                            추가
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 모달 푸터 */}
            <div className="p-4 border-t border-border bg-surface flex justify-end">
              <button
                onClick={() => {
                  setShowMaterialSelector(false)
                  setSearchTerm('')
                }}
                className="px-4 py-2 text-[14px] border border-border rounded-lg hover:bg-surface-hover text-text transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
