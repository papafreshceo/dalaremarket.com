'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'

interface CategorySetting {
  id: string
  expense_type: string | null
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  category_5: string | null
  notes: string | null
  is_active: boolean
}

export default function CategorySettingsPage() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const [categories, setCategories] = useState<CategorySetting[]>([])
  const [tableData, setTableData] = useState<CategorySetting[]>([])
  const [filteredTableData, setFilteredTableData] = useState<CategorySetting[]>([])
  const [loading, setLoading] = useState(false)
  const [filterExpenseType, setFilterExpenseType] = useState<'전체' | '사입' | '지출' | '가'>('전체')

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
    // Grid에서 변경된 데이터를 받아서 tableData 업데이트
    // 필터링 여부와 관계없이 항상 전체 데이터 교체
    setTableData(newData)
  }

  const handleSave = async () => {
    try {
      // 1단계: tableData 내부 중복 제거
      const seen = new Map<string, CategorySetting>()
      const uniqueRows: CategorySetting[] = []

      tableData.forEach(row => {
        // 최소한 하나의 카테고리는 입력되어야 함
        if (!row.category_1 && !row.category_2 && !row.category_3 && !row.category_4 && !row.category_5) {
          return // 모든 카테고리가 비어있으면 스킵
        }

        const key = `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}|${row.category_5 || ''}`

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
          const key = `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}|${row.category_5 || ''}`

          if (insertedKeys.has(key)) {
            console.log('저장 중 중복 스킵:', row)
            continue
          }

          const { error } = await supabase.from('category_settings').insert([{
            expense_type: row.expense_type || null,
            category_1: row.category_1 || null,
            category_2: row.category_2 || null,
            category_3: row.category_3 || null,
            category_4: row.category_4 || null,
            category_5: row.category_5 || null,
            notes: row.notes || null,
            is_active: true
          }])

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
          const key = `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}|${row.category_5 || ''}`

          if (!row.id || String(row.id).startsWith('temp_')) {
            // 이번 저장에서 이미 삽입했는지 체크
            if (insertedKeys.has(key)) {
              console.log('저장 중 중복 스킵:', row)
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
              .eq('category_5', row.category_5 || null)
              .limit(1)

            if (existing && existing.length > 0) {
              console.log('DB 중복 스킵:', row)
              continue
            }

            const { error } = await supabase.from('category_settings').insert([{
              expense_type: row.expense_type || null,
              category_1: row.category_1 || null,
              category_2: row.category_2 || null,
              category_3: row.category_3 || null,
              category_4: row.category_4 || null,
              category_5: row.category_5 || null,
              notes: row.notes || null,
              is_active: true
            }])

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
              category_5: row.category_5 || null,
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
        const key = `${cat.expense_type || ''}|${cat.category_1 || ''}|${cat.category_2 || ''}|${cat.category_3 || ''}|${cat.category_4 || ''}|${cat.category_5 || ''}`

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
      width: 120,
      className: 'text-center',
      type: 'dropdown' as const,
      source: ['사입', '지출', '가']
    },
    { key: 'category_1', title: '대분류', width: 150, className: 'text-center' },
    { key: 'category_2', title: '중분류', width: 150, className: 'text-center' },
    { key: 'category_3', title: '소분류', width: 150, className: 'text-center' },
    { key: 'category_4', title: '품목', width: 150, className: 'text-center' },
    { key: 'category_5', title: '품종', width: 150, className: 'text-center' },
    { key: 'notes', title: '비고', width: 200, className: 'text-center' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[16px] font-bold">카테고리 설정</div>
        <div className="flex gap-2">
          <Button onClick={handleRemoveDuplicates} variant="ghost" className="text-orange-600">
            중복 제거
          </Button>
        </div>
      </div>

      {/* 지출유형 필터 */}
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
          onClick={() => setFilterExpenseType('가')}
          variant={filterExpenseType === '가' ? 'primary' : 'ghost'}
          className="min-w-[80px]"
        >
          가
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
        excludeEmptyColumns={['category_1', 'category_2', 'category_3', 'category_4', 'category_5']}
        onCopy={(indices) => {
          console.log('복사할 행:', indices)
        }}
        height="600px"
        globalSearchPlaceholder="지출유형, 대분류, 중분류, 소분류, 품목, 품종, 비고 검색"
        exportFilePrefix="카테고리설정"
        mergeKeyGetter={(row) =>
          `${row.expense_type || ''}|${row.category_1 || ''}|${row.category_2 || ''}|${row.category_3 || ''}|${row.category_4 || ''}|${row.category_5 || ''}`
        }
      />
    </div>
  )
}
