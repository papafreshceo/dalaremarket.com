'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface SupplierRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function SupplierRegistrationModal({
  isOpen,
  onClose,
  onSuccess
}: SupplierRegistrationModalProps) {
  const { showToast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    business_number: '',
    representative: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    supplier_type: '농가',
    commission_type: '정액',
    commission_rate: 0,
    notes: ''
  })

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      showToast('코드와 이름은 필수입니다.', 'warning')
      return
    }

    const { error } = await supabase.from('partners').insert([{
      code: formData.code,
      name: formData.name,
      business_number: formData.business_number || null,
      representative: formData.representative || null,
      contact_person: formData.contact_person || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      partner_type: formData.supplier_type,
      commission_type: formData.commission_type,
      commission_rate: formData.commission_rate,
      notes: formData.notes || null,
      is_active: true
    }])

    if (error) {
      showToast('거래처 등록 실패: ' + error.message, 'error')
      return
    }

    showToast('거래처가 등록되었습니다.', 'success')

    // 폼 초기화
    setFormData({
      code: '',
      name: '',
      business_number: '',
      representative: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      supplier_type: '농가',
      commission_type: '정액',
      commission_rate: 0,
      notes: ''
    })

    onSuccess?.()
    onClose()
  }

  const handleClose = () => {
    setFormData({
      code: '',
      name: '',
      business_number: '',
      representative: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      supplier_type: '농가',
      commission_type: '정액',
      commission_rate: 0,
      notes: ''
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="거래처 등록"
      size="md"
      footer={
        <>
          <Button onClick={handleClose} variant="ghost">
            취소
          </Button>
          <Button onClick={handleSubmit}>
            등록
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              거래처 코드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="거래처 코드"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              거래처명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="거래처명"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호</label>
            <input
              type="text"
              value={formData.business_number}
              onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="000-00-00000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표자</label>
            <input
              type="text"
              value={formData.representative}
              onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="대표자명"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="담당자명"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="주소"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">거래처 유형</label>
            <select
              value={formData.supplier_type}
              onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="농가">농가</option>
              <option value="중매인">중매인</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">수수료 유형</label>
            <select
              value={formData.commission_type}
              onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="정액">정액</option>
              <option value="정률">정률</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">수수료율/액</label>
            <input
              type="number"
              value={formData.commission_rate}
              onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={3}
            placeholder="비고사항"
          />
        </div>
      </div>
    </Modal>
  )
}
