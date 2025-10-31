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

interface Popup {
  id: string
  title: string
  content: string
  image_id: string | null
  image?: CloudinaryImage
  popup_type: 'notice' | 'promotion' | 'event'
  link_url: string
  is_active: boolean
  display_order: number
  width: number
  height: number
  position_x: number
  position_y: number
  start_date: string
  end_date: string
  enable_today_close: boolean
  created_at: string
}

export default function PopupsPage() {
  const { showToast } = useToast()
  const [popups, setPopups] = useState<Popup[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null)
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false)
  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryImage[]>([])

  // 팝업 목록 조회
  const fetchPopups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/popups?include_image=true')
      const result = await response.json()

      if (result.success) {
        setPopups(result.data || [])
      } else {
        showToast(result.error || '팝업 목록을 불러오는데 실패했습니다.', 'error')
      }
    } catch (error: any) {
      showToast(error.message || '팝업 목록을 불러오는데 실패했습니다.', 'error')
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
    fetchPopups()
  }, [])

  const handleAdd = () => {
    setEditingPopup({
      id: '',
      title: '',
      content: '',
      image_id: null,
      popup_type: 'notice',
      link_url: '',
      is_active: true,
      display_order: popups.length + 1,
      width: 400,
      height: 500,
      position_x: 100,
      position_y: 100,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      enable_today_close: true,
      created_at: new Date().toISOString(),
    })
    setIsModalOpen(true)
  }

  const handleEdit = (popup: Popup) => {
    setEditingPopup({
      ...popup,
      start_date: popup.start_date ? popup.start_date.split('T')[0] : '',
      end_date: popup.end_date ? popup.end_date.split('T')[0] : '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('팝업을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/popups?id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        showToast('팝업이 삭제되었습니다.', 'success')
        fetchPopups()
      } else {
        showToast(result.error || '삭제에 실패했습니다.', 'error')
      }
    } catch (error: any) {
      showToast(error.message || '삭제에 실패했습니다.', 'error')
    }
  }

  const handleSave = async () => {
    if (!editingPopup) return

    if (!editingPopup.title) {
      showToast('팝업 제목을 입력하세요.', 'error')
      return
    }

    try {
      const method = editingPopup.id ? 'PUT' : 'POST'
      const response = await fetch('/api/popups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPopup),
      })
      const result = await response.json()

      if (result.success) {
        showToast(result.message || '저장되었습니다.', 'success')
        setIsModalOpen(false)
        setEditingPopup(null)
        fetchPopups()
      } else {
        showToast(result.error || '저장에 실패했습니다.', 'error')
      }
    } catch (error: any) {
      showToast(error.message || '저장에 실패했습니다.', 'error')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const popup = popups.find((p) => p.id === id)
      if (!popup) return

      const response = await fetch('/api/popups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...popup,
          is_active: !currentStatus,
        }),
      })
      const result = await response.json()

      if (result.success) {
        showToast(
          !currentStatus ? '팝업이 활성화되었습니다.' : '팝업이 비활성화되었습니다.',
          'success'
        )
        fetchPopups()
      } else {
        showToast(result.error || '상태 변경에 실패했습니다.', 'error')
      }
    } catch (error: any) {
      showToast(error.message || '상태 변경에 실패했습니다.', 'error')
    }
  }

  const handleSelectImage = (image: CloudinaryImage) => {
    if (editingPopup) {
      setEditingPopup({
        ...editingPopup,
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">팝업 관리</h1>
          <p className="mt-1 text-sm text-text-secondary">
            플랫폼 팝업 공지사항을 관리합니다.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
        >
          + 팝업 추가
        </Button>
      </div>

      {/* 팝업 목록 */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-text-tertiary">
            로딩 중...
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">순서</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">제목</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">유형</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">미리보기</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">기간</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text">상태</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-text">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {popups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                    등록된 팝업이 없습니다.
                  </td>
                </tr>
              ) : (
                popups.map((popup) => (
                  <tr key={popup.id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-sm text-text">{popup.display_order}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-text">{popup.title}</div>
                      {popup.link_url && (
                        <div className="text-xs text-text-tertiary truncate max-w-xs">
                          {popup.link_url}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          popup.popup_type === 'notice'
                            ? 'bg-blue-100 text-blue-800'
                            : popup.popup_type === 'promotion'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {popup.popup_type === 'notice'
                          ? '공지'
                          : popup.popup_type === 'promotion'
                          ? '프로모션'
                          : '이벤트'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {popup.image?.secure_url ? (
                        <img
                          src={popup.image.secure_url}
                          alt={popup.title}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                          없음
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {popup.start_date && <div>{popup.start_date.split('T')[0]}</div>}
                      {popup.end_date && <div>~ {popup.end_date.split('T')[0]}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(popup.id, popup.is_active)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          popup.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {popup.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(popup)}
                          className="text-sm text-primary hover:underline"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(popup.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 팝업 추가/수정 모달 */}
      {isModalOpen && editingPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text mb-4">
              {editingPopup.id ? '팝업 수정' : '팝업 추가'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    팝업 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPopup.title}
                    onChange={(e) =>
                      setEditingPopup({ ...editingPopup, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                    placeholder="팝업 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">팝업 유형</label>
                  <select
                    value={editingPopup.popup_type}
                    onChange={(e) =>
                      setEditingPopup({
                        ...editingPopup,
                        popup_type: e.target.value as Popup['popup_type'],
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  >
                    <option value="notice">공지</option>
                    <option value="promotion">프로모션</option>
                    <option value="event">이벤트</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">팝업 내용</label>
                <textarea
                  value={editingPopup.content}
                  onChange={(e) =>
                    setEditingPopup({ ...editingPopup, content: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  rows={4}
                  placeholder="팝업 내용을 입력하세요 (HTML 가능)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">이미지</label>
                <div className="flex items-start gap-3">
                  {editingPopup.image?.secure_url ? (
                    <div className="relative">
                      <img
                        src={editingPopup.image.secure_url}
                        alt="선택된 이미지"
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <button
                        onClick={() =>
                          setEditingPopup({ ...editingPopup, image_id: null, image: undefined })
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                      이미지 없음
                    </div>
                  )}
                  <Button
                    onClick={openImageSelector}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
                  >
                    이미지 선택
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">링크 URL</label>
                <input
                  type="url"
                  value={editingPopup.link_url}
                  onChange={(e) =>
                    setEditingPopup({ ...editingPopup, link_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">너비 (px)</label>
                  <input
                    type="number"
                    value={editingPopup.width}
                    onChange={(e) =>
                      setEditingPopup({ ...editingPopup, width: parseInt(e.target.value) || 400 })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">높이 (px)</label>
                  <input
                    type="number"
                    value={editingPopup.height}
                    onChange={(e) =>
                      setEditingPopup({ ...editingPopup, height: parseInt(e.target.value) || 500 })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">X 좌표</label>
                  <input
                    type="number"
                    value={editingPopup.position_x}
                    onChange={(e) =>
                      setEditingPopup({
                        ...editingPopup,
                        position_x: parseInt(e.target.value) || 100,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Y 좌표</label>
                  <input
                    type="number"
                    value={editingPopup.position_y}
                    onChange={(e) =>
                      setEditingPopup({
                        ...editingPopup,
                        position_y: parseInt(e.target.value) || 100,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">시작일</label>
                  <input
                    type="date"
                    value={editingPopup.start_date}
                    onChange={(e) =>
                      setEditingPopup({ ...editingPopup, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">종료일</label>
                  <input
                    type="date"
                    value={editingPopup.end_date}
                    onChange={(e) =>
                      setEditingPopup({ ...editingPopup, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">표시 순서</label>
                  <input
                    type="number"
                    value={editingPopup.display_order}
                    onChange={(e) =>
                      setEditingPopup({
                        ...editingPopup,
                        display_order: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingPopup.is_active}
                    onChange={(e) =>
                      setEditingPopup({ ...editingPopup, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-text">
                    활성화
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable_today_close"
                    checked={editingPopup.enable_today_close}
                    onChange={(e) =>
                      setEditingPopup({ ...editingPopup, enable_today_close: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="enable_today_close" className="text-sm text-text">
                    오늘 하루 보지 않기 버튼 표시
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingPopup(null)
                }}
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
            <h2 className="text-xl font-bold text-text mb-4">이미지 선택</h2>

            <div className="grid grid-cols-4 gap-4">
              {cloudinaryImages.map((image) => (
                <div
                  key={image.id}
                  className="cursor-pointer border-2 border-transparent hover:border-primary rounded-lg overflow-hidden"
                  onClick={() => handleSelectImage(image)}
                >
                  <img
                    src={image.secure_url}
                    alt={image.title || '이미지'}
                    className="w-full h-32 object-cover"
                  />
                  {image.title && (
                    <div className="p-2 text-xs text-text-secondary truncate">{image.title}</div>
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
