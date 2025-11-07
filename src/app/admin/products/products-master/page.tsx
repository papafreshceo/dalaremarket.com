'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Modal } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'
import ExcelJS from 'exceljs'

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
  const [originalData, setOriginalData] = useState<ProductMaster[]>([]) // 원본 데이터 추적
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0, message: '' })
  const [supplyStatuses, setSupplyStatuses] = useState<Array<{ code: string; name: string }>>([])

  useEffect(() => {
    fetchProducts()
    fetchSupplyStatuses()
  }, [])

  useEffect(() => {
    setTableData(products)
    // products가 변경되면 originalData도 갱신 (최초 로드 및 저장 후 fetchProducts 호출 시)
    setOriginalData(JSON.parse(JSON.stringify(products)))
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

  // 변경된 데이터 감지 함수
  const getChangedRows = () => {
    const changed: ProductMaster[] = []
    const newRows: ProductMaster[] = []

    tableData.forEach((row) => {
      // 신규 행
      if (!row.id || String(row.id).startsWith('temp_')) {
        newRows.push(row)
        return
      }

      // 기존 행 중 변경된 것 찾기
      const original = originalData.find(o => o.id === row.id)
      if (original) {
        // 필드별로 비교 (JSON.stringify는 순서에 민감하므로 직접 비교)
        const isChanged =
          original.category_1 !== row.category_1 ||
          original.category_2 !== row.category_2 ||
          original.category_3 !== row.category_3 ||
          original.category_4 !== row.category_4 ||
          original.category_4_code !== row.category_4_code ||
          original.supply_status !== row.supply_status ||
          original.shipping_deadline !== row.shipping_deadline ||
          original.season_start_date !== row.season_start_date ||
          original.season_end_date !== row.season_end_date ||
          original.seller_supply !== row.seller_supply ||
          original.is_best !== row.is_best ||
          original.is_recommended !== row.is_recommended ||
          original.has_image !== row.has_image ||
          original.has_detail_page !== row.has_detail_page ||
          original.notes !== row.notes ||
          original.is_active !== row.is_active

        if (isChanged) {
          changed.push(row)
        }
      }
    })

    console.log('[Save Debug] 변경 감지 결과:', {
      newRowsCount: newRows.length,
      changedCount: changed.length,
      changedIds: changed.map(r => r.id)
    })

    return { changed, newRows, total: changed.length + newRows.length }
  }

  const handleSave = async () => {
    try {
      console.log('[Save Debug] originalData 샘플:', originalData[0])
      console.log('[Save Debug] tableData 샘플:', tableData[0])
      console.log('[Save Debug] originalData 길이:', originalData.length)
      console.log('[Save Debug] tableData 길이:', tableData.length)

      const { changed, newRows, total } = getChangedRows()

      if (total === 0) {
        showToast('변경된 데이터가 없습니다.', 'info')
        return
      }

      setSaving(true)
      setSaveProgress({ current: 0, total, message: '저장 준비 중...' })

      let skippedRows: string[] = []
      let duplicateRows: string[] = []
      let savedCount = 0

      // 신규 행 저장
      for (let i = 0; i < newRows.length; i++) {
        const row = newRows[i]
        setSaveProgress({
          current: savedCount + 1,
          total,
          message: `신규 데이터 ${i + 1}/${newRows.length} 저장 중...`
        })

        // 최소한 category_4(품목)는 있어야 함
        if (!row.category_4) {
          console.log('⚠️ category_4가 없어서 건너뜀:', row);
          skippedRows.push(`${row.category_1 || ''} > ${row.category_2 || ''} > ${row.category_3 || ''} (품목명 없음)`)
          continue
        }

        // 중복 검사
        const { data: existingData, error: checkError } = await supabase
          .from('products_master')
          .select('id')
          .eq('category_1', row.category_1 || null)
          .eq('category_2', row.category_2 || null)
          .eq('category_3', row.category_3 || null)
          .eq('category_4', row.category_4)
          .limit(1)

        if (!checkError && existingData && existingData.length > 0) {
          const duplicatePath = `${row.category_1 || ''} > ${row.category_2 || ''} > ${row.category_3 || ''} > ${row.category_4}`
          duplicateRows.push(duplicatePath)
          console.log('⚠️ 중복된 품목:', duplicatePath)
          continue
        }

        const productData: any = {
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
          notes: row.notes || null,
          is_active: row.is_active !== null ? row.is_active : true
        }

        // has_image, has_detail_page는 DB 컬럼이 존재하는 경우에만 포함
        if (row.has_image !== undefined) {
          productData.has_image = row.has_image || false
        }
        if (row.has_detail_page !== undefined) {
          productData.has_detail_page = row.has_detail_page || false
        }

        // 신규 등록
        const { data, error } = await supabase
          .from('products_master')
          .insert([productData])
          .select()
          .single()

        if (error) {
          // 중복 에러 처리
          if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
            const duplicatePath = `${row.category_1 || ''} > ${row.category_2 || ''} > ${row.category_3 || ''} > ${row.category_4}`
            duplicateRows.push(duplicatePath)
            console.log('⚠️ 등록 중 중복 발견:', duplicatePath)
            continue
          }
          showToast(`품목 등록 실패: ${error.message}`, 'error')
          continue
        }

        savedCount++
      }

      // 변경된 행 저장
      for (let i = 0; i < changed.length; i++) {
        const row = changed[i]
        setSaveProgress({
          current: savedCount + 1,
          total,
          message: `수정 데이터 ${i + 1}/${changed.length} 저장 중...`
        })

        const productData: any = {
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
          notes: row.notes || null,
          is_active: row.is_active !== null ? row.is_active : true
        }

        // has_image, has_detail_page는 DB 컬럼이 존재하는 경우에만 포함
        if (row.has_image !== undefined) {
          productData.has_image = row.has_image || false
        }
        if (row.has_detail_page !== undefined) {
          productData.has_detail_page = row.has_detail_page || false
        }

        const { error } = await supabase
          .from('products_master')
          .update(productData)
          .eq('id', row.id)

        if (error) {
          console.error('업데이트 에러 상세:', error)
          showToast(`품목 수정 실패: ${error.message} (${error.code})`, 'error')
          continue
        }

        savedCount++
      }

      setSaveProgress({ current: total, total, message: '데이터 새로고침 중...' })
      await fetchProducts()

      setSaving(false)

      // 중복 및 스킵 알림
      if (duplicateRows.length > 0) {
        const duplicateMessage = duplicateRows.length > 3
          ? `${duplicateRows.slice(0, 3).join('\n')}\n... 외 ${duplicateRows.length - 3}개`
          : duplicateRows.join('\n')

        await confirm({
          title: '⚠️ 중복된 품목이 있습니다',
          message: `다음 품목은 이미 존재하여 건너뛰었습니다:\n\n${duplicateMessage}`,
          confirmText: '확인',
          showCancel: false
        })
      }

      if (skippedRows.length > 0) {
        const skipMessage = skippedRows.length > 3
          ? `${skippedRows.slice(0, 3).join('\n')}\n... 외 ${skippedRows.length - 3}개`
          : skippedRows.join('\n')

        await confirm({
          title: '⚠️ 건너뛴 행이 있습니다',
          message: `다음 행은 품목명이 없어 저장되지 않았습니다:\n\n${skipMessage}`,
          confirmText: '확인',
          showCancel: false
        })
      }

      let message = `저장 완료! (신규: ${newRows.length}개, 수정: ${changed.length}개)`
      if (duplicateRows.length > 0 || skippedRows.length > 0) {
        message += ` (중복: ${duplicateRows.length}개, 건너뜀: ${skippedRows.length}개)`
      }
      showToast(message, 'success')
    } catch (error) {
      console.error('저장 중 오류:', error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 동기화 기능 (원물 및 옵션상품에 품목 마스터 데이터 상속 및 매칭)
  const handleSync = async () => {
    try {
      const confirmed = await confirm({
        title: '품목 마스터 동기화',
        message: '품목 마스터 데이터를 원물과 옵션상품에 동기화하시겠습니까?\n\n이 작업은 다음을 수행합니다:\n- 품목별 원물/옵션상품 매칭\n- 품목 정보 상속 (공급상태, 시즌 등)',
        confirmText: '동기화',
        showCancel: true
      })

      if (!confirmed) return

      setSyncing(true)
      setSaveProgress({ current: 0, total: 100, message: '동기화 준비 중...' })

      // 1. 전체 매칭 실행
      setSaveProgress({ current: 30, total: 100, message: '원물/옵션상품 매칭 중...' })
      const matchResponse = await fetch('/api/link-product-masters', {
        method: 'POST'
      })
      const matchResult = await matchResponse.json()

      // 2. 상속 실행 (활성화된 모든 품목 마스터에 대해)
      setSaveProgress({ current: 60, total: 100, message: '품목 정보 상속 중...' })
      const activeProducts = products.filter(p => p.is_active)
      let totalRawMaterials = 0
      let totalOptionProducts = 0

      for (const product of activeProducts) {
        const response = await fetch('/api/inherit-product-master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productMasterId: product.id })
        })
        const result = await response.json()
        if (result.success) {
          totalRawMaterials += result.rawMaterialsUpdated || 0
          totalOptionProducts += result.optionProductsUpdated || 0
        }
      }

      setSaveProgress({ current: 100, total: 100, message: '동기화 완료!' })
      setSyncing(false)

      // 결과 모달 표시
      if (matchResult.success) {
        setMatchResult({
          ...matchResult,
          inheritedRawMaterials: totalRawMaterials,
          inheritedOptionProducts: totalOptionProducts
        })
        setShowMatchResultModal(true)
      } else {
        showToast(`동기화 완료! 상속: 원물 ${totalRawMaterials}개, 옵션상품 ${totalOptionProducts}개`, 'success')
      }
    } catch (error) {
      console.error('동기화 중 오류:', error)
      showToast('동기화 중 오류가 발생했습니다.', 'error')
    } finally {
      setSyncing(false)
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
      renderer: (value: any) => (
        <div className="flex items-center justify-center">
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
      renderer: (value: any) => (
        <div className="flex items-center justify-center">
          {value && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded border border-blue-300">
              상세페이지
            </span>
          )}
        </div>
      )
    },
    { key: 'notes', title: '비고', width: 200, className: 'text-center' },
    {
      key: 'is_active',
      title: '활성화',
      width: 90,
      className: 'text-center',
      type: 'checkbox' as const
    }
  ]

  const handleExcelDownload = async () => {
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

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('품목마스터')

    // Add headers
    const headers = Object.keys(excelData[0] || {})
    worksheet.addRow(headers)

    // Add data
    excelData.forEach(row => {
      worksheet.addRow(Object.values(row))
    })

    // Download file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `품목마스터_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)

    showToast('엑셀 다운로드 완료', 'success')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[16px] font-bold">품목 마스터</div>
        <div className="flex gap-2">
          {/* 동기화 버튼 */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-2 text-sm border border-green-500 text-green-600 rounded hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="원물/옵션상품과 동기화"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>동기화</span>
          </button>

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

      {/* 저장/동기화 중 상태 표시 */}
      {(saving || syncing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {saving ? '저장 중...' : '동기화 중...'}
              </div>

              {/* 진행 상황 바 */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${saveProgress.total > 0 ? (saveProgress.current / saveProgress.total) * 100 : 0}%`
                  }}
                />
              </div>

              {/* 진행 상황 텍스트 */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {saveProgress.message}
              </div>

              {/* 로딩 스피너 */}
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <EditableAdminGrid
        data={tableData}
        columns={columns}
        onDataChange={handleDataChange}
        onSave={handleSave}
        onDelete={handleDelete}
        enableRowSelection
        enableAddRow
        enableCopy
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

              {/* 상속 결과 (동기화 실행 시에만 표시) */}
              {(matchResult.inheritedRawMaterials !== undefined || matchResult.inheritedOptionProducts !== undefined) && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    품목 정보 상속 결과
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">원물 업데이트:</span>
                      <span className="font-semibold text-green-600">
                        {matchResult.inheritedRawMaterials || 0}건
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">옵션상품 업데이트:</span>
                      <span className="font-semibold text-green-600">
                        {matchResult.inheritedOptionProducts || 0}건
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
