'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'

interface Variety {
  id: string
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  category_5: string | null
  is_active: boolean
  notes: string | null
}

export default function ItemMasterPage() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const [varieties, setVarieties] = useState<Variety[]>([])
  const [tableData, setTableData] = useState<Variety[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchVarieties()
  }, [])

  useEffect(() => {
    setTableData(varieties)
  }, [varieties])

  const fetchVarieties = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('item_master')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('품종 로드 오류:', error)
      setLoading(false)
      return
    }

    if (data) {
      setVarieties(data)
    }
    setLoading(false)
  }

  const handleAddRow = () => {
    const newRow = {
      id: `temp_${Date.now()}`,
      category_1: '',
      category_2: '',
      category_3: '',
      category_4: '',
      category_5: '',
      is_active: true,
      notes: ''
    }
    setTableData([newRow, ...tableData])
  }

  const handleSave = async () => {
    try {
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i]

        if (!row.category_5) {
          continue // 품종이 없으면 스킵
        }

        if (!row.id || String(row.id).startsWith('temp_')) {
          // 신규 데이터
          const { error } = await supabase.from('item_master').insert([{
            item_name: row.category_5, // 품종을 item_name으로 저장
            category_1: row.category_1 || null,
            category_2: row.category_2 || null,
            category_3: row.category_3 || null,
            category_4: row.category_4 || null,
            category_5: row.category_5 || null,
            is_active: true,
            notes: row.notes || null
          }])

          if (error) {
            showToast(`품종 등록 실패 (${row.category_5}): ${error.message}`, 'error')
            return
          }
        } else {
          // 기존 데이터 업데이트
          const { error } = await supabase.from('item_master').update({
            item_name: row.category_5, // 품종을 item_name으로 저장
            category_1: row.category_1 || null,
            category_2: row.category_2 || null,
            category_3: row.category_3 || null,
            category_4: row.category_4 || null,
            category_5: row.category_5 || null,
            notes: row.notes || null
          }).eq('id', row.id)

          if (error) {
            showToast(`품종 수정 실패 (${row.category_5}): ${error.message}`, 'error')
            return
          }
        }
      }

      await fetchVarieties()
      showToast('저장되었습니다.', 'success')
    } catch (error) {
      console.error(error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleDelete = async (rowIndex: number) => {
    const confirmed = await confirm({
      title: '삭제 확인',
      message: '정말 삭제하시겠습니까?',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    })
    if (!confirmed) return

    const row = tableData[rowIndex]
    if (row.id.startsWith('temp_')) {
      // 임시 행 삭제
      const newData = [...tableData]
      newData.splice(rowIndex, 1)
      setTableData(newData)
    } else {
      // DB에서 삭제
      const { error } = await supabase.from('item_master').delete().eq('id', row.id)
      if (error) {
        showToast('삭제 실패: ' + error.message, 'error')
        return
      }
      await fetchVarieties()
    }
  }

  const columns = [
    { key: 'category_1', title: '대분류', width: 120, className: 'text-center' },
    { key: 'category_2', title: '중분류', width: 120, className: 'text-center' },
    { key: 'category_3', title: '소분류', width: 120, className: 'text-center' },
    { key: 'category_4', title: '품목', width: 120, className: 'text-center' },
    { key: 'category_5', title: '품종', width: 120, className: 'text-center' },
    { key: 'notes', title: '비고', width: 200, className: 'text-center' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[16px] font-bold">품종 마스터 관리</div>
        <div className="text-sm text-gray-600">
          총 {tableData.length}개의 품종
        </div>
      </div>

      <EditableAdminGrid
        data={tableData}
        columns={columns}
        onDataChange={setTableData}
        onDelete={handleDelete}
        onSave={handleSave}
        onDeleteSelected={(indices) => {
          indices.forEach(index => handleDelete(index))
        }}
        onCopy={(indices) => {
        }}
        height="600px"
        globalSearchPlaceholder="대분류, 중분류, 소분류, 품목, 품종, 비고 검색"
      />
    </div>
  )
}
