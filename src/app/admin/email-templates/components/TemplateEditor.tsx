'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { X, Save, Eye } from 'lucide-react'

interface EmailTemplate {
  id: number
  name: string
  type: string
  subject: string
  html_content: string
  variables: Record<string, string>
  description?: string
  is_active: boolean
}

interface TemplateEditorProps {
  template: EmailTemplate | null
  onClose: () => void
  onSave: () => void
}

export default function TemplateEditor({ template, onClose, onSave }: TemplateEditorProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('broadcast')
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (template) {
      setName(template.name)
      setType(template.type)
      setSubject(template.subject)
      setHtmlContent(template.html_content)
      setDescription(template.description || '')
      setIsActive(template.is_active)
    } else {
      // 기본 템플릿
      setHtmlContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #ffffff; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>달래마켓</h1>
    </div>
    <div class="content">
      <h2>{title}</h2>
      <p>{content}</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{url}" class="button">자세히 보기</a>
      </p>
    </div>
    <div class="footer">
      <p>이 메일은 달래마켓에서 발송되었습니다.</p>
      <p><a href="{unsubscribe_url}">수신 거부</a></p>
    </div>
  </div>
</body>
</html>`)
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !type || !subject || !htmlContent) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }

    setLoading(true)

    try {
      const url = template
        ? `/api/admin/email-templates/${template.id}`
        : '/api/admin/email-templates'

      const method = template ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          subject,
          html_content: htmlContent,
          description,
          is_active: isActive
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || (template ? '템플릿이 수정되었습니다' : '템플릿이 생성되었습니다'))
        onSave()
      } else {
        toast.error(data.error || '저장에 실패했습니다')
      }
    } catch (error) {
      console.error('저장 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const insertVariable = (variable: string) => {
    setHtmlContent(prev => prev + `{${variable}}`)
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
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 10
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
            {template ? '템플릿 수정' : '새 템플릿 만들기'}
          </h2>
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

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* 템플릿 이름 */}
            <div>
              <label style={{
                fontSize: '13px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '6px',
                color: '#374151'
              }}>
                템플릿 이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 주문 확인 이메일"
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

            {/* 타입 */}
            <div>
              <label style={{
                fontSize: '13px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '6px',
                color: '#374151'
              }}>
                타입 *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="broadcast">전체 공지</option>
                <option value="welcome">가입 환영</option>
                <option value="notification">알림</option>
                <option value="order">주문 확인</option>
                <option value="shipping">배송 안내</option>
                <option value="custom">커스텀</option>
              </select>
            </div>
          </div>

          {/* 제목 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              이메일 제목 *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: {subject}"
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
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              변수를 사용할 수 있습니다: {'{subject}'}, {'{title}'}, {'{name}'}
            </p>
          </div>

          {/* 설명 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              설명
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="템플릿 설명을 입력하세요"
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

          {/* 변수 삽입 버튼 */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              자주 사용하는 변수
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['title', 'content', 'name', 'email', 'url', 'unsubscribe_url'].map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  style={{
                    padding: '4px 8px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    cursor: 'pointer'
                  }}
                >
                  {`{${variable}}`}
                </button>
              ))}
            </div>
          </div>

          {/* HTML 내용 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              HTML 내용 *
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="HTML 코드를 입력하세요"
              rows={20}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 활성화 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151'
            }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span>활성화</span>
            </label>
          </div>

          {/* 버튼 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                color: '#374151',
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
              <Eye size={14} />
              {showPreview ? '미리보기 숨기기' : '미리보기'}
            </button>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
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
              <Save size={14} />
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>

        {/* 미리보기 */}
        {showPreview && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              미리보기
            </h3>
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
