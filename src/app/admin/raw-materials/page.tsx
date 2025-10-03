// app/admin/raw-materials/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  code: string
  name: string
  level: number
  parent_id: string | null
}

interface Supplier {
  id: string
  code: string
  name: string
}

interface RawMaterial {
  id: string
  material_code: string
  material_name: string
  category_level_1_id: string | null
  category_level_2_id: string | null
  category_level_3_id: string | null
  category_level_4_id: string | null
  category_level_5_id: string | null
  category_level_6_id: string | null
  item_type: string | null
  variety: string | null
  standard_unit: string
  supply_status: string
  season: string | null
  season_start_date: string | null
  season_peak_date: string | null
  season_end_date: string | null
  main_supplier_id: string | null
  is_active: boolean
  created_at: string
  // 조인된 데이터
  category_level_1?: string
  category_level_2?: string
  category_level_3?: string
  category_level_4?: string
  category_level_5?: string
  category_level_6?: string
  supplier_name?: string
  latest_price?: number
}

interface PriceHistory {
  id: string
  material_id: string
  price: number
  unit_quantity: number
  effective_date: string
  notes: string | null
}

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const [selectedMaterialForPrice, setSelectedMaterialForPrice] = useState<RawMaterial | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'price'>('list')
  
  // 카테고리 선택 상태
  const [selectedCategories, setSelectedCategories] = useState({
    level1: '',
    level2: '',
    level3: '',
    level4: '',
    level5: '',
    level6: ''
  })

  const [formData, setFormData] = useState({
    material_code: '',
    material_name: '',
    category_level_1_id: '',
    category_level_2_id: '',
    category_level_3_id: '',
    category_level_4_id: '',
    category_level_5_id: '',
    category_level_6_id: '',
    standard_unit: 'kg',
    supply_status: '대기중',
    season: '',
    season_start_date: '',
    season_peak_date: '',
    season_end_date: '',
    main_supplier_id: '',
    is_active: true
  })

  const [priceForm, setPriceForm] = useState({
    price: 0,
    unit_quantity: 1,
    effective_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    await Promise.all([
      fetchMaterials(),
      fetchCategories(),
      fetchSuppliers()
    ])
    setLoading(false)
  }

  // 원물 목록 조회
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('v_raw_materials_full')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  // 카테고리 조회
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .eq('is_active', true)
        .order('level')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // 거래처 조회
  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  // 카테고리 필터링 (레벨별)
  const getCategoriesByLevel = (level: number, parentId?: string) => {
    return categories.filter(cat => {
      if (cat.level !== level) return false
      if (level === 1) return true
      return cat.parent_id === parentId
    })
  }

  // 원물 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const materialData = {
        ...formData,
        // null 값 처리
        category_level_1_id: formData.category_level_1_id || null,
        category_level_2_id: formData.category_level_2_id || null,
        category_level_3_id: formData.category_level_3_id || null,
        category_level_4_id: formData.category_level_4_id || null,
        category_level_5_id: formData.category_level_5_id || null,
        category_level_6_id: formData.category_level_6_id || null,
        main_supplier_id: formData.main_supplier_id || null,
        season_start_date: formData.season_start_date || null,
        season_peak_date: formData.season_peak_date || null,
        season_end_date: formData.season_end_date || null
      }

      if (editingMaterial) {
        const { error } = await supabase
          .from('raw_materials')
          .update(materialData)
          .eq('id', editingMaterial.id)

        if (error) throw error
        alert('원물이 수정되었습니다.')
      } else {
        const { error } = await supabase
          .from('raw_materials')
          .insert([materialData])

        if (error) throw error
        alert('원물이 추가되었습니다.')
      }

      setShowModal(false)
      resetForm()
      fetchMaterials()
    } catch (error: any) {
      console.error('Error saving material:', error)
      alert(error.message || '저장 중 오류가 발생했습니다.')
    }
  }

  // 시세 등록
  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMaterialForPrice) return

    try {
      const { error } = await supabase
        .from('material_price_history')
        .insert({
          material_id: selectedMaterialForPrice.id,
          supplier_id: selectedMaterialForPrice.main_supplier_id,
          price: priceForm.price,
          unit_quantity: priceForm.unit_quantity,
          effective_date: priceForm.effective_date,
          price_type: 'PURCHASE',
          notes: priceForm.notes
        })

      if (error) throw error
      
      alert('시세가 등록되었습니다.')
      setShowPriceModal(false)
      setPriceForm({
        price: 0,
        unit_quantity: 1,
        effective_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      fetchMaterials()
    } catch (error: any) {
      console.error('Error saving price:', error)
      alert(error.message || '시세 등록 중 오류가 발생했습니다.')
    }
  }

  // 원물 삭제
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 원물을 삭제하시겠습니까?`)) return

    try {
      const { error } = await supabase
        .from('raw_materials')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('원물이 삭제되었습니다.')
      fetchMaterials()
    } catch (error: any) {
      console.error('Error deleting material:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      material_code: '',
      material_name: '',
      category_level_1_id: '',
      category_level_2_id: '',
      category_level_3_id: '',
      category_level_4_id: '',
      category_level_5_id: '',
      category_level_6_id: '',
      standard_unit: 'kg',
      supply_status: '대기중',
      season: '',
      season_start_date: '',
      season_peak_date: '',
      season_end_date: '',
      main_supplier_id: '',
      is_active: true
    })
    setEditingMaterial(null)
    setSelectedCategories({
      level1: '',
      level2: '',
      level3: '',
      level4: '',
      level5: '',
      level6: ''
    })
  }

  // 공급상태 뱃지
  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      '공급중': 'bg-green-100 text-green-800',
      '일시중단': 'bg-yellow-100 text-yellow-800',
      '품절': 'bg-red-100 text-red-800',
      '시즌종료': 'bg-gray-100 text-gray-800',
      '대기중': 'bg-blue-100 text-blue-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">원물 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            총 {materials.length}개의 원물이 등록되어 있습니다.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 원물 추가
        </button>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            원물 목록
          </button>
          <button
            onClick={() => setActiveTab('price')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'price'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            시세 관리
          </button>
        </nav>
      </div>

      {/* 원물 목록 테이블 */}
      {activeTab === 'list' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">원물명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">단위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">최근시세</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">거래처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    등록된 원물이 없습니다.
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr key={material.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {material.material_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.material_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        {[
                          material.category_level_1,
                          material.category_level_2,
                          material.category_level_3,
                          material.category_level_4,
                          material.category_level_5,
                          material.category_level_6
                        ].filter(Boolean).join(' > ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.standard_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.latest_price ? 
                        `${material.latest_price.toLocaleString()}원` : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.supplier_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(material.supply_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setEditingMaterial(material)
                          setFormData({
                            material_code: material.material_code,
                            material_name: material.material_name,
                            category_level_1_id: material.category_level_1_id || '',
                            category_level_2_id: material.category_level_2_id || '',
                            category_level_3_id: material.category_level_3_id || '',
                            category_level_4_id: material.category_level_4_id || '',
                            category_level_5_id: material.category_level_5_id || '',
                            category_level_6_id: material.category_level_6_id || '',
                            standard_unit: material.standard_unit,
                            supply_status: material.supply_status,
                            season: material.season || '',
                            season_start_date: material.season_start_date || '',
                            season_peak_date: material.season_peak_date || '',
                            season_end_date: material.season_end_date || '',
                            main_supplier_id: material.main_supplier_id || '',
                            is_active: material.is_active
                          })
                          setShowModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(material.id, material.material_name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 시세 관리 탭 */}
      {activeTab === 'price' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">시세 등록</h3>
            <p className="text-sm text-gray-600">원물을 선택하고 최신 시세를 등록하세요.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((material) => (
              <div key={material.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{material.material_name}</h4>
                    <p className="text-sm text-gray-500">{material.material_code}</p>
                  </div>
                  {getStatusBadge(material.supply_status)}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <p>현재 시세: {material.latest_price ? `${material.latest_price.toLocaleString()}원` : '미등록'}</p>
                  <p>단위: {material.standard_unit}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedMaterialForPrice(material)
                    setShowPriceModal(true)
                  }}
                  className="w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  시세 등록
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 원물 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingMaterial ? '원물 수정' : '원물 추가'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {/* 기본 정보 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    원물코드 *
                  </label>
                  <input
                    type="text"
                    value={formData.material_code}
                    onChange={(e) => setFormData({...formData, material_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    원물명 *
                  </label>
                  <input
                    type="text"
                    value={formData.material_name}
                    onChange={(e) => setFormData({...formData, material_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* 카테고리 선택 (6단계) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대분류</label>
                  <select
                    value={formData.category_level_1_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        category_level_1_id: e.target.value,
                        category_level_2_id: '',
                        category_level_3_id: '',
                        category_level_4_id: '',
                        category_level_5_id: '',
                        category_level_6_id: ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">선택</option>
                    {getCategoriesByLevel(1).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">중분류</label>
                  <select
                    value={formData.category_level_2_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        category_level_2_id: e.target.value,
                        category_level_3_id: '',
                        category_level_4_id: '',
                        category_level_5_id: '',
                        category_level_6_id: ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!formData.category_level_1_id}
                  >
                    <option value="">선택</option>
                    {formData.category_level_1_id && 
                      getCategoriesByLevel(2, formData.category_level_1_id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">소분류</label>
                  <select
                    value={formData.category_level_3_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        category_level_3_id: e.target.value,
                        category_level_4_id: '',
                        category_level_5_id: '',
                        category_level_6_id: ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!formData.category_level_2_id}
                  >
                    <option value="">선택</option>
                    {formData.category_level_2_id && 
                      getCategoriesByLevel(3, formData.category_level_2_id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">세분류</label>
                  <select
                    value={formData.category_level_4_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        category_level_4_id: e.target.value,
                        category_level_5_id: '',
                        category_level_6_id: ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!formData.category_level_3_id}
                  >
                    <option value="">선택</option>
                    {formData.category_level_3_id && 
                      getCategoriesByLevel(4, formData.category_level_3_id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품목</label>
                  <select
                    value={formData.category_level_5_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        category_level_5_id: e.target.value,
                        category_level_6_id: ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!formData.category_level_4_id}
                  >
                    <option value="">선택</option>
                    {formData.category_level_4_id && 
                      getCategoriesByLevel(5, formData.category_level_4_id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품종</label>
                  <select
                    value={formData.category_level_6_id}
                    onChange={(e) => setFormData({...formData, category_level_6_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!formData.category_level_5_id}
                  >
                    <option value="">선택</option>
                    {formData.category_level_5_id && 
                      getCategoriesByLevel(6, formData.category_level_5_id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                </div>

                {/* 기타 정보 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">표준단위 *</label>
                  <select
                    value={formData.standard_unit}
                    onChange={(e) => setFormData({...formData, standard_unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="개">개</option>
                    <option value="박스">박스</option>
                    <option value="포">포</option>
                    <option value="단">단</option>
                    <option value="톤">톤</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공급상태</label>
                  <select
                    value={formData.supply_status}
                    onChange={(e) => setFormData({...formData, supply_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="대기중">대기중</option>
                    <option value="공급중">공급중</option>
                    <option value="일시중단">일시중단</option>
                    <option value="품절">품절</option>
                    <option value="시즌종료">시즌종료</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주거래처</label>
                  <select
                    value={formData.main_supplier_id}
                    onChange={(e) => setFormData({...formData, main_supplier_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">선택</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시즌</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({...formData, season: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">선택</option>
                    <option value="봄">봄</option>
                    <option value="여름">여름</option>
                    <option value="가을">가을</option>
                    <option value="겨울">겨울</option>
                    <option value="연중">연중</option>
                  </select>
                </div>
              </div>

              {/* 시즌 날짜 */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시즌 시작일</label>
                  <input
                    type="date"
                    value={formData.season_start_date}
                    onChange={(e) => setFormData({...formData, season_start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">피크 시기</label>
                  <input
                    type="date"
                    value={formData.season_peak_date}
                    onChange={(e) => setFormData({...formData, season_peak_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시즌 종료일</label>
                  <input
                    type="date"
                    value={formData.season_end_date}
                    onChange={(e) => setFormData({...formData, season_end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingMaterial ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 시세 등록 모달 */}
      {showPriceModal && selectedMaterialForPrice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              시세 등록: {selectedMaterialForPrice.material_name}
            </h3>
            
            <form onSubmit={handlePriceSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">단가 (원) *</label>
                  <input
                    type="number"
                    value={priceForm.price}
                    onChange={(e) => setPriceForm({...priceForm, price: Number(e.target.value)})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    단위수량 ({selectedMaterialForPrice.standard_unit})
                  </label>
                  <input
                    type="number"
                    value={priceForm.unit_quantity}
                    onChange={(e) => setPriceForm({...priceForm, unit_quantity: Number(e.target.value)})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">적용일자</label>
                  <input
                    type="date"
                    value={priceForm.effective_date}
                    onChange={(e) => setPriceForm({...priceForm, effective_date: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">메모</label>
                  <textarea
                    value={priceForm.notes}
                    onChange={(e) => setPriceForm({...priceForm, notes: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPriceModal(false)
                    setPriceForm({
                      price: 0,
                      unit_quantity: 1,
                      effective_date: new Date().toISOString().split('T')[0],
                      notes: ''
                    })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}