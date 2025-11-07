// app/admin/settings/supply-status/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input, Select, Badge, Modal, Tabs } from '@/components/ui'
import { Loader2, ArrowRight } from 'lucide-react'

type AnimationStyle =
  | 'pulse_dot'           // 옵션 1: 펄스 도트
  | 'rotating_ring'       // 옵션 2: 회전 링
  | 'slide_bar'           // 옵션 3: 슬라이드 바
  | 'pulse_icon'          // 옵션 4: 펄스 아이콘
  | 'wave_effect'         // 옵션 5: 파동 효과
  | 'bouncing_dots'       // 옵션 6: 깜박이는 도트 3개
  | 'icon_only'           // 옵션 7: 아이콘만
  | 'pulse_background'    // 옵션 8: 펄스 배경
  | 'spinner'             // 옵션 9: 스피너
  | 'minimal_dot'         // 옵션 10: 미니멀 도트
  | 'arrow_flow'          // 옵션 11: 화살표 이동
  | 'icon_with_dot';      // 옵션 12: 아이콘+도트

interface SupplyStatus {
  id: string
  status_type: 'product' | 'option_products'
  code: string
  name: string
  color: string
  display_order: number
  is_active: boolean
  animation_style?: AnimationStyle
  created_at?: string
  updated_at?: string
}

export default function SupplyStatusSettingsPage() {
  const [activeTab, setActiveTab] = useState<'product' | 'option_products'>('product')
  const [statuses, setStatuses] = useState<SupplyStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<SupplyStatus | null>(null)
  const [formData, setFormData] = useState<Partial<SupplyStatus>>({
    status_type: 'product',
    code: '',
    name: '',
    color: '#10B981',
    display_order: 0,
    is_active: true,
    animation_style: 'minimal_dot'
  })

  const supabase = createClient()

  // 애니메이션 스타일 옵션
  const animationOptions = [
    { value: 'pulse_dot', label: '펄스 도트' },
    { value: 'rotating_ring', label: '회전 링' },
    { value: 'slide_bar', label: '슬라이드 바' },
    { value: 'pulse_icon', label: '펄스 아이콘' },
    { value: 'wave_effect', label: '파동 효과' },
    { value: 'bouncing_dots', label: '도트 3개' },
    { value: 'icon_only', label: '아이콘만' },
    { value: 'pulse_background', label: '펄스 배경' },
    { value: 'spinner', label: '스피너' },
    { value: 'minimal_dot', label: '미니멀 도트' },
    { value: 'arrow_flow', label: '화살표' },
    { value: 'icon_with_dot', label: '아이콘+도트' },
  ]

  // 애니메이션 미리보기 렌더링
  const renderAnimationPreview = (style: string, color: string) => {
    const baseColor = color || '#10B981';

    switch (style) {
      case 'pulse_dot':
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full animate-ping absolute" style={{ backgroundColor: baseColor, opacity: 0.4 }} />
              <div className="w-2 h-2 rounded-full relative" style={{ backgroundColor: baseColor }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'rotating_ring':
        return (
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${baseColor} transparent transparent transparent` }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'slide_bar':
        return (
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute h-full w-1/2 rounded-full animate-slide" style={{ backgroundColor: baseColor }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'pulse_icon':
        return (
          <div className="flex items-center gap-2">
            <div className="animate-pulse">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: baseColor }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'wave_effect':
        return (
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full animate-ping" style={{ backgroundColor: baseColor, opacity: 0.3 }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: baseColor }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'bouncing_dots':
        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: baseColor, animationDelay: '0s' }} />
              <div className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: baseColor, animationDelay: '0.2s' }} />
              <div className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: baseColor, animationDelay: '0.4s' }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'icon_only':
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: baseColor }} />
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'pulse_background':
        return (
          <div className="px-2 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: `${baseColor}20` }}>
            <span className="text-xs font-medium" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'spinner':
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: baseColor }} />
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'minimal_dot':
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full animate-ping absolute" style={{ backgroundColor: baseColor, opacity: 0.5 }} />
              <div className="w-1.5 h-1.5 rounded-full relative" style={{ backgroundColor: baseColor }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'arrow_flow':
        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 animate-pulse">
              <ArrowRight className="w-2.5 h-2.5" style={{ color: baseColor }} />
              <ArrowRight className="w-2.5 h-2.5" style={{ color: baseColor, opacity: 0.6 }} />
              <ArrowRight className="w-2.5 h-2.5" style={{ color: baseColor, opacity: 0.3 }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      case 'icon_with_dot':
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full animate-ping absolute -top-0.5 -right-0.5" style={{ backgroundColor: baseColor, opacity: 0.6 }} />
              <div className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5" style={{ backgroundColor: baseColor }} />
              <div className="w-3 h-3 rounded" style={{ backgroundColor: baseColor, opacity: 0.7 }} />
            </div>
            <span className="text-xs" style={{ color: baseColor }}>샘플</span>
          </div>
        );
      default:
        return <span className="text-xs text-gray-400">미리보기 없음</span>;
    }
  }

  // 20가지 색상 옵션
  const colorOptions = [
    { value: '#10B981', label: '초록', preview: 'bg-emerald-500' },
    { value: '#3B82F6', label: '파랑', preview: 'bg-blue-500' },
    { value: '#EF4444', label: '빨강', preview: 'bg-red-500' },
    { value: '#F59E0B', label: '주황', preview: 'bg-amber-500' },
    { value: '#8B5CF6', label: '보라', preview: 'bg-violet-500' },
    { value: '#EC4899', label: '분홍', preview: 'bg-pink-500' },
    { value: '#14B8A6', label: '청록', preview: 'bg-teal-500' },
    { value: '#6366F1', label: '남색', preview: 'bg-indigo-500' },
    { value: '#84CC16', label: '라임', preview: 'bg-lime-500' },
    { value: '#06B6D4', label: '하늘', preview: 'bg-cyan-500' },
    { value: '#F97316', label: '진주황', preview: 'bg-orange-500' },
    { value: '#A855F7', label: '연보라', preview: 'bg-purple-500' },
    { value: '#0EA5E9', label: '밝은파랑', preview: 'bg-sky-500' },
    { value: '#22C55E', label: '밝은초록', preview: 'bg-green-500' },
    { value: '#FBBF24', label: '노랑', preview: 'bg-yellow-400' },
    { value: '#F472B6', label: '연분홍', preview: 'bg-pink-400' },
    { value: '#9CA3AF', label: '회색', preview: 'bg-gray-500' },
    { value: '#475569', label: '진회색', preview: 'bg-slate-600' },
    { value: '#7C3AED', label: '진보라', preview: 'bg-violet-600' },
    { value: '#DC2626', label: '진빨강', preview: 'bg-red-600' }
  ]

  useEffect(() => {
    fetchStatuses()
  }, [activeTab])

  const fetchStatuses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('supply_status_settings')
      .select('*')
      .eq('status_type', activeTab)
      .order('display_order')

    if (!error && data) {
      setStatuses(data)
      // 품목 상태 기본값 체크 및 생성
      if (data.length === 0 && activeTab === 'product') {
        await initializeProductStatuses()
        fetchStatuses()
      }
    }
    setLoading(false)
  }

  const initializeProductStatuses = async () => {
    const defaultStatuses = [
      {
        status_type: 'product' as const,
        code: 'SHIPPING',
        name: '출하중',
        color: '#10B981',
        display_order: 1,
        is_active: true
      },
      {
        status_type: 'product' as const,
        code: 'SEASON_END',
        name: '시즌종료',
        color: '#F59E0B',
        display_order: 2,
        is_active: true
      }
    ]

    await supabase
      .from('supply_status_settings')
      .insert(defaultStatuses)
  }

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        status_type: activeTab
      }


      let result;
      if (editingStatus) {
        result = await supabase
          .from('supply_status_settings')
          .update(dataToSave)
          .eq('id', editingStatus.id)
      } else {
        result = await supabase
          .from('supply_status_settings')
          .insert([dataToSave])
      }


      if (result.error) {
        console.error('❌ 저장 오류:', result.error);
        alert(`저장 실패: ${result.error.message}`);
        return;
      }

      setModalOpen(false)
      setEditingStatus(null)
      setFormData({
        status_type: activeTab,
        code: '',
        name: '',
        color: '#10B981',
        display_order: statuses.length + 1,
        is_active: true
      })
      fetchStatuses()
      alert('저장되었습니다.')
    } catch (error) {
      console.error('Error saving status:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (status: SupplyStatus) => {
    setEditingStatus(status)
    setFormData(status)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await supabase
        .from('supply_status_settings')
        .delete()
        .eq('id', id)

      fetchStatuses()
      alert('삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting status:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleActive = async (status: SupplyStatus) => {
    try {
      await supabase
        .from('supply_status_settings')
        .update({ is_active: !status.is_active })
        .eq('id', status.id)

      fetchStatuses()
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const handleReorder = async (statusId: string, direction: 'up' | 'down') => {
    const index = statuses.findIndex(s => s.id === statusId)
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === statuses.length - 1)
    ) return

    const newStatuses = [...statuses]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    // Swap display_order values
    const tempOrder = newStatuses[index]!.display_order
    newStatuses[index]!.display_order = newStatuses[targetIndex]!.display_order
    newStatuses[targetIndex]!.display_order = tempOrder

    // Swap array positions using temp variable
    const temp = newStatuses[index]
    newStatuses[index] = newStatuses[targetIndex]!
    newStatuses[targetIndex] = temp!

    setStatuses(newStatuses)

    // Update database
    try {
      await Promise.all([
        supabase
          .from('supply_status_settings')
          .update({ display_order: newStatuses[index]!.display_order })
          .eq('id', newStatuses[index]!.id),
        supabase
          .from('supply_status_settings')
          .update({ display_order: newStatuses[targetIndex]!.display_order })
          .eq('id', newStatuses[targetIndex]!.id)
      ])
    } catch (error) {
      console.error('Error reordering:', error)
      fetchStatuses()
    }
  }

  const getBadgeStyle = (color: string) => {
    return {
      backgroundColor: color,
      color: '#ffffff',
      border: `1px solid ${color}`
    }
  }

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'product' | 'option_products')
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <div className="text-[16px] font-bold text-gray-900">공급상태 설정</div>
        <p className="mt-1 text-sm text-gray-600">
          품목 및 옵션상품의 공급상태를 관리합니다
        </p>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('product')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'product'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
           품목 상태
          </button>
          <button
            onClick={() => handleTabChange('option_products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'option_products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            옵션상품 상태
          </button>
        </nav>
      </div>

      {/* 상태 목록 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-[14px] font-medium">
            {activeTab === 'product' ? '품목 상태 목록' : '옵션상품 상태 목록'}
          </div>
          <Button onClick={() => {
            setFormData({
              status_type: activeTab,
              code: '',
              name: '',
              color: '#10B981',
              display_order: statuses.length + 1,
              is_active: true
            })
            setEditingStatus(null)
            setModalOpen(true)
          }}>
            + 상태 추가
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">순서</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">코드</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">이름</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">색상</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">활성</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">작업</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((status, index) => (
                <tr key={status.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReorder(status.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleReorder(status.id, 'down')}
                        disabled={index === statuses.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <span className="ml-2">{status.display_order}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{status.code}</td>
                  <td className="py-3 px-4">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={getBadgeStyle(status.color)}
                    >
                      {status.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border-2"
                        style={{ 
                          backgroundColor: status.color,
                          borderColor: status.color
                        }}
                      />
                      <span className="text-xs text-gray-500">{status.color}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(status)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        status.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {status.is_active ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(status)}
                      >
                        수정
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(status.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {statuses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              등록된 상태가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 상태 추가/수정 모달 */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingStatus ? '상태 수정' : '상태 추가'}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                취소
              </Button>
              <Button variant="primary" onClick={handleSave}>
                저장
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="상태 코드"
              value={formData.code || ''}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              placeholder="예: SHIPPING"
              required
            />
            
            <Input
              label="상태명"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="예: 출하중"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                색상 선택
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({...formData, color: option.value})}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === option.value
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-white hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-xs text-gray-500">
                  {colorOptions.find(o => o.value === formData.color)?.label || formData.color}
                </span>
              </div>
            </div>

            {/* 애니메이션 스타일 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                애니메이션 스타일
              </label>
              <div className="grid grid-cols-2 gap-2">
                {animationOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({...formData, animation_style: option.value as AnimationStyle})}
                    className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all ${
                      formData.animation_style === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xs font-medium text-gray-700">{option.label}</span>
                    <div className="ml-2">
                      {renderAnimationPreview(option.value, formData.color || '#10B981')}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                선택된 스타일: <span className="font-medium">{animationOptions.find(o => o.value === formData.animation_style)?.label}</span>
              </div>
            </div>

            <Input
              label="표시 순서"
              type="number"
              value={formData.display_order || 0}
              onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
              min="0"
            />
          </div>
        </Modal>
      )}
      <style jsx global>{`
        @keyframes slide {
          0%, 100% {
            left: 0;
          }
          50% {
            left: 50%;
          }
        }
        .animate-slide {
          animation: slide 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}