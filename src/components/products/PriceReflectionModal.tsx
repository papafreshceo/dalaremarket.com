// components/products/PriceReflectionModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'

type ApplyAction = 'keep' | 'auto_only' | 'switch_to_auto' | 'apply_auto'

interface AffectedProduct {
  option_product_id: string
  option_name: string
  material_cost_policy: string
  current_material_cost: number
  new_material_cost: number
  current_total_cost: number
  new_total_cost: number
  seller_mode: string
  naver_mode: string
  coupang_mode: string
}

interface SellerPreview {
  option_product_id: string
  option_name: string
  seller_mode: string
  current_seller_price: number
  new_auto_price: number
  can_auto_apply: boolean
}

interface DirectPreview {
  option_product_id: string
  option_name: string
  naver_mode: string
  current_naver_paid: number
  new_naver_paid_auto: number
  current_naver_free: number
  new_naver_free_auto: number
  coupang_mode: string
  current_coupang_paid: number
  new_coupang_paid_auto: number
  current_coupang_free: number
  new_coupang_free_auto: number
}

interface Props {
  materialId: string
  materialName: string
  onClose: () => void
  onComplete: () => void
}

export default function PriceReflectionModal({ materialId, materialName, onClose, onComplete }: Props) {
  const supabase = createClient()

  const [step, setStep] = useState(1) // 1: 원물가, 2: 셀러공급가, 3: 직접판매가
  const [loading, setLoading] = useState(false)

  // 1단계 데이터
  const [affectedProducts, setAffectedProducts] = useState<AffectedProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  // 2단계 데이터
  const [sellerPreviews, setSellerPreviews] = useState<SellerPreview[]>([])
  const [sellerActions, setSellerActions] = useState<Map<string, ApplyAction>>(new Map())

  // 3단계 데이터
  const [directPreviews, setDirectPreviews] = useState<DirectPreview[]>([])
  const [naverActions, setNaverActions] = useState<Map<string, ApplyAction>>(new Map())
  const [coupangActions, setCoupangActions] = useState<Map<string, ApplyAction>>(new Map())

  // 1단계: 영향받는 상품 조회
  useEffect(() => {
    loadAffectedProducts()
  }, [])

  const loadAffectedProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_affected_option_products', {
        p_material_id: materialId
      })

      if (error) throw error

      setAffectedProducts(data || [])

      // 기본으로 모두 선택
      const allIds = new Set(data?.map((p: AffectedProduct) => p.option_product_id) || [])
      setSelectedProducts(allIds)
    } catch (error) {
      console.error('Error loading affected products:', error)
      alert('옵션상품 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 2단계: 셀러공급가 미리보기
  const loadSellerPreviews = async () => {
    setLoading(true)
    try {
      const selectedIds = Array.from(selectedProducts)
      const { data, error } = await supabase.rpc('preview_seller_prices', {
        p_option_product_ids: selectedIds
      })

      if (error) throw error

      setSellerPreviews(data || [])

      // 기본 액션 설정
      const actions = new Map<string, ApplyAction>()
      data?.forEach((p: SellerPreview) => {
        if (p.seller_mode === '자동') {
          actions.set(p.option_product_id, 'apply_auto')
        } else {
          actions.set(p.option_product_id, 'auto_only')
        }
      })
      setSellerActions(actions)
    } catch (error) {
      console.error('Error loading seller previews:', error)
      alert('셀러공급가 미리보기 실패')
    } finally {
      setLoading(false)
    }
  }

  // 3단계: 직접판매가 미리보기
  const loadDirectPreviews = async () => {
    setLoading(true)
    try {
      const selectedIds = Array.from(selectedProducts)
      const { data, error } = await supabase.rpc('preview_direct_prices', {
        p_option_product_ids: selectedIds
      })

      if (error) throw error

      setDirectPreviews(data || [])

      // 기본 액션 설정
      const nActions = new Map<string, ApplyAction>()
      const cActions = new Map<string, ApplyAction>()
      data?.forEach((p: DirectPreview) => {
        if (p.naver_mode === '자동') {
          nActions.set(p.option_product_id, 'apply_auto')
        } else {
          nActions.set(p.option_product_id, 'auto_only')
        }

        if (p.coupang_mode === '자동') {
          cActions.set(p.option_product_id, 'apply_auto')
        } else {
          cActions.set(p.option_product_id, 'auto_only')
        }
      })
      setNaverActions(nActions)
      setCoupangActions(cActions)
    } catch (error) {
      console.error('Error loading direct previews:', error)
      alert('직접판매가 미리보기 실패')
    } finally {
      setLoading(false)
    }
  }

  // 다음 단계로
  const handleNext = async () => {
    if (step === 1) {
      if (selectedProducts.size === 0) {
        alert('반영할 상품을 선택해주세요.')
        return
      }
      // 원물가 반영
      setLoading(true)
      try {
        const { error } = await supabase.rpc('apply_material_cost_update', {
          p_option_product_ids: Array.from(selectedProducts)
        })
        if (error) throw error

        // 2단계로
        await loadSellerPreviews()
        setStep(2)
      } catch (error) {
        console.error('Error applying material cost:', error)
        alert('원물가 반영 실패')
      } finally {
        setLoading(false)
      }
    } else if (step === 2) {
      // 셀러공급가 반영
      setLoading(true)
      try {
        const updates = Array.from(sellerActions.entries()).map(([id, action]) => ({
          id,
          action
        }))

        const { error } = await supabase.rpc('apply_seller_price_update', {
          p_updates: updates
        })
        if (error) throw error

        // 3단계로
        await loadDirectPreviews()
        setStep(3)
      } catch (error) {
        console.error('Error applying seller prices:', error)
        alert('셀러공급가 반영 실패')
      } finally {
        setLoading(false)
      }
    } else if (step === 3) {
      // 직접판매가 반영
      setLoading(true)
      try {
        const updates = Array.from(selectedProducts).map(id => ({
          id,
          naver_action: naverActions.get(id) || 'keep',
          coupang_action: coupangActions.get(id) || 'keep'
        }))

        const { error } = await supabase.rpc('apply_direct_price_update', {
          p_updates: updates
        })
        if (error) throw error

        alert('시세 반영이 완료되었습니다!')
        onComplete()
        onClose()
      } catch (error) {
        console.error('Error applying direct prices:', error)
        alert('직접판매가 반영 실패')
      } finally {
        setLoading(false)
      }
    }
  }

  const toggleProduct = (id: string) => {
    const newSet = new Set(selectedProducts)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedProducts(newSet)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <h2 className="text-xl font-bold text-blue-900">
            시세 반영 - {materialName}
          </h2>
          <div className="mt-2 flex gap-2">
            <div className={`px-3 py-1 rounded text-sm font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1. 원물가
            </div>
            <div className={`px-3 py-1 rounded text-sm font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2. 셀러공급가
            </div>
            <div className={`px-3 py-1 rounded text-sm font-semibold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3. 직접판매가
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <div className="text-center py-8">로딩 중...</div>}

          {/* 1단계: 원물가 반영 */}
          {step === 1 && !loading && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                이 원물을 사용하는 옵션상품의 원가를 최신 시세로 업데이트합니다.
                <br />
                반영할 상품을 선택해주세요.
              </p>
              <div className="space-y-2">
                {affectedProducts.map(product => (
                  <div
                    key={product.option_product_id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.option_product_id)}
                        onChange={() => toggleProduct(product.option_product_id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{product.option_name}</div>
                        <div className="text-sm text-gray-600 mt-1 grid grid-cols-2 gap-2">
                          <div>
                            원물가: {product.current_material_cost?.toLocaleString()}원
                            → <span className="text-blue-600 font-semibold">{product.new_material_cost?.toLocaleString()}원</span>
                          </div>
                          <div>
                            총원가: {product.current_total_cost?.toLocaleString()}원
                            → <span className="text-blue-600 font-semibold">{product.new_total_cost?.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {affectedProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  이 원물을 사용하는 옵션상품이 없거나, 모두 고정가 정책입니다.
                </div>
              )}
            </div>
          )}

          {/* 2단계: 셀러공급가 반영 */}
          {step === 2 && !loading && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                변경된 원가를 셀러공급가에 반영할지 선택해주세요.
              </p>
              <div className="space-y-3">
                {sellerPreviews.map(product => (
                  <div key={product.option_product_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-2">{product.option_name}</div>
                    <div className="text-sm text-gray-600 mb-3">
                      현재: {product.current_seller_price?.toLocaleString()}원
                      → 자동 계산값: <span className="text-blue-600 font-semibold">{product.new_auto_price?.toLocaleString()}원</span>
                    </div>

                    {product.seller_mode === '자동' ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={sellerActions.get(product.option_product_id) === 'apply_auto'}
                          onChange={(e) => {
                            const newActions = new Map(sellerActions)
                            newActions.set(product.option_product_id, e.target.checked ? 'apply_auto' : 'keep')
                            setSellerActions(newActions)
                          }}
                        />
                        <span className="text-green-600 font-semibold">✓ 반영 (자동 모드)</span>
                      </label>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-amber-600 font-semibold">⚠️ 수동 모드</div>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`seller_${product.option_product_id}`}
                              checked={sellerActions.get(product.option_product_id) === 'keep'}
                              onChange={() => {
                                const newActions = new Map(sellerActions)
                                newActions.set(product.option_product_id, 'keep')
                                setSellerActions(newActions)
                              }}
                            />
                            반영 안함
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`seller_${product.option_product_id}`}
                              checked={sellerActions.get(product.option_product_id) === 'auto_only'}
                              onChange={() => {
                                const newActions = new Map(sellerActions)
                                newActions.set(product.option_product_id, 'auto_only')
                                setSellerActions(newActions)
                              }}
                            />
                            자동값만 업데이트 (최종가 {product.current_seller_price?.toLocaleString()}원 유지)
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`seller_${product.option_product_id}`}
                              checked={sellerActions.get(product.option_product_id) === 'switch_to_auto'}
                              onChange={() => {
                                const newActions = new Map(sellerActions)
                                newActions.set(product.option_product_id, 'switch_to_auto')
                                setSellerActions(newActions)
                              }}
                            />
                            자동 모드로 전환하고 반영 ({product.new_auto_price?.toLocaleString()}원)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3단계: 직접판매가 반영 */}
          {step === 3 && !loading && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                변경된 원가를 직접판매가(네이버, 쿠팡)에 반영할지 선택해주세요.
              </p>
              <div className="space-y-4">
                {directPreviews.map(product => (
                  <div key={product.option_product_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-3">{product.option_name}</div>

                    {/* 네이버 */}
                    <div className="mb-3 pb-3 border-b">
                      <div className="text-sm font-semibold text-gray-700 mb-2">📦 네이버</div>
                      <div className="text-xs text-gray-600 mb-2">
                        유료배송: {product.current_naver_paid?.toLocaleString()}원 → {product.new_naver_paid_auto?.toLocaleString()}원 |
                        무료배송: {product.current_naver_free?.toLocaleString()}원 → {product.new_naver_free_auto?.toLocaleString()}원
                      </div>
                      {renderPriceActions(product.option_product_id, product.naver_mode, naverActions, setNaverActions, 'naver')}
                    </div>

                    {/* 쿠팡 */}
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">📦 쿠팡</div>
                      <div className="text-xs text-gray-600 mb-2">
                        유료배송: {product.current_coupang_paid?.toLocaleString()}원 → {product.new_coupang_paid_auto?.toLocaleString()}원 |
                        무료배송: {product.current_coupang_free?.toLocaleString()}원 → {product.new_coupang_free_auto?.toLocaleString()}원
                      </div>
                      {renderPriceActions(product.option_product_id, product.coupang_mode, coupangActions, setCoupangActions, 'coupang')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
                이전
              </Button>
            )}
            <Button onClick={handleNext} disabled={loading || (step === 1 && selectedProducts.size === 0)}>
              {step === 3 ? '완료' : '다음'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  function renderPriceActions(
    productId: string,
    mode: string,
    actions: Map<string, ApplyAction>,
    setActions: (actions: Map<string, ApplyAction>) => void,
    channel: 'naver' | 'coupang'
  ) {
    if (mode === '자동') {
      return (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={actions.get(productId) === 'apply_auto'}
            onChange={(e) => {
              const newActions = new Map(actions)
              newActions.set(productId, e.target.checked ? 'apply_auto' : 'keep')
              setActions(newActions)
            }}
          />
          <span className="text-green-600 font-semibold">✓ 반영 (자동 모드)</span>
        </label>
      )
    }

    return (
      <div className="space-y-1">
        <div className="text-xs text-amber-600 font-semibold">⚠️ 수동 모드</div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            name={`${channel}_${productId}`}
            checked={actions.get(productId) === 'keep'}
            onChange={() => {
              const newActions = new Map(actions)
              newActions.set(productId, 'keep')
              setActions(newActions)
            }}
          />
          반영 안함
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            name={`${channel}_${productId}`}
            checked={actions.get(productId) === 'auto_only'}
            onChange={() => {
              const newActions = new Map(actions)
              newActions.set(productId, 'auto_only')
              setActions(newActions)
            }}
          />
          자동값만 업데이트 (최종가 유지)
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            name={`${channel}_${productId}`}
            checked={actions.get(productId) === 'switch_to_auto'}
            onChange={() => {
              const newActions = new Map(actions)
              newActions.set(productId, 'switch_to_auto')
              setActions(newActions)
            }}
          />
          자동 모드로 전환하고 반영
        </label>
      </div>
    )
  }
}
