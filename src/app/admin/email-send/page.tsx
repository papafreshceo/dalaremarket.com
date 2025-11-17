'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Send, Mail, Users, Eye } from 'lucide-react'

interface EmailTemplate {
  id: number
  name: string
  type: string
  subject: string
  html_content: string
  variables: Record<string, string>
  description?: string
}

export default function EmailSendPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [recipients, setRecipients] = useState<'all' | 'role' | 'custom'>('all')
  const [recipientRole, setRecipientRole] = useState<string>('buyer')
  const [customEmails, setCustomEmails] = useState<string>('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    // selectedTemplateId가 유효한 숫자인지 확인
    if (selectedTemplateId && !isNaN(selectedTemplateId)) {
      const template = templates.find(t => t.id === selectedTemplateId)
      setSelectedTemplate(template || null)

      // 템플릿 변수 초기화
      if (template?.variables) {
        const initialVars: Record<string, string> = {}
        Object.keys(template.variables).forEach(key => {
          initialVars[key] = ''
        })
        setVariables(initialVars)
      }
    } else {
      setSelectedTemplate(null)
      setVariables({})
    }
  }, [selectedTemplateId, templates])

  const fetchTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const response = await fetch('/api/admin/email-templates')
      const data = await response.json()

      if (data.success) {
        // 활성화된 템플릿만 표시
        const activeTemplates = data.data.filter((t: EmailTemplate) => t.is_active !== false)
        console.log('Loaded templates:', activeTemplates)
        setTemplates(activeTemplates)
      } else {
        toast.error(data.error || '템플릿 목록을 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('템플릿 조회 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleSend = async () => {
    if (!selectedTemplateId) {
      toast.error('템플릿을 선택해주세요')
      return
    }

    if (recipients === 'custom' && !customEmails.trim()) {
      toast.error('수신자 이메일을 입력해주세요')
      return
    }

    if (recipients === 'role' && !recipientRole) {
      toast.error('수신자 역할을 선택해주세요')
      return
    }

    // 필수 변수 확인
    const requiredVars = selectedTemplate?.variables ? Object.keys(selectedTemplate.variables) : []
    const missingVars = requiredVars.filter(key => !variables[key]?.trim())
    if (missingVars.length > 0 && !['name', 'email'].some(v => missingVars.includes(v))) {
      // name과 email은 자동으로 채워지므로 제외
      const filtered = missingVars.filter(v => v !== 'name' && v !== 'email')
      if (filtered.length > 0) {
        toast.error(`필수 변수를 입력해주세요: ${filtered.join(', ')}`)
        return
      }
    }

    const confirmed = confirm(
      recipients === 'all'
        ? '전체 회원에게 이메일을 발송하시겠습니까?'
        : recipients === 'role'
        ? `${recipientRole} 역할의 회원에게 이메일을 발송하시겠습니까?`
        : `${customEmails.split(',').length}명에게 이메일을 발송하시겠습니까?`
    )

    if (!confirmed) return

    setLoading(true)

    try {
      const response = await fetch('/api/admin/email/send-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          recipients,
          recipientRole: recipients === 'role' ? recipientRole : undefined,
          customEmails: recipients === 'custom' ? customEmails.split(',').map(e => e.trim()) : undefined,
          variables
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)

        // 결과 상세 표시
        if (data.data.failed > 0) {
          setTimeout(() => {
            alert(`발송 완료:\n성공: ${data.data.success}건\n실패: ${data.data.failed}건\n\n${data.data.errors.length > 0 ? '오류:\n' + data.data.errors.join('\n') : ''}`)
          }, 500)
        }

        // 폼 초기화
        setSelectedTemplateId(null)
        setRecipients('all')
        setCustomEmails('')
        setVariables({})
      } else {
        toast.error(data.error || '이메일 발송에 실패했습니다')
      }
    } catch (error) {
      console.error('이메일 발송 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
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

  const getPreviewHtml = () => {
    if (!selectedTemplate) return ''

    let html = selectedTemplate.html_content

    // 변수 치환
    for (const [key, value] of Object.entries(variables)) {
      if (value) {
        html = html.replace(new RegExp(`{${key}}`, 'g'), value)
      }
    }

    // name과 email은 샘플 데이터로 표시
    html = html.replace(/{name}/g, '홍길동')
    html = html.replace(/{email}/g, 'example@dalraemarket.com')

    return html
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          이메일 발송
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          템플릿을 선택하여 회원들에게 이메일을 발송할 수 있습니다
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 왼쪽: 발송 설정 */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} />
            발송 설정
          </h2>

          {/* 템플릿 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '8px',
              color: '#374151'
            }}>
              템플릿 선택 *
            </label>
            <div>
              {templatesLoading ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                  로딩 중...
                </div>
              ) : (
                <>
                  <select
                    value={selectedTemplateId == null ? '' : String(selectedTemplateId)}
                    onClick={() => console.log('Select clicked!')}
                    onFocus={() => console.log('Select focused!')}
                    onChange={(e) => {
                      const value = e.target.value
                      console.log('Selected value:', value)
                      if (value === '') {
                        setSelectedTemplateId(null)
                      } else {
                        const numValue = Number(value)
                        console.log('Converted to number:', numValue)
                        if (!isNaN(numValue)) {
                          setSelectedTemplateId(numValue)
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      position: 'relative',
                      zIndex: 10
                    }}
                  >
                    <option value="">템플릿을 선택하세요</option>
                    <option value="999">테스트 옵션</option>
                    {templates.map(template => (
                      <option key={template.id} value={String(template.id)}>
                        [{getTypeLabel(template.type)}] {template.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                    템플릿 개수: {templates.length}개
                  </div>
                </>
              )}
            </div>
            {selectedTemplate?.description && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                {selectedTemplate.description}
              </p>
            )}
          </div>

          {/* 수신자 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '8px',
              color: '#374151'
            }}>
              수신자 선택 *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="radio"
                  value="all"
                  checked={recipients === 'all'}
                  onChange={(e) => setRecipients(e.target.value as 'all')}
                  style={{
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px',
                    margin: '0',
                    flexShrink: 0
                  }}
                />
                <span>전체 회원</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="radio"
                  value="role"
                  checked={recipients === 'role'}
                  onChange={(e) => setRecipients(e.target.value as 'role')}
                  style={{
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px',
                    margin: '0',
                    flexShrink: 0
                  }}
                />
                <span>역할별</span>
              </label>
              {recipients === 'role' && (
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  style={{
                    marginLeft: '28px',
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="buyer">구매자</option>
                  <option value="seller">판매자</option>
                  <option value="admin">관리자</option>
                </select>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="radio"
                  value="custom"
                  checked={recipients === 'custom'}
                  onChange={(e) => setRecipients(e.target.value as 'custom')}
                  style={{
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px',
                    margin: '0',
                    flexShrink: 0
                  }}
                />
                <span>개별 입력</span>
              </label>
              {recipients === 'custom' && (
                <textarea
                  value={customEmails}
                  onChange={(e) => setCustomEmails(e.target.value)}
                  placeholder="이메일을 쉼표(,)로 구분하여 입력하세요&#10;예: user1@example.com, user2@example.com"
                  rows={4}
                  style={{
                    marginLeft: '28px',
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              )}
            </div>
          </div>

          {/* 변수 입력 */}
          {selectedTemplate && selectedTemplate.variables && Object.keys(selectedTemplate.variables).length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '8px',
                color: '#374151'
              }}>
                템플릿 변수
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(selectedTemplate.variables).map(([key, description]) => {
                  // name과 email은 자동으로 채워지므로 입력 필드 표시 안함
                  if (key === 'name' || key === 'email') {
                    return (
                      <div key={key} style={{ fontSize: '12px', color: '#6b7280' }}>
                        <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>
                          {`{${key}}`}
                        </code>: {description} (자동 입력)
                      </div>
                    )
                  }

                  return (
                    <div key={key}>
                      <label style={{ fontSize: '12px', color: '#374151', marginBottom: '4px', display: 'block' }}>
                        <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>
                          {`{${key}}`}
                        </code> - {description}
                      </label>
                      <input
                        type="text"
                        value={variables[key] || ''}
                        onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                        placeholder={`${description} 입력`}
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
                  )
                })}
              </div>
            </div>
          )}

          {/* 발송 버튼 */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              disabled={!selectedTemplate}
              style={{
                padding: '10px 16px',
                background: !selectedTemplate ? '#f3f4f6' : '#fff',
                color: !selectedTemplate ? '#9ca3af' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: !selectedTemplate ? 'not-allowed' : 'pointer',
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
              onClick={handleSend}
              disabled={loading || !selectedTemplateId}
              style={{
                padding: '10px 20px',
                background: loading || !selectedTemplateId ? '#9ca3af' : '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: loading || !selectedTemplateId ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={14} />
              {loading ? '발송 중...' : '이메일 발송'}
            </button>
          </div>
        </div>

        {/* 오른쪽: 안내 및 통계 */}
        <div>
          {/* 사용 안내 */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} />
              사용 안내
            </h3>
            <ul style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>템플릿을 선택하고 수신자를 지정하여 이메일을 발송할 수 있습니다</li>
              <li>변수 {'{name}'}, {'{email}'}은 각 수신자에게 자동으로 개인화됩니다</li>
              <li>발송 전 미리보기를 통해 내용을 확인하세요</li>
              <li>모든 발송 내역은 이메일 로그에 기록됩니다</li>
            </ul>
          </div>

          {/* 미리보기 */}
          {showPreview && selectedTemplate && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                이메일 미리보기
              </h3>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                <strong>제목:</strong> {selectedTemplate.subject}
              </div>
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                overflow: 'auto',
                maxHeight: '600px',
                background: '#f9fafb'
              }}>
                <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
