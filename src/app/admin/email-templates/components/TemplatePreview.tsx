'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { X, RefreshCw } from 'lucide-react'

interface EmailTemplate {
  id: number
  name: string
  type: string
  subject: string
  html_content: string
  variables: Record<string, string>
  description?: string
}

interface TemplatePreviewProps {
  template: EmailTemplate
  onClose: () => void
}

export default function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    subject: '테스트 제목',
    title: '테스트 타이틀',
    content: '이것은 테스트 내용입니다. 이메일 템플릿이 어떻게 보이는지 확인할 수 있습니다.',
    name: '홍길동',
    email: 'test@example.com',
    url: 'https://example.com',
    unsubscribe_url: 'https://example.com/unsubscribe'
  })
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePreview = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: variableValues })
      })

      const data = await response.json()

      if (data.success) {
        setPreviewHtml(data.data.html)
        setPreviewSubject(data.data.subject)
      } else {
        toast.error(data.error || '미리보기를 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('미리보기 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    handlePreview()
  })

  const updateVariable = (key: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [key]: value }))
  }

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
              템플릿 미리보기
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              {template.name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* 왼쪽: 변수 입력 */}
          <div style={{
            padding: '20px',
            borderRight: '1px solid #e5e7eb',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>
                테스트 변수
              </h3>
              <button
                onClick={handlePreview}
                disabled={loading}
                style={{
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} />
                새로고침
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.keys(variableValues).map((key) => (
                <div key={key}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '4px',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}>
                    {`{${key}}`}
                  </label>
                  {key === 'content' ? (
                    <textarea
                      value={variableValues[key]}
                      onChange={(e) => updateVariable(key, e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '12px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={variableValues[key]}
                      onChange={(e) => updateVariable(key, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* 제목 */}
            {previewSubject && (
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb'
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  제목
                </p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {previewSubject}
                </p>
              </div>
            )}

            {/* 이메일 미리보기 */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
              background: '#f3f4f6'
            }}>
              {loading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
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
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  overflow: 'auto'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
