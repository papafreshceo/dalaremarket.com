'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
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
  representative_phone: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  bank_name: string | null
  bank_account: string | null
  account_holder: string | null
  partner_type: string | null
  partner_category: string
  commission_type: string
  commission_rate: number
  is_active: boolean
  notes: string | null
}

export default function Page() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const [partners, setPartners] = useState<Partner[]>([])
  const [partnerTypes, setPartnerTypes] = useState<string[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('전체')

  const hotTableRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPartners()
    fetchPartnerTypes()
  }, [])

  useEffect(() => {
    let filtered = partners.filter(p => p.is_active !== false)

    if (typeFilter !== '전체') {
      filtered = filtered.filter(p => p.partner_type === typeFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name?.includes(searchTerm) ||
        p.code?.includes(searchTerm) ||
        p.representative?.includes(searchTerm) ||
        p.phone?.includes(searchTerm)
      )
    }

    setTableData(filtered)
  }, [partners, searchTerm, typeFilter])

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

  const generatePartnerCode = async (category: string) => {
    const prefix = category === '공급자' ? 'SUP' : 'CUS'

    const { data } = await supabase
      .from('partners')
      .select('code')
      .like('code', `${prefix}%`)
      .order('code', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const lastCode = data[0].code
      const lastNumber = parseInt(lastCode.substring(3))
      const newNumber = lastNumber + 1
      return `${prefix}${String(newNumber).padStart(4, '0')}`
    }

    return `${prefix}0001`
  }

  const handleAddRow = async () => {
    const code = await generatePartnerCode('공급자')
    const newRow = {
      id: `temp_${Date.now()}`,
      code: code,
      name: '',
      business_number: '',
      representative: '',
      representative_phone: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      bank_name: '',
      bank_account: '',
      account_holder: '',
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

        if (!row.name) {
          continue
        }

        // 코드가 없거나 변경된 경우 새로 생성
        if (!row.code || row.code === '') {
          row.code = await generatePartnerCode(row.partner_category || '공급자')
        }

        if (row.id.startsWith('temp_')) {
          const { error } = await supabase.from('partners').insert([{
            code: row.code,
            name: row.name,
            business_number: row.business_number || null,
            representative: row.representative || null,
            representative_phone: row.representative_phone || null,
            contact_person: row.contact_person || null,
            phone: row.phone || null,
            email: row.email || null,
            address: row.address || null,
            bank_name: row.bank_name || null,
            bank_account: row.bank_account || null,
            account_holder: row.account_holder || null,
            partner_type: row.partner_type || '농가',
            partner_category: row.partner_category || '공급자',
            commission_type: row.commission_type || '정액',
            commission_rate: Number(row.commission_rate) || 0,
            is_active: true,
            notes: row.notes || null
          }])

          if (error) {
            showToast(`거래처 등록 실패 (${row.name}): ${error.message}`, 'error')
            return
          }
        } else {
          const { error } = await supabase.from('partners').update({
            code: row.code,
            name: row.name,
            business_number: row.business_number || null,
            representative: row.representative || null,
            representative_phone: row.representative_phone || null,
            contact_person: row.contact_person || null,
            phone: row.phone || null,
            email: row.email || null,
            address: row.address || null,
            bank_name: row.bank_name || null,
            bank_account: row.bank_account || null,
            account_holder: row.account_holder || null,
            partner_type: row.partner_type || '농가',
            partner_category: row.partner_category || '공급자',
            commission_type: row.commission_type || '정액',
            commission_rate: Number(row.commission_rate) || 0,
            notes: row.notes || null
          }).eq('id', row.id)

          if (error) {
            showToast(`거래처 수정 실패 (${row.name}): ${error.message}`, 'error')
            return
          }
        }
      }

      await fetchPartners()
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
      const { error } = await supabase.from('partners').update({ is_active: false }).eq('id', row.id)
      if (error) {
        showToast('삭제 실패: ' + error.message, 'error')
        return
      }
      await fetchPartners()
    }
  }

  const columns: any[] = [
    {
      data: 'code',
      title: '거래처코드',
      width: 100,
      className: 'htCenter',
      readOnly: true
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
      width: 80,
      className: 'htCenter'
    },
    {
      data: 'partner_type',
      title: '유형',
      type: 'dropdown',
      source: partnerTypes,
      width: 80,
      className: 'htCenter'
    },
    {
      data: 'representative',
      title: '대표자',
      width: 100,
      className: 'htCenter'
    },
    {
      data: 'representative_phone',
      title: '대표자 전화번호',
      width: 130,
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
      title: '담당자 전화번호',
      width: 130,
      className: 'htCenter'
    },
    {
      data: 'email',
      title: '이메일',
      width: 180,
      className: 'htCenter'
    },
    {
      data: 'bank_name',
      title: '은행명',
      width: 100,
      className: 'htCenter'
    },
    {
      data: 'bank_account',
      title: '계좌번호',
      width: 150,
      className: 'htCenter'
    },
    {
      data: 'account_holder',
      title: '예금주',
      width: 100,
      className: 'htCenter'
    },
    {
      data: 'commission_type',
      title: '수수료방식',
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
      data: 'address',
      title: '주소',
      width: 200,
      className: 'htLeft'
    },
    {
      data: 'notes',
      title: '비고',
      width: 150,
      className: 'htLeft'
    },
    {
      title: '삭제',
      width: 60,
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
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">거래처 관리</h1>
      </div>

      {/* 거래처 조회 */}
      <div className="flex gap-4">
        <div className="flex gap-2">
          <Button
            variant={typeFilter === '전체' ? 'primary' : 'ghost'}
            onClick={() => setTypeFilter('전체')}
          >
            전체
          </Button>
          {partnerTypes.map(type => (
            <Button
              key={type}
              variant={typeFilter === type ? 'primary' : 'ghost'}
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </Button>
          ))}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="거래처명, 코드, 대표자, 전화번호 검색"
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* 거래처 등록 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            총 {tableData.length}개의 거래처
          </div>
          <div className="flex gap-2">
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
          height="500"
          width="100%"
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          autoColumnSize={false}
          manualColumnResize={true}
          contextMenu={true}
          afterOnCellMouseDown={(event, coords) => {
            if (coords.col === 16) {
              handleDelete(coords.row)
            }
          }}
        />
      </div>
    </div>
  )
}
