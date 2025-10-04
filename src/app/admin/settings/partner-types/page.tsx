'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button } from '@/components/ui'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.css'

registerAllModules()

interface PartnerType {
  id: string
  type_name: string
  description: string | null
  is_active: boolean
}

export default function PartnerTypesPage() {
  const [types, setTypes] = useState<PartnerType[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const hotTableRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchTypes()
  }, [])

  useEffect(() => {
    setTableData(types)
  }, [types])

  const fetchTypes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('partner_types')
      .select('*')
      .order('type_name')

    if (error) {
      console.error('거래처 유형 로드 오류:', error)
      setLoading(false)
      return
    }

    if (data) {
      setTypes(data)
    }
    setLoading(false)
  }

  const handleAddRow = () => {
    const newRow = {
      id: `temp_${Date.now()}`,
      type_name: '',
      description: '',
      is_active: true
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

        if (!row.type_name) {
          continue
        }

        if (row.id.startsWith('temp_')) {
          const { error } = await supabase.from('partner_types').insert([{
            type_name: row.type_name,
            description: row.description || null,
            is_active: true
          }])

          if (error) {
            alert(`거래처 유형 등록 실패 (${row.type_name}): ${error.message}`)
            return
          }
        } else {
          const { error } = await supabase.from('partner_types').update({
            type_name: row.type_name,
            description: row.description || null
          }).eq('id', row.id)

          if (error) {
            alert(`거래처 유형 수정 실패 (${row.type_name}): ${error.message}`)
            return
          }
        }
      }

      await fetchTypes()
      alert('저장되었습니다.')
    } catch (error) {
      console.error(error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (rowIndex: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const row = tableData[rowIndex]
    if (row.id.startsWith('temp_')) {
      const newData = [...tableData]
      newData.splice(rowIndex, 1)
      setTableData(newData)
    } else {
      const { error } = await supabase.from('partner_types').delete().eq('id', row.id)
      if (error) {
        alert('삭제 실패: ' + error.message)
        return
      }
      await fetchTypes()
    }
  }

  const columns: any[] = [
    {
      data: 'type_name',
      title: '유형명',
      width: 200,
      className: 'htCenter'
    },
    {
      data: 'description',
      title: '설명',
      width: 400,
      className: 'htLeft'
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
        <h1 className="text-2xl font-bold">거래처 유형 관리</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddRow} variant="ghost">
            + 행 추가
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </div>
      </div>

      <Card>
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
            if (coords.col === 2) { // 삭제 컬럼
              handleDelete(coords.row)
            }
          }}
        />
      </Card>

      <div className="text-sm text-gray-600">
        총 {tableData.length}개의 거래처 유형
      </div>
    </div>
  )
}
