// app/admin/products/raw-materials/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  DataTable, 
  Card, 
  Button, 
  Tabs, 
  Modal, 
  Badge, 
  Input, 
  Select 
} from '@/components/ui'

// ========== 타입 정의 ==========
interface Category {
  id: string
  code: string
  name: string
  level: number
  parent_id: string | null
  display_order?: number
  is_active: boolean
}

interface Supplier {
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
  item_type?: string
  variety?: string
  standard_unit: string
  supply_status: string
  main_supplier_id: string | null
  latest_price?: number
  unit_quantity?: number
  last_trade_date?: string
  supplier_name?: string
  category_level_1?: string
  category_level_2?: string
  category_level_3?: string
  category_level_4?: string
  category_level_5?: string
  category_level_6?: string
  season?: string
  season_start_date?: string
  season_peak_date?: string
  season_end_date?: string
  color_code?: string
  created_at?: string
  [key: string]: any
}

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category?: string
  supplier_price: number
  selling_price: number
  margin_rate?: number
  commission_rate?: number
  stock_quantity: number
  unit: string
  thumbnail_url?: string
  is_active: boolean
  created_at?: string
}

interface FormData {
  material_code?: string
  material_name?: string
  category_level_1_id?: string
  category_level_2_id?: string
  category_level_3_id?: string
  category_level_4_id?: string
  category_level_5_id?: string
  category_level_6_id?: string
  item_type?: string
  variety?: string
  standard_unit?: string
  supply_status?: string
  main_supplier_id?: string
  season?: string
  season_start_date?: string
  season_peak_date?: string
  season_end_date?: string
  color_code?: string
  sku?: string
  name?: string
  description?: string
  category?: string
  supplier_price?: number
  selling_price?: number
  margin_rate?: number
  commission_rate?: number
  stock_quantity?: number
  unit?: string
  is_active?: boolean
  code?: string
  supplier_code?: string
  supplier_name?: string
  business_number?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
}

interface CellPosition {
  row: number
  col: number
}

interface SupplyStatus {
  id?: string
  code: string
  name: string
  color: string
  display_order?: number
  is_active?: boolean
}

export default function RawMaterialsManagementPage() {
  // ========== 상태 관리 ==========
  const [mainTab, setMainTab] = useState('raw-materials')
  const [subTab, setSubTab] = useState('list')
  const [loading, setLoading] = useState(false)
  
  // 데이터
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<RawMaterial[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplyStatuses, setSupplyStatuses] = useState<SupplyStatus[]>([])
  
  // 통계 데이터
  const [stats, setStats] = useState({
    totalMaterials: 0,
    shippingMaterials: 0,
    seasonEndMaterials: 0,
    todayPriceUpdates: 0
  })
  
  // 필터 상태
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // 모달
  const [modalType, setModalType] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // 폼 데이터
  const [formData, setFormData] = useState<FormData>({})
  
  // 셀 선택 및 편집 상태
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const originalValues = useRef<Map<string, any>>(new Map())
  
  // 변경사항 추적
  const [modifiedMaterials, setModifiedMaterials] = useState<Set<string>>(new Set())
  
  const tableRef = useRef<HTMLTableElement>(null)
  const supabase = createClient()

  // ========== 데이터 로드 ==========
  useEffect(() => {
    fetchInitialData()
  }, [])

  // materials 데이터가 변경될 때마다 통계 재계산
  useEffect(() => {
    if (materials.length > 0) {
      fetchStatistics()
    }
  }, [materials])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMaterials(),
        fetchProducts(),
        fetchCategories(),
        fetchSuppliers(),
        fetchSupplyStatuses(),
        fetchStatistics()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      // 전체 원물 수
      const { count: totalCount } = await supabase
        .from('raw_materials')
        .select('*', { count: 'exact', head: true })
      
      // 출하중 원물 수
      const { count: shippingCount } = await supabase
        .from('raw_materials')
        .select('*', { count: 'exact', head: true })
        .eq('supply_status', '출하중')
      
      // 시즌종료 원물 수
      const { count: seasonEndCount } = await supabase
        .from('raw_materials')
        .select('*', { count: 'exact', head: true })
        .eq('supply_status', '시즌종료')
      
      // 오늘 시세 등록 수
      const { count: todayPriceCount } = await supabase
        .from('material_price_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
      
      setStats({
        totalMaterials: totalCount || 0,
        shippingMaterials: shippingCount || 0,
        seasonEndMaterials: seasonEndCount || 0,
        todayPriceUpdates: todayPriceCount || 0
      })
    } catch (error) {
      console.error('Error fetching statistics:', error)
      // 오류 발생 시 materials 배열 기반으로 계산
      setStats({
        totalMaterials: materials.length,
        shippingMaterials: materials.filter(m => m.supply_status === '출하중').length,
        seasonEndMaterials: materials.filter(m => m.supply_status === '시즌종료').length,
        todayPriceUpdates: 0
      })
    }
  }

  const fetchSupplyStatuses = async () => {
    const { data, error } = await supabase
      .from('supply_status_settings')
      .select('*')
      .eq('status_type', 'raw_material')
      .eq('is_active', true)
      .order('display_order')
    
    if (!error && data) {
      setSupplyStatuses(data)
    }
  }

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('v_raw_materials_full')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setMaterials(data)
      setFilteredMaterials(data)
    }
  }

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setProducts(data)
    }
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('material_categories')
      .select('*')
      .eq('is_active', true)
      .order('level')
      .order('display_order')
    
    if (!error && data) {
      setCategories(data)
    }
  }

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (!error && data) {
      setSuppliers(data)
    }
  }

  // ========== 필터링 ==========
  useEffect(() => {
    let filtered = [...materials]
    
    // 전역 검색 필터 (모든 필드 대상)
    if (globalSearchTerm) {
      const searchLower = globalSearchTerm.toLowerCase()
      filtered = filtered.filter(m => {
        return (
          m.material_code?.toLowerCase().includes(searchLower) ||
          m.material_name?.toLowerCase().includes(searchLower) ||
          m.category_level_1?.toLowerCase().includes(searchLower) ||
          m.category_level_2?.toLowerCase().includes(searchLower) ||
          m.category_level_3?.toLowerCase().includes(searchLower) ||
          m.category_level_4?.toLowerCase().includes(searchLower) ||
          m.category_level_5?.toLowerCase().includes(searchLower) ||
          m.category_level_6?.toLowerCase().includes(searchLower) ||
          m.item_type?.toLowerCase().includes(searchLower) ||
          m.variety?.toLowerCase().includes(searchLower) ||
          m.standard_unit?.toLowerCase().includes(searchLower) ||
          m.supply_status?.toLowerCase().includes(searchLower) ||
          m.supplier_name?.toLowerCase().includes(searchLower) ||
          m.season?.toLowerCase().includes(searchLower) ||
          m.color_code?.toLowerCase().includes(searchLower) ||
          m.latest_price?.toString().includes(searchLower) ||
          m.unit_quantity?.toString().includes(searchLower) ||
          (m.last_trade_date && new Date(m.last_trade_date).toLocaleDateString('ko-KR').includes(searchLower)) ||
          (m.season_start_date && new Date(m.season_start_date).toLocaleDateString('ko-KR').includes(searchLower)) ||
          (m.season_peak_date && new Date(m.season_peak_date).toLocaleDateString('ko-KR').includes(searchLower)) ||
          (m.season_end_date && new Date(m.season_end_date).toLocaleDateString('ko-KR').includes(searchLower))
        )
      })
    }
    
    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(m => m.supply_status === selectedStatus)
    }
    
    setFilteredMaterials(filtered)
  }, [materials, selectedStatus, globalSearchTerm])

  // ========== 체크박스 핸들러 ==========
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredMaterials.map(m => m.id)))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
    setSelectAll(newSelected.size === filteredMaterials.length)
  }

  // 선택된 행 삭제
  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) {
      alert('선택된 항목이 없습니다.')
      return
    }
    
    if (!confirm(`${selectedRows.size}개 항목을 삭제하시겠습니까?`)) return
    
    try {
      for (const id of selectedRows) {
        await supabase
          .from('raw_materials')
          .delete()
          .eq('id', id)
      }
      
      setSelectedRows(new Set())
      setSelectAll(false)
      await fetchMaterials()
      alert('삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }
  
  const updateParentCategories = (rowIndex: number, selectedCategory: Category) => {
    const material = filteredMaterials[rowIndex]
    const updatedMaterial = { ...material }
    
    // 선택한 카테고리부터 상위로 올라가며 설정
    let currentCat = selectedCategory
    updatedMaterial[`category_level_${currentCat.level}_id`] = currentCat.id
    updatedMaterial[`category_level_${currentCat.level}`] = currentCat.name
    
    // 상위 카테고리들 찾아서 설정
    while (currentCat.parent_id) {
      const parentCat = categories.find(c => c.id === currentCat.parent_id)
      if (parentCat) {
        updatedMaterial[`category_level_${parentCat.level}_id`] = parentCat.id
        updatedMaterial[`category_level_${parentCat.level}`] = parentCat.name
        currentCat = parentCat
      } else {
        break
      }
    }
    
    // 로컬 상태 업데이트
    const newMaterials = [...filteredMaterials]
    newMaterials[rowIndex] = updatedMaterial
    setFilteredMaterials(newMaterials)
    
    // 수정된 항목 추적
    setModifiedMaterials(prev => new Set(prev).add(material.id))
  }
  
  const getCategoriesByLevel = (level: number, parentId?: string) => {
    return categories.filter(cat => {
      if (cat.level !== level) return false
      if (level === 1) return true
      return cat.parent_id === parentId
    })
  }

  // ========== 인라인 편집 핸들러 (수정됨) ==========
  const handleCellClick = (rowIndex: number, colIndex: number, value: string, field: string) => {
    const material = filteredMaterials[rowIndex]
    if (!material) return
    
    const cellKey = `${material.id}-${field}`
    
    // 이미 선택된 셀을 다시 클릭하면 편집 모드로
    if (selectedCell?.row === rowIndex && selectedCell?.col === colIndex) {
      setEditingCell({ row: rowIndex, col: colIndex })
      setEditValue(value || '')
      
      if (!originalValues.current.has(cellKey)) {
        originalValues.current.set(cellKey, value)
      }
    } else {
      // 다른 셀 선택
      setSelectedCell({ row: rowIndex, col: colIndex })
      setEditingCell(null)
    }
  }

  const handleCellValueChange = (rowIndex: number, field: string, value: string) => {
    const material = filteredMaterials[rowIndex]
    const cellKey = `${material.id}-${field}`
    const originalValue = originalValues.current.get(cellKey)
    
    if (originalValue !== value) {
      const updatedMaterial = { ...material, [field]: value }
      
      const newMaterials = [...filteredMaterials]
      newMaterials[rowIndex] = updatedMaterial
      setFilteredMaterials(newMaterials)
      
      setModifiedMaterials(prev => new Set(prev).add(material.id))
    } else {
      let hasOtherChanges = false
      
      originalValues.current.forEach((originalVal, key) => {
        if (key.startsWith(material.id) && key !== cellKey) {
          const fieldName = key.split('-')[1]
          if (material[fieldName] !== originalVal) {
            hasOtherChanges = true
          }
        }
      })
      
      if (!hasOtherChanges) {
        setModifiedMaterials(prev => {
          const newSet = new Set(prev)
          newSet.delete(material.id)
          return newSet
        })
      }
    }
    
    setEditingCell(null)
    setEditValue('')
  }

  // 일괄 저장
  const handleSaveAll = async () => {
    if (modifiedMaterials.size === 0) {
      alert('변경사항이 없습니다.')
      return
    }
    
    try {
      for (const id of modifiedMaterials) {
        const material = filteredMaterials.find(m => m.id === id)
        if (material) {
          await supabase
            .from('raw_materials')
            .update({
              material_code: material.material_code,
              material_name: material.material_name,
              category_level_1_id: material.category_level_1_id,
              category_level_2_id: material.category_level_2_id,
              category_level_3_id: material.category_level_3_id,
              category_level_4_id: material.category_level_4_id,
              category_level_5_id: material.category_level_5_id,
              category_level_6_id: material.category_level_6_id,
              standard_unit: material.standard_unit,
              supply_status: material.supply_status,
              main_supplier_id: material.main_supplier_id,
              unit_quantity: material.unit_quantity,
              last_trade_date: material.last_trade_date,
              season: material.season,
              season_start_date: material.season_start_date,
              season_peak_date: material.season_peak_date,
              season_end_date: material.season_end_date,
              color_code: material.color_code
            })
            .eq('id', id)
        }
      }
      
      // 시세는 별도 테이블에 저장
      for (const id of modifiedMaterials) {
        const material = filteredMaterials.find(m => m.id === id)
        if (material && material.latest_price) {
          await supabase
            .from('material_price_history')
            .insert({
              material_id: material.id,
              price: material.latest_price,
              unit_quantity: material.unit_quantity || 1,
              effective_date: new Date().toISOString().split('T')[0],
              price_type: 'PURCHASE'
            })
        }
      }
      
      setModifiedMaterials(new Set())
      originalValues.current.clear()
      alert('저장되었습니다.')
      await fetchMaterials()
    } catch (error) {
      console.error('Error saving:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  // ========== CRUD 핸들러 ==========
  const handleSaveMaterial = async () => {
    try {
      if (editingItem) {
        await supabase
          .from('raw_materials')
          .update(formData)
          .eq('id', editingItem.id)
      } else {
        await supabase
          .from('raw_materials')
          .insert([formData])
      }
      
      await fetchMaterials()
      closeModal()
      alert('저장되었습니다.')
    } catch (error) {
      console.error('Error saving material:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (table === 'raw_materials') await fetchMaterials()
      
      alert('삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handlePriceUpdate = async (materialId: string) => {
    const price = prompt('새로운 시세를 입력하세요:')
    if (!price) return
    
    try {
      await supabase
        .from('material_price_history')
        .insert({
          material_id: materialId,
          price: Number(price),
          unit_quantity: 1,
          effective_date: new Date().toISOString().split('T')[0],
          price_type: 'PURCHASE'
        })
      
      await fetchMaterials()
      alert('시세가 등록되었습니다.')
    } catch (error) {
      console.error('Error updating price:', error)
      alert('시세 등록 중 오류가 발생했습니다.')
    }
  }

  // ========== 모달 핸들러 ==========
  const openModal = (type: string, item?: any) => {
    setModalType(type)
    setEditingItem(item)
    
    if (item) {
      setFormData(item)
    } else {
      setFormData({})
    }
  }

  const closeModal = () => {
    setModalType(null)
    setEditingItem(null)
    setFormData({})
  }

  // ========== 렌더링 ==========
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-medium text-gray-900">원물관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          원물 정보와 시세를 통합 관리합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 원물</p>
              <p className="text-2xl font-bold">{stats.totalMaterials.toLocaleString()}</p>
            </div>
            <div className="text-3xl">🌾</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">출하중</p>
              <p className="text-2xl font-bold text-green-600">{stats.shippingMaterials.toLocaleString()}</p>
            </div>
            <div className="text-3xl">🚚</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">시즌종료</p>
              <p className="text-2xl font-bold text-orange-600">{stats.seasonEndMaterials.toLocaleString()}</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">오늘 시세 등록</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayPriceUpdates.toLocaleString()}</p>
            </div>
            <div className="text-3xl">💱</div>
          </div>
        </Card>
      </div>

      {/* 메뉴 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => openModal('material-register')}
          className="text-left"
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white">📝</span>
              </div>
              <span className="text-xs text-gray-500">모달</span>
            </div>
            <h3 className="font-semibold text-lg mb-1">원물등록관리</h3>
            <p className="text-sm text-gray-600">새로운 원물을 등록하고 정보를 수정합니다</p>
          </Card>
        </button>

        <button
          onClick={() => openModal('price-record')}
          className="text-left"
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white">💰</span>
              </div>
              <span className="text-xs text-gray-500">모달</span>
            </div>
            <h3 className="font-semibold text-lg mb-1">시세기록</h3>
            <p className="text-sm text-gray-600">원물별 시세를 기록하고 이력을 관리합니다</p>
          </Card>
        </button>

        <button
          onClick={() => openModal('price-analysis')}
          className="text-left"
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white">📊</span>
              </div>
              <span className="text-xs text-gray-500">모달</span>
            </div>
            <h3 className="font-semibold text-lg mb-1">시세분석</h3>
            <p className="text-sm text-gray-600">시세 변동 추이를 분석하고 예측합니다</p>
          </Card>
        </button>
      </div>

      {/* 필터 영역 */}
      <div className="space-y-4">
        {/* 상태 필터 태그 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체 ({materials.length})
          </button>
          {supplyStatuses.map(status => (
            <button
              key={status.code}
              onClick={() => setSelectedStatus(status.name)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedStatus === status.name 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.name} ({materials.filter(m => m.supply_status === status.name).length})
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <Card
        title={`원물 목록 (${filteredMaterials.length}건)`}
        actions={
          <div className="flex gap-2">
            {selectedRows.size > 0 && (
              <>
                <span className="text-sm text-red-600 mr-2">
                  {selectedRows.size}개 선택됨
                </span>
                <Button 
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  선택 삭제
                </Button>
              </>
            )}
            {modifiedMaterials.size > 0 && (
              <span className="text-sm text-orange-600 mr-2">
                {modifiedMaterials.size}개 항목 수정됨
              </span>
            )}
            <Button 
              variant="primary"
              onClick={handleSaveAll}
              disabled={modifiedMaterials.size === 0}
            >
              변경사항 저장
            </Button>
            <Button onClick={() => openModal('material')}>
              + 원물 추가
            </Button>
          </div>
        }
      >
        {/* 전역 검색 */}
        <div className="mb-4">
          <div className="w-full flex justify-end">
            <div className="relative">
              <input
                type="text"
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="w-[200px] pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg 
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {globalSearchTerm && (
            <p className="mt-2 text-sm text-gray-600 text-right">
              검색 결과: {filteredMaterials.length}건
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse table-fixed">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '100px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-2 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">원물코드</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">원물명</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">대분류</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">중분류</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">품목</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">품종</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">단위</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">현재시세</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">단위수량</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">최근거래</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">주거래처</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">시즌</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">시작일</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">피크시기</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">종료일</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">상태</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">색코드</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material, rowIndex) => (
                <tr 
                  key={material.id} 
                  className={`border-b hover:bg-gray-50 ${
                    modifiedMaterials.has(material.id) ? 'bg-yellow-50' : ''
                  } ${selectedRows.has(material.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(material.id)}
                      onChange={() => handleSelectRow(material.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 0 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 0, material.material_code, 'material_code')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 0 ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'material_code', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'material_code', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 px-1 outline-none text-xs text-center"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      material.material_code
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center font-medium overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 1 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 1, material.material_name, 'material_name')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 1 ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'material_name', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'material_name', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 px-1 outline-none text-xs font-medium text-center"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      material.material_name
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap">
                    {material.category_level_1 || '-'}
                  </td>
                  <td className="px-2 py-2 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap">
                    {material.category_level_2 || '-'}
                  </td>
                  <td className="px-2 py-2 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap">
                    {material.item_type || material.category_level_5 || '-'}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 5 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 5, material.variety || material.category_level_6 || '', 'category_level_6_id')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 5 ? (
                      <select
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value)
                          // 선택한 카테고리의 상위 카테고리들 자동 설정
                          const selectedCat = categories.find(c => c.id === e.target.value)
                          if (selectedCat && selectedCat.level === 6) {
                            updateParentCategories(rowIndex, selectedCat)
                          }
                        }}
                        onBlur={() => handleCellValueChange(rowIndex, 'category_level_6_id', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'category_level_6_id', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 outline-none text-xs"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">선택</option>
                        {categories.filter(c => c.level === 6).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    ) : (
                      material.variety || material.category_level_6 || '-'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 6 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 6, material.standard_unit, 'standard_unit')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 6 ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'standard_unit', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'standard_unit', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 outline-none text-xs text-center"
                        autoFocus
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="개">개</option>
                        <option value="박스">박스</option>
                        <option value="포">포</option>
                        <option value="단">단</option>
                      </select>
                    ) : (
                      material.standard_unit
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-right cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 7 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 7, material.latest_price?.toString() || '', 'latest_price')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 7 ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'latest_price', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'latest_price', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 px-1 outline-none text-xs text-right"
                        autoFocus
                      />
                    ) : (
                      material.latest_price ? `${material.latest_price.toLocaleString()}` : '-'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 8 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 8, material.unit_quantity?.toString() || '1', 'unit_quantity')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 8 ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'unit_quantity', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'unit_quantity', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 px-1 outline-none text-xs text-center"
                        autoFocus
                      />
                    ) : (
                      material.unit_quantity || '1'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 9 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 9, material.last_trade_date || '', 'last_trade_date')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 9 ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'last_trade_date', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'last_trade_date', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 outline-none text-xs"
                        autoFocus
                      />
                    ) : (
                      material.last_trade_date ? new Date(material.last_trade_date).toLocaleDateString('ko-KR').slice(5) : '-'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 10 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 10, material.main_supplier_id || '', 'main_supplier_id')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 10 ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'main_supplier_id', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'main_supplier_id', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 outline-none text-xs"
                        autoFocus
                      >
                        <option value="">선택</option>
                        {suppliers.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </select>
                    ) : (
                      material.supplier_name || '-'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 11 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 11, material.season || '', 'season')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 11 ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'season', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'season', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 px-1 outline-none text-xs text-center"
                        autoFocus
                      />
                    ) : (
                      material.season || '-'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 12 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 12, material.season_start_date || '', 'season_start_date')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 12 ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'season_start_date', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'season_start_date', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 outline-none text-xs"
                        autoFocus
                      />
                    ) : (
                      material.season_start_date ? new Date(material.season_start_date).toLocaleDateString('ko-KR').slice(5) : '-'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 13 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 13, material.season_peak_date || '', 'season_peak_date')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 13 ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'season_peak_date', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'season_peak_date', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 outline-none text-xs"
                        autoFocus
                      />
                    ) : (
                      material.season_peak_date ? new Date(material.season_peak_date).toLocaleDateString('ko-KR').slice(5) : '-'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 14 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 14, material.season_end_date || '', 'season_end_date')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 14 ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'season_end_date', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'season_end_date', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 outline-none text-xs"
                        autoFocus
                      />
                    ) : (
                      material.season_end_date ? new Date(material.season_end_date).toLocaleDateString('ko-KR').slice(5) : '-'
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 15 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 15, material.supply_status, 'supply_status')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 15 ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'supply_status', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'supply_status', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-white border border-blue-500 outline-none text-xs"
                        autoFocus
                      >
                        {supplyStatuses.map(status => (
                          <option key={status.code} value={status.name}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ 
                          backgroundColor: supplyStatuses.find(s => s.name === material.supply_status)?.color || '#9CA3AF'
                        }}
                      >
                        {material.supply_status}
                      </span>
                    )}
                  </td>
                  <td 
                    className={`px-2 py-2 text-xs text-center cursor-pointer ${
                      selectedCell?.row === rowIndex && selectedCell?.col === 16 
                        ? 'ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, 16, material.color_code || '', 'color_code')}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === 16 ? (
                      <input
                        type="color"
                        value={editValue || '#000000'}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellValueChange(rowIndex, 'color_code', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellValueChange(rowIndex, 'color_code', editValue)
                          } else if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full h-6 bg-transparent outline-none cursor-pointer"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      material.color_code ? (
                        <div 
                          className="w-6 h-6 mx-auto rounded border"
                          style={{ backgroundColor: material.color_code }}
                          title={material.color_code}
                        />
                      ) : '-'
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs text-center">
                    <Badge variant="primary" size="sm" className="cursor-pointer mr-1" onClick={() => openModal('material', material)}>
                      수정
                    </Badge>
                    <Badge variant="danger" size="sm" className="cursor-pointer" onClick={() => handleDelete('raw_materials', material.id)}>
                      삭제
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 안내 메시지 */}
        <div className="mt-4 text-sm text-gray-500">
          <p>• 셀을 클릭하여 선택, 다시 클릭하면 편집 모드</p>
          <p>• Enter로 저장, Escape로 취소</p>
        </div>
      </Card>

      {/* 모달들 */}
      {modalType === 'material' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={editingItem ? '원물 수정' : '원물 추가'}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>취소</Button>
              <Button onClick={handleSaveMaterial}>저장</Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="원물코드"
              value={formData.material_code || ''}
              onChange={(e) => setFormData({...formData, material_code: e.target.value})}
              required
            />
            <Input
              label="원물명"
              value={formData.material_name || ''}
              onChange={(e) => setFormData({...formData, material_name: e.target.value})}
              required
            />
            <Select
              label="표준단위"
              value={formData.standard_unit || 'kg'}
              onChange={(e) => setFormData({...formData, standard_unit: e.target.value})}
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'g', label: 'g' },
                { value: '개', label: '개' },
                { value: '박스', label: '박스' }
              ]}
            />
            <Select
              label="공급상태"
              value={formData.supply_status || '출하중'}
              onChange={(e) => setFormData({...formData, supply_status: e.target.value})}
              options={supplyStatuses.map(s => ({ value: s.name, label: s.name }))}
            />
          </div>
        </Modal>
      )}

      {modalType === 'material-register' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="원물등록관리"
          size="xl"
        >
          <div className="space-y-4">
            <p className="text-gray-600">원물 등록 및 관리 기능이 구현될 예정입니다.</p>
          </div>
        </Modal>
      )}

      {modalType === 'price-record' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="시세기록"
          size="xl"
        >
          <div className="space-y-4">
            <p className="text-gray-600">시세 기록 기능이 구현될 예정입니다.</p>
          </div>
        </Modal>
      )}

      {modalType === 'price-analysis' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="시세분석"
          size="xl"
        >
          <div className="space-y-4">
            <p className="text-gray-600">시세 분석 기능이 구현될 예정입니다.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}