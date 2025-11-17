'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, Mail } from 'lucide-react'
import TemplateEditor from './TemplateEditor'

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

  const handleSaveSuccess = () => {
    setShowEditor(false)
    setSelectedTemplate(null)
    fetchTemplates()
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      transactional: '트랜잭션',
      marketing: '마케팅',
      notification: '알림',
      broadcast: '공지사항'
    }
    return labels[type] || type
  }

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      transactional: '#2563eb',
      marketing: '#10b981',
      notification: '#f59e0b',
      broadcast: '#8b5cf6'
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
            onClick={() => setFilterType('transactional')}
            style={{
              padding: '6px 12px',
              background: filterType === 'transactional' ? '#000' : '#f3f4f6',
              color: filterType === 'transactional' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            트랜잭션
          </button>
          <button
            onClick={() => setFilterType('marketing')}
            style={{
              padding: '6px 12px',
              background: filterType === 'marketing' ? '#000' : '#f3f4f6',
              color: filterType === 'marketing' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            마케팅
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
            공지사항
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
              onClick={() => handleEdit(template)}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* 삭제 버튼 - 우측 상단 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(template)
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '4px',
                  background: 'transparent',
                  color: '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2'
                  e.currentTarget.style.color = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9ca3af'
                }}
              >
                <Trash2 size={14} />
              </button>

              {/* 헤더 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px',
                paddingRight: '28px'
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
                    {template.is_active && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                  {template.description && (
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      {template.description}
                    </p>
                  )}
                </div>
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
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                생성일: {new Date(template.created_at).toLocaleDateString('ko-KR')}
              </p>
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
    </div>
  )
}
