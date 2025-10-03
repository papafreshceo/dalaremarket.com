// app/admin/products/page.tsx
'use client'

import { useState, useEffect } from 'react'
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
  standard_unit: string
  supply_status: string
  main_supplier_id: string | null
  latest_price?: number
  supplier_name?: string
  full_category_path?: string
  category_level_1?: string
  category_level_2?: string
  category_level_3?: string
  category_level_4?: string
  category_level_5?: string
  category_level_6?: string
  created_at?: string
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
  images?: string[]
  is_active: boolean
  metadata?: any
  created_at?: string
}

interface FormData {
  // 원물 폼
  material_code?: string
  material_name?: string
  category_level_1_id?: string
  category_level_2_id?: string
  category_level_3_id?: string
  category_level_4_id?: string
  category_level_5_id?: string
  category_level_6_id?: string
  standard_unit?: string
  supply_status?: string
  main_supplier_id?: string
  // 상품 폼
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
  // 거래처 폼
  code?: string
  supplier_code?: string
  supplier_name?: string
  business_number?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
}

export default function ProductsManagementPage() {
  // ========== 상태 관리 ==========
  const [mainTab, setMainTab] = useState('raw-materials')
  const [subTab, setSubTab] = useState('list')
  const [loading, setLoading] = useState(false)
  
  // 데이터
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  
  // 모달
  const [modalType, setModalType] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // 폼 데이터
  const [formData, setFormData] = useState<FormData>({})
  
  const supabase = createClient()

  // ========== 데이터 로드 ==========
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMaterials(),
        fetchProducts(),
        fetchCategories(),
        fetchSuppliers()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('v_raw_materials_full')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setMaterials(data)
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

  // ========== 카테고리 필터링 ==========
  const getCategoriesByLevel = (level: number, parentId?: string) => {
    return categories.filter(cat => {
      if (cat.level !== level) return false
      if (level === 1) return true
      return cat.parent_id === parentId
    })
  }

  // ========== 테이블 컬럼 정의 ==========
  const materialColumns = [
    { key: 'material_code', label: '원물코드', width: '120px' },
    { 
      key: 'material_name', 
      label: '원물명',
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    { 
      key: 'full_category_path', 
      label: '카테고리',
      render: (value: string, row: RawMaterial) => {
        const path = [
          row.category_level_1,
          row.category_level_2,
          row.category_level_3,
          row.category_level_4,
          row.category_level_5,
          row.category_level_6
        ].filter(Boolean).join(' > ')
        return <span className="text-sm text-gray-600">{path || '-'}</span>
      }
    },
    { key: 'standard_unit', label: '단위', width: '80px' },
    { 
      key: 'latest_price', 
      label: '최근시세',
      align: 'right' as const,
      render: (value: number) => value ? `${value.toLocaleString()}원` : '-'
    },
    { key: 'supplier_name', label: '거래처' },
    { 
      key: 'supply_status', 
      label: '상태',
      render: (value: string) => {
        const statusVariants: Record<string, any> = {
          '공급중': 'success',
          '일시중단': 'warning',
          '품절': 'danger',
          '시즌종료': 'default',
          '대기중': 'info'
        }
        return <Badge variant={statusVariants[value] || 'default'}>{value}</Badge>
      }
    }
  ]

  const productColumns = [
    { key: 'sku', label: 'SKU', width: '120px' },
    { 
      key: 'name', 
      label: '상품명',
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    { key: 'category', label: '카테고리' },
    { 
      key: 'supplier_price', 
      label: '공급가',
      align: 'right' as const,
      render: (value: number) => `${value.toLocaleString()}원`
    },
    { 
      key: 'selling_price', 
      label: '판매가',
      align: 'right' as const,
      render: (value: number) => `${value.toLocaleString()}원`
    },
    { 
      key: 'margin_rate', 
      label: '마진율',
      align: 'center' as const,
      render: (value: number, row: Product) => {
        const margin = Math.round((1 - row.supplier_price / row.selling_price) * 100)
        return `${margin}%`
      }
    },
    { 
      key: 'stock_quantity', 
      label: '재고',
      align: 'center' as const,
      render: (value: number, row: Product) => `${value} ${row.unit}`
    },
    { 
      key: 'is_active', 
      label: '상태',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? '판매중' : '중단'}
        </Badge>
      )
    }
  ]

  const supplierColumns = [
    { key: 'code', label: '거래처코드', width: '120px' },
    { 
      key: 'name', 
      label: '거래처명',
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    { key: 'business_number', label: '사업자번호' },
    { key: 'contact_person', label: '담당자' },
    { key: 'phone', label: '연락처' },
    { key: 'email', label: '이메일' },
    { 
      key: 'is_active', 
      label: '상태',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? '활성' : '비활성'}
        </Badge>
      )
    }
  ]

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

  const handleSaveProduct = async () => {
    try {
      const productData = {
        ...formData,
        is_active: formData.is_active !== false
      }
      
      if (editingItem) {
        await supabase
          .from('products')
          .update(productData)
          .eq('id', editingItem.id)
      } else {
        await supabase
          .from('products')
          .insert([productData])
      }
      
      await fetchProducts()
      closeModal()
      alert('저장되었습니다.')
    } catch (error) {
      console.error('Error saving product:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleSaveSupplier = async () => {
    try {
      const supplierData = {
        code: formData.supplier_code || formData.code,
        name: formData.supplier_name || formData.name,
        business_number: formData.business_number,
        contact_person: formData.contact_person,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        is_active: true
      }
      
      if (editingItem) {
        await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingItem.id)
      } else {
        await supabase
          .from('suppliers')
          .insert([supplierData])
      }
      
      await fetchSuppliers()
      closeModal()
      alert('저장되었습니다.')
    } catch (error) {
      console.error('Error saving supplier:', error)
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
      else if (table === 'products') await fetchProducts()
      else if (table === 'suppliers') await fetchSuppliers()
      
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

  // ========== 탭 정의 ==========
  const mainTabs = [
    { key: 'raw-materials', label: '원물관리' },
    { key: 'option-products', label: '옵션상품관리' }
  ]

  const materialSubTabs = [
    { key: 'list', label: '원물정보' },
    { key: 'price', label: '시세기록' },
    { key: 'suppliers', label: '거래처등록' }
  ]

  const productSubTabs = [
    { key: 'list', label: '상품목록' },
    { key: 'pricing', label: '공급가결정' },
    { key: 'thumbnail', label: '썸네일관리' }
  ]

  // ========== 렌더링 ==========
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-medium text-gray-900">상품관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          원물 정보와 옵션상품을 통합 관리합니다
        </p>
      </div>

      {/* 메인 컨테이너 */}
      <Card padding="none">
        {/* 메인 탭 */}
        <div className="border-b">
          <Tabs
            tabs={mainTabs}
            activeTab={mainTab}
            onChange={(key) => {
              setMainTab(key)
              setSubTab('list')
            }}
          />
        </div>

        {/* 원물관리 */}
        {mainTab === 'raw-materials' && (
          <>
            {/* 서브 탭 */}
            <div className="border-b bg-gray-50">
              <div className="px-6">
                <Tabs
                  tabs={materialSubTabs}
                  activeTab={subTab}
                  onChange={setSubTab}
                />
              </div>
            </div>

            {/* 원물정보 탭 */}
            {subTab === 'list' && (
              <div className="p-6">
                <Card
                  title="원물 목록"
                  actions={
                    <Button onClick={() => openModal('material')}>
                      + 원물 추가
                    </Button>
                  }
                >
                  <DataTable
                    columns={materialColumns}
                    data={materials}
                    loading={loading}
                    onEdit={(row) => openModal('material', row)}
                    onDelete={(row) => handleDelete('raw_materials', row.id)}
                    emptyMessage="등록된 원물이 없습니다"
                  />
                </Card>
              </div>
            )}

            {/* 시세기록 탭 */}
            {subTab === 'price' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map((material) => (
                    <Card key={material.id} padding="sm">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">{material.material_name}</h4>
                          <p className="text-sm text-gray-500">{material.material_code}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            현재시세: <span className="font-medium">
                              {material.latest_price ? `${material.latest_price.toLocaleString()}원` : '미등록'}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">
                            단위: {material.standard_unit}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          onClick={() => handlePriceUpdate(material.id)}
                        >
                          시세 업데이트
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 거래처등록 탭 */}
            {subTab === 'suppliers' && (
              <div className="p-6">
                <Card
                  title="거래처 목록"
                  actions={
                    <Button onClick={() => openModal('supplier')}>
                      + 거래처 추가
                    </Button>
                  }
                >
                  <DataTable
                    columns={supplierColumns}
                    data={suppliers}
                    loading={loading}
                    onEdit={(row) => openModal('supplier', row)}
                    onDelete={(row) => handleDelete('suppliers', row.id)}
                    emptyMessage="등록된 거래처가 없습니다"
                  />
                </Card>
              </div>
            )}
          </>
        )}

        {/* 옵션상품관리 */}
        {mainTab === 'option-products' && (
          <>
            {/* 서브 탭 */}
            <div className="border-b bg-gray-50">
              <div className="px-6">
                <Tabs
                  tabs={productSubTabs}
                  activeTab={subTab}
                  onChange={setSubTab}
                />
              </div>
            </div>

            {/* 상품목록 탭 */}
            {subTab === 'list' && (
              <div className="p-6">
                <Card
                  title="상품 목록"
                  actions={
                    <Button onClick={() => openModal('product')}>
                      + 상품 추가
                    </Button>
                  }
                >
                  <DataTable
                    columns={productColumns}
                    data={products}
                    loading={loading}
                    onEdit={(row) => openModal('product', row)}
                    onDelete={(row) => handleDelete('products', row.id)}
                    emptyMessage="등록된 상품이 없습니다"
                  />
                </Card>
              </div>
            )}

            {/* 공급가결정 탭 */}
            {subTab === 'pricing' && (
              <div className="p-6">
                <Card title="가격 정책 설정" className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="기본 마진율 (%)"
                      type="number"
                      placeholder="30"
                      helper="모든 상품에 적용될 기본 마진율"
                    />
                    <Input
                      label="플랫폼 수수료 (%)"
                      type="number"
                      placeholder="10"
                      helper="플랫폼 이용 수수료"
                    />
                    <Input
                      label="무료배송 기준 (원)"
                      type="number"
                      placeholder="50000"
                      helper="이 금액 이상 구매시 무료배송"
                    />
                  </div>
                  <div className="mt-4">
                    <Button variant="primary">정책 저장</Button>
                  </div>
                </Card>

                <Card title="상품별 가격 설정">
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              원가: {product.supplier_price.toLocaleString()}원
                            </p>
                            <p className="font-medium">
                              판매가: {product.selling_price.toLocaleString()}원
                            </p>
                            <p className="text-sm text-green-600">
                              마진: {Math.round((1 - product.supplier_price / product.selling_price) * 100)}%
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            type="number"
                            placeholder="원가"
                            defaultValue={product.supplier_price}
                          />
                          <Input
                            type="number"
                            placeholder="마진율(%)"
                          />
                          <Input
                            type="number"
                            placeholder="판매가"
                            defaultValue={product.selling_price}
                          />
                          <Button variant="primary" size="sm">
                            가격 수정
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* 썸네일관리 탭 */}
            {subTab === 'thumbnail' && (
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} padding="sm">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        {product.thumbnail_url ? (
                          <img 
                            src={product.thumbnail_url} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No Image</span>
                        )}
                      </div>
                      <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                      <p className="text-xs text-gray-500 mb-3">{product.sku}</p>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => alert('이미지 업로드 기능 구현 예정')}
                      >
                        이미지 변경
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* 원물 추가/수정 모달 - 간략화 */}
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
              value={formData.supply_status || '대기중'}
              onChange={(e) => setFormData({...formData, supply_status: e.target.value})}
              options={[
                { value: '대기중', label: '대기중' },
                { value: '공급중', label: '공급중' },
                { value: '품절', label: '품절' }
              ]}
            />
          </div>
        </Modal>
      )}

      {/* 상품 추가/수정 모달 - 간략화 */}
      {modalType === 'product' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={editingItem ? '상품 수정' : '상품 추가'}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>취소</Button>
              <Button onClick={handleSaveProduct}>저장</Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={formData.sku || ''}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              required
            />
            <Input
              label="상품명"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <Input
              label="공급가"
              type="number"
              value={formData.supplier_price || ''}
              onChange={(e) => setFormData({...formData, supplier_price: Number(e.target.value)})}
            />
            <Input
              label="판매가"
              type="number"
              value={formData.selling_price || ''}
              onChange={(e) => setFormData({...formData, selling_price: Number(e.target.value)})}
            />
          </div>
        </Modal>
      )}

      {/* 거래처 추가/수정 모달 - 간략화 */}
      {modalType === 'supplier' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={editingItem ? '거래처 수정' : '거래처 추가'}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>취소</Button>
              <Button onClick={handleSaveSupplier}>저장</Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="거래처코드"
              value={formData.supplier_code || ''}
              onChange={(e) => setFormData({...formData, supplier_code: e.target.value})}
              required
            />
            <Input
              label="거래처명"
              value={formData.supplier_name || ''}
              onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
              required
            />
            <Input
              label="연락처"
              value={formData.phone || ''}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <Input
              label="이메일"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}