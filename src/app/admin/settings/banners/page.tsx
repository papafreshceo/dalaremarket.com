'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface Banner {
  id: string
  title: string
  image_url: string
  link_url: string
  display_order: number
  is_active: boolean
  start_date: string
  end_date: string
  banner_type: 'main' | 'promotion' | 'notice'
}

export default function BannersPage() {
  const { showToast } = useToast()
  const [banners, setBanners] = useState<Banner[]>([
    {
      id: '1',
      title: '신규 회원 가입 이벤트',
      image_url: 'https://via.placeholder.com/1200x400',
      link_url: '/platform',
      display_order: 1,
      is_active: true,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      banner_type: 'main'
    }
  ])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  const handleAdd = () => {
    setEditingBanner({
      id: '',
      title: '',
      image_url: '',
      link_url: '',
      display_order: banners.length + 1,
      is_active: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner_type: 'main'
    })
    setIsModalOpen(true)
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('배너를 삭제하시겠습니까?')) {
      setBanners(prev => prev.filter(b => b.id !== id))
      showToast('배너가 삭제되었습니다.', 'success')
    }
  }

  const handleSave = () => {
    if (!editingBanner) return

    if (editingBanner.id) {
      setBanners(prev => prev.map(b => b.id === editingBanner.id ? editingBanner : b))
      showToast('배너가 수정되었습니다.', 'success')
    } else {
      setBanners(prev => [...prev, { ...editingBanner, id: Date.now().toString() }])
      showToast('배너가 추가되었습니다.', 'success')
    }
    setIsModalOpen(false)
    setEditingBanner(null)
  }

  const toggleActive = (id: string) => {
    setBanners(prev => prev.map(b =>
      b.id === id ? { ...b, is_active: !b.is_active } : b
    ))
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>배너 관리</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>메인 배너 및 프로모션 배너를 관리합니다.</p>
        </div>
        <button
          onClick={handleAdd}
          style={{
            padding: '8px 16px',
            background: '#000',
            color: '#fff',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          배너 추가
        </button>
      </div>

      {/* 배너 목록 */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
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
            {banners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                  등록된 배너가 없습니다.
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3 text-sm text-text">{banner.display_order}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-text">{banner.title}</div>
                    <div className="text-xs text-text-tertiary truncate max-w-xs">
                      {banner.link_url}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      banner.banner_type === 'main' ? 'bg-blue-100 text-blue-800' :
                      banner.banner_type === 'promotion' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {banner.banner_type === 'main' ? '메인' :
                       banner.banner_type === 'promotion' ? '프로모션' : '공지'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="h-12 w-20 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    <div>{banner.start_date}</div>
                    <div>~ {banner.end_date}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(banner.id)}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        banner.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {banner.is_active ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="text-sm text-primary hover:underline"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
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
      </div>

      {/* 배너 추가/수정 모달 */}
      {isModalOpen && editingBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text mb-4">
              {editingBanner.id ? '배너 수정' : '배너 추가'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  배너 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingBanner.title}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="배너 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  이미지 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={editingBanner.image_url}
                  onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  링크 URL
                </label>
                <input
                  type="url"
                  value={editingBanner.link_url}
                  onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    배너 유형
                  </label>
                  <select
                    value={editingBanner.banner_type}
                    onChange={(e) => setEditingBanner({ ...editingBanner, banner_type: e.target.value as Banner['banner_type'] })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  >
                    <option value="main">메인</option>
                    <option value="promotion">프로모션</option>
                    <option value="notice">공지</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    표시 순서
                  </label>
                  <input
                    type="number"
                    value={editingBanner.display_order}
                    onChange={(e) => setEditingBanner({ ...editingBanner, display_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={editingBanner.start_date}
                    onChange={(e) => setEditingBanner({ ...editingBanner, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={editingBanner.end_date}
                    onChange={(e) => setEditingBanner({ ...editingBanner, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingBanner.is_active}
                  onChange={(e) => setEditingBanner({ ...editingBanner, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm text-text">
                  배너 활성화
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingBanner(null)
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
    </div>
  )
}
