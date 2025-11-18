'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface PaymentMethod {
  id: string
  name: string
  is_active: boolean
  icon: string
}

interface PGSettings {
  pg_provider: string
  merchant_id: string
  api_key: string
  secret_key: string
  is_test_mode: boolean
}

export default function PaymentSettingsPage() {
  const { showToast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'card', name: '신용카드', is_active: true, icon: '💳' },
    { id: 'bank', name: '계좌이체', is_active: true, icon: '🏦' },
    { id: 'vbank', name: '가상계좌', is_active: true, icon: '🏧' },
    { id: 'phone', name: '휴대폰결제', is_active: false, icon: '📱' },
    { id: 'kakaopay', name: '카카오페이', is_active: true, icon: '💛' },
    { id: 'naverpay', name: '네이버페이', is_active: false, icon: '🟢' },
    { id: 'payco', name: '페이코', is_active: false, icon: '🅿️' }
  ])

  const [pgSettings, setPgSettings] = useState<PGSettings>({
    pg_provider: 'inicis',
    merchant_id: '',
    api_key: '',
    secret_key: '',
    is_test_mode: true
  })

  const [loading, setLoading] = useState(false)

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(method =>
        method.id === id ? { ...method, is_active: !method.is_active } : method
      )
    )
  }

  const handlePGChange = (field: keyof PGSettings, value: string | boolean) => {
    setPgSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // 실제로는 Supabase에 저장
      // await supabase.from('payment_settings').upsert({ paymentMethods, pgSettings })

      showToast('결제 설정이 저장되었습니다.', 'success')
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
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>결제 설정</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>결제 수단 및 PG 연동 설정을 관리합니다.</p>
      </div>

      {/* 결제 수단 설정 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">결제 수단 설정</h2>
        <p className="text-sm text-text-tertiary">고객이 사용할 수 있는 결제 수단을 선택하세요.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                method.is_active
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-gray-400'
              }`}
              onClick={() => togglePaymentMethod(method.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-medium text-text">{method.name}</span>
                </div>
                <div
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    method.is_active ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      method.is_active ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PG 설정 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">PG(결제대행사) 설정</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              PG사 선택 <span className="text-red-500">*</span>
            </label>
            <select
              value={pgSettings.pg_provider}
              onChange={(e) => handlePGChange('pg_provider', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
            >
              <option value="inicis">KG이니시스</option>
              <option value="kcp">NHN KCP</option>
              <option value="nice">나이스페이</option>
              <option value="danal">다날</option>
              <option value="tosspayments">토스페이먼츠</option>
              <option value="kakaopay">카카오페이</option>
              <option value="naverpay">네이버페이</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              가맹점 ID (MID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pgSettings.merchant_id}
              onChange={(e) => handlePGChange('merchant_id', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="PG사에서 발급받은 가맹점 ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pgSettings.api_key}
              onChange={(e) => handlePGChange('api_key', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="API Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Secret Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={pgSettings.secret_key}
              onChange={(e) => handlePGChange('secret_key', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="Secret Key"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              보안을 위해 암호화되어 저장됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <input
              type="checkbox"
              id="is_test_mode"
              checked={pgSettings.is_test_mode}
              onChange={(e) => handlePGChange('is_test_mode', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_test_mode" className="text-sm text-text">
              <span className="font-medium">테스트 모드</span>
              <span className="ml-2 text-text-tertiary">
                (실제 결제가 이루어지지 않습니다)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 추가 설정 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">추가 설정</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              최소 결제 금액
            </label>
            <input
              type="number"
              defaultValue={1000}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="1000"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              이 금액 미만으로는 결제가 불가능합니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              무이자 할부 개월수
            </label>
            <div className="flex gap-2">
              {[2, 3, 6, 12].map((month) => (
                <label key={month} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-text">{month}개월</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_refund"
              className="rounded border-gray-300"
            />
            <label htmlFor="auto_refund" className="text-sm text-text">
              주문 취소 시 자동 환불 처리
            </label>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={() => {
            showToast('연결 테스트를 진행합니다...', 'info')
          }}
          className="px-6 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
        >
          연결 테스트
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
  )
}
