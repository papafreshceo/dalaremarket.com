// app/(admin)/settings/categories/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  code: string
  name: string
  level: number
  parent_id: string | null
  parent_name?: string
  display_order: number
  is_active: boolean
  full_path?: string
  children?: Category[]
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedParent, setSelectedParent] = useState<string>('')
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    level: 1,
    parent_id: null as string | null,
    display_order: 0
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  // 카테고리 조회
  const fetchCategories = async () => {
    try {
      // 계층구조로 조회
      const { data, error } = await supabase
        .from('material_categories')
        .select(`
          *,
          parent:parent_id(name)
        `)
        .order('level')
        .order('display_order')

      if (error) throw error

      // 계층 구조로 정리
      const organized = organizeCategories(data || [])
      setCategories(organized)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // 계층 구조 정리
  const organizeCategories = (flat: any[]): Category[] => {
    const map: { [key: string]: Category } = {}
    const roots: Category[] = []

    // 맵 생성
    flat.forEach(item => {
      map[item.id] = {
        ...item,
        parent_name: item.parent?.name,
        children: []
      }
    })

    // 트리 구성
    flat.forEach(item => {
      if (item.parent_id) {
        if (map[item.parent_id]) {
          map[item.parent_id].children?.push(map[item.id])
        }
      } else {
        roots.push(map[item.id])
      }
    })

    return roots
  }

  // 카테고리 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        // 수정
        const { error } = await supabase
          .from('material_categories')
          .update({
            name: formData.name,
            display_order: formData.display_order
          })
          .eq('id', editingCategory.id)

        if (error) throw error
        alert('카테고리가 수정되었습니다.')
      } else {
        // 추가
        const { error } = await supabase
          .from('material_categories')
          .insert([{
            code: formData.code,
            name: formData.name,
            level: formData.level,
            parent_id: formData.parent_id,
            display_order: formData.display_order
          }])

        if (error) throw error
        alert('카테고리가 추가되었습니다.')
      }

      setShowModal(false)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      console.error('Error saving category:', error)
      alert(error.message || '저장 중 오류가 발생했습니다.')
    }
  }

  // 카테고리 삭제
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 카테고리를 삭제하시겠습니까?\n하위 카테고리가 있으면 삭제할 수 없습니다.`)) return

    try {
      const { error } = await supabase
        .from('material_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('카테고리가 삭제되었습니다.')
      fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      if (error.message.includes('foreign key')) {
        alert('하위 카테고리나 연결된 원물이 있어 삭제할 수 없습니다.')
      } else {
        alert('삭제 중 오류가 발생했습니다.')
      }
    }
  }

  // 활성/비활성 토글
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('material_categories')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchCategories()
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      level: 1,
      parent_id: null,
      display_order: 0
    })
    setEditingCategory(null)
    setSelectedParent('')
  }

  // 새 카테고리 추가 모달 열기
  const openAddModal = (level: number, parentId?: string) => {
    resetForm()
    setFormData({
      ...formData,
      level,
      parent_id: parentId || null
    })
    setSelectedParent(parentId || '')
    setShowModal(true)
  }

  // 카테고리 트리 렌더링
  const renderCategoryTree = (category: Category, depth: number = 0) => {
    const paddingLeft = depth * 20
    
    return (
      <div key={category.id}>
        <div 
          className={`flex items-center justify-between py-2 px-4 hover:bg-gray-50 ${
            depth === 0 ? 'border-t' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft + 16}px` }}
        >
          <div className="flex items-center space-x-3">
            {depth > 0 && (
              <span className="text-gray-400">└</span>
            )}
            <span className="font-medium">{category.name}</span>
            <span className="text-xs text-gray-500">({category.code})</span>
            {category.level === 1 && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">대분류</span>
            )}
            {category.level === 2 && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">중분류</span>
            )}
            {category.level === 3 && (
              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">소분류</span>
            )}
            {category.level === 4 && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">세분류</span>
            )}
            {category.level === 5 && (
              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">품목</span>
            )}
            {category.level === 6 && (
              <span className="px-2 py-0.5 text-xs bg-pink-100 text-pink-800 rounded">품종</span>
            )}
            {!category.is_active && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">비활성</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {category.level < 6 && (
              <button
                onClick={() => openAddModal(category.level + 1, category.id)}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                + 하위추가
              </button>
            )}
            <button
              onClick={() => {
                setEditingCategory(category)
                setFormData({
                  code: category.code,
                  name: category.name,
                  level: category.level,
                  parent_id: category.parent_id,
                  display_order: category.display_order
                })
                setShowModal(true)
              }}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              수정
            </button>
            <button
              onClick={() => toggleActive(category.id, category.is_active)}
              className={`px-2 py-1 text-xs rounded ${
                category.is_active 
                  ? 'bg-gray-500 text-white hover:bg-gray-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {category.is_active ? '비활성' : '활성'}
            </button>
            <button
              onClick={() => handleDelete(category.id, category.name)}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </div>
        
        {category.children && category.children.map(child => 
          renderCategoryTree(child, depth + 1)
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">카테고리 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            원물 분류 체계를 관리합니다. 대분류 → 중분류 → 소분류 → 세분류 → 품목 → 품종 (6단계) 구조입니다.
          </p>
        </div>
        <button
          onClick={() => openAddModal(1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 대분류 추가
        </button>
      </div>

      {/* 카테고리 트리 */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium">카테고리 구조</h3>
        </div>
        <div className="divide-y">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              등록된 카테고리가 없습니다.
            </div>
          ) : (
            categories.map(category => renderCategoryTree(category))
          )}
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingCategory ? '카테고리 수정' : '카테고리 추가'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    카테고리 코드 *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    placeholder="예: CAT001"
                    required
                    disabled={editingCategory !== null}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    카테고리명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    placeholder="예: 농산물"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    분류 레벨
                  </label>
                  <input
                    type="text"
                    value={
                      formData.level === 1 ? '대분류' : 
                      formData.level === 2 ? '중분류' : 
                      formData.level === 3 ? '소분류' :
                      formData.level === 4 ? '세분류' :
                      formData.level === 5 ? '품목' : '품종'
                    }
                    className="mt-1 block w-full rounded-md bg-gray-100 p-2"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    표시 순서
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    min="0"
                  />
                </div>
              </div>

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
                  {editingCategory ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}