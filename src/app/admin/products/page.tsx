'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  supplier_price: number
  selling_price: number
  stock_quantity: number
  unit: string
  is_active: boolean
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    supplier_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    unit: '개',
    is_active: true
  })

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  // 상품 목록 조회
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // 상품 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProduct) {
        // 수정
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id)

        if (error) throw error
        alert('상품이 수정되었습니다.')
      } else {
        // 추가
        const { error } = await supabase
          .from('products')
          .insert([formData])

        if (error) throw error
        alert('상품이 추가되었습니다.')
      }

      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  // 상품 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('상품이 삭제되었습니다.')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 수정 모드
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      supplier_price: product.supplier_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      unit: product.unit,
      is_active: product.is_active
    })
    setShowModal(true)
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      supplier_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      unit: '개',
      is_active: true
    })
    setEditingProduct(null)
  }

  if (loading) {
    return <div className="p-6">로딩 중...</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
          <p className="mt-1 text-sm text-gray-600">총 {products.length}개의 상품이 등록되어 있습니다.</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 새 상품 추가
        </button>
      </div>

      {/* 상품 목록 테이블 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">공급가</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매가</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">재고</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                  등록된 상품이 없습니다.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">₩{product.supplier_price?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">₩{product.selling_price?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.stock_quantity} {product.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? '상품 수정' : '새 상품 추가'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    단위
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    공급가
                  </label>
                  <input
                    type="number"
                    value={formData.supplier_price}
                    onChange={(e) => setFormData({...formData, supplier_price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    판매가
                  </label>
                  <input
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({...formData, selling_price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    재고 수량
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <select
                    value={formData.is_active.toString()}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProduct ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}