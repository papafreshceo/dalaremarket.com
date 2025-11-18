'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface EmailSettings {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  sender_name: string
  sender_email: string
}

interface SMSSettings {
  provider: string
  api_key: string
  sender_number: string
}

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms'
  event: string
  is_active: boolean
  subject?: string
  content: string
}

export default function NotificationsSettingsPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'templates'>('email')

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    sender_name: '달래마켓',
    sender_email: 'noreply@dalreamarket.com'
  })

  const [smsSettings, setSMSSettings] = useState<SMSSettings>({
    provider: 'aligo',
    api_key: '',
    sender_number: ''
  })

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: '주문 완료',
      type: 'email',
      event: 'order_completed',
      is_active: true,
      subject: '주문이 완료되었습니다',
      content: '고객님의 주문이 정상적으로 접수되었습니다.'
    },
    {
      id: '2',
      name: '배송 시작',
      type: 'sms',
      event: 'shipping_started',
      is_active: true,
      content: '[달래마켓] 주문하신 상품이 발송되었습니다.'
    },
    {
      id: '3',
      name: '회원 가입',
      type: 'email',
      event: 'user_registered',
      is_active: true,
      subject: '회원가입을 환영합니다',
      content: '달래마켓 가입을 진심으로 환영합니다.'
    }
  ])

  const handleEmailChange = (field: keyof EmailSettings, value: string | number) => {
    setEmailSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSMSChange = (field: keyof SMSSettings, value: string) => {
    setSMSSettings(prev => ({ ...prev, [field]: value }))
  }

  const toggleTemplate = (id: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === id ? { ...template, is_active: !template.is_active } : template
      )
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // 실제로는 Supabase에 저장
      showToast('알림 설정이 저장되었습니다.', 'success')
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>알림 설정</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>이메일 및 SMS 알림 설정을 관리합니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'email'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text'
            }`}
          >
            이메일 설정
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'sms'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text'
            }`}
          >
            SMS 설정
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text'
            }`}
          >
            알림 템플릿
          </button>
        </nav>
      </div>

      {/* 이메일 설정 */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-text">SMTP 설정</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    SMTP 호스트 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtp_host}
                    onChange={(e) => handleEmailChange('smtp_host', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    SMTP 포트 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={emailSettings.smtp_port}
                    onChange={(e) => handleEmailChange('smtp_port', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  SMTP 사용자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={emailSettings.smtp_user}
                  onChange={(e) => handleEmailChange('smtp_user', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  SMTP 비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={emailSettings.smtp_password}
                  onChange={(e) => handleEmailChange('smtp_password', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    발신자 이름
                  </label>
                  <input
                    type="text"
                    value={emailSettings.sender_name}
                    onChange={(e) => handleEmailChange('sender_name', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                    placeholder="달래마켓"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    발신자 이메일
                  </label>
                  <input
                    type="email"
                    value={emailSettings.sender_email}
                    onChange={(e) => handleEmailChange('sender_email', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                    placeholder="noreply@dalreamarket.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => showToast('테스트 이메일을 발송했습니다.', 'success')}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
            >
              테스트 메일 발송
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}

      {/* SMS 설정 */}
      {activeTab === 'sms' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-text">SMS 서비스 설정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  SMS 제공업체
                </label>
                <select
                  value={smsSettings.provider}
                  onChange={(e) => handleSMSChange('provider', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                >
                  <option value="aligo">알리고</option>
                  <option value="coolsms">쿨SMS</option>
                  <option value="solapi">SOLAPI</option>
                  <option value="ncp">네이버 클라우드</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={smsSettings.api_key}
                  onChange={(e) => handleSMSChange('api_key', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="API Key를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  발신 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={smsSettings.sender_number}
                  onChange={(e) => handleSMSChange('sender_number', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="010-0000-0000"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  발신 번호는 사전에 인증이 필요합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => showToast('테스트 SMS를 발송했습니다.', 'success')}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
            >
              테스트 SMS 발송
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}

      {/* 알림 템플릿 */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">템플릿명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">유형</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">이벤트</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">상태</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-text">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-text">{template.name}</div>
                      {template.subject && (
                        <div className="text-xs text-text-tertiary mt-1">{template.subject}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        template.type === 'email'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {template.type === 'email' ? '이메일' : 'SMS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {template.event}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleTemplate(template.id)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          template.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {template.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-sm text-primary hover:underline">
                          수정
                        </button>
                        <button className="text-sm text-text-tertiary hover:underline">
                          미리보기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
