'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface CloudinaryImage {
  id: string
  secure_url: string
  title?: string
  width?: number
  height?: number
}

interface PromotionalImage {
  id: number
  image_id: string | null
  image?: CloudinaryImage
  section: string
  display_order: number
  title: string
  link_url: string
  is_active: boolean
}

type Section = 'hero' | 'tab1' | 'tab2' | 'tab3' | 'tab4'

const SECTION_CONFIG = {
  hero: { name: '히어로 섹션', slots: 1 },
  tab1: { name: '한눈에 보는 상품', slots: 4 },
  tab2: { name: '간편 발주시스템', slots: 4 },
  tab3: { name: '셀러 업무도구', slots: 4 },
  tab4: { name: '다양한 서비스', slots: 4 },
}

export default function PromotionalImagesPage() {
  const { showToast } = useToast()
  const [activeSection, setActiveSection] = useState<Section>('hero')
  const [slots, setSlots] = useState<Record<Section, PromotionalImage[]>>({
    hero: [],
    tab1: [],
    tab2: [],
    tab3: [],
    tab4: [],
  })
  const [loading, setLoading] = useState(true)
  const [editingSlot, setEditingSlot] = useState<PromotionalImage | null>(null)
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false)
  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryImage[]>([])

  // 프로모션 슬롯 조회
  const fetchSlots = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/promotional-images')
      const result = await response.json()

      if (result.success) {
        const allSlots = result.data || []

        // 섹션별로 그룹화하고 부족한 슬롯 생성
        const groupedSlots: Record<Section, PromotionalImage[]> = {
          hero: [],
          tab1: [],
          tab2: [],
          tab3: [],
          tab4: [],
        }

        Object.keys(SECTION_CONFIG).forEach((section) => {
          const sectionKey = section as Section
          const config = SECTION_CONFIG[sectionKey]
          const existingSlots = allSlots.filter((s: PromotionalImage) => s.section === section)

          // 슬롯 번호별로 정렬하고 부족한 슬롯 추가
          const fullSlots = Array.from({ length: config.slots }, (_, i) => {
            const order = i + 1
            const existing = existingSlots.find((s: PromotionalImage) => s.display_order === order)
            return existing || {
              id: 0,
              image_id: null,
              section: sectionKey,
              display_order: order,
              title: `${config.name} ${order}`,
              link_url: '',
              is_active: true,
            }
          })

          groupedSlots[sectionKey] = fullSlots
        })

        setSlots(groupedSlots)
      } else {
        showToast(result.error || '슬롯 목록을 불러오는데 실패했습니다.', 'error')
      }
    } catch (error: any) {
      showToast(error.message || '슬롯 목록을 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Cloudinary 이미지 목록 조회
  const fetchCloudinaryImages = async () => {
    try {
      const response = await fetch('/api/cloudinary/images?limit=100')
      const result = await response.json()

      if (result.success) {
        setCloudinaryImages(result.data || [])
      }
    } catch (error) {
      console.error('이미지 목록 조회 실패:', error)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  const handleEdit = (slot: PromotionalImage) => {
    setEditingSlot(slot)
  }

  const handleSave = async () => {
    if (!editingSlot) return

    try {
      const method = editingSlot.id > 0 ? 'PUT' : 'POST'
      const response = await fetch('/api/admin/promotional-images', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSlot.id > 0 ? editingSlot.id : undefined,
          image_id: editingSlot.image_id,
          section: editingSlot.section,
          display_order: editingSlot.display_order,
          title: editingSlot.title,
          link_url: editingSlot.link_url,
          is_active: editingSlot.is_active,
          image_url: '',
        }),
      })
      const result = await response.json()

      if (result.success) {
        showToast('저장되었습니다.', 'success')
        setEditingSlot(null)
        fetchSlots()
      } else {
        showToast(result.error || '저장에 실패했습니다.', 'error')
      }
    } catch (error: any) {
      showToast(error.message || '저장에 실패했습니다.', 'error')
    }
  }

  const toggleActive = async (slot: PromotionalImage) => {
    if (slot.id === 0) {
      showToast('먼저 슬롯을 저장해주세요.', 'error')
      return
    }

    try {
      const response = await fetch('/api/admin/promotional-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slot.id,
          is_active: !slot.is_active,
        }),
      })
      const result = await response.json()

      if (result.success) {
        showToast(
          !slot.is_active ? '슬롯이 활성화되었습니다.' : '슬롯이 비활성화되었습니다.',
          'success'
        )
        fetchSlots()
      } else {
        showToast(result.error || '상태 변경에 실패했습니다.', 'error')
      }
    } catch (error: any) {
      showToast(error.message || '상태 변경에 실패했습니다.', 'error')
    }
  }

  const handleSelectImage = (image: CloudinaryImage) => {
    if (editingSlot) {
      setEditingSlot({
        ...editingSlot,
        image_id: image.id,
        image,
      })
      setIsImageSelectorOpen(false)
    }
  }

  const openImageSelector = () => {
    fetchCloudinaryImages()
    setIsImageSelectorOpen(true)
  }

  // 섹션별 레이아웃 렌더링
  const renderSectionLayout = (section: Section) => {
    const sectionSlots = slots[section]

    if (loading) {
      return <div className="py-12 text-center text-text-tertiary">로딩 중...</div>
    }

    // 히어로 섹션 - 단일 큰 이미지
    if (section === 'hero') {
      const slot = sectionSlots[0]
      if (!slot) return null

      return (
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-text">히어로 이미지</div>
              <button
                onClick={() => toggleActive(slot)}
                className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                  slot.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
                disabled={slot.id === 0}
              >
                {slot.is_active ? '활성' : '비활성'}
              </button>
            </div>

            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-border">
              {slot.image?.secure_url ? (
                <img
                  src={slot.image.secure_url}
                  alt={slot.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                  이미지 영역
                </div>
              )}
            </div>

            {slot.link_url && (
              <div className="text-xs text-text-secondary truncate">🔗 {slot.link_url}</div>
            )}

            <Button
              onClick={() => handleEdit(slot)}
              className="w-full px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
            >
              설정
            </Button>
          </div>
        </div>
      )
    }

    // 탭 1, 2 - 2x2 그리드
    if (section === 'tab1' || section === 'tab2') {
      return (
        <div className="grid grid-cols-2 gap-4">
          {sectionSlots.map((slot) => (
            <div
              key={`${slot.section}-${slot.display_order}`}
              className="bg-surface border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {slot.display_order}
                  </div>
                  <div className="text-sm font-medium text-text">{slot.title}</div>
                </div>
                <button
                  onClick={() => toggleActive(slot)}
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    slot.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  disabled={slot.id === 0}
                >
                  {slot.is_active ? '활성' : '비활성'}
                </button>
              </div>

              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-border">
                {slot.image?.secure_url ? (
                  <img
                    src={slot.image.secure_url}
                    alt={slot.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-tertiary text-sm">
                    {section === 'tab1' ? '상품 홍보' : '발주 기능'} {slot.display_order}
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleEdit(slot)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover text-text"
              >
                설정
              </Button>
            </div>
          ))}
        </div>
      )
    }

    // 탭 3 - 세로형 4개
    if (section === 'tab3') {
      return (
        <div className="grid grid-cols-4 gap-4">
          {sectionSlots.map((slot) => (
            <div
              key={`${slot.section}-${slot.display_order}`}
              className="bg-surface border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs">
                  {slot.display_order}
                </div>
                <button
                  onClick={() => toggleActive(slot)}
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    slot.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  disabled={slot.id === 0}
                >
                  {slot.is_active ? '활성' : '비활성'}
                </button>
              </div>

              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-border">
                {slot.image?.secure_url ? (
                  <img
                    src={slot.image.secure_url}
                    alt={slot.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-tertiary text-sm">
                    도구 {slot.display_order}
                  </div>
                )}
              </div>

              <div className="text-xs font-medium text-text truncate">{slot.title}</div>

              <Button
                onClick={() => handleEdit(slot)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover text-text"
              >
                설정
              </Button>
            </div>
          ))}
        </div>
      )
    }

    // 탭 4 - 혼합 레이아웃 (CSS Grid로 루트 페이지와 동일하게)
    if (section === 'tab4') {
      return (
        <div className="grid grid-cols-3 gap-4">
          {sectionSlots.map((slot, index) => {
            // 첫 번째는 2행, 마지막은 2열 span
            const gridClass =
              index === 0
                ? 'row-span-2'
                : index === 3
                ? 'col-span-2'
                : ''

            return (
              <div
                key={`${slot.section}-${slot.display_order}`}
                className={`bg-surface border border-border rounded-lg p-4 space-y-3 ${gridClass}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {slot.display_order}
                  </div>
                  <button
                    onClick={() => toggleActive(slot)}
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      slot.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    disabled={slot.id === 0}
                  >
                    {slot.is_active ? '활성' : '비활성'}
                  </button>
                </div>

                <div
                  className={`bg-gray-100 rounded-lg overflow-hidden border border-border ${
                    index === 0 ? 'aspect-[3/4]' : index === 3 ? 'aspect-[8/3]' : 'aspect-[4/3]'
                  }`}
                >
                  {slot.image?.secure_url ? (
                    <img
                      src={slot.image.secure_url}
                      alt={slot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary text-sm">
                      서비스 {slot.display_order}
                    </div>
                  )}
                </div>

                <div className="text-xs font-medium text-text truncate">{slot.title}</div>

                <Button
                  onClick={() => handleEdit(slot)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover text-text"
                >
                  설정
                </Button>
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>프로모션 이미지 관리</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          플랫폼 메인 페이지에 표시되는 이미지를 섹션별로 관리합니다.
        </p>
      </div>

      {/* 섹션 탭 (루트 페이지와 동일한 구조) */}
      <div className="bg-surface border border-border rounded-lg p-2">
        <div className="flex gap-2">
          {Object.entries(SECTION_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as Section)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === key
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'hover:bg-surface-hover text-text-secondary'
              }`}
            >
              {config.name}
            </button>
          ))}
        </div>
      </div>

      {/* 섹션별 레이아웃 (루트 페이지와 동일) */}
      <div className="bg-background p-6 rounded-lg border border-border">
        {renderSectionLayout(activeSection)}
      </div>

      {/* 슬롯 편집 모달 */}
      {editingSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text mb-4">
              {SECTION_CONFIG[editingSlot.section as Section].name} - 슬롯{' '}
              {editingSlot.display_order} 설정
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">슬롯 제목</label>
                <input
                  type="text"
                  value={editingSlot.title}
                  onChange={(e) => setEditingSlot({ ...editingSlot, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="슬롯 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">이미지</label>
                <div className="flex items-start gap-3">
                  {editingSlot.image?.secure_url ? (
                    <div className="relative">
                      <img
                        src={editingSlot.image.secure_url}
                        alt="선택된 이미지"
                        className="w-40 h-24 object-cover rounded border"
                      />
                      <button
                        onClick={() =>
                          setEditingSlot({ ...editingSlot, image_id: null, image: undefined })
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-40 h-24 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">
                      이미지 없음
                    </div>
                  )}
                  <Button
                    onClick={openImageSelector}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
                  >
                    Cloudinary 이미지 선택
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">링크 URL</label>
                <input
                  type="url"
                  value={editingSlot.link_url}
                  onChange={(e) => setEditingSlot({ ...editingSlot, link_url: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="https://example.com"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  이미지 클릭 시 이동할 URL (선택사항)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  checked={editingSlot.is_active}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, is_active: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active_edit" className="text-sm text-text">
                  슬롯 활성화
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 선택 모달 */}
      {isImageSelectorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-surface rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text mb-4">Cloudinary 이미지 선택</h2>

            <div className="grid grid-cols-3 gap-4">
              {cloudinaryImages.map((image) => (
                <div
                  key={image.id}
                  className="cursor-pointer border-2 border-transparent hover:border-primary rounded-lg overflow-hidden transition-all"
                  onClick={() => handleSelectImage(image)}
                >
                  <img
                    src={image.secure_url}
                    alt={image.title || '이미지'}
                    className="w-full h-40 object-cover"
                  />
                  {image.title && (
                    <div className="p-2 text-xs text-text-secondary truncate bg-background">
                      {image.title}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {cloudinaryImages.length === 0 && (
              <div className="py-12 text-center text-text-tertiary">
                사용 가능한 이미지가 없습니다.
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setIsImageSelectorOpen(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
