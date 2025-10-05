'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.css'

registerAllModules()

interface Variety {
  id: string
  item_name: string
  category_1: string | null
  category_2: string | null
  category_3: string | null
  category_4: string | null
  is_active: boolean
  notes: string | null
}

export default function ItemMasterPage() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const [varieties, setVarieties] = useState<Variety[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const hotTableRef = useRef<any>(null)
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
      item_name: '',
      category_1: '',
      category_2: '',
      category_3: '',
      category_4: '',
      is_active: true,
      notes: ''
    }
    setTableData([newRow, ...tableData])
  }

  const handleSave = async () => {
    if (!hotTableRef.current) return

    const hotInstance = hotTableRef.current.hotInstance
    const sourceData = hotInstance.getSourceData()

    try {
      for (let i = 0; i < sourceData.length; i++) {
        const row = sourceData[i]

        if (!row.item_name) {
          continue // 품종명이 없으면 스킵
        }

        if (row.id.startsWith('temp_')) {
          // 신규 데이터
          const { error } = await supabase.from('item_master').insert([{
            item_name: row.item_name,
            category_1: row.category_1 || null,
            category_2: row.category_2 || null,
            category_3: row.category_3 || null,
            category_4: row.item_name, // 품종명과 동일
            is_active: true,
            notes: row.notes || null
          }])

          if (error) {
            showToast(`품종 등록 실패 (${row.item_name}): ${error.message}`, 'error')
            return
          }
        } else {
          // 기존 데이터 업데이트
          const { error } = await supabase.from('item_master').update({
            item_name: row.item_name,
            category_1: row.category_1 || null,
            category_2: row.category_2 || null,
            category_3: row.category_3 || null,
            category_4: row.item_name,
            notes: row.notes || null
          }).eq('id', row.id)

          if (error) {
            showToast(`품종 수정 실패 (${row.item_name}): ${error.message}`, 'error')
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

  const columns: any[] = [
    {
      data: 'item_name',
      title: '품종명',
      width: 150,
      className: 'htCenter'
    },
    {
      data: 'category_1',
      title: '대분류',
      width: 120,
      className: 'htCenter'
    },
    {
      data: 'category_2',
      title: '중분류',
      width: 120,
      className: 'htCenter'
    },
    {
      data: 'category_3',
      title: '소분류',
      width: 120,
      className: 'htCenter'
    },
    {
      data: 'notes',
      title: '비고',
      width: 200,
      className: 'htCenter'
    },
    {
      title: '삭제',
      width: 80,
      readOnly: true,
      renderer: function(instance: any, td: any, row: any) {
        td.innerHTML = '<button class="text-red-600 hover:text-red-800">삭제</button>'
        td.className = 'htCenter'
        return td
      }
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[16px] font-bold">품종 마스터 관리</div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">
            총 {tableData.length}개의 품종
          </div>
          <Button onClick={handleAddRow} variant="ghost">
            + 행 추가
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </div>
      </div>

      <HotTable
        ref={hotTableRef}
        data={tableData}
        columns={columns}
        colHeaders={true}
        rowHeaders={true}
        height="600"
        width="100%"
        licenseKey="non-commercial-and-evaluation"
        stretchH="all"
        autoColumnSize={false}
        manualColumnResize={true}
        contextMenu={true}
        afterOnCellMouseDown={(event, coords) => {
          if (coords.col === 5) { // 삭제 컬럼
            handleDelete(coords.row)
          }
        }}
      />
    </div>
  )
}
