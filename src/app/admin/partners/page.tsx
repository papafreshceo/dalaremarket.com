'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button } from '@/components/ui'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.css'

registerAllModules()

interface Partner {
  id: string
  code: string
  name: string
  business_number: string | null
  representative: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  partner_type: string | null
  partner_category: string
  commission_type: string
  commission_rate: number
  is_active: boolean
  notes: string | null
}

export default function Page() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnerTypes, setPartnerTypes] = useState<string[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const hotTableRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPartners()
    fetchPartnerTypes()
  }, [])

  useEffect(() => {
    setTableData(partners)
  }, [partners])

  const fetchPartners = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('거래처 로드 오류:', error)
      setLoading(false)
      return
    }

    if (data) {
      setPartners(data)
    }
    setLoading(false)
  }

  const fetchPartnerTypes = async () => {
    const { data } = await supabase
      .from('partner_types')
      .select('type_name')
      .eq('is_active', true)
      .order('type_name')

    if (data) {
      setPartnerTypes(data.map(t => t.type_name))
    }
  }

  const handleAddRow = () => {
    const newRow = {
      id: `temp_${Date.now()}`,
      code: '',
      name: '',
      business_number: '',
      representative: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      partner_type: '농가',
      partner_category: '공급자',
      commission_type: '정액',
      commission_rate: 0,
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

        if (!row.code || !row.name) {
          continue
        }

        if (row.id.startsWith('temp_')) {
          const { error } = await supabase.from('partners').insert([{
            code: row.code,
            name: row.name,
            business_number: row.business_number || null,
            representative: row.representative || null,
            contact_person: row.contact_person || null,
            phone: row.phone || null,
            email: row.email || null,
            address: row.address || null,
            partner_type: row.partner_type || '농가',
            partner_category: row.partner_category || '공급자',
            commission_type: row.commission_type || '정액',
            commission_rate: Number(row.commission_rate) || 0,
            is_active: true,
            notes: row.notes || null
          }])

          if (error) {
            alert(`거래처 등록 실패 (${row.name}): ${error.message}`)
            return
          }
        } else {
          const { error } = await supabase.from('partners').update({
            code: row.code,
            name: row.name,
            business_number: row.business_number || null,
            representative: row.representative || null,
            contact_person: row.contact_person || null,
            phone: row.phone || null,
            email: row.email || null,
            address: row.address || null,
            partner_type: row.partner_type || '농가',
            partner_category: row.partner_category || '공급자',
            commission_type: row.commission_type || '정액',
            commission_rate: Number(row.commission_rate) || 0,
            notes: row.notes || null
          }).eq('id', row.id)

          if (error) {
            alert(`거래처 수정 실패 (${row.name}): ${error.message}`)
            return
          }
        }
      }

      await fetchPartners()
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
      const { error } = await supabase.from('partners').update({ is_active: false }).eq('id', row.id)
      if (error) {
        alert('삭제 실패: ' + error.message)
        return
      }
      await fetchPartners()
    }
  }

  const columns: any[] = [
    {
      data: 'code',
      title: '거래처 코드',
      width: 120,
      className: 'htCenter'
    },
    {
      data: 'name',
      title: '거래처명',
      width: 150,
      className: 'htCenter'
    },
    {
      data: 'partner_category',
      title: '구분',
      type: 'dropdown',
      source: ['공급자', '고객'],
      width: 100,
      className: 'htCenter'
    },
    {
      data: 'partner_type',
      title: '유형',
      type: 'dropdown',
      source: partnerTypes,
      width: 100,
      className: 'htCenter'
    },
    {
      data: 'commission_type',
      title: '수수료 방식',
      type: 'dropdown',
      source: ['정액', '정율'],
      width: 100,
      className: 'htCenter'
    },
    {
      data: 'commission_rate',
      title: '수수료',
      type: 'numeric',
      width: 100,
      className: 'htRight'
    },
    {
      data: 'representative',
      title: '대표자',
      width: 100,
      className: 'htCenter'
    },
    {
      data: 'contact_person',
      title: '담당자',
      width: 100,
      className: 'htCenter'
    },
    {
      data: 'phone',
      title: '전화번호',
      width: 120,
      className: 'htCenter'
    },
    {
      data: 'email',
      title: '이메일',
      width: 150,
      className: 'htCenter'
    },
    {
      data: 'address',
      title: '주소',
      width: 200,
      className: 'htCenter'
    },
    {
      data: 'notes',
      title: '비고',
      width: 150,
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
        <h1 className="text-2xl font-bold">거래처 관리</h1>
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
            if (coords.col === 12) {
              handleDelete(coords.row)
            }
          }}
        />
      </Card>

      <div className="text-sm text-gray-600">
        총 {tableData.filter(s => s.is_active !== false).length}개의 거래처
      </div>
    </div>
  )
}
