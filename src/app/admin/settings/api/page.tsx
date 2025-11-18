'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used: string
  status: 'active' | 'inactive'
  permissions: string[]
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  created_at: string
}

export default function ApiSettingsPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs'>('keys')

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: '메인 API 키',
      key: 'dlr_live_1234567890abcdef',
      created_at: '2025-01-01',
      last_used: '2025-10-15 14:30',
      status: 'active',
      permissions: ['read', 'write']
    },
    {
      id: '2',
      name: '테스트 API 키',
      key: 'dlr_test_abcdef1234567890',
      created_at: '2025-01-15',
      last_used: '2025-10-10 10:20',
      status: 'active',
      permissions: ['read']
    }
  ])

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: '주문 알림',
      url: 'https://example.com/webhook/order',
      events: ['order.created', 'order.updated'],
      is_active: true,
      created_at: '2025-01-01'
    }
  ])

  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read'])

  const generateApiKey = () => {
    if (!newKeyName.trim()) {
      showToast('API 키 이름을 입력하세요.', 'error')
      return
    }

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `dlr_live_${Math.random().toString(36).substring(2, 18)}`,
      created_at: new Date().toISOString().split('T')[0],
      last_used: '-',
      status: 'active',
      permissions: newKeyPermissions
    }

    setApiKeys(prev => [newKey, ...prev])
    setShowApiKeyModal(false)
    setNewKeyName('')
    setNewKeyPermissions(['read'])
    showToast('새 API 키가 생성되었습니다.', 'success')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('클립보드에 복사되었습니다.', 'success')
  }

  const deleteApiKey = (id: string, name: string) => {
    if (confirm(`"${name}" API 키를 삭제하시겠습니까?`)) {
      setApiKeys(prev => prev.filter(k => k.id !== id))
      showToast('API 키가 삭제되었습니다.', 'success')
    }
  }

  const toggleKeyStatus = (id: string) => {
    setApiKeys(prev => prev.map(key =>
      key.id === id ? { ...key, status: key.status === 'active' ? 'inactive' : 'active' } : key
    ))
  }

  const toggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(webhook =>
      webhook.id === id ? { ...webhook, is_active: !webhook.is_active } : webhook
    ))
  }

  const deleteWebhook = (id: string, name: string) => {
    if (confirm(`"${name}" 웹훅을 삭제하시겠습니까?`)) {
      setWebhooks(prev => prev.filter(w => w.id !== id))
      showToast('웹훅이 삭제되었습니다.', 'success')
    }
  }

  const testWebhook = (url: string) => {
    showToast(`${url}로 테스트 요청을 전송했습니다.`, 'info')
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-text">API 설정</h1>
        <p className="mt-1 text-sm text-text-secondary">API 키 및 웹훅을 관리합니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'keys'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text'
            }`}
          >
            API 키 관리
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'webhooks'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text'
            }`}
          >
            웹훅 관리
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'docs'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text'
            }`}
          >
            API 문서
          </button>
        </nav>
      </div>

      {/* API 키 관리 */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-text">API 키 목록</h2>
              <p className="text-sm text-text-tertiary mt-1">
                외부 애플리케이션에서 API를 사용하기 위한 인증 키입니다.
              </p>
            </div>
            <Button
              onClick={() => setShowApiKeyModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              + API 키 생성
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">API 키</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">권한</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">마지막 사용</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">상태</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-text">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-text">{apiKey.name}</div>
                      <div className="text-xs text-text-tertiary">생성: {apiKey.created_at}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded text-text font-mono">
                          {apiKey.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="text-primary hover:text-primary-hover"
                          title="복사"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {apiKey.permissions.map((perm) => (
                          <span key={perm} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{apiKey.last_used}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleKeyStatus(apiKey.id)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          apiKey.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {apiKey.status === 'active' ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => deleteApiKey(apiKey.id, apiKey.name)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                API 키는 생성 시 한 번만 표시됩니다. 안전한 곳에 보관하세요.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 웹훅 관리 */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-text">웹훅 목록</h2>
              <p className="text-sm text-text-tertiary mt-1">
                특정 이벤트 발생 시 지정된 URL로 알림을 전송합니다.
              </p>
            </div>
            <Button
              onClick={() => setShowWebhookModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              + 웹훅 추가
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">URL</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">이벤트</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">상태</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-text">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {webhooks.map((webhook) => (
                  <tr key={webhook.id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-text">{webhook.name}</div>
                      <div className="text-xs text-text-tertiary">생성: {webhook.created_at}</div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-text-secondary">{webhook.url}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <span key={event} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                            {event}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleWebhook(webhook.id)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          webhook.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {webhook.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => testWebhook(webhook.url)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          테스트
                        </button>
                        <button className="text-sm text-text-secondary hover:underline">
                          수정
                        </button>
                        <button
                          onClick={() => deleteWebhook(webhook.id, webhook.name)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API 문서 */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text mb-4">API 문서</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-text mb-2">베이스 URL</h3>
                <code className="block bg-background px-4 py-2 rounded text-sm text-text">
                  https://api.dalreamarket.com/v1
                </code>
              </div>

              <div>
                <h3 className="font-medium text-text mb-2">인증</h3>
                <p className="text-sm text-text-secondary mb-2">
                  모든 API 요청은 헤더에 API 키를 포함해야 합니다:
                </p>
                <code className="block bg-background px-4 py-2 rounded text-sm text-text">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div>
                <h3 className="font-medium text-text mb-2">주요 엔드포인트</h3>
                <div className="space-y-2">
                  <div className="bg-background p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded font-medium">GET</span>
                      <code className="text-sm text-text">/products</code>
                    </div>
                    <p className="text-xs text-text-tertiary">상품 목록 조회</p>
                  </div>
                  <div className="bg-background p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-medium">POST</span>
                      <code className="text-sm text-text">/orders</code>
                    </div>
                    <p className="text-xs text-text-tertiary">주문 생성</p>
                  </div>
                  <div className="bg-background p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded font-medium">GET</span>
                      <code className="text-sm text-text">/orders/:id</code>
                    </div>
                    <p className="text-xs text-text-tertiary">주문 상세 조회</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => window.open('https://docs.dalreamarket.com/api', '_blank')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  전체 API 문서 보기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API 키 생성 모달 */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text mb-4">새 API 키 생성</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  API 키 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="예: 메인 API 키"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  권한 선택
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newKeyPermissions.includes('read')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyPermissions(prev => [...prev, 'read'])
                        } else {
                          setNewKeyPermissions(prev => prev.filter(p => p !== 'read'))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-text">읽기 (read)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newKeyPermissions.includes('write')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyPermissions(prev => [...prev, 'write'])
                        } else {
                          setNewKeyPermissions(prev => prev.filter(p => p !== 'write'))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-text">쓰기 (write)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setShowApiKeyModal(false)
                  setNewKeyName('')
                  setNewKeyPermissions(['read'])
                }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
              >
                취소
              </Button>
              <Button
                onClick={generateApiKey}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                생성
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
