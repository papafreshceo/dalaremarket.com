'use client'

import { useState, useEffect } from 'react'
import EditableAdminGrid from '@/components/ui/EditableAdminGrid'
import { useToast } from '@/components/ui/Toast'

interface MappingSetting {
  id: number;
  display_order: number;
  market_name: string;
  market_initial: string;
  market_color: string;
  detect_string1: string;
  detect_string2: string;
  settlement_formula: string;
  header_row: number;
}

interface MappingField {
  id: number;
  market_name: string;
  field_1?: string;
  field_2?: string;
  field_3?: string;
  field_4?: string;
  field_5?: string;
  field_6?: string;
  field_7?: string;
  field_8?: string;
  field_9?: string;
  field_10?: string;
  field_11?: string;
  field_12?: string;
  field_13?: string;
  field_14?: string;
  field_15?: string;
  field_16?: string;
  field_17?: string;
  field_18?: string;
  field_19?: string;
  field_20?: string;
  field_21?: string;
  field_22?: string;
  field_23?: string;
  field_24?: string;
  field_25?: string;
  field_26?: string;
  field_27?: string;
  field_28?: string;
  field_29?: string;
  field_30?: string;
  field_31?: string;
  field_32?: string;
  field_33?: string;
  field_34?: string;
  field_35?: string;
  field_36?: string;
  field_37?: string;
  field_38?: string;
  field_39?: string;
  field_40?: string;
  field_41?: string;
  field_42?: string;
  field_43?: string;
  field_44?: string;
  [key: string]: any;
}

export default function MappingSettingsPage() {
  const { showToast } = useToast()

  // 마켓 기본 설정
  const [settings, setSettings] = useState<MappingSetting[]>([])
  const [settingsLoading, setSettingsLoading] = useState(true)

  // 표준필드 매핑
  const [fields, setFields] = useState<MappingField[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(true)

  // 표준필드를 가로로, 마켓을 세로로 변환
  const [transformedFieldsData, setTransformedFieldsData] = useState<any[]>([])
  const [fieldsColumns, setFieldsColumns] = useState<any[]>([])

  // 표준필드 고정 순서 (44개)
  const standardFieldsOrder = [
    'market_name',
    'sequence_number',
    'payment_date',
    'order_number',
    'buyer_name',
    'buyer_phone',
    'recipient_name',
    'recipient_phone',
    'recipient_address',
    'delivery_message',
    'option_name',
    'quantity',
    'market',
    'confirmation',
    'special_request',
    'shipping_request_date',
    'seller_name',
    'seller_supply_price',
    'warehouse',
    'invoice_owner',
    'vendor_company',
    'shipping_location_name',
    'shipping_location_address',
    'shipping_location_phone',
    'shipping_cost',
    'settlement_amount',
    'settlement_target_amount',
    'product_amount',
    'final_payment_amount',
    'discount_amount',
    'platform_discount',
    'seller_discount',
    'buyer_coupon_discount',
    'coupon_discount',
    'other_support_discount',
    'commission1',
    'commission2',
    'seller_id',
    'separate_shipping',
    'shipping_fee',
    'shipping_date',
    'courier_company',
    'tracking_number',
    'option_code',
  ]

  // 표준필드 한글 매핑
  const standardFieldLabels: { [key: string]: string } = {
    platform: '플랫폼',
    market_name: '마켓명',
    sequence_number: '연번',
    payment_date: '결제일',
    order_number: '주문번호',
    buyer_name: '주문자',
    buyer_phone: '주문자전화번호',
    recipient_name: '수령인',
    recipient_phone: '수령인전화번호',
    recipient_address: '주소',
    delivery_message: '배송메세지',
    option_name: '옵션명',
    quantity: '수량',
    market: '마켓',
    confirmation: '확인',
    special_request: '특이/요청사항',
    shipping_request_date: '발송요청일',
    seller_name: '셀러',
    seller_supply_price: '셀러공급가',
    warehouse: '출고처',
    invoice_owner: '송장주체',
    vendor_company: '벤더사',
    shipping_location_name: '발송지명',
    shipping_location_address: '발송지주소',
    shipping_location_phone: '발송지연락처',
    shipping_cost: '출고비용',
    settlement_amount: '정산예정금액',
    settlement_target_amount: '정산대상금액',
    product_amount: '상품금액',
    final_payment_amount: '최종결제금액',
    discount_amount: '할인금액',
    platform_discount: '마켓부담할인금액',
    seller_discount: '판매자할인쿠폰할인',
    buyer_coupon_discount: '구매쿠폰적용금액',
    coupon_discount: '쿠폰할인금액',
    other_support_discount: '기타지원금할인금',
    commission1: '수수료1',
    commission2: '수수료2',
    seller_id: '판매아이디',
    separate_shipping: '분리배송 Y/N',
    shipping_fee: '택배비',
    shipping_date: '발송일(송장입력일)',
    courier_company: '택배사',
    tracking_number: '송장번호',
    option_code: '옵션코드',
    product_name: '상품명',
    seller_product_code: '판매자상품코드',
    settlement_base_amount: '정산기준금액',
    product_price: '상품가격',
    seller_basic_discount: '판매자기본할인',
    seller_additional_discount: '판매자추가할인',
    seller_coupon_discount: '판매자쿠폰할인',
    platform_coupon_discount: '플랫폼쿠폰할인',
    additional_discount: '추가할인',
    deposit_amount: '입금액',
  }

  const basicColumns = [
    { key: 'display_order', title: '순서', width: 60, readOnly: false, type: 'number' as const },
    { key: 'market_name', title: '마켓명', width: 120, readOnly: false },
    { key: 'market_initial', title: '이니셜', width: 80, readOnly: false },
    { key: 'market_color', title: '색상', width: 100, readOnly: false },
    { key: 'detect_string1', title: '감지파일명', width: 150, readOnly: false },
    { key: 'detect_string2', title: '감지헤더명', width: 280, readOnly: false },
    { key: 'settlement_formula', title: '정산공식', width: 180, readOnly: false },
    { key: 'header_row', title: '헤더행', width: 80, readOnly: false, type: 'number' as const },
  ]

  useEffect(() => {
    loadSettings()
    loadFields()
  }, [])

  useEffect(() => {
    if (fields.length === 0) {
      return
    }

    // 컬럼 정의: 플랫폼 + 표준필드1~표준필드44 (고정)
    const newColumns = [
      { key: 'market_name', title: '플랫폼', width: 120, readOnly: true },
      ...Array.from({ length: 44 }, (_, index) => ({
        key: `field_${index + 1}`,
        title: `표준필드${index + 1}`,
        width: 150,
        readOnly: false, // 표준필드 행도 수정 가능하게 변경
      })),
    ]
    setFieldsColumns(newColumns)

    // DB에서 가져온 데이터를 그대로 사용
    setTransformedFieldsData(fields)
  }, [fields])

  // 기본 설정 로드
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/mapping-settings')
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        const cleanedData = result.data.map((item: any) => ({
          id: item.id,
          display_order: isNaN(item.display_order) ? null : Number(item.display_order),
          market_name: String(item.market_name || ''),
          market_initial: String(item.market_initial || ''),
          market_color: String(item.market_color || ''),
          detect_string1: String(item.detect_string1 || ''),
          detect_string2: String(item.detect_string2 || ''),
          settlement_formula: String(item.settlement_formula || ''),
          header_row: isNaN(item.header_row) ? 1 : Number(item.header_row),
        }))
        setSettings(cleanedData)
      }
    } catch (error) {
      console.error('매핑 설정 로드 실패:', error)
    } finally {
      setSettingsLoading(false)
    }
  }

  // 표준필드 매핑 로드
  const loadFields = async () => {
    try {
      const response = await fetch('/api/mapping-settings/fields')
      const result = await response.json()

      if (result.success) {
        setFields(result.data)
      }
    } catch (error) {
      console.error('필드 매핑 로드 실패:', error)
    } finally {
      setFieldsLoading(false)
    }
  }

  // 기본 설정 저장
  const handleSaveSettings = async (modifiedRows?: MappingSetting[]) => {
    try {
      // 수정된 행만 저장
      const rowsToSave = modifiedRows || settings

      if (rowsToSave.length === 0) {
        showToast('변경사항이 없습니다.', 'info')
        return
      }

      const promises = rowsToSave.map(async (setting) => {
        const response = await fetch('/api/mapping-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting),
        })
        return response.json()
      })

      await Promise.all(promises)
      showToast(`${rowsToSave.length}개 행이 저장되었습니다.`, 'success')
      loadSettings()
    } catch (error) {
      console.error('저장 실패:', error)
      showToast('저장에 실패했습니다.', 'error')
    }
  }

  // 필드 매핑 저장
  const handleSaveFields = async (modifiedRows?: MappingField[]) => {
    try {
      // 수정된 행만 저장 (표준필드 행도 포함)
      let dataToSave = modifiedRows || transformedFieldsData

      if (dataToSave.length === 0) {
        showToast('변경사항이 없습니다.', 'info')
        return
      }

      const promises = dataToSave.map(async (row) => {
        const { market_name, id, created_at, updated_at, ...updates } = row

        console.log('저장할 데이터:', { market_name, updates })

        const response = await fetch('/api/mapping-settings/fields', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ market_name, updates }),
        })

        const result = await response.json()
        console.log('저장 결과:', result)
        return result
      })

      await Promise.all(promises)
      showToast(`${dataToSave.length}개 행이 저장되었습니다.`, 'success')
      loadFields()
    } catch (error) {
      console.error('저장 실패:', error)
      showToast('저장에 실패했습니다.', 'error')
    }
  }

  const handleDeleteSettings = async (indices: number[]) => {
    const idsToDelete = indices.map(index => settings[index].id)

    if (!confirm(`선택한 ${indices.length}개 마켓을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch('/api/mapping-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      })

      const result = await response.json()

      if (result.success) {
        showToast('삭제되었습니다.', 'success')
        loadSettings()
      } else {
        showToast('삭제 실패: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      showToast('삭제에 실패했습니다.', 'error')
    }
  }

  const handleDeleteFields = async (indices: number[]) => {
    const idsToDelete = indices.map(index => fields[index].id)

    if (!confirm(`선택한 ${indices.length}개 항목을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch('/api/mapping-settings/fields', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      })

      const result = await response.json()

      if (result.success) {
        showToast('삭제되었습니다.', 'success')
        loadFields()
      } else {
        showToast('삭제 실패: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      showToast('삭제에 실패했습니다.', 'error')
    }
  }

  const loading = settingsLoading || fieldsLoading

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 마켓 기본 설정 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">마켓 기본 설정</h2>
        <EditableAdminGrid
          columns={basicColumns}
          data={settings}
          onDataChange={(newData) => setSettings(newData)}
          onSave={handleSaveSettings}
          height="400px"
          enableCSVExport={true}
          enableCSVImport={true}
        />
      </div>

      {/* 마켓 매핑 설정 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">마켓 매핑 설정</h2>
        {fieldsColumns.length > 0 && (
          <EditableAdminGrid
            columns={fieldsColumns}
            data={transformedFieldsData}
            onDataChange={(newData) => setTransformedFieldsData(newData)}
            onSave={handleSaveFields}
            height="900px"
            rowHeight={26}
            enableCSVExport={true}
            enableCSVImport={true}
          />
        )}
      </div>
    </div>
  )
}
