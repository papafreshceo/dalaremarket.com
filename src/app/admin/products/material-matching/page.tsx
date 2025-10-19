'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui'
import { Search, Plus, Trash2, Save, Percent, AlertCircle, Package, X, Check, Filter } from 'lucide-react'

const supabase = createClient()

interface OptionProduct {
  id: string
  option_code: string
  option_name: string
  standard_quantity: number | null
  standard_unit: string | null
  category_1?: string | null
  category_2?: string | null
  category_3?: string | null
  category_4?: string | null
  category_5?: string | null
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

  const [category1Filter, setCategory1Filter] = useState<string>('') // 대분류
  const [category2Filter, setCategory2Filter] = useState<string>('') // 중분류
  const [category3Filter, setCategory3Filter] = useState<string>('') // 소분류
  const [category4Filter, setCategory4Filter] = useState<string>('') // 품목
  const [allMaterialLinks, setAllMaterialLinks] = useState<Record<string, MaterialLink[]>>({})
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 품목 매칭용
  const [categorySettings, setCategorySettings] = useState<Array<{category_4: string}>>([])
  const [selectedCategory4, setSelectedCategory4] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (rawMaterials.length > 0) {
      fetchAllMaterialLinks()
    }
  }, [rawMaterials])

  // 셋째자리가 1 이상이면 올림, 아니면 버림 (소숫점 둘째자리까지)
  const roundQuantity = (value: number): number => {
    const scaled = value * 1000 // 셋째자리를 정수로
    const thirdDecimal = Math.floor(scaled) % 10 // 셋째자리 추출

    if (thirdDecimal >= 1) {
      // 셋째자리가 1 이상이면 올림
      return Math.ceil(value * 100) / 100
    } else {
      // 셋째자리가 0이면 버림
      return Math.floor(value * 100) / 100
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchOptionProducts(),
        fetchRawMaterials(),
        fetchCategorySettings()
      ])
    } catch (error) {
      showToast('데이터 로딩 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorySettings = async () => {
    const { data, error } = await supabase
      .from('category_settings')
      .select('category_4')
      .eq('is_active', true)
      .eq('expense_type', '사입') // 지출유형이 '사입'인 것만
      .not('category_4', 'is', null)
      .order('category_4')

    if (error) {
      console.error('품목 목록 조회 오류:', error)
      return
    }

    // 중복 제거
    const uniqueCategories = Array.from(new Set(data.map(c => c.category_4)))
      .map(c4 => ({ category_4: c4 }))

    setCategorySettings(uniqueCategories)
  }

  const fetchOptionProducts = async () => {
    const { data: products, error } = await supabase
      .from('option_products')
      .select('id, option_code, option_name, standard_quantity, standard_unit, category_1, category_2, category_3, category_4, category_5')
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
        percentage: Math.round(percentage * 100) / 100
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
      }

      setShowMaterialSelector(false)
      setSearchTerm('')
      await fetchLinkedMaterials(selectedProduct.id)
      await fetchOptionProducts()
      await fetchAllMaterialLinks() // 배지 업데이트를 위해 추가

      // 원물 추가 후 자동 균등배분 및 저장
      setTimeout(async () => {
        // linkedMaterials가 업데이트될 때까지 대기 후 균등배분
        const { data: updatedLinks, error: fetchError } = await supabase
          .from('option_product_materials')
          .select('id, option_product_id, raw_material_id, quantity, unit_price')
          .eq('option_product_id', selectedProduct.id)

        if (fetchError || !updatedLinks) {
          console.error('Error fetching updated links:', fetchError)
          return
        }

        const standardQty = selectedProduct.standard_quantity || 0
        const perMaterial = 100 / updatedLinks.length

        // 먼저 모든 비율을 계산 (소숫점 2자리)
        const percentages: number[] = []
        for (let i = 0; i < updatedLinks.length; i++) {
          if (i === updatedLinks.length - 1) {
            // 마지막 항목: 나머지로 계산
            const currentTotal = percentages.reduce((sum, p) => sum + p, 0)
            percentages.push(Math.round((100 - currentTotal) * 100) / 100)
          } else {
            percentages.push(Math.round(perMaterial * 100) / 100)
          }
        }

        // 모든 사용량 계산 (모두 올림 처리)
        const quantities: number[] = []
        for (let i = 0; i < updatedLinks.length; i++) {
          const percentage = percentages[i]
          quantities.push(roundQuantity(standardQty * percentage / 100))
        }

        // 모든 원물에 균등배분 적용하여 DB 업데이트
        for (let i = 0; i < updatedLinks.length; i++) {
          const link = updatedLinks[i]
          const quantity = quantities[i]
          const { error: updateError } = await supabase
            .from('option_product_materials')
            .update({ quantity })
            .eq('id', link.id)

          if (updateError) {
            console.error('Error updating quantity:', updateError)
          }
        }

        // UI 업데이트
        await fetchLinkedMaterials(selectedProduct.id)
      }, 100)
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
      await fetchAllMaterialLinks() // 배지 업데이트를 위해 추가

      // 원물 삭제 후 남은 원물들에 대해 자동 균등배분
      setTimeout(async () => {
        const { data: remainingLinks, error: fetchError } = await supabase
          .from('option_product_materials')
          .select('id, option_product_id, raw_material_id, quantity, unit_price')
          .eq('option_product_id', selectedProduct.id)

        if (fetchError || !remainingLinks || remainingLinks.length === 0) {
          return
        }

        const standardQty = selectedProduct.standard_quantity || 0
        const perMaterial = 100 / remainingLinks.length

        // 먼저 모든 비율을 계산 (소숫점 2자리)
        const percentages: number[] = []
        for (let i = 0; i < remainingLinks.length; i++) {
          if (i === remainingLinks.length - 1) {
            // 마지막 항목: 나머지로 계산
            const currentTotal = percentages.reduce((sum, p) => sum + p, 0)
            percentages.push(Math.round((100 - currentTotal) * 100) / 100)
          } else {
            percentages.push(Math.round(perMaterial * 100) / 100)
          }
        }

        // 모든 사용량 계산 (모두 올림 처리)
        const quantities: number[] = []
        for (let i = 0; i < remainingLinks.length; i++) {
          const percentage = percentages[i]
          quantities.push(roundQuantity(standardQty * percentage / 100))
        }

        // 남은 원물에 균등배분 적용
        for (let i = 0; i < remainingLinks.length; i++) {
          const link = remainingLinks[i]
          const quantity = quantities[i]
          const { error: updateError } = await supabase
            .from('option_product_materials')
            .update({ quantity })
            .eq('id', link.id)

          if (updateError) {
            console.error('Error updating quantity:', updateError)
          }
        }

        // UI 업데이트
        await fetchLinkedMaterials(selectedProduct.id)
      }, 100)
    }
  }

  const handleSaveLinks = async () => {
    setSaving(true)
    try {
      const updates = linkedMaterials.map(link => ({
        id: link.id,
        quantity: roundQuantity(link.quantity || 0),
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

      // 원물 매칭 저장 후 카테고리 업데이트
      if (selectedProduct) {
        await updateProductCategory(selectedProduct.id)
        await fetchLinkedMaterials(selectedProduct.id)
      }

      showToast('저장되었습니다.', 'success')
    } catch (error) {
      console.error('Error saving:', error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 품목으로 카테고리 매칭 (원물이 없는 옵션상품용)
  const handleCategoryMatching = async () => {
    if (!selectedProduct) {
      showToast('옵션상품을 선택해주세요', 'error')
      return
    }

    const targetCategory4 = selectedCategory4 || selectedProduct.category_4

    if (!targetCategory4) {
      showToast('품목을 선택해주세요', 'error')
      return
    }

    try {
      setSaving(true)

      // category_settings에서 품목으로 조회
      const { data: categorySettings, error: fetchError } = await supabase
        .from('category_settings')
        .select('category_1, category_2, category_3, category_4, category_5')
        .eq('category_4', targetCategory4)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (fetchError || !categorySettings) {
        showToast(`품목 "${targetCategory4}"에 대한 카테고리 설정을 찾을 수 없습니다`, 'error')
        return
      }

      // 옵션상품의 카테고리 업데이트
      const { error: updateError } = await supabase
        .from('option_products')
        .update({
          category_1: categorySettings.category_1,
          category_2: categorySettings.category_2,
          category_3: categorySettings.category_3,
          category_4: categorySettings.category_4,
          category_5: categorySettings.category_5
        })
        .eq('id', selectedProduct.id)

      if (updateError) throw updateError

      showToast('품목 매칭이 완료되었습니다', 'success')

      // 옵션상품 목록 새로고침
      await fetchOptionProducts()

      // 현재 선택된 상품 정보 업데이트
      const { data: updatedProduct } = await supabase
        .from('option_products')
        .select('*')
        .eq('id', selectedProduct.id)
        .single()

      if (updatedProduct) {
        setSelectedProduct(updatedProduct)
      }

      // 선택 초기화
      setSelectedCategory4('')
    } catch (error) {
      console.error('품목 매칭 오류:', error)
      showToast('품목 매칭 중 오류가 발생했습니다', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 옵션상품의 카테고리 업데이트 (원물 매칭 또는 품목 매칭 기반)
  const updateProductCategory = async (productId: string) => {
    try {
      // 1. 원물 매칭이 있는지 확인
      const { data: materialLinks } = await supabase
        .from('option_product_materials')
        .select('raw_material_id')
        .eq('option_product_id', productId)

      if (materialLinks && materialLinks.length > 0) {
        // 원물 매칭이 있으면 첫 번째 원물의 카테고리 사용
        const { data: rawMaterial } = await supabase
          .from('raw_materials')
          .select('category_1, category_2, category_3, category_4, category_5')
          .eq('id', materialLinks[0].raw_material_id)
          .single()

        if (rawMaterial && rawMaterial.category_4) {
          await supabase
            .from('option_products')
            .update({
              category_1: rawMaterial.category_1,
              category_2: rawMaterial.category_2,
              category_3: rawMaterial.category_3,
              category_4: rawMaterial.category_4,
              category_5: rawMaterial.category_5
            })
            .eq('id', productId)
        }
      } else {
        // 원물 매칭이 없으면 옵션상품의 category_4로 category_settings에서 직접 조회
        const { data: product } = await supabase
          .from('option_products')
          .select('category_4')
          .eq('id', productId)
          .single()

        if (product?.category_4) {
          const { data: categorySettings } = await supabase
            .from('category_settings')
            .select('category_1, category_2, category_3, category_4, category_5')
            .eq('category_4', product.category_4)
            .eq('is_active', true)
            .limit(1)
            .single()

          if (categorySettings) {
            await supabase
              .from('option_products')
              .update({
                category_1: categorySettings.category_1,
                category_2: categorySettings.category_2,
                category_3: categorySettings.category_3,
                category_4: categorySettings.category_4,
                category_5: categorySettings.category_5
              })
              .eq('id', productId)
          }
        }
      }
    } catch (error) {
      console.error('카테고리 업데이트 오류:', error)
      // 에러가 나도 저장은 성공으로 처리 (카테고리 업데이트는 부가 기능)
    }
  }

  const autoDistributePercentages = () => {
    if (!selectedProduct || linkedMaterials.length === 0) return

    const perMaterial = 100 / linkedMaterials.length
    const standardQty = selectedProduct.standard_quantity || 0

    // 먼저 모든 비율을 계산 (소숫점 2자리)
    const percentages: number[] = []
    for (let i = 0; i < linkedMaterials.length; i++) {
      if (i === linkedMaterials.length - 1) {
        // 마지막 항목: 나머지로 계산
        const currentTotal = percentages.reduce((sum, p) => sum + p, 0)
        percentages.push(Math.round((100 - currentTotal) * 100) / 100)
      } else {
        percentages.push(Math.round(perMaterial * 100) / 100)
      }
    }

    // 모든 사용량 계산 (모두 올림 처리)
    const quantities: number[] = []
    for (let i = 0; i < linkedMaterials.length; i++) {
      const percentage = percentages[i]
      quantities.push(roundQuantity(standardQty * percentage / 100))
    }

    // 계산된 비율과 사용량으로 업데이트
    const updated = linkedMaterials.map((link, index) => {
      return {
        ...link,
        percentage: percentages[index],
        quantity: quantities[index]
      }
    })

    setLinkedMaterials(updated)
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
        const qty = roundQuantity(standardQty * newPercentage / 100)
        return { ...link, percentage: newPercentage, quantity: qty }
      } else {
        const ratio = totalOtherPercentage > 0 ? (link.percentage || 0) / totalOtherPercentage : 1 / otherLinks.length
        const adjustedPercentage = Math.max(0, (link.percentage || 0) - (delta * ratio))
        const qty = roundQuantity(standardQty * adjustedPercentage / 100)
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

    // 미매칭 필터
    if (showUnmatchedOnly) {
      filtered = filtered.filter(p => !p.has_materials)
    }

    // 카테고리 필터 (옵션상품의 카테고리로 필터링)
    if (category1Filter || category2Filter || category3Filter || category4Filter) {
      filtered = filtered.filter(p => {
        const matchesCategory1 = !category1Filter || p.category_1 === category1Filter
        const matchesCategory2 = !category2Filter || p.category_2 === category2Filter
        const matchesCategory3 = !category3Filter || p.category_3 === category3Filter
        const matchesCategory4 = !category4Filter || p.category_4 === category4Filter

        return matchesCategory1 && matchesCategory2 && matchesCategory3 && matchesCategory4
      })
    }

    return filtered
  }, [optionProducts, productSearchTerm, category1Filter, category2Filter, category3Filter, category4Filter, allMaterialLinks, rawMaterials, showUnmatchedOnly])

  // 유사도 계산 함수
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    // 완전 일치
    if (s1 === s2) return 100

    // 포함 여부
    if (s1.includes(s2) || s2.includes(s1)) return 80

    // 단어 단위 일치 (공백으로 분리)
    const words1 = s1.split(/[\s,()]+/).filter(Boolean)
    const words2 = s2.split(/[\s,()]+/).filter(Boolean)

    let matchCount = 0
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matchCount++
          break
        }
      }
    }

    const maxWords = Math.max(words1.length, words2.length)
    if (maxWords === 0) return 0

    return (matchCount / maxWords) * 60
  }

  const filteredMaterials = useMemo(() => {
    const filtered = rawMaterials.filter(m => {
      const matchesSearch = m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.material_code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory1 = !category1Filter || m.category_1 === category1Filter
      const matchesCategory2 = !category2Filter || m.category_2 === category2Filter
      const matchesCategory3 = !category3Filter || m.category_3 === category3Filter
      const matchesCategory4 = !category4Filter || m.category_4 === category4Filter

      return matchesSearch && matchesCategory1 && matchesCategory2 && matchesCategory3 && matchesCategory4
    })

    // 선택된 옵션상품이 있으면 유사도로 정렬
    if (selectedProduct) {
      return filtered.map(material => {
        // 기본 유사도 계산
        let similarity = calculateSimilarity(selectedProduct.option_name, material.material_name)

        // 이미 연결된 원물이면 +20점 보너스
        const isLinked = linkedMaterials.some(link => link.raw_material_id === material.id)
        if (isLinked) {
          similarity += 20
        }

        return { ...material, similarity }
      }).sort((a, b) => b.similarity - a.similarity) // 유사도 높은 순으로 정렬
    }

    return filtered
  }, [rawMaterials, searchTerm, category1Filter, category2Filter, category3Filter, category4Filter, selectedProduct, linkedMaterials])

  // 대분류 목록 (옵션상품에서 가져옴)
  const category1Options = Array.from(new Set(optionProducts.map(p => p.category_1).filter(Boolean)))

  // 중분류 목록 (대분류 선택 시 필터링)
  const category2Options = useMemo(() => {
    if (category1Filter) {
      return Array.from(new Set(
        optionProducts
          .filter(p => p.category_1 === category1Filter)
          .map(p => p.category_2)
          .filter(Boolean)
      ))
    }
    return Array.from(new Set(optionProducts.map(p => p.category_2).filter(Boolean)))
  }, [optionProducts, category1Filter])

  // 소분류 목록 (중분류 선택 시 필터링)
  const category3Options = useMemo(() => {
    if (category2Filter) {
      return Array.from(new Set(
        optionProducts
          .filter(p => (!category1Filter || p.category_1 === category1Filter) && p.category_2 === category2Filter)
          .map(p => p.category_3)
          .filter(Boolean)
      ))
    }
    return Array.from(new Set(optionProducts.map(p => p.category_3).filter(Boolean)))
  }, [optionProducts, category1Filter, category2Filter])

  // 품목 목록 (소분류 선택 시 필터링)
  const category4Options = useMemo(() => {
    if (category3Filter) {
      return Array.from(new Set(
        optionProducts
          .filter(p =>
            (!category1Filter || p.category_1 === category1Filter) &&
            (!category2Filter || p.category_2 === category2Filter) &&
            p.category_3 === category3Filter
          )
          .map(p => p.category_4)
          .filter(Boolean)
      ))
    }
    return Array.from(new Set(optionProducts.map(p => p.category_4).filter(Boolean)))
  }, [optionProducts, category1Filter, category2Filter, category3Filter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const totalPercentage = linkedMaterials.reduce((sum, l) => sum + (l.percentage || 0), 0)
  const isPercentageValid = totalPercentage >= 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">원물 매칭</h1>
              <p className="text-sm text-gray-500 mt-1">
                옵션상품과 원물을 연결하고 배합비를 설정하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* 좌측: 옵션상품 목록 (6) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* 검색 및 필터 섹션 */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">옵션상품 목록</h2>
                  <span className="ml-auto text-sm text-gray-500">{filteredProducts.length}개</span>
                </div>

                {/* 검색창 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="옵션명 또는 옵션코드 검색..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* 미매칭 필터 버튼 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUnmatchedOnly(!showUnmatchedOnly)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showUnmatchedOnly
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    미매칭만 보기
                    {showUnmatchedOnly && <X className="w-3 h-3" />}
                  </button>
                </div>

                {/* 필터 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600 font-medium w-full">카테고리 필터:</span>
                    <select
                      value={category1Filter}
                      onChange={(e) => {
                        setCategory1Filter(e.target.value)
                        setCategory2Filter('')
                        setCategory3Filter('')
                        setCategory4Filter('')
                      }}
                      className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">대분류 전체</option>
                      {category1Options.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <select
                      value={category2Filter}
                      onChange={(e) => {
                        setCategory2Filter(e.target.value)
                        setCategory3Filter('')
                        setCategory4Filter('')
                      }}
                      className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!category1Filter && category2Options.length === 0}
                    >
                      <option value="">중분류 전체</option>
                      {category2Options.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={category3Filter}
                      onChange={(e) => {
                        setCategory3Filter(e.target.value)
                        setCategory4Filter('')
                      }}
                      className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!category2Filter && category3Options.length === 0}
                    >
                      <option value="">소분류 전체</option>
                      {category3Options.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <select
                      value={category4Filter}
                      onChange={(e) => setCategory4Filter(e.target.value)}
                      className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!category3Filter && category4Options.length === 0}
                    >
                      <option value="">품목 전체</option>
                      {category4Options.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 옵션상품 리스트 */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">옵션상품이 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const productMaterials = allMaterialLinks[product.id] || []

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          className={`p-4 cursor-pointer transition-all duration-200 ${
                            selectedProduct?.id === product.id
                              ? 'bg-blue-50 border-l-4 border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* 왼쪽 그룹: 옵션코드 + 체크/배지 + 옵션명 + 표준수량 */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                                {product.option_code}
                              </span>
                              {product.has_materials ? (
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" title="원물 매칭됨" />
                              ) : product.category_4 ? (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex-shrink-0 font-medium" title="품목 매칭됨">
                                  품목
                                </span>
                              ) : null}
                              <h3 className="font-medium text-gray-900 text-[16px]" title={product.option_name}>
                                {product.option_name}
                              </h3>
                              <span className="text-xs text-gray-600 flex-shrink-0">
                                {product.standard_quantity || 0}{product.standard_unit || ''}
                              </span>
                            </div>
                            {/* 오른쪽: 원물명 배지 또는 품목명 */}
                            {productMaterials.length > 0 ? (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {productMaterials.slice(0, 2).map((link, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"
                                    title={link.material_name}
                                  >
                                    {link.material_name && link.material_name.length > 8
                                      ? link.material_name.slice(0, 8) + '...'
                                      : link.material_name}
                                  </span>
                                ))}
                                {productMaterials.length > 2 && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                    +{productMaterials.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : product.category_4 ? (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium" title="품목명">
                                  {product.category_4}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 연결된 원물 (4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* 헤더 */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {selectedProduct ? selectedProduct.option_name : '연결된 원물'}
                    </h2>
                    {selectedProduct && (
                      <p className="text-sm text-gray-600 mt-1">
                        표준수량: {selectedProduct.standard_quantity || 0}{selectedProduct.standard_unit || ''}
                      </p>
                    )}
                  </div>
                  {selectedProduct && linkedMaterials.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={autoDistributePercentages}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Percent className="w-4 h-4" />
                        균등배분
                      </button>
                      <button
                        onClick={handleSaveLinks}
                        disabled={saving || !isPercentageValid}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 컨텐츠 */}
              <div className="p-4">
                {!selectedProduct ? (
                  <div className="py-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">좌측에서 옵션상품을 선택하세요</p>
                    <p className="text-sm text-gray-500">원물 연결 및 배합비 설정이 가능합니다</p>
                  </div>
                ) : linkedMaterials.length === 0 ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">연결된 원물이 없습니다</p>
                    <div className="text-xs bg-gray-100 p-3 rounded mb-4 max-w-md mx-auto">
                      <div className="grid grid-cols-2 gap-2 text-left">
                        <span className="text-gray-500">품목(category_4):</span>
                        <span className="font-medium">{selectedProduct?.category_4 || '(없음)'}</span>
                        <span className="text-gray-500">대분류:</span>
                        <span>{selectedProduct?.category_1 || '-'}</span>
                        <span className="text-gray-500">중분류:</span>
                        <span>{selectedProduct?.category_2 || '-'}</span>
                        <span className="text-gray-500">소분류:</span>
                        <span>{selectedProduct?.category_3 || '-'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => setShowMaterialSelector(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        원물 추가하기
                      </button>
                      <div className="text-sm text-gray-500">또는</div>

                      {/* 품목 선택 드롭다운 */}
                      <div className="w-full max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          품목 선택 {selectedProduct?.category_4 && (
                            <span className="text-xs text-gray-500">(현재: {selectedProduct.category_4})</span>
                          )}
                        </label>
                        <select
                          value={selectedCategory4}
                          onChange={(e) => setSelectedCategory4(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">품목을 선택하세요</option>
                          {categorySettings.map(cat => (
                            <option key={cat.category_4} value={cat.category_4}>
                              {cat.category_4}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleCategoryMatching}
                        disabled={!selectedProduct?.category_4 && !selectedCategory4}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Package className="w-4 h-4" />
                        {selectedProduct?.category_4 ? '품목 재매칭' : '품목으로 카테고리 매칭'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 원물 추가 버튼 */}
                    <button
                      onClick={() => setShowMaterialSelector(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      원물 추가
                    </button>

                    {/* 원물 리스트 */}
                    <div className="space-y-3">
                      {linkedMaterials.map((link) => {
                        const requiredPerOne = link.quantity || 0
                        const percentage = link.percentage || 0

                        // 원물 사용량 비율 계산 (백분율)
                        const usageRatio = link.material_standard_quantity
                          ? ((requiredPerOne / link.material_standard_quantity) * 100).toFixed(1)
                          : null

                        return (
                          <div
                            key={link.id}
                            className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 truncate" title={link.material_name}>
                                    {link.material_name}
                                  </h4>
                                  {usageRatio && (
                                    <span className="text-[12px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex-shrink-0">
                                      원물사용 {usageRatio}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {link.material_code} | 표준 {link.material_standard_quantity || '-'}{link.material_standard_unit || ''}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteMaterial(link.id)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.1"
                                value={percentage}
                                onChange={(e) => handlePercentageChange(link.id, parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-blue-600">
                                  {percentage.toFixed(2)}%
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium text-green-600">
                                  {requiredPerOne.toFixed(2)} {link.material_standard_unit || ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* 요약 정보 */}
                    <div className={`p-4 rounded-lg border-2 ${
                      isPercentageValid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">총 비율</span>
                        <span className={`text-lg font-bold ${
                          isPercentageValid ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {totalPercentage.toFixed(2)}%
                        </span>
                      </div>
                      {!isPercentageValid && (
                        <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          총 비율이 100% 이상이어야 저장할 수 있습니다.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 원물 선택 모달 */}
      {showMaterialSelector && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMaterialSelector(false)
              setSearchTerm('')
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* 모달 헤더 */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">원물 선택</h3>
                <p className="text-sm text-gray-600 mt-1">추가할 원물을 선택하세요</p>
              </div>
              <button
                onClick={() => {
                  setShowMaterialSelector(false)
                  setSearchTerm('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 검색창 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="원물명 또는 원물코드로 검색하세요..."
                  className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* 테이블 */}
            <div className="flex-1 overflow-y-auto">
              {filteredMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Package className="w-20 h-20 text-gray-300 mb-4" />
                  <p className="text-lg text-gray-500 mb-2">검색 결과가 없습니다</p>
                  <p className="text-sm text-gray-400">다른 검색어로 시도해보세요</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredMaterials.map((material) => {
                    const isLinked = linkedMaterials.some(link => link.raw_material_id === material.id)
                    const similarity = (material as any).similarity

                    // 원물 사용량 비율 계산
                    const linkedMaterial = linkedMaterials.find(link => link.raw_material_id === material.id)
                    const usageRatio = linkedMaterial && material.standard_quantity
                      ? (linkedMaterial.quantity / material.standard_quantity).toFixed(2)
                      : null

                    return (
                      <div
                        key={material.id}
                        className={`px-6 py-3 transition-colors cursor-pointer group ${
                          isLinked ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-blue-50'
                        }`}
                        onClick={() => handleAddMaterial(material.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* 1줄: 원물코드 + 품목배지 + 원물명(표준수량 포함) + 유사도 + 사용량비율 */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[14px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                                {material.material_code}
                              </span>
                              {material.category_4 && (
                                <span className="text-[14px] bg-green-50 text-green-700 px-2 py-0.5 rounded flex-shrink-0">
                                  {material.category_4}
                                </span>
                              )}
                              {isLinked && (
                                <span className="text-[12px] bg-blue-600 text-white px-2 py-0.5 rounded flex-shrink-0">
                                  연결됨
                                </span>
                              )}
                              <h4 className="flex-1 truncate" title={material.material_name}>
                                <span className="text-[18px] font-semibold text-gray-900">{material.material_name}</span>
                                {' '}
                                <span className="text-[14px] text-gray-600">{material.standard_quantity || '-'}{material.standard_unit || ''}</span>
                              </h4>
                              {usageRatio && (
                                <span className="text-[12px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex-shrink-0">
                                  원물사용 {usageRatio}
                                </span>
                              )}
                              {similarity !== undefined && similarity > 0 && (
                                <span className="text-[12px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">
                                  {Math.round(similarity)}%
                                </span>
                              )}
                            </div>
                            {/* 2줄: 최근가격 */}
                            {material.latest_price && (
                              <div className="text-[14px] text-gray-500 pl-1">
                                최근가격: {material.latest_price.toLocaleString()}원
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddMaterial(material.id)
                            }}
                            className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-[14px] font-medium rounded-lg transition-all ${
                              isLinked
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            disabled={isLinked}
                          >
                            <Plus className="w-4 h-4" />
                            {isLinked ? '추가됨' : '추가'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                총 <span className="font-semibold text-gray-900">{filteredMaterials.length}</span>개의 원물
              </p>
              <button
                onClick={() => {
                  setShowMaterialSelector(false)
                  setSearchTerm('')
                }}
                className="px-5 py-2.5 text-base font-medium border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
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
