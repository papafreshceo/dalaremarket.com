'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface ItemRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultTab?: 'variety' | 'expense'
}

interface CategorySetting {
  expense_type: string | null
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  category_5: string | null
}

export default function ItemRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'variety'
}: ItemRegistrationModalProps) {
  const { showToast } = useToast()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'variety' | 'expense'>(defaultTab)
  const [categorySettings, setCategorySettings] = useState<CategorySetting[]>([])

  const [formData, setFormData] = useState({
    expense_type: '',
    category_1: '',
    category_2: '',
    category_3: '',
    category_4: '',
    category_5: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategorySettings()
      // 탭에 따라 expense_type 자동 설정
      if (activeTab === 'variety') {
        setFormData(prev => ({ ...prev, expense_type: '사입' }))
      } else if (activeTab === 'expense') {
        setFormData(prev => ({ ...prev, expense_type: '지출' }))
      }
    }
  }, [isOpen, activeTab])

  const fetchCategorySettings = async () => {
    const { data } = await supabase
      .from('category_settings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) setCategorySettings(data)
  }

  // 대분류 옵션 가져오기
  const getCategory1Options = () => {
    const filtered = categorySettings.filter(c => {
      if (activeTab === 'variety') return c.expense_type === '사입'
      if (activeTab === 'expense') return c.expense_type === '지출'
      return false
    })
    const uniqueValues = [...new Set(filtered.map(c => c.category_1).filter(Boolean))]
    return uniqueValues.sort()
  }

  // 중분류 옵션 가져오기
  const getCategory2Options = (category1: string) => {
    if (!category1) return []
    const filtered = categorySettings.filter(c =>
      c.expense_type === formData.expense_type && c.category_1 === category1
    )
    const uniqueValues = [...new Set(filtered.map(c => c.category_2).filter(Boolean))]
    return uniqueValues.sort()
  }


  const handleSubmit = async () => {
    // 유효성 검사
    if (activeTab === 'variety' && !formData.category_5) {
      showToast('품종은 필수입니다.', 'warning')
      return
    }
    if (activeTab === 'expense' && !formData.category_4) {
      showToast('품목은 필수입니다.', 'warning')
      return
    }

    const { error } = await supabase.from('item_master').insert([{
      item_name: activeTab === 'variety' ? formData.category_5 : formData.category_4,
      category_1: formData.category_1 || null,
      category_2: formData.category_2 || null,
      category_3: formData.category_3 || null,
      category_4: formData.category_4 || null,
      category_5: activeTab === 'variety' ? formData.category_5 : null,
      is_active: true,
      notes: formData.notes || null
    }])

    if (error) {
      const tabName = activeTab === 'variety' ? '품종' : '지출항목'
      showToast(`${tabName} 등록 실패: ${error.message}`, 'error')
      return
    }

    const tabName = activeTab === 'variety' ? '품종이' : '지출항목이'
    showToast(`${tabName} 등록되었습니다.`, 'success')

    // 폼 초기화
    setFormData({
      expense_type: formData.expense_type,
      category_1: '',
      category_2: '',
      category_3: '',
      category_4: '',
      category_5: '',
      notes: ''
    })

    onSuccess?.()
    onClose()
  }

  const handleClose = () => {
    setFormData({
      expense_type: '',
      category_1: '',
      category_2: '',
      category_3: '',
      category_4: '',
      category_5: '',
      notes: ''
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="항목 추가"
      size="sm"
      footer={
        <>
          <Button onClick={handleClose} variant="ghost">
            취소
          </Button>
          <Button onClick={handleSubmit}>
            등록
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 탭 버튼 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('variety')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'variety'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            품종 등록
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'expense'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            지출항목 등록
          </button>
        </div>

        {/* 폼 영역 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-20">대분류</label>
            <select
              value={formData.category_1}
              onChange={(e) => setFormData({ ...formData, category_1: e.target.value, category_2: '', category_3: '', category_4: '', category_5: '' })}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">선택하세요</option>
              {getCategory1Options().map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-20">중분류</label>
            <select
              value={formData.category_2}
              onChange={(e) => setFormData({ ...formData, category_2: e.target.value, category_3: '', category_4: '', category_5: '' })}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              disabled={!formData.category_1}
            >
              <option value="">선택하세요</option>
              {getCategory2Options(formData.category_1).map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-20">소분류</label>
            <input
              type="text"
              value={formData.category_3}
              onChange={(e) => setFormData({ ...formData, category_3: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              placeholder="소분류를 입력하세요"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-20">
              품목 {activeTab === 'expense' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={formData.category_4}
              onChange={(e) => setFormData({ ...formData, category_4: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              placeholder="품목을 입력하세요"
            />
          </div>

          {/* 품종 등록 탭에만 품종 입력란 표시 */}
          {activeTab === 'variety' && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 w-20">
                품종 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.category_5}
                onChange={(e) => setFormData({ ...formData, category_5: e.target.value })}
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                placeholder="품종을 입력하세요"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-20">비고</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              rows={3}
              placeholder="비고사항을 입력하세요"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
