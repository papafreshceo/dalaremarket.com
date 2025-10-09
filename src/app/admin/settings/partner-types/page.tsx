'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'

interface PartnerType {
  id: string
  partner_category: string
  code_prefix: string
  type_name: string
  description: string | null
  is_active: boolean
}

export default function PartnerTypesPage() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const [types, setTypes] = useState<PartnerType[]>([])
  const [tableData, setTableData] = useState<PartnerType[]>([])
  const [loading, setLoading] = useState(false)

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
      partner_category: '공급자',
      code_prefix: 'SUP',
      type_name: '',
      description: '',
      is_active: true
    }
    setTableData([newRow, ...tableData])
  }

  const handleSave = async () => {
    try {
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i]

        if (!row.type_name) {
          continue
        }

        if (row.id.startsWith('temp_')) {
          const { error } = await supabase.from('partner_types').insert([{
            partner_category: row.partner_category,
            code_prefix: row.code_prefix,
            type_name: row.type_name,
            description: row.description || null,
            is_active: true
          }])

          if (error) {
            showToast(`거래처 유형 등록 실패 (${row.type_name}): ${error.message}`, 'error')
            return
          }
        } else {
          const { error } = await supabase.from('partner_types').update({
            partner_category: row.partner_category,
            code_prefix: row.code_prefix,
            type_name: row.type_name,
            description: row.description || null
          }).eq('id', row.id)

          if (error) {
            showToast(`거래처 유형 수정 실패 (${row.type_name}): ${error.message}`, 'error')
            return
          }
        }
      }

      await fetchTypes()
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
      const newData = [...tableData]
      newData.splice(rowIndex, 1)
      setTableData(newData)
    } else {
      const { error } = await supabase.from('partner_types').delete().eq('id', row.id)
      if (error) {
        showToast('삭제 실패: ' + error.message, 'error')
        return
      }
      await fetchTypes()
    }
  }

  const columns = [
    {
      key: 'partner_category',
      title: '구분',
      width: 100,
      className: 'text-center'
    },
    {
      key: 'code_prefix',
      title: '이니셜',
      width: 80,
      className: 'text-center'
    },
    { key: 'type_name', title: '유형명', width: 200, className: 'text-center' },
    { key: 'description', title: '설명', width: 400, className: 'text-left' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[16px] font-bold">거래처 유형 관리</div>
        <div className="text-sm text-gray-600">
          총 {tableData.length}개의 거래처 유형
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
        height="600px"
        globalSearchPlaceholder="유형명, 설명 검색"
      />
    </div>
  )
}
