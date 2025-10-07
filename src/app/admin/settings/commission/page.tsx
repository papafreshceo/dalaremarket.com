// app/admin/settings/commission/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

export default function CommissionSettingsPage() {
  const supabase = createClient()
  const { showToast } = useToast()

  const [naverCommission, setNaverCommission] = useState<number>(0)
  const [coupangCommission, setCoupangCommission] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCommissionSettings()
  }, [])

  const fetchCommissionSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['naver_commission_rate', 'coupang_commission_rate'])

      if (error) throw error

      if (data) {
        const naverSetting = data.find(s => s.key === 'naver_commission_rate')
        const coupangSetting = data.find(s => s.key === 'coupang_commission_rate')

        setNaverCommission(naverSetting ? parseFloat(naverSetting.value) : 0)
        setCoupangCommission(coupangSetting ? parseFloat(coupangSetting.value) : 0)
      }
    } catch (error) {
      console.error('수수료 설정 로드 실패:', error)
      showToast('수수료 설정을 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // 네이버 수수료 저장
      const { error: naverError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'naver_commission_rate',
          value: naverCommission.toString(),
          description: '네이버 판매 수수료율 (%)'
        }, {
          onConflict: 'key'
        })

      if (naverError) throw naverError

      // 쿠팡 수수료 저장
      const { error: coupangError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'coupang_commission_rate',
          value: coupangCommission.toString(),
          description: '쿠팡 판매 수수료율 (%)'
        }, {
          onConflict: 'key'
        })

      if (coupangError) throw coupangError

      showToast('수수료 설정이 저장되었습니다.', 'success')
    } catch (error) {
      console.error('수수료 설정 저장 실패:', error)
      showToast('수수료 설정 저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">수수료 설정</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            플랫폼별 판매 수수료율을 설정합니다
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>

      {/* 설정 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* 네이버 수수료 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">네이버 스마트스토어</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">네이버 플랫폼 판매 수수료</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                수수료율 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={naverCommission}
                  onChange={(e) => setNaverCommission(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="예: 5.9"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
                  %
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                예상 수수료 (10,000원 기준)
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-lg font-semibold">
                {Math.round(10000 * naverCommission / 100).toLocaleString()}원
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* 쿠팡 수수료 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">쿠팡 마켓플레이스</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">쿠팡 플랫폼 판매 수수료</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                수수료율 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={coupangCommission}
                  onChange={(e) => setCoupangCommission(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="예: 11.0"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
                  %
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                예상 수수료 (10,000원 기준)
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-lg font-semibold">
                {Math.round(10000 * coupangCommission / 100).toLocaleString()}원
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 정보 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold">수수료 설정 안내</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>각 플랫폼의 공식 수수료율을 확인하여 입력해주세요</li>
              <li>수수료율은 소수점 첫째 자리까지 입력 가능합니다</li>
              <li>설정된 수수료는 가격 계산 시 자동으로 반영됩니다</li>
              <li>수수료율이 변경되면 기존 상품의 가격도 재계산됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
