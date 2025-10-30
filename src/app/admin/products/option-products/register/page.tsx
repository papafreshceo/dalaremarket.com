'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui'
import { PageLayout } from '@/components/layouts'
import { Plus, X, Search } from 'lucide-react'

const supabase = createClient()

interface RawMaterial {
  id: string
  material_code: string
  material_name: string
  standard_quantity: number | null
  standard_unit: string | null
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  category_5: string | null
  season_start_date: string | null
  season_peak_date: string | null
  season_end_date: string | null
  season: string | null
  supply_status: string | null
  color_code: string | null
  is_active: boolean
  latest_price: number | null
}

export default function RegisterOptionProductPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [selectedMaterials, setSelectedMaterials] = useState<RawMaterial[]>([])
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false)
  const [allMaterials, setAllMaterials] = useState<RawMaterial[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [productsMaster, setProductsMaster] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<any>(null)

  // 새 원물 추가 폼 (테이블 행)
  const [newMaterialRows, setNewMaterialRows] = useState<any[]>([])

  // 옵션상품 행 관리
  const [optionRows, setOptionRows] = useState<any[]>([{
    id: 'option-1',
    option_code: '',
    option_name: '',
    spec1: '',
    spec2: '',
    spec3: '',
    standard_quantity: '',
    standard_unit: '',
    raw_material_cost: '',
    packaging_box_price: '',
    pack_price: '',
    bag_vinyl_price: '',
    cushioning_price: '',
    sticker_price: '',
    ice_pack_price: '',
    other_material_price: '',
    labor_cost: '',
    total_cost: '',
    seller_supply_price: '',
    seller_margin_rate: '',
    naver_paid_shipping_price: '',
    naver_free_shipping_price: '',
    coupang_paid_shipping_price: '',
    coupang_free_shipping_price: '',
    supplier_id: '',
    shipping_vendor_id: '',
    invoice_entity: '',
    vendor_id: '',
    shipping_location_name: '',
    shipping_location_address: '',
    shipping_location_contact: '',
    shipping_deadline: '',
    shipping_fee: '',
    shipping_additional_quantity: '',
    misc_cost: '',
    season_start_date: '',
    season_end_date: '',
    season: '',
    status: '',
    supply_status: '',
    thumbnail_url: '',
    description: '',
    notes: '',
    is_seller_supply: false,
    is_best: false,
    is_recommended: false,
    has_detail_page: false,
    has_images: false
  }])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // 거래처 데이터
  const [vendors, setVendors] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [shippingVendors, setShippingVendors] = useState<any[]>([])
  const [invoiceEntities, setInvoiceEntities] = useState<any[]>([])
  const [supplyStatuses, setSupplyStatuses] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: materials } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('is_active', true)
      .order('material_code')

    if (materials) setAllMaterials(materials)

    const { data: productMasterData } = await supabase
      .from('products_master')
      .select('*')
      .eq('is_active', true)
      .order('category_1, category_2, category_3, category_4')

    if (productMasterData) setProductsMaster(productMasterData)

    const { data: vendorData } = await supabase
      .from('partners')
      .select('*')
      .eq('partner_type', '벤더사')
      .eq('is_active', true)

    const { data: supplierData } = await supabase
      .from('partners')
      .select('*')
      .eq('partner_type', '공급자')
      .eq('is_active', true)

    const { data: shippingVendorData } = await supabase
      .from('shipping_vendors')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    const { data: invoiceEntityData } = await supabase
      .from('invoice_entities')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    const { data: statuses } = await supabase
      .from('supply_status_settings')
      .select('*')
      .eq('status_type', 'optional_product')
      .eq('is_active', true)
      .order('display_order')

    if (vendorData) setVendors(vendorData)
    if (supplierData) setSuppliers(supplierData)
    if (shippingVendorData) setShippingVendors(shippingVendorData)
    if (invoiceEntityData) setInvoiceEntities(invoiceEntityData)
    if (statuses) setSupplyStatuses(statuses)
  }

  const handleAddMaterial = (material: RawMaterial) => {
    if (selectedMaterials.find(m => m.id === material.id)) {
      showToast('이미 선택된 원물입니다.', 'warning')
      return
    }

    // 원물 선택시 카테고리 선택 초기화
    setSelectedCategory(null)
    setSelectedMaterials([...selectedMaterials, material])

    // 첫 번째 원물 선택 시 시즌 정보를 옵션 행에 반영
    if (selectedMaterials.length === 0) {
      setOptionRows((prev) => prev.map(row => ({
        ...row,
        season_start_date: material.season_start_date || '',
        season_end_date: material.season_end_date || '',
        season: material.season || ''
      })))
    }

    showToast('원물이 추가되었습니다.', 'success')
  }

  const handleRemoveMaterial = (materialId: string) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.id !== materialId))
    showToast('원물이 제거되었습니다.', 'success')
  }

  // 옵션상품 행 추가
  const addOptionRow = () => {
    const newRow = {
      id: `option-${Date.now()}`,
      option_code: '',
      option_name: '',
      spec1: '',
      spec2: '',
      spec3: '',
      standard_quantity: '',
      standard_unit: '',
      raw_material_cost: '',
      packaging_box_price: '',
      pack_price: '',
      bag_vinyl_price: '',
      cushioning_price: '',
      sticker_price: '',
      ice_pack_price: '',
      other_material_price: '',
      labor_cost: '',
      total_cost: '',
      seller_supply_price: '',
      seller_margin_rate: '',
      naver_paid_shipping_price: '',
      naver_free_shipping_price: '',
      coupang_paid_shipping_price: '',
      coupang_free_shipping_price: '',
      supplier_id: '',
      shipping_vendor_id: '',
      invoice_entity: '',
      vendor_id: '',
      shipping_location_name: '',
      shipping_location_address: '',
      shipping_location_contact: '',
      shipping_deadline: '',
      shipping_fee: '',
      shipping_additional_quantity: '',
      misc_cost: '',
      season_start_date: '',
      season_end_date: '',
      season: '',
      status: '',
      supply_status: '',
      thumbnail_url: '',
      description: '',
      notes: '',
      is_seller_supply: false,
      is_best: false,
      is_recommended: false,
      has_detail_page: false,
      has_images: false
    }
    setOptionRows([...optionRows, newRow])
  }

  // 옵션상품 행 삭제 (선택된 행들)
  const removeSelectedRows = () => {
    if (selectedRows.size === 0) {
      showToast('삭제할 행을 선택해주세요.', 'warning')
      return
    }
    if (optionRows.length === selectedRows.size) {
      showToast('최소 1개의 행은 남겨야 합니다.', 'warning')
      return
    }
    setOptionRows(optionRows.filter(row => !selectedRows.has(row.id)))
    setSelectedRows(new Set())
    showToast(`${selectedRows.size}개 행이 삭제되었습니다.`, 'success')
  }

  // 옵션상품 행 업데이트
  const updateOptionRow = (id: string, field: string, value: any) => {
    setOptionRows(
      optionRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    )
  }

  // 행 선택 토글
  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  // 전체 선택 토글
  const toggleAllRows = () => {
    if (selectedRows.size === optionRows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(optionRows.map(row => row.id)))
    }
  }

  const addNewMaterialRow = () => {
    setNewMaterialRows([
      ...newMaterialRows,
      {
        id: `temp-${Date.now()}`,
        material_code: '',
        material_name: '',
        standard_quantity: '',
        standard_unit: '',
        category_1: '',
        category_2: '',
        category_3: '',
        category_4: '',
        category_5: '',
        season_start_date: '',
        season_peak_date: '',
        season_end_date: '',
        season: '',
        supply_status: '',
        color_code: '#000000',
        is_active: true,
        latest_price: '0'
      }
    ])
  }

  const removeNewMaterialRow = (id: string) => {
    setNewMaterialRows(newMaterialRows.filter(row => row.id !== id))
  }

  const updateNewMaterialRow = (id: string, field: string, value: any) => {
    setNewMaterialRows(
      newMaterialRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    )
  }

  const handleSaveNewMaterials = async () => {
    try {
      for (const row of newMaterialRows) {
        if (!row.material_code || !row.material_name) {
          showToast('원물코드와 원물명은 필수입니다.', 'warning')
          return
        }

        const { data, error } = await supabase
          .from('raw_materials')
          .insert([{
            material_code: row.material_code,
            material_name: row.material_name,
            standard_quantity: parseFloat(row.standard_quantity) || null,
            standard_unit: row.standard_unit,
            category_1: row.category_1,
            category_2: row.category_2,
            category_3: row.category_3,
            category_4: row.category_4,
            category_5: row.category_5,
            season_start_date: row.season_start_date || null,
            season_peak_date: row.season_peak_date || null,
            season_end_date: row.season_end_date || null,
            season: row.season,
            supply_status: row.supply_status,
            color_code: row.color_code,
            is_active: row.is_active,
            latest_price: parseFloat(row.latest_price) || null
          }])
          .select()
          .single()

        if (error) throw error
        setAllMaterials([...allMaterials, data])
      }

      showToast(`${newMaterialRows.length}개의 원물이 추가되었습니다.`, 'success')
      setNewMaterialRows([])
      setShowNewMaterialForm(false)
    } catch (error) {
      console.error('Error adding new materials:', error)
      showToast('원물 추가 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleSave = async () => {
    try {
      // 유효성 검사
      const emptyNameRows = optionRows.filter(row => !row.option_name.trim())
      if (emptyNameRows.length > 0) {
        showToast('모든 행의 옵션명을 입력해주세요.', 'warning')
        return
      }

      if (selectedMaterials.length === 0 && !selectedCategory) {
        showToast('원물 또는 카테고리를 선택해주세요.', 'warning')
        return
      }

      // 카테고리 정보 결정
      let categoryData = {}
      if (selectedMaterials.length > 0) {
        const firstMaterial = selectedMaterials[0]
        categoryData = {
          category_1: firstMaterial.category_1,
          category_2: firstMaterial.category_2,
          category_3: firstMaterial.category_3,
          category_4: firstMaterial.category_4,
          category_5: firstMaterial.category_5,
        }
      } else if (selectedCategory) {
        categoryData = {
          category_1: selectedCategory.category_1,
          category_2: selectedCategory.category_2,
          category_3: selectedCategory.category_3,
          category_4: selectedCategory.category_4,
          category_5: selectedCategory.category_5 || null,
        }
      }

      // 여러 행 저장
      for (const row of optionRows) {
        const { data: newProduct, error: productError } = await supabase
          .from('option_products')
          .insert([{
            ...categoryData,
            option_code: row.option_code || `OPT${Date.now()}`,
            option_name: row.option_name,
            spec1: row.spec1,
            spec2: row.spec2,
            spec3: row.spec3,
            standard_quantity: parseFloat(row.standard_quantity) || null,
            standard_unit: row.standard_unit,
            raw_material_cost: parseFloat(row.raw_material_cost) || 0,
            packaging_box_price: parseFloat(row.packaging_box_price) || 0,
            pack_price: parseFloat(row.pack_price) || 0,
            bag_vinyl_price: parseFloat(row.bag_vinyl_price) || 0,
            cushioning_price: parseFloat(row.cushioning_price) || 0,
            sticker_price: parseFloat(row.sticker_price) || 0,
            ice_pack_price: parseFloat(row.ice_pack_price) || 0,
            other_material_price: parseFloat(row.other_material_price) || 0,
            labor_cost: parseFloat(row.labor_cost) || 0,
            total_cost: parseFloat(row.total_cost) || 0,
            seller_supply_price: parseFloat(row.seller_supply_price) || 0,
            seller_margin_rate: parseFloat(row.seller_margin_rate) || 0,
            naver_paid_shipping_price: parseFloat(row.naver_paid_shipping_price) || 0,
            naver_free_shipping_price: parseFloat(row.naver_free_shipping_price) || 0,
            coupang_paid_shipping_price: parseFloat(row.coupang_paid_shipping_price) || 0,
            coupang_free_shipping_price: parseFloat(row.coupang_free_shipping_price) || 0,
            supplier_id: row.supplier_id || null,
            shipping_vendor_id: row.shipping_vendor_id || null,
            invoice_entity: row.invoice_entity,
            vendor_id: row.vendor_id || null,
            shipping_location_name: row.shipping_location_name,
            shipping_location_address: row.shipping_location_address,
            shipping_location_contact: row.shipping_location_contact,
            shipping_deadline: row.shipping_deadline,
            shipping_fee: parseFloat(row.shipping_fee) || 0,
            shipping_additional_quantity: parseFloat(row.shipping_additional_quantity) || 0,
            misc_cost: parseFloat(row.misc_cost) || 0,
            season_start_date: row.season_start_date || null,
            season_end_date: row.season_end_date || null,
            season: row.season,
            status: row.status,
            supply_status: row.supply_status,
            thumbnail_url: row.thumbnail_url,
            description: row.description,
            notes: row.notes,
            is_seller_supply: row.is_seller_supply,
            is_best: row.is_best,
            is_recommended: row.is_recommended,
            has_detail_page: row.has_detail_page,
            has_images: row.has_images
          }])
          .select()
          .single()

        if (productError) throw productError

        // 원물이 선택된 경우에만 option_product_materials에 등록
        if (selectedMaterials.length > 0) {
          for (const material of selectedMaterials) {
            await supabase.from('option_product_materials').insert([{
              option_product_id: newProduct.id,
              raw_material_id: material.id,
              quantity: 0,
              unit_price: material.latest_price
            }])
          }
        }
      }

      showToast(`${optionRows.length}개의 옵션상품이 등록되었습니다.`, 'success')
      router.push('/admin/products/option-products')
    } catch (error) {
      console.error('Error saving option products:', error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  const filteredMaterials = allMaterials.filter(m =>
    m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.material_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PageLayout
      title="옵션상품 등록"
      showBack
      actions={
        <>
          <Button variant="outline" size="xs" onClick={() => router.back()}>
            취소
          </Button>
          <Button size="xs" onClick={handleSave}>
            저장
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 1. 원물 또는 카테고리 선택 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
              1. 원물 선택 (복수 선택 가능) 또는 카테고리 선택
            </h2>
            <div className="flex gap-2">
              <Button
                size="xs"
                variant="outline"
                onClick={() => setShowCategorySelector(true)}
              >
                <Search className="w-4 h-4 mr-1" />
                카테고리 선택
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setShowNewMaterialForm(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                새 원물 추가
              </Button>
              <Button
                size="xs"
                onClick={() => setShowMaterialSelector(true)}
              >
                <Search className="w-4 h-4 mr-1" />
                원물 선택
              </Button>
            </div>
          </div>

          {/* 선택된 카테고리 표시 */}
          {selectedCategory && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-green-900 dark:text-green-100">
                    선택된 카테고리 (위탁생산 상품)
                  </p>
                  <p className="text-[14px] text-green-700 dark:text-green-300 mt-1">
                    {[selectedCategory.category_1, selectedCategory.category_2, selectedCategory.category_3, selectedCategory.category_4, selectedCategory.category_5]
                      .filter(Boolean)
                      .join(' > ')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-green-600 hover:text-green-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {selectedMaterials.length === 0 && !selectedCategory ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>자체 제작: 원물을 선택해주세요</p>
              <p className="text-[12px] mt-1">위탁 생산: 카테고리를 선택해주세요</p>
            </div>
          ) : selectedMaterials.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold">원물코드</th>
                    <th className="px-2 py-2 text-left font-semibold">원물명</th>
                    <th className="px-2 py-2 text-right font-semibold">표준량</th>
                    <th className="px-2 py-2 text-left font-semibold">카테고리</th>
                    <th className="px-2 py-2 text-center font-semibold w-16">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedMaterials.map((material) => (
                    <tr key={material.id}>
                      <td className="px-2 py-2">{material.material_code}</td>
                      <td className="px-2 py-2">{material.material_name}</td>
                      <td className="px-2 py-2 text-right">
                        {material.standard_quantity} {material.standard_unit}
                      </td>
                      <td className="px-2 py-2 text-[11px]">
                        {[material.category_1, material.category_2, material.category_3, material.category_4, material.category_5]
                          .filter(Boolean)
                          .join(' > ')}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => handleRemoveMaterial(material.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* 2. 옵션상품 작성 테이블 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
              2. 옵션상품 정보 입력 ({optionRows.length}개)
            </h2>
            <div className="flex gap-2">
              <Button
                size="xs"
                variant="outline"
                onClick={removeSelectedRows}
                disabled={selectedRows.size === 0}
              >
                <X className="w-4 h-4 mr-1" />
                선택 삭제 ({selectedRows.size})
              </Button>
              <Button
                size="xs"
                onClick={addOptionRow}
              >
                <Plus className="w-4 h-4 mr-1" />
                행 추가
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="border px-2 py-2 font-semibold w-[40px]">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === optionRows.length}
                      onChange={toggleAllRows}
                      className="w-4 h-4"
                    />
                  </th>
                  {/* 기본 정보 */}
                  <th className="border px-2 py-2 font-semibold min-w-[200px]">옵션코드</th>
                  <th className="border px-2 py-2 font-semibold min-w-[120px]">옵션명*</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">규격1</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">규격2</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">규격3</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">표준수량</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">표준단위</th>
                  {/* 가격 */}
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">원물가</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">박스비</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">팩</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">봉지/비닐</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">완충재</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">스티커</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">아이스팩</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">기타자재</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">인건비</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">셀러공급가</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">셀러마진율</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">택배비</th>
                  {/* 거래처 */}
                  <th className="border px-2 py-2 font-semibold min-w-[100px]">공급자</th>
                  <th className="border px-2 py-2 font-semibold min-w-[100px]">출고처</th>
                  <th className="border px-2 py-2 font-semibold min-w-[100px]">송장주체</th>
                  <th className="border px-2 py-2 font-semibold min-w-[100px]">벤더사</th>
                  <th className="border px-2 py-2 font-semibold min-w-[100px]">상태</th>
                  {/* 시즌 */}
                  <th className="border px-2 py-2 font-semibold min-w-[100px]">시즌시작</th>
                  <th className="border px-2 py-2 font-semibold min-w-[100px]">시즌종료</th>
                  <th className="border px-2 py-2 font-semibold min-w-[80px]">시즌</th>
                  {/* Y/N */}
                  <th className="border px-2 py-2 font-semibold min-w-[60px]">셀러공급</th>
                  <th className="border px-2 py-2 font-semibold min-w-[60px]">베스트</th>
                  <th className="border px-2 py-2 font-semibold min-w-[60px]">추천</th>
                  <th className="border px-2 py-2 font-semibold min-w-[60px]">상세페이지</th>
                  <th className="border px-2 py-2 font-semibold min-w-[60px]">이미지</th>
                </tr>
              </thead>
              <tbody>
                {optionRows.map((row) => (
                  <tr key={row.id} className={selectedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                    <td className="border px-1 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        value={row.option_code}
                        onChange={(e) => updateOptionRow(row.id, 'option_code', e.target.value)}
                        className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                        placeholder="미입력시 자동생성"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        value={row.option_name}
                        onChange={(e) => updateOptionRow(row.id, 'option_name', e.target.value)}
                        className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                        placeholder="필수"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        value={row.spec1}
                        onChange={(e) => updateOptionRow(row.id, 'spec1', e.target.value)}
                        className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                        placeholder="1kg"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        value={row.spec2}
                        onChange={(e) => updateOptionRow(row.id, 'spec2', e.target.value)}
                        className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                        placeholder="중-소과"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        value={row.spec3}
                        onChange={(e) => updateOptionRow(row.id, 'spec3', e.target.value)}
                        className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                        placeholder="16~18개"
                      />
                    </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.standard_quantity}
                      onChange={(e) => updateOptionRow(row.id, 'standard_quantity', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="text"
                      value={row.standard_unit}
                      onChange={(e) => updateOptionRow(row.id, 'standard_unit', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    />
                  </td>
                  {/* 가격 필드들 */}
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.raw_material_cost}
                      onChange={(e) => updateOptionRow(row.id, 'raw_material_cost', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.packaging_box_price}
                      onChange={(e) => updateOptionRow(row.id, 'packaging_box_price', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.pack_price}
                      onChange={(e) => updateOptionRow(row.id, 'pack_price', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.bag_vinyl_price}
                      onChange={(e) => updateOptionRow(row.id, 'bag_vinyl_price', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.cushioning_price}
                      onChange={(e) => updateOptionRow(row.id, 'cushioning_price', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.sticker_price}
                      onChange={(e) => updateOptionRow(row.id, 'sticker_price', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.ice_pack_price}
                      onChange={(e) => updateOptionRow(row.id, 'ice_pack_price', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.other_material_price}
                      onChange={(e) => updateOptionRow(row.id, 'other_material_price', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.labor_cost}
                      onChange={(e) => updateOptionRow(row.id, 'labor_cost', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.seller_supply_price}
                      onChange={(e) => updateOptionRow(row.id, 'seller_supply_price', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.seller_margin_rate}
                      onChange={(e) => updateOptionRow(row.id, 'seller_margin_rate', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      value={row.shipping_fee}
                      onChange={(e) => updateOptionRow(row.id, 'shipping_fee', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px] text-right"
                      placeholder="0"
                    />
                  </td>
                  {/* 거래처 */}
                  <td className="border px-1 py-1">
                    <select
                      value={row.supplier_id}
                      onChange={(e) => updateOptionRow(row.id, 'supplier_id', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    >
                      <option value="">선택</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-1 py-1">
                    <select
                      value={row.shipping_vendor_id}
                      onChange={(e) => updateOptionRow(row.id, 'shipping_vendor_id', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    >
                      <option value="">선택</option>
                      {shippingVendors.map(sv => (
                        <option key={sv.id} value={sv.id}>{sv.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-1 py-1">
                    <select
                      value={row.invoice_entity}
                      onChange={(e) => updateOptionRow(row.id, 'invoice_entity', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    >
                      <option value="">선택</option>
                      {invoiceEntities.map(ie => (
                        <option key={ie.id} value={ie.name}>{ie.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-1 py-1">
                    <select
                      value={row.vendor_id}
                      onChange={(e) => updateOptionRow(row.id, 'vendor_id', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    >
                      <option value="">선택</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-1 py-1">
                    <select
                      value={row.status}
                      onChange={(e) => updateOptionRow(row.id, 'status', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    >
                      <option value="">선택</option>
                      {supplyStatuses.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  {/* 시즌 */}
                  <td className="border px-1 py-1">
                    <input
                      type="date"
                      value={row.season_start_date}
                      onChange={(e) => updateOptionRow(row.id, 'season_start_date', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="date"
                      value={row.season_end_date}
                      onChange={(e) => updateOptionRow(row.id, 'season_end_date', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="text"
                      value={row.season}
                      onChange={(e) => updateOptionRow(row.id, 'season', e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                    />
                  </td>
                  {/* Y/N */}
                  <td className="border px-1 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={row.is_seller_supply}
                      onChange={(e) => updateOptionRow(row.id, 'is_seller_supply', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="border px-1 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={row.is_best}
                      onChange={(e) => updateOptionRow(row.id, 'is_best', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="border px-1 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={row.is_recommended}
                      onChange={(e) => updateOptionRow(row.id, 'is_recommended', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="border px-1 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={row.has_detail_page}
                      onChange={(e) => updateOptionRow(row.id, 'has_detail_page', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                    <td className="border px-1 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={row.has_images}
                        onChange={(e) => updateOptionRow(row.id, 'has_images', e.target.checked)}
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-[16px] font-semibold">원물 선택</h3>
              <button
                onClick={() => {
                  setShowMaterialSelector(false)
                  setSearchTerm('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 border-b">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="원물명 또는 코드 검색"
                className="w-full border rounded-lg px-3 py-2 text-[14px]"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[14px]">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">원물코드</th>
                    <th className="px-4 py-3 text-left font-semibold">원물명</th>
                    <th className="px-4 py-3 text-right font-semibold">표준량</th>
                    <th className="px-4 py-3 text-center font-semibold w-24">선택</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                        검색 결과가 없습니다
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((material) => (
                      <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3">{material.material_code}</td>
                        <td className="px-4 py-3">{material.material_name}</td>
                        <td className="px-4 py-3 text-right">
                          {material.standard_quantity} {material.standard_unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              handleAddMaterial(material)
                              setShowMaterialSelector(false)
                              setSearchTerm('')
                            }}
                            className="px-4 py-1.5 text-[14px] bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          </div>
        </div>
      )}

      {/* 새 원물 추가 모달 (테이블 형식) */}
      {showNewMaterialForm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewMaterialForm(false)
              setNewMaterialRows([])
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[95vw] max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-[16px] font-semibold">새 원물 추가</h3>
              <div className="flex gap-2">
                <Button size="xs" onClick={addNewMaterialRow}>
                  <Plus className="w-4 h-4 mr-1" />
                  행 추가
                </Button>
                <Button size="xs" onClick={handleSaveNewMaterials} disabled={newMaterialRows.length === 0}>
                  저장
                </Button>
                <button
                  onClick={() => {
                    setShowNewMaterialForm(false)
                    setNewMaterialRows([])
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="border px-2 py-2 font-semibold min-w-[100px]">원물코드*</th>
                      <th className="border px-2 py-2 font-semibold min-w-[120px]">원물명*</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">표준량</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">표준규격</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">대분류</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">중분류</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">소분류</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">품목</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">품종</th>
                      <th className="border px-2 py-2 font-semibold min-w-[100px]">시즌시작일</th>
                      <th className="border px-2 py-2 font-semibold min-w-[100px]">시즌피크일</th>
                      <th className="border px-2 py-2 font-semibold min-w-[100px]">시즌종료일</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">시즌</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">공급상태</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">색상코드</th>
                      <th className="border px-2 py-2 font-semibold min-w-[60px]">활성화</th>
                      <th className="border px-2 py-2 font-semibold min-w-[80px]">최근가격</th>
                      <th className="border px-2 py-2 font-semibold min-w-[60px]">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newMaterialRows.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="border px-4 py-8 text-center text-gray-500">
                          '행 추가' 버튼을 클릭하여 원물을 추가하세요
                        </td>
                      </tr>
                    ) : (
                      newMaterialRows.map((row) => (
                        <tr key={row.id}>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.material_code}
                              onChange={(e) => updateNewMaterialRow(row.id, 'material_code', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                              placeholder="필수"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.material_name}
                              onChange={(e) => updateNewMaterialRow(row.id, 'material_name', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                              placeholder="필수"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="number"
                              value={row.standard_quantity}
                              onChange={(e) => updateNewMaterialRow(row.id, 'standard_quantity', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.standard_unit}
                              onChange={(e) => updateNewMaterialRow(row.id, 'standard_unit', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.category_1}
                              onChange={(e) => updateNewMaterialRow(row.id, 'category_1', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.category_2}
                              onChange={(e) => updateNewMaterialRow(row.id, 'category_2', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.category_3}
                              onChange={(e) => updateNewMaterialRow(row.id, 'category_3', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.category_4}
                              onChange={(e) => updateNewMaterialRow(row.id, 'category_4', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.category_5}
                              onChange={(e) => updateNewMaterialRow(row.id, 'category_5', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="date"
                              value={row.season_start_date}
                              onChange={(e) => updateNewMaterialRow(row.id, 'season_start_date', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="date"
                              value={row.season_peak_date}
                              onChange={(e) => updateNewMaterialRow(row.id, 'season_peak_date', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="date"
                              value={row.season_end_date}
                              onChange={(e) => updateNewMaterialRow(row.id, 'season_end_date', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.season}
                              onChange={(e) => updateNewMaterialRow(row.id, 'season', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={row.supply_status}
                              onChange={(e) => updateNewMaterialRow(row.id, 'supply_status', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="color"
                              value={row.color_code}
                              onChange={(e) => updateNewMaterialRow(row.id, 'color_code', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent h-[28px]"
                            />
                          </td>
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={row.is_active}
                              onChange={(e) => updateNewMaterialRow(row.id, 'is_active', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="border px-1 py-1">
                            <input
                              type="number"
                              value={row.latest_price}
                              onChange={(e) => updateNewMaterialRow(row.id, 'latest_price', e.target.value)}
                              className="w-full px-1 py-1 border-0 bg-transparent text-[11px]"
                            />
                          </td>
                          <td className="border px-1 py-1 text-center">
                            <button
                              onClick={() => removeNewMaterialRow(row.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 선택 모달 */}
      {showCategorySelector && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategorySelector(false)
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold">카테고리 선택</h3>
                <p className="text-[14px] text-gray-500 mt-1">위탁 생산 상품의 경우 카테고리를 선택하세요</p>
              </div>
              <button
                onClick={() => setShowCategorySelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr className="text-[14px]">
                    <th className="px-4 py-3 text-left font-semibold">대분류</th>
                    <th className="px-4 py-3 text-left font-semibold">중분류</th>
                    <th className="px-4 py-3 text-left font-semibold">소분류</th>
                    <th className="px-4 py-3 text-left font-semibold">품목</th>
                    <th className="px-4 py-3 text-left font-semibold">품종</th>
                    <th className="px-4 py-3 text-center font-semibold w-24">선택</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {productsMaster.length === 0 ? (
                    <tr className="text-[14px]">
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        등록된 카테고리가 없습니다
                      </td>
                    </tr>
                  ) : (
                    productsMaster.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-[14px]">
                        <td className="px-4 py-3">{category.category_1 || '-'}</td>
                        <td className="px-4 py-3">{category.category_2 || '-'}</td>
                        <td className="px-4 py-3">{category.category_3 || '-'}</td>
                        <td className="px-4 py-3">{category.category_4 || '-'}</td>
                        <td className="px-4 py-3">{category.category_5 || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedCategory(category)
                              setSelectedMaterials([]) // 카테고리 선택시 원물 선택 초기화
                              setShowCategorySelector(false)
                              showToast('카테고리가 선택되었습니다.', 'success')
                            }}
                            className="px-4 py-1.5 text-[14px] bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            선택
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
