'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Modal } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'
import ExcelJS from 'exceljs'

interface CategorySetting {
  id: string
  expense_type: string | null
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  category_5: string | null
  notes: string | null
}

export default function CategorySettingsPage() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const [categories, setCategories] = useState<CategorySetting[]>([])
  const [tableData, setTableData] = useState<CategorySetting[]>([])
  const [filteredTableData, setFilteredTableData] = useState<CategorySetting[]>([])
  const [loading, setLoading] = useState(false)
  const [filterExpenseType, setFilterExpenseType] = useState<'전체' | '사입' | '지출' | '가공'>('전체')

  // 엑셀 업로드 모달
  const [excelUploadModal, setExcelUploadModal] = useState<{ data: any[], mode: 'replace' | 'merge' | null } | null>(null)

  // 엑셀 업로드 결과 모달
  const [uploadResultModal, setUploadResultModal] = useState<{
    type: 'replace' | 'merge'
    originalCount: number
    uploadCount: number
    added: string[]
    updated: string[]
    deleted: string[]
    unchanged: string[]
  } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  // categories를 tableData에 복사 (전체 데이터)
  useEffect(() => {
    setTableData(categories)
  }, [categories])

  // 필터링된 데이터를 filteredTableData에 설정
  useEffect(() => {
    if (filterExpenseType === '전체') {
      setFilteredTableData(tableData)
    } else {
      setFilteredTableData(tableData.filter(c => c.expense_type === filterExpenseType))
    }
  }, [tableData, filterExpenseType])

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('category_settings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('카테고리 로드 오류:', error)
      setLoading(false)
      return
    }

    if (data) {
      setCategories(data)
    }
    setLoading(false)
  }

  const handleDataChange = (newData: CategorySetting[]) => {
    // Grid에서 변경된 데이터를 받아서 업데이트
    // 필터 모드에 따라 처리
    if (filterExpenseType === '전체') {
      // 전체 모드: tableData 그대로 업데이트
      setTableData(newData)
    } else {
      // 필터 모드: 변경된 데이터를 tableData에 병합
      const updatedTableData = tableData.map(row => {
        const found = newData.find(newRow => newRow.id === row.id)
        return found || row
      })
      // 새로 추가된 행도 포함
      const newRows = newData.filter(newRow =>
        !tableData.some(row => row.id === newRow.id)
      )
      setTableData([...updatedTableData, ...newRows])
    }
  }

  const handleSave = async () => {
    try {
      // 1단계: tableData 내부 중복 제거
      const seen = new Map<string, CategorySetting>()
      const uniqueRows: CategorySetting[] = []

      tableData.forEach(row => {
        // 최소한 하나의 카테고리는 입력되어야 함
        if (!row.category_1 && !row.category_2 && !row.category_3 && !row.category_4) {
          return // 모든 카테고리가 비어있으면 스킵
        }

        const key = `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}`

        if (!seen.has(key)) {
          seen.set(key, row)
          uniqueRows.push(row)
        }
      })

      if (uniqueRows.length < tableData.length) {
        const duplicateCount = tableData.length - uniqueRows.length
        showToast(`테이블에서 ${duplicateCount}개의 중복이 발견되어 제거했습니다.`, 'warning')
      }

      // 전체 교체 모드인지 확인 (모든 행이 temp_ ID를 가지면 전체 교체)
      const allRowsAreNew = uniqueRows.every(row => !row.id || String(row.id).startsWith('temp_'))

      if (allRowsAreNew && uniqueRows.length > 0) {
        // 전체 교체 모드: 기존 데이터 모두 삭제 후 새로 삽입
        const { error: deleteError } = await supabase
          .from('category_settings')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 삭제

        if (deleteError) {
          showToast(`기존 데이터 삭제 실패: ${deleteError.message}`, 'error')
          return
        }

        // 중복 체크 후 새 데이터 삽입
        const insertedKeys = new Set<string>()

        for (let i = 0; i < uniqueRows.length; i++) {
          const row = uniqueRows[i]
          const key = `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}`

          if (insertedKeys.has(key)) {
            continue
          }

          const { error } = await supabase.from('category_settings').insert([{
            expense_type: row.expense_type || null,
            category_1: row.category_1 || null,
            category_2: row.category_2 || null,
            category_3: row.category_3 || null,
            category_4: row.category_4 || null,
            notes: row.notes || null
          }]).select()

          if (error) {
            showToast(`카테고리 등록 실패: ${error.message}`, 'error')
            return
          }

          insertedKeys.add(key)
        }
      } else {
        // 병합 모드: 기존 방식대로 처리
        const insertedKeys = new Set<string>()

        for (let i = 0; i < uniqueRows.length; i++) {
          const row = uniqueRows[i]
          const key = `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}`

          if (!row.id || String(row.id).startsWith('temp_')) {
            // 이번 저장에서 이미 삽입했는지 체크
            if (insertedKeys.has(key)) {
              continue
            }

            // DB에 이미 있는지 체크
            const { data: existing } = await supabase
              .from('category_settings')
              .select('id')
              .eq('expense_type', row.expense_type || null)
              .eq('category_1', row.category_1 || null)
              .eq('category_2', row.category_2 || null)
              .eq('category_3', row.category_3 || null)
              .eq('category_4', row.category_4 || null)
              .limit(1)

            if (existing && existing.length > 0) {
              continue
            }

            const { error } = await supabase.from('category_settings').insert([{
              expense_type: row.expense_type || null,
              category_1: row.category_1 || null,
              category_2: row.category_2 || null,
              category_3: row.category_3 || null,
              category_4: row.category_4 || null,
              notes: row.notes || null
            }]).select()

            if (error) {
              showToast(`카테고리 등록 실패: ${error.message}`, 'error')
              return
            }

            insertedKeys.add(key)
          } else {
            // 기존 데이터 업데이트
            const { error } = await supabase.from('category_settings').update({
              expense_type: row.expense_type || null,
              category_1: row.category_1 || null,
              category_2: row.category_2 || null,
              category_3: row.category_3 || null,
              category_4: row.category_4 || null,
              notes: row.notes || null
            }).eq('id', row.id)

            if (error) {
              showToast(`카테고리 수정 실패: ${error.message}`, 'error')
              return
            }
          }
        }
      }

      await fetchCategories()
      showToast('저장되었습니다.', 'success')
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
      `선택한 ${indices.length}개의 카테고리를 삭제하시겠습니까?`,
      '삭제된 데이터는 복구할 수 없습니다.'
    )

    if (!confirmed) return

    try {
      const idsToDelete = indices
        .map(idx => tableData[idx])
        .filter(row => !row.id.startsWith('temp_'))
        .map(row => row.id)

      if (idsToDelete.length > 0) {
        const { error } = await supabase
          .from('category_settings')
          .delete()
          .in('id', idsToDelete)

        if (error) {
          showToast('삭제 중 오류가 발생했습니다.', 'error')
          return
        }
      }

      await fetchCategories()
      showToast(`${indices.length}개 항목이 삭제되었습니다.`, 'success')
    } catch (error) {
      console.error('삭제 중 오류:', error)
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleRemoveDuplicates = async () => {
    const confirmed = await confirm(
      '중복된 카테고리를 제거하시겠습니까?',
      '가장 최근에 생성된 데이터만 남기고 나머지는 삭제됩니다.'
    )

    if (!confirmed) return

    try {
      setLoading(true)

      // 모든 카테고리 가져오기
      const { data: allCategories, error: fetchError } = await supabase
        .from('category_settings')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        showToast('데이터 조회 실패', 'error')
        setLoading(false)
        return
      }

      // 중복 찾기
      const seen = new Map<string, string>() // key: unique combination, value: id to keep
      const idsToDelete: string[] = []

      allCategories?.forEach(cat => {
        const key = `${cat.expense_type || ''}|${cat.category_1 || ''}|${cat.category_2 || ''}|${cat.category_3 || ''}|${cat.category_4 || ''}`

        if (seen.has(key)) {
          // 중복 발견 - 삭제 대상
          idsToDelete.push(cat.id)
        } else {
          // 처음 보는 조합 - 유지
          seen.set(key, cat.id)
        }
      })

      if (idsToDelete.length === 0) {
        showToast('중복된 카테고리가 없습니다.', 'success')
        setLoading(false)
        return
      }

      // 중복 데이터 삭제
      const { error: deleteError } = await supabase
        .from('category_settings')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        showToast('중복 제거 실패: ' + deleteError.message, 'error')
        setLoading(false)
        return
      }

      await fetchCategories()
      showToast(`${idsToDelete.length}개의 중복 카테고리를 제거했습니다.`, 'success')
      setLoading(false)
    } catch (error) {
      console.error('중복 제거 중 오류:', error)
      showToast('중복 제거 중 오류가 발생했습니다.', 'error')
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'expense_type',
      title: '지출유형',
      width: 100,
      className: 'text-center',
      type: 'dropdown' as const,
      source: ['사입', '지출', '가공']
    },
    { key: 'category_1', title: '대분류', width: 120, className: 'text-center' },
    { key: 'category_2', title: '중분류', width: 120, className: 'text-center' },
    { key: 'category_3', title: '소분류', width: 120, className: 'text-center' },
    { key: 'category_4', title: '품목', width: 120, className: 'text-center' },
    { key: 'category_5', title: '품종', width: 120, className: 'text-center' },
    { key: 'notes', title: '비고', width: 250, className: 'text-center' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[16px] font-bold">카테고리 설정</div>
        <div className="flex gap-2">
          {/* 엑셀 다운로드 버튼 */}
          <button
            onClick={async () => {
              // 데이터를 엑셀 형식으로 변환
              const excelData = categories.map(cat => ({
                'ID': cat.id,
                '대분류': cat.expense_type || '',
                '중분류': cat.category_1 || '',
                '소분류': cat.category_2 || '',
                '품목': cat.category_3 || '',
                '품종': cat.category_4 || '',
                '비고': cat.notes || ''
              }))

              const workbook = new ExcelJS.Workbook()
              const worksheet = workbook.addWorksheet('카테고리설정')

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
              a.download = `카테고리설정_${new Date().toISOString().split('T')[0]}.xlsx`
              a.click()
              window.URL.revokeObjectURL(url)

              showToast('엑셀 다운로드 완료', 'success')
            }}
            className="p-2 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition-colors"
            title="엑셀 다운로드"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* 엑셀 업로드 버튼 */}
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.xlsx,.xls'
              input.onchange = async (e: any) => {
                const file = e.target.files?.[0]
                if (!file) return

                const reader = new FileReader()
                reader.onload = async (e) => {
                  const data = e.target?.result
                  const workbook = new ExcelJS.Workbook()
                  await workbook.xlsx.load(data as ArrayBuffer)
                  const worksheet = workbook.worksheets[0]
                  const jsonData: any[] = []

                  worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return // Skip header row
                    const rowData: any = {}
                    const headers = worksheet.getRow(1).values as any[]
                    row.eachCell((cell, colNumber) => {
                      const header = headers[colNumber]
                      if (header) {
                        rowData[header] = cell.value === null ? null : cell.value
                      }
                    })
                    if (Object.keys(rowData).length > 0) {
                      jsonData.push(rowData)
                    }
                  })

                  // 한글 헤더를 영문으로 매핑
                  const reverseFieldMapping: Record<string, string> = {
                    'ID': 'id',
                    '대분류': 'expense_type',
                    '중분류': 'category_1',
                    '소분류': 'category_2',
                    '품목': 'category_3',
                    '품종': 'category_4',
                    '비고': 'notes'
                  }

                  // 한글 헤더를 영문으로 변환
                  const convertedData = jsonData.map((row: any) => {
                    const englishRow: any = {}
                    Object.keys(row).forEach(key => {
                      const englishKey = reverseFieldMapping[key] || key
                      englishRow[englishKey] = row[key]
                    })
                    return englishRow
                  })

                  // 빈 문자열을 null로 변환
                  const cleanData = convertedData.map((row: any) => {
                    const cleaned: any = {}
                    Object.keys(row).forEach(key => {
                      if (row[key] === '' || row[key] === 'undefined' || row[key] === 'null') {
                        cleaned[key] = null
                      } else {
                        cleaned[key] = row[key]
                      }
                    })
                    return cleaned
                  })

                  // 모달 열기 (교체/병합 선택)
                  setExcelUploadModal({ data: cleanData, mode: null })
                }
                reader.readAsArrayBuffer(file)
              }
              input.click()
            }}
            className="p-2 text-sm border border-green-500 text-green-600 rounded hover:bg-green-50 transition-colors"
            title="엑셀 업로드"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>

          <Button onClick={handleRemoveDuplicates} variant="ghost" className="text-orange-600">
            중복 제거
          </Button>
        </div>
      </div>

      {/* 대분류 필터 */}
      <div className="flex gap-2">
        <Button
          onClick={() => setFilterExpenseType('전체')}
          variant={filterExpenseType === '전체' ? 'primary' : 'ghost'}
          className="min-w-[80px]"
        >
          전체
        </Button>
        <Button
          onClick={() => setFilterExpenseType('사입')}
          variant={filterExpenseType === '사입' ? 'primary' : 'ghost'}
          className="min-w-[80px]"
        >
          사입
        </Button>
        <Button
          onClick={() => setFilterExpenseType('지출')}
          variant={filterExpenseType === '지출' ? 'primary' : 'ghost'}
          className="min-w-[80px]"
        >
          지출
        </Button>
        <Button
          onClick={() => setFilterExpenseType('가공')}
          variant={filterExpenseType === '가공' ? 'primary' : 'ghost'}
          className="min-w-[80px]"
        >
          가공
        </Button>
      </div>

      <EditableAdminGrid
        data={filteredTableData}
        columns={columns}
        onDataChange={handleDataChange}
        onSave={handleSave}
        onDeleteSelected={handleDelete}
        tableName="category_settings"
        onDataReload={fetchCategories}
        excludeEmptyColumns={['category_1', 'category_2', 'category_3', 'category_4']}
        onCopy={(indices) => {
        }}
        height="600px"
        globalSearchPlaceholder="대분류, 중분류, 소분류, 품목, 품종, 비고 검색"
        exportFilePrefix="카테고리설정"
        enableCSVExport={false}
        enableCSVImport={false}
        mergeKeyGetter={(row) =>
          `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}`
        }
      />

      {/* 엑셀 업로드 결과 모달 */}
      {uploadResultModal && (
        <Modal
          isOpen={true}
          onClose={() => setUploadResultModal(null)}
          title={uploadResultModal.type === 'replace' ? '교체 완료' : '병합 완료'}
          size="lg"
        >
          <div className="space-y-4">
            {/* 기본 통계 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">기존 카테고리:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{uploadResultModal.originalCount}개</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">업로드 파일:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{uploadResultModal.uploadCount}개</span>
                </div>
              </div>
            </div>

            {/* Mode-specific message */}
            {uploadResultModal.type === 'replace' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  <strong>교체 모드:</strong> 엑셀 파일의 데이터로 완전히 교체했습니다.
                </p>
              </div>
            )}

            {/* 변경 통계 */}
            <div className={`grid ${uploadResultModal.type === 'merge' ? 'grid-cols-4' : 'grid-cols-3'} gap-3 text-center`}>
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{uploadResultModal.added.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">추가</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResultModal.updated.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">수정</div>
              </div>
              {uploadResultModal.type === 'replace' && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadResultModal.deleted.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">삭제</div>
                </div>
              )}
              {uploadResultModal.type === 'merge' && (
                <div className="bg-gray-500/10 border border-gray-500/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{uploadResultModal.unchanged.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">변경없음</div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setUploadResultModal(null)}>확인</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 엑셀 업로드 모달 (교체/병합 선택) */}
      {excelUploadModal && (
        <Modal
          isOpen={true}
          onClose={() => setExcelUploadModal(null)}
          title="엑셀 업로드"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              총 <strong className="text-blue-600 dark:text-blue-400">{excelUploadModal.data.length}개</strong>의 데이터를 업로드합니다.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  // 교체: 엑셀의 데이터로 완전히 교체
                  const { data: existingCategories } = await supabase.from('category_settings').select('*')
                  const existingIdMap = new Map(existingCategories?.map(c => [c.id, c]) || [])
                  const existingCategoryMap = new Map(existingCategories?.map(c => {
                    const key = `${c.expense_type || ''}|${c.category_1 || ''}|${c.category_2 || ''}|${c.category_3 || ''}|${c.category_4 || ''}`
                    return [key, c]
                  }) || [])

                  const dataToUpsert = excelUploadModal.data
                  const dataToUpdate: any[] = []
                  const dataToInsert: any[] = []

                  dataToUpsert.forEach((item: any) => {
                    if (item.id && existingIdMap.has(item.id)) {
                      dataToUpdate.push(item)
                    } else {
                      const key = `${item.expense_type || ''}|${item.category_1 || ''}|${item.category_2 || ''}|${item.category_3 || ''}|${item.category_4 || ''}`
                      const existing = existingCategoryMap.get(key)
                      if (existing) {
                        dataToUpdate.push({ ...item, id: existing.id })
                      } else {
                        const { id: _removed, ...itemWithoutId } = item
                        dataToInsert.push(itemWithoutId)
                      }
                    }
                  })

                  const added: string[] = []
                  const updated: string[] = []

                  dataToInsert.forEach((row: any) => {
                    const label = `${row.expense_type || ''} > ${row.category_1 || ''} > ${row.category_2 || ''}`
                    added.push(label)
                  })

                  dataToUpdate.forEach((row: any) => {
                    const label = `${row.expense_type || ''} > ${row.category_1 || ''} > ${row.category_2 || ''}`
                    updated.push(label)
                  })

                  // 업데이트
                  if (dataToUpdate.length > 0) {
                    const { error: updateError } = await supabase
                      .from('category_settings')
                      .upsert(dataToUpdate, { onConflict: 'id' })
                    if (updateError) {
                      showToast('업로드 중 오류가 발생했습니다.', 'error')
                      return
                    }
                  }

                  // 신규 추가
                  if (dataToInsert.length > 0) {
                    const { error: insertError } = await supabase
                      .from('category_settings')
                      .insert(dataToInsert)
                    if (insertError) {
                      showToast('업로드 중 오류가 발생했습니다.', 'error')
                      return
                    }
                  }

                  // 삭제 (교체 모드)
                  const uploadedIds = new Set(
                    dataToUpsert
                      .map((d: any) => d.id)
                      .filter((id: any) => id && existingIdMap.has(id))
                  )
                  const deletedCategories = existingCategories?.filter(c => !uploadedIds.has(c.id)) || []
                  if (deletedCategories.length > 0) {
                    await supabase
                      .from('category_settings')
                      .delete()
                      .in('id', deletedCategories.map(c => c.id))
                  }

                  showToast('교체 완료!', 'success')
                  await fetchCategories()
                  setExcelUploadModal(null)

                  const deletedList = deletedCategories.map(d => `${d.expense_type || ''} > ${d.category_1 || ''} > ${d.category_2 || ''}`)
                  setUploadResultModal({
                    type: 'replace',
                    originalCount: existingCategories?.length || 0,
                    uploadCount: excelUploadModal.data.length,
                    added,
                    updated,
                    deleted: deletedList,
                    unchanged: []
                  })
                }}
                className="w-full px-4 py-3 text-left border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div className="font-semibold text-red-600">교체</div>
                <div className="text-xs text-gray-600 mt-1">엑셀 파일의 데이터로 교체합니다.</div>
              </button>
              <button
                onClick={async () => {
                  // 병합: 기존 데이터 유지하면서 업데이트/추가
                  const { data: existingData } = await supabase.from('category_settings').select('*')
                  const existingIdMap = new Map(existingData?.map(d => [d.id, d]) || [])
                  const existingDataMap = new Map(existingData?.map(d => {
                    const key = `${d.expense_type || ''}|${d.category_1 || ''}|${d.category_2 || ''}|${d.category_3 || ''}|${d.category_4 || ''}`
                    return [key, d]
                  }) || [])

                  const dataToUpsert = excelUploadModal.data
                  const dataToUpdate: any[] = []
                  const dataToInsert: any[] = []

                  dataToUpsert.forEach((item: any) => {
                    if (item.id && existingIdMap.has(item.id)) {
                      dataToUpdate.push(item)
                    } else {
                      const key = `${item.expense_type || ''}|${item.category_1 || ''}|${item.category_2 || ''}|${item.category_3 || ''}|${item.category_4 || ''}`
                      const existing = existingDataMap.get(key)
                      if (existing) {
                        dataToUpdate.push({ ...item, id: existing.id })
                      } else {
                        const { id: _removed, ...itemWithoutId } = item
                        dataToInsert.push(itemWithoutId)
                      }
                    }
                  })

                  const added: string[] = []
                  const updated: string[] = []
                  const unchanged: string[] = []

                  dataToInsert.forEach((row: any) => {
                    const label = `${row.expense_type || ''} > ${row.category_1 || ''} > ${row.category_2 || ''}`
                    added.push(label)
                  })

                  dataToUpdate.forEach((row: any) => {
                    const key = `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}`
                    const existing = existingDataMap.get(key)
                    const label = `${row.expense_type || ''} > ${row.category_1 || ''} > ${row.category_2 || ''}`

                    if (existing) {
                      let hasChanges = false
                      for (const k in row) {
                        if (k === 'updated_at' || k === 'created_at' || k === 'id') continue
                        if (JSON.stringify(row[k]) !== JSON.stringify(existing[k])) {
                          hasChanges = true
                          break
                        }
                      }
                      if (hasChanges) {
                        updated.push(label)
                      } else {
                        unchanged.push(label)
                      }
                    }
                  })

                  // 업데이트
                  if (dataToUpdate.length > 0) {
                    const { error: updateError } = await supabase
                      .from('category_settings')
                      .upsert(dataToUpdate, { onConflict: 'id' })
                    if (updateError) {
                      showToast('업로드 중 오류가 발생했습니다.', 'error')
                      return
                    }
                  }

                  // 신규 추가
                  if (dataToInsert.length > 0) {
                    const { error: insertError } = await supabase
                      .from('category_settings')
                      .insert(dataToInsert)
                    if (insertError) {
                      showToast('업로드 중 오류가 발생했습니다.', 'error')
                      return
                    }
                  }

                  showToast('병합 완료!', 'success')
                  await fetchCategories()
                  setExcelUploadModal(null)

                  setUploadResultModal({
                    type: 'merge',
                    originalCount: existingData?.length || 0,
                    uploadCount: excelUploadModal.data.length,
                    added,
                    updated,
                    deleted: [],
                    unchanged
                  })
                }}
                className="w-full px-4 py-3 text-left border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-blue-600">병합</div>
                <div className="text-xs text-gray-600 mt-1">기존 데이터를 유지하면서 업데이트하거나 새 데이터를 추가합니다.</div>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
