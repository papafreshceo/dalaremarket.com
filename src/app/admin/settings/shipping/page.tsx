'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface ShippingCompany {
  id: string
  name: string
  code: string
  is_active: boolean
}

interface ShippingPolicy {
  free_shipping_threshold: number
  default_shipping_fee: number
  jeju_additional_fee: number
  island_additional_fee: number
  same_day_shipping_cutoff: string
}

export default function ShippingSettingsPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([
    { id: '1', name: 'CJ대한통운', code: 'cj', is_active: true },
    { id: '2', name: '우체국택배', code: 'epost', is_active: true },
    { id: '3', name: '로젠택배', code: 'logen', is_active: true },
    { id: '4', name: '한진택배', code: 'hanjin', is_active: false },
    { id: '5', name: '롯데택배', code: 'lotte', is_active: false },
    { id: '6', name: 'GSPostBox', code: 'gspostbox', is_active: false },
    { id: '7', name: '경동택배', code: 'kdexp', is_active: false }
  ])

  const [shippingPolicy, setShippingPolicy] = useState<ShippingPolicy>({
    free_shipping_threshold: 30000,
    default_shipping_fee: 3000,
    jeju_additional_fee: 3000,
    island_additional_fee: 5000,
    same_day_shipping_cutoff: '14:00'
  })

  const toggleCompany = (id: string) => {
    setShippingCompanies(prev =>
      prev.map(company =>
        company.id === id ? { ...company, is_active: !company.is_active } : company
      )
    )
  }

  const handlePolicyChange = (field: keyof ShippingPolicy, value: number | string) => {
    setShippingPolicy(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // 실제로는 Supabase에 저장
      // await supabase.from('shipping_settings').upsert({ shippingCompanies, shippingPolicy })

      showToast('배송 설정이 저장되었습니다.', 'success')
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>배송 설정</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>배송사 및 배송비 정책을 관리합니다.</p>
      </div>

      {/* 배송사 설정 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">배송사 설정</h2>
        <p className="text-sm text-text-tertiary">사용할 택배사를 선택하세요.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shippingCompanies.map((company) => (
            <div
              key={company.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                company.is_active
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-gray-400'
              }`}
              onClick={() => toggleCompany(company.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text">{company.name}</div>
                  <div className="text-xs text-text-tertiary mt-1">{company.code}</div>
                </div>
                <div
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    company.is_active ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      company.is_active ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              선택한 배송사는 주문 등록 시 선택할 수 있습니다.
            </div>
          </div>
        </div>
      </div>

      {/* 배송비 정책 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">배송비 정책</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              기본 배송비 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={shippingPolicy.default_shipping_fee}
                onChange={(e) => handlePolicyChange('default_shipping_fee', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                placeholder="3000"
              />
              <span className="text-text-secondary">원</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              무료배송 기준금액
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={shippingPolicy.free_shipping_threshold}
                onChange={(e) => handlePolicyChange('free_shipping_threshold', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                placeholder="30000"
              />
              <span className="text-text-secondary">원 이상</span>
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              0원으로 설정하면 무료배송이 적용되지 않습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                제주 추가배송비
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={shippingPolicy.jeju_additional_fee}
                  onChange={(e) => handlePolicyChange('jeju_additional_fee', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="3000"
                />
                <span className="text-text-secondary">원</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                도서산간 추가배송비
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={shippingPolicy.island_additional_fee}
                  onChange={(e) => handlePolicyChange('island_additional_fee', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                  placeholder="5000"
                />
                <span className="text-text-secondary">원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 출고 정책 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">출고 정책</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              당일 출고 마감시간
            </label>
            <input
              type="time"
              value={shippingPolicy.same_day_shipping_cutoff}
              onChange={(e) => handlePolicyChange('same_day_shipping_cutoff', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              이 시간 이전 주문은 당일 출고, 이후 주문은 익일 출고됩니다.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">
              주말 출고
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saturday_shipping"
                className="rounded border-gray-300"
              />
              <label htmlFor="saturday_shipping" className="text-sm text-text">
                토요일 출고
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sunday_shipping"
                className="rounded border-gray-300"
              />
              <label htmlFor="sunday_shipping" className="text-sm text-text">
                일요일 출고
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              평균 배송 소요일
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={2}
                min={1}
                max={7}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              />
              <span className="text-text-secondary">일</span>
            </div>
          </div>
        </div>
      </div>

      {/* 반품/교환 배송비 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">반품/교환 배송비</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              반품 배송비 (편도)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={3000}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              />
              <span className="text-text-secondary">원</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              교환 배송비 (왕복)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={6000}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              />
              <span className="text-text-secondary">원</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              판매자 과실로 인한 반품/교환 시에는 배송비를 판매자가 부담합니다.
            </div>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
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
  )
}
