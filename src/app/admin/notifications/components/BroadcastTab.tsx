'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Send, Image as ImageIcon } from 'lucide-react'

interface CloudinaryImage {
  id: number
  cloudinary_id: string
  secure_url: string
  title?: string
  category?: string
}

export default function BroadcastTab() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('broadcast')
  const [url, setUrl] = useState('/platform/notifications')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [images, setImages] = useState<CloudinaryImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(false)

  const fetchImages = async () => {
    setImagesLoading(true)
    try {
      const response = await fetch('/api/cloudinary/images?is_public=true&limit=50')
      const data = await response.json()
      if (data.success) {
        setImages(data.data)
      }
    } catch (error) {
      console.error('이미지 조회 오류:', error)
      toast.error('이미지를 불러올 수 없습니다')
    } finally {
      setImagesLoading(false)
    }
  }

  const handleImageSelect = (image: CloudinaryImage) => {
    setImageUrl(image.secure_url)
    setShowImageModal(false)
    toast.success('이미지가 선택되었습니다')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !body) {
      toast.error('제목과 내용을 입력해주세요')
      return
    }

    if (!confirm('모든 사용자에게 푸시 알림을 전송하시겠습니까?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category, url, imageUrl }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setTitle('')
        setBody('')
        setUrl('/platform/notifications')
        setImageUrl('')
      } else {
        toast.error(data.error || '전송에 실패했습니다')
      }
    } catch (error) {
      console.error('전송 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          전체 공지 발송
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 제목 */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="알림 제목을 입력하세요"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* 내용 */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              내용 *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              rows={4}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 카테고리 */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '200px',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="broadcast">전체 공지</option>
              <option value="announcement">일반 공지</option>
              <option value="system">시스템</option>
              <option value="event">이벤트</option>
            </select>
          </div>

          {/* URL */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              클릭 시 이동할 URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/platform/notifications"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              알림 클릭 시 이동할 페이지 경로를 입력하세요
            </p>
          </div>

          {/* 이미지 선택 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              썸네일 이미지 (선택)
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Selected thumbnail"
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(true)
                  fetchImages()
                }}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ImageIcon size={14} />
                {imageUrl ? '이미지 변경' : '이미지 선택'}
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  style={{
                    padding: '8px 12px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  제거
                </button>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              클라우디너리에 업로드된 공개 이미지를 선택할 수 있습니다
            </p>
          </div>

          {/* 미리보기 */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              미리보기
            </p>
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#2563eb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    달
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                      {title || '알림 제목'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {body || '알림 내용이 여기에 표시됩니다'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      방금 전
                    </p>
                  </div>
                </div>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Notification thumbnail"
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 전송 버튼 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              모든 활성 사용자에게 푸시 알림이 전송됩니다
            </p>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: loading ? '#9ca3af' : '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={14} />
              {loading ? '전송 중...' : '전송하기'}
            </button>
          </div>
        </form>
      </div>

      {/* 이미지 선택 모달 */}
      {showImageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '20px',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                이미지 선택
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>

            {imagesLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #000',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                {images.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => handleImageSelect(image)}
                    style={{
                      cursor: 'pointer',
                      border: imageUrl === image.secure_url ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    <img
                      src={image.secure_url}
                      alt={image.title || 'Image'}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover'
                      }}
                    />
                    {image.title && (
                      <div style={{
                        padding: '8px',
                        fontSize: '11px',
                        color: '#6b7280',
                        background: '#f9fafb',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {image.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!imagesLoading && images.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: '#6b7280',
                fontSize: '13px'
              }}>
                공개 이미지가 없습니다
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
