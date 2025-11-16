'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Plus, Edit, Trash2, Eye, Mail } from 'lucide-react'
import TemplateEditor from './TemplateEditor'
import TemplatePreview from './TemplatePreview'

interface EmailTemplate {
  id: number
  name: string
  type: string
  subject: string
  html_content: string
  variables: Record<string, string>
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [filterType])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const url = filterType === 'all'
        ? '/api/admin/email-templates'
        : `/api/admin/email-templates?type=${filterType}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.data)
      } else {
        toast.error(data.error || '템플릿 목록을 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('템플릿 조회 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('템플릿이 삭제되었습니다')
        fetchTemplates()
      } else {
        toast.error(data.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    }
  }

  const handleCreateNew = () => {
    setSelectedTemplate(null)
    setShowEditor(true)
  }

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setShowEditor(true)
  }

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleSaveSuccess = () => {
    setShowEditor(false)
    setSelectedTemplate(null)
    fetchTemplates()
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      broadcast: '전체 공지',
      welcome: '가입 환영',
      notification: '알림',
      order: '주문 확인',
      shipping: '배송 안내',
      custom: '커스텀'
    }
    return labels[type] || type
  }

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      broadcast: '#2563eb',
      welcome: '#059669',
      notification: '#f59e0b',
      order: '#8b5cf6',
      shipping: '#ec4899',
      custom: '#6b7280'
    }
    return colors[type] || '#6b7280'
  }

  return (
    <div>
      {/* 필터 및 생성 버튼 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '6px 12px',
              background: filterType === 'all' ? '#000' : '#f3f4f6',
              color: filterType === 'all' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            전체
          </button>
          <button
            onClick={() => setFilterType('broadcast')}
            style={{
              padding: '6px 12px',
              background: filterType === 'broadcast' ? '#000' : '#f3f4f6',
              color: filterType === 'broadcast' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            전체 공지
          </button>
          <button
            onClick={() => setFilterType('welcome')}
            style={{
              padding: '6px 12px',
              background: filterType === 'welcome' ? '#000' : '#f3f4f6',
              color: filterType === 'welcome' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            가입 환영
          </button>
          <button
            onClick={() => setFilterType('notification')}
            style={{
              padding: '6px 12px',
              background: filterType === 'notification' ? '#000' : '#f3f4f6',
              color: filterType === 'notification' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            알림
          </button>
        </div>

        <button
          onClick={handleCreateNew}
          style={{
            padding: '8px 16px',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          새 템플릿 만들기
        </button>
      </div>

      {/* 템플릿 목록 */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
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
      ) : templates.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <Mail size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            {filterType === 'all' ? '등록된 템플릿이 없습니다' : `${getTypeLabel(filterType)} 템플릿이 없습니다`}
          </p>
          <button
            onClick={handleCreateNew}
            style={{
              padding: '8px 16px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            새 템플릿 만들기
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '16px'
        }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                transition: 'all 0.2s'
              }}
            >
              {/* 헤더 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                      {template.name}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      background: getTypeBadgeColor(template.type),
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {getTypeLabel(template.type)}
                    </span>
                  </div>
                  {template.description && (
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      {template.description}
                    </p>
                  )}
                </div>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: template.is_active ? '#10b981' : '#9ca3af',
                  flexShrink: 0,
                  marginLeft: '8px'
                }} />
              </div>

              {/* 제목 */}
              <div style={{
                background: '#f9fafb',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '12px'
              }}>
                <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>제목</p>
                <p style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                  {template.subject}
                </p>
              </div>

              {/* 변수 */}
              {template.variables && Object.keys(template.variables).length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>사용 변수</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {Object.keys(template.variables).map((key) => (
                      <span
                        key={key}
                        style={{
                          padding: '2px 6px',
                          background: '#e5e7eb',
                          color: '#374151',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {`{${key}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 날짜 */}
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
                생성일: {new Date(template.created_at).toLocaleDateString('ko-KR')}
              </p>

              {/* 액션 버튼 */}
              <div style={{
                display: 'flex',
                gap: '6px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => handlePreview(template)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Eye size={14} />
                  미리보기
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Edit size={14} />
                  수정
                </button>
                <button
                  onClick={() => handleDelete(template)}
                  style={{
                    padding: '6px 12px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 템플릿 에디터 모달 */}
      {showEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => {
            setShowEditor(false)
            setSelectedTemplate(null)
          }}
          onSave={handleSaveSuccess}
        />
      )}

      {/* 미리보기 모달 */}
      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => {
            setShowPreview(false)
            setSelectedTemplate(null)
          }}
        />
      )}
    </div>
  )
}
