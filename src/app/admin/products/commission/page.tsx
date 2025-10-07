// app/admin/products/commission/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Modal } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface Market {
  id: string
  name: string
  commission: number
  color: string
  icon: string
  isDefault: boolean
}

const DEFAULT_MARKETS: Omit<Market, 'id' | 'commission'>[] = [
  { name: '네이버', color: 'green', icon: '', isDefault: true },
  { name: '쿠팡', color: 'blue', icon: '', isDefault: true },
  { name: '토스', color: 'sky', icon: '', isDefault: true },
  { name: 'ESM', color: 'purple', icon: '', isDefault: true },
  { name: '11번가', color: 'red', icon: '', isDefault: true },
  { name: '카카오', color: 'yellow', icon: '', isDefault: true },
  { name: '올웨이즈', color: 'pink', icon: '', isDefault: true },
]

export default function CommissionSettingsPage() {
  const supabase = createClient()
  const { showToast } = useToast()

  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMarketName, setNewMarketName] = useState('')
  const [newMarketColor, setNewMarketColor] = useState('gray')

  useEffect(() => {
    fetchCommissionSettings()
  }, [])

  const fetchCommissionSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('market_commissions')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setMarkets(data.map(d => ({
          id: d.id,
          name: d.market_name,
          commission: parseFloat(d.commission_rate) || 0,
          color: d.color || 'gray',
          icon: d.icon || '',
          isDefault: d.is_default || false
        })))
      } else {
        // 기본 마켓 초기화
        const defaultMarkets = DEFAULT_MARKETS.map((m, idx) => ({
          id: `default_${idx}`,
          ...m,
          commission: 0
        }))
        setMarkets(defaultMarkets)
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

      // 모든 마켓 수수료 저장
      for (const market of markets) {
        const { error } = await supabase
          .from('market_commissions')
          .upsert({
            id: market.id.startsWith('default_') ? undefined : market.id,
            market_name: market.name,
            commission_rate: market.commission.toString(),
            color: market.color,
            icon: market.icon,
            is_default: market.isDefault
          }, {
            onConflict: market.id.startsWith('default_') ? undefined : 'id'
          })

        if (error) throw error
      }

      await fetchCommissionSettings()
      showToast('수수료 설정이 저장되었습니다.', 'success')
    } catch (error) {
      console.error('수수료 설정 저장 실패:', error)
      showToast('수수료 설정 저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMarket = async () => {
    if (!newMarketName.trim()) {
      showToast('마켓명을 입력해주세요.', 'error')
      return
    }

    const newMarket: Market = {
      id: `new_${Date.now()}`,
      name: newMarketName,
      commission: 0,
      color: newMarketColor,
      icon: '',
      isDefault: false
    }

    setMarkets([...markets, newMarket])
    setShowAddModal(false)
    setNewMarketName('')
    setNewMarketColor('gray')
  }

  const handleDeleteMarket = (id: string) => {
    setMarkets(markets.filter(m => m.id !== id))
  }

  const handleCommissionChange = (id: string, value: number) => {
    setMarkets(markets.map(m => m.id === id ? { ...m, commission: value } : m))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="w-[500px]">
        {/* 헤더 */}
        <div className="space-y-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">수수료 설정</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              마켓별 판매 수수료율을 설정합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              + 마켓 추가
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>

        {/* 마켓 리스트 */}
        <div className="space-y-2">
        {markets.map((market) => (
          <div
            key={market.id}
            className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3"
          >
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{market.name}</span>
            </div>
            <div className="relative w-32">
              <input
                type="number"
                value={market.commission}
                onChange={(e) => handleCommissionChange(market.id, parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                %
              </div>
            </div>
            {!market.isDefault && (
              <button
                onClick={() => handleDeleteMarket(market.id)}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
        </div>
      </div>

      {/* 마켓 추가 모달 */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="마켓 추가"
          size="md"
        >
          <div className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                마켓명
              </label>
              <input
                type="text"
                value={newMarketName}
                onChange={(e) => setNewMarketName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="예: 지마켓"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                색상 테마
              </label>
              <div className="flex gap-2">
                {['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].map(color => (
                  <button
                    key={color}
                    onClick={() => setNewMarketColor(color)}
                    className={`w-10 h-10 rounded-lg bg-${color}-500 ${
                      newMarketColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                취소
              </Button>
              <Button
                onClick={handleAddMarket}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                추가
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
