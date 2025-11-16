'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Search, Send, Users, Eye, X } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  profile_name?: string
}

interface EmailTemplate {
  id: number
  name: string
  type: string
  subject: string
  html_content: string
  variables: Record<string, string>
}

export default function SendEmailTab() {
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchTemplates()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/members')
      const data = await response.json()

      if (data.success && data.members) {
        // organization_members에서 사용자 추출
        const uniqueUsers = new Map<string, User>()
        data.members.forEach((member: any) => {
          if (member.user && member.user.email) {
            uniqueUsers.set(member.user.id, {
              id: member.user.id,
              email: member.user.email,
              name: member.user.name,
              profile_name: member.user.profile_name
            })
          }
        })
        setUsers(Array.from(uniqueUsers.values()))
      }
    } catch (error) {
      console.error('사용자 조회 오류:', error)
      toast.error('사용자 목록을 불러올 수 없습니다')
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates?is_active=true')
      const data = await response.json()

      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('템플릿 조회 오류:', error)
      toast.error('템플릿을 불러올 수 없습니다')
    }
  }

  const toggleUserSelection = (email: string) => {
    setSelectedUsers(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    )
  }

  const selectAllUsers = () => {
    const filteredEmails = getFilteredUsers().map(u => u.email)
    setSelectedUsers(filteredEmails)
  }

  const deselectAllUsers = () => {
    setSelectedUsers([])
  }

  const getFilteredUsers = () => {
    if (!searchQuery) return users
    const query = searchQuery.toLowerCase()
    return users.filter(u =>
      u.email.toLowerCase().includes(query) ||
      u.name?.toLowerCase().includes(query) ||
      u.profile_name?.toLowerCase().includes(query)
    )
  }

  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template && template.variables) {
      // 템플릿 변수 초기화
      const initialVars: Record<string, string> = {}
      Object.keys(template.variables).forEach(key => {
        initialVars[key] = ''
      })
      setVariables(initialVars)
    }
  }

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast.error('수신자를 선택해주세요')
      return
    }

    if (!selectedTemplate) {
      toast.error('템플릿을 선택해주세요')
      return
    }

    if (!confirm(`${selectedUsers.length}명에게 이메일을 발송하시겠습니까?`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_emails: selectedUsers,
          template_id: selectedTemplate,
          variables
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setSelectedUsers([])
        setSelectedTemplate(null)
        setVariables({})
      } else {
        toast.error(data.error || '발송에 실패했습니다')
      }
    } catch (error) {
      console.error('발송 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const currentTemplate = templates.find(t => t.id === selectedTemplate)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
      {/* 왼쪽: 수신자 선택 */}
      <div>
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* 헤더 */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>
                수신자 선택
              </h3>
              <span style={{
                padding: '4px 8px',
                background: '#f3f4f6',
                color: '#374151',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {selectedUsers.length}명 선택
              </span>
            </div>

            {/* 검색 */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름이나 이메일로 검색..."
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 34px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* 전체 선택/해제 */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginTop: '8px'
            }}>
              <button
                onClick={selectAllUsers}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                전체 선택
              </button>
              <button
                onClick={deselectAllUsers}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                선택 해제
              </button>
            </div>
          </div>

          {/* 사용자 목록 */}
          <div style={{
            maxHeight: '500px',
            overflow: 'auto'
          }}>
            {getFilteredUsers().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: '#6b7280',
                fontSize: '13px'
              }}>
                <Users size={32} style={{ margin: '0 auto 12px', color: '#d1d5db' }} />
                <p>사용자가 없습니다</p>
              </div>
            ) : (
              <div>
                {getFilteredUsers().map((user) => (
                  <label
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      background: selectedUsers.includes(user.email) ? '#f9fafb' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedUsers.includes(user.email)) {
                        e.currentTarget.style.background = '#f9fafb'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedUsers.includes(user.email)) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.email)}
                      onChange={() => toggleUserSelection(user.email)}
                      style={{
                        width: '16px',
                        height: '16px',
                        marginRight: '12px',
                        cursor: 'pointer'
                      }}
                    />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                        {user.profile_name || user.name || '이름 없음'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        {user.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 템플릿 및 발송 */}
      <div>
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            이메일 작성
          </h3>

          {/* 템플릿 선택 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px',
              color: '#374151'
            }}>
              템플릿 선택 *
            </label>
            <select
              value={selectedTemplate || ''}
              onChange={(e) => handleTemplateChange(Number(e.target.value))}
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
              <option value="">템플릿을 선택하세요</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
          </div>

          {/* 선택된 템플릿 정보 */}
          {currentTemplate && (
            <>
              <div style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>제목</p>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                  {currentTemplate.subject}
                </p>
              </div>

              {/* 변수 입력 */}
              {currentTemplate.variables && Object.keys(currentTemplate.variables).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px',
                    color: '#374151'
                  }}>
                    변수 입력
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.keys(currentTemplate.variables).filter(key => !['name', 'email', 'unsubscribe_url'].includes(key)).map((key) => (
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
                            value={variables[key] || ''}
                            onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                            rows={3}
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
                        ) : (
                          <input
                            type="text"
                            value={variables[key] || ''}
                            onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                    * name, email, unsubscribe_url은 자동으로 설정됩니다
                  </p>
                </div>
              )}

              {/* 미리보기 버튼 */}
              <button
                onClick={() => setShowPreview(true)}
                style={{
                  width: '100%',
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
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '16px'
                }}
              >
                <Eye size={14} />
                미리보기
              </button>
            </>
          )}

          {/* 발송 버튼 */}
          <div style={{
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={handleSend}
              disabled={loading || selectedUsers.length === 0 || !selectedTemplate}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: loading || selectedUsers.length === 0 || !selectedTemplate ? '#9ca3af' : '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading || selectedUsers.length === 0 || !selectedTemplate ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Send size={16} />
              {loading ? '발송 중...' : `${selectedUsers.length}명에게 발송하기`}
            </button>
          </div>
        </div>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && currentTemplate && (
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
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>미리보기</h3>
              <button
                onClick={() => setShowPreview(false)}
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
            <div style={{ padding: '20px' }}>
              <div style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>제목</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                  {currentTemplate.subject.replace(/{(\w+)}/g, (_, key) => variables[key] || `{${key}}`)}
                </p>
              </div>
              <div style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'auto'
              }}>
                <div dangerouslySetInnerHTML={{
                  __html: currentTemplate.html_content.replace(/{(\w+)}/g, (_, key) => {
                    if (key === 'name') return '홍길동'
                    if (key === 'email') return 'example@email.com'
                    if (key === 'unsubscribe_url') return '#'
                    return variables[key] || `{${key}}`
                  })
                }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
