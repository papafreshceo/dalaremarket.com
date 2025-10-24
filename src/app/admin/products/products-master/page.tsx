'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Modal } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'
import * as XLSX from 'xlsx'

interface ProductMaster {
  id: string
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  category_4_code: string | null
  supply_status: string | null
  shipping_deadline: number | null
  season_start_date: string | null
  season_end_date: string | null
  seller_supply: boolean | null
  is_best: boolean | null
  is_recommended: boolean | null
  has_image: boolean | null
  has_detail_page: boolean | null
  notes: string | null
  is_active: boolean
}

// 날짜 포맷 변환 함수 (7-8 -> 07-08)
function formatSeasonDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null

  // 이미 MM-DD 형식인지 확인
  if (/^\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // M-D 또는 MM-D 또는 M-DD 형식을 MM-DD로 변환
  const parts = trimmed.split('-')
  if (parts.length === 2) {
    const month = parts[0].padStart(2, '0')
    const day = parts[1].padStart(2, '0')
    return `${month}-${day}`
  }

  return trimmed
}

export default function ProductsMasterPage() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const supabase = createClient()

  const [products, setProducts] = useState<ProductMaster[]>([])
  const [tableData, setTableData] = useState<ProductMaster[]>([])
  const [loading, setLoading] = useState(false)
  const [supplyStatuses, setSupplyStatuses] = useState<Array<{ code: string; name: string }>>([])

  useEffect(() => {
    fetchProducts()
    fetchSupplyStatuses()
  }, [])

  useEffect(() => {
    setTableData(products)
  }, [products])

  const fetchSupplyStatuses = async () => {
    const { data, error } = await supabase
      .from('supply_status_settings')
      .select('code, name')
      .eq('status_type', 'product')
      .eq('is_active', true)
      .order('display_order')

    if (!error && data) {
      setSupplyStatuses(data)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products_master')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('품목 마스터 로드 오류:', error)
      setLoading(false)
      return
    }

    if (data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const handleDataChange = (newData: ProductMaster[]) => {
    setTableData(newData)
  }

  const handleSave = async () => {
    try {
      let totalRawMaterials = 0
      let totalOptionProducts = 0

      for (const row of tableData) {
        // 최소한 category_3(품목)는 있어야 함
        if (!row.category_3) {
          continue
        }

        const productData = {
          category_1: row.category_1 || null,
          category_2: row.category_2 || null,
          category_3: row.category_3 || null,
          category_4: row.category_4 || null,
          category_4_code: row.category_4_code || null,
          supply_status: row.supply_status || null,
          shipping_deadline: row.shipping_deadline || null,
          season_start_date: formatSeasonDate(row.season_start_date),
          season_end_date: formatSeasonDate(row.season_end_date),
          seller_supply: row.seller_supply !== null ? row.seller_supply : true,
          is_best: row.is_best || false,
          is_recommended: row.is_recommended || false,
          has_image: row.has_image || false,
          has_detail_page: row.has_detail_page || false,
          notes: row.notes || null,
          is_active: row.is_active !== null ? row.is_active : true
        }

        let savedId: string | null = null

        if (!row.id || String(row.id).startsWith('temp_')) {
          // 신규 등록
          const { data, error } = await supabase
            .from('products_master')
            .insert([productData])
            .select()
            .single()

          if (error) {
            showToast(`품목 등록 실패: ${error.message}`, 'error')
            return
          }
          savedId = data?.id
        } else {
          // 기존 데이터 수정
          console.log('업데이트 데이터:', productData)
          const { error } = await supabase
            .from('products_master')
            .update(productData)
            .eq('id', row.id)

          if (error) {
            console.error('업데이트 에러 상세:', error)
            showToast(`품목 수정 실패: ${error.message}`, 'error')
            return
          }
          savedId = row.id
        }

        // 상속 실행: 품목 마스터 → 원물 → 옵션상품
        if (savedId) {
          const response = await fetch('/api/inherit-product-master', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productMasterId: savedId })
          })
          const result = await response.json()
          if (result.success) {
            totalRawMaterials += result.rawMaterialsUpdated || 0
            totalOptionProducts += result.optionProductsUpdated || 0
          }
        }
      }

      await fetchProducts()

      // 저장 후 전체 매칭 실행
      const matchResponse = await fetch('/api/link-product-masters', {
        method: 'POST'
      })
      const matchResult = await matchResponse.json()

      if (matchResult.success) {
        setMatchResult(matchResult)
        setShowMatchResultModal(true)
      } else {
        if (totalRawMaterials > 0 || totalOptionProducts > 0) {
          showToast(
            `저장 완료! 상속: 원물 ${totalRawMaterials}개, 옵션상품 ${totalOptionProducts}개`,
            'success'
          )
        } else {
          showToast('저장되었습니다.', 'success')
        }
      }
    } catch (error) {
      console.error('저장 중 오류:', error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleDelete = async (indices: number[]) => {
    if (indices.length === 0) {
      showToast('삭제할 항목을 선택해주세요.', 'warning')
      return
    }

    const confirmed = await confirm(
      `선택한 ${indices.length}개의 품목을 삭제하시겠습니까?`,
      '삭제된 데이터는 복구할 수 없습니다.'
    )

    if (!confirmed) return

    const idsToDelete = indices.map(i => tableData[i].id).filter(id => id && !String(id).startsWith('temp_'))

    if (idsToDelete.length > 0) {
      const { error } = await supabase
        .from('products_master')
        .delete()
        .in('id', idsToDelete)

      if (error) {
        showToast(`삭제 실패: ${error.message}`, 'error')
        return
      }
    }

    await fetchProducts()
    showToast(`${indices.length}개 항목이 삭제되었습니다.`, 'success')
  }

  const [showMatchResultModal, setShowMatchResultModal] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)

  const columns = [
    { key: 'category_1', title: '대분류', width: 150, className: 'text-center' },
    { key: 'category_2', title: '중분류', width: 150, className: 'text-center' },
    { key: 'category_3', title: '소분류', width: 150, className: 'text-center' },
    { key: 'category_4', title: '품목', width: 150, className: 'text-center' },
    { key: 'category_4_code', title: '품목코드', width: 120, className: 'text-center' },
    {
      key: 'supply_status',
      title: '공급상태',
      width: 120,
      className: 'text-center',
      type: 'dropdown' as const,
      source: supplyStatuses.map(s => s.name)
    },
    {
      key: 'shipping_deadline',
      title: '발송기한(일)',
      width: 100,
      className: 'text-center',
      type: 'number' as const
    },
    {
      key: 'season_start_date',
      title: '시즌시작(MM-DD)',
      width: 130,
      className: 'text-center'
    },
    {
      key: 'season_end_date',
      title: '시즌종료(MM-DD)',
      width: 130,
      className: 'text-center'
    },
    {
      key: 'seller_supply',
      title: '셀러공급',
      width: 100,
      className: 'text-center',
      type: 'checkbox' as const
    },
    {
      key: 'is_best',
      title: '베스트',
      width: 80,
      className: 'text-center',
      type: 'checkbox' as const
    },
    {
      key: 'is_recommended',
      title: '추천상품',
      width: 90,
      className: 'text-center',
      type: 'checkbox' as const
    },
    {
      key: 'has_image',
      title: '이미지Y/N',
      width: 100,
      className: 'text-center',
      type: 'checkbox' as const,
      renderer: (value: any) => (
        <div className="flex items-center justify-center gap-2">
          <input type="checkbox" checked={!!value} readOnly className="w-4 h-4" />
          {value && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded border border-gray-300">
              이미지
            </span>
          )}
        </div>
      )
    },
    {
      key: 'has_detail_page',
      title: '상세페이지Y/N',
      width: 120,
      className: 'text-center',
      type: 'checkbox' as const,
      renderer: (value: any) => (
        <div className="flex items-center justify-center gap-2">
          <input type="checkbox" checked={!!value} readOnly className="w-4 h-4" />
          {value && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded border border-blue-300">
              상세페이지
            </span>
          )}
        </div>
      )
    },
    { key: 'notes', title: '비고', width: 200, className: 'text-center' }
  ]

  const handleExcelDownload = () => {
    const excelData = products.map(prod => ({
      'ID': prod.id,
      '대분류': prod.category_1 || '',
      '중분류': prod.category_2 || '',
      '소분류': prod.category_3 || '',
      '품목': prod.category_4 || '',
      '품목코드': prod.category_4_code || '',
      '공급상태': prod.supply_status || '',
      '발송기한(일)': prod.shipping_deadline || '',
      '시즌시작': prod.season_start_date || '',
      '시즌종료': prod.season_end_date || '',
      '셀러공급': prod.seller_supply ? 'Y' : 'N',
      '베스트': prod.is_best ? 'Y' : 'N',
      '추천상품': prod.is_recommended ? 'Y' : 'N',
      '이미지제공': prod.has_image ? 'Y' : 'N',
      '상세페이지': prod.has_detail_page ? 'Y' : 'N',
      '비고': prod.notes || '',
      '활성화': prod.is_active ? 'Y' : 'N'
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '품목마스터')
    XLSX.writeFile(workbook, `품목마스터_${new Date().toISOString().split('T')[0]}.xlsx`)
    showToast('엑셀 다운로드 완료', 'success')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[16px] font-bold">품목 마스터</div>
        <div className="flex gap-2">
          {/* 엑셀 다운로드 버튼 */}
          <button
            onClick={handleExcelDownload}
            className="p-2 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition-colors"
            title="엑셀 다운로드"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      <EditableAdminGrid
        data={tableData}
        columns={columns}
        onDataChange={handleDataChange}
        onSave={handleSave}
        onDelete={handleDelete}
        enableRowSelection
        enableAddRow
        loading={loading}
      />

      {/* 전체 매칭 결과 모달 */}
      <Modal
        isOpen={showMatchResultModal}
        onClose={() => setShowMatchResultModal(false)}
        title="전체 매칭 완료"
        size="md"
      >
        {matchResult && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-2xl font-bold text-green-600 mb-2">
                매칭이 완료되었습니다
              </div>
              <div className="text-sm text-gray-500">
                총 {matchResult.productMastersCount}개 품목 마스터 기준
              </div>
            </div>

            <div className="space-y-3">
              {/* 원물 매칭 결과 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  원물 매칭 결과
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">새로 매칭:</span>
                    <span className="font-semibold text-green-600">
                      {matchResult.newRawMaterials}건
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">이미 매칭됨:</span>
                    <span className="font-semibold text-gray-600">
                      {matchResult.alreadyLinkedRawMaterials}건
                    </span>
                  </div>
                </div>
              </div>

              {/* 옵션상품 매칭 결과 */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  옵션상품 매칭 결과
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">새로 매칭:</span>
                    <span className="font-semibold text-green-600">
                      {matchResult.newOptionProducts}건
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">이미 매칭됨:</span>
                    <span className="font-semibold text-gray-600">
                      {matchResult.alreadyLinkedOptionProducts}건
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setShowMatchResultModal(false)}
                className="px-6"
              >
                확인
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
