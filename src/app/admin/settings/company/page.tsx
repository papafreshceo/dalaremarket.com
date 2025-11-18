'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

interface CompanyInfo {
  id?: string
  company_name: string
  business_number: string
  ceo_name: string
  business_type: string
  business_category: string
  address: string
  address_detail: string
  phone: string
  fax: string
  email: string
  bank_name: string
  account_number: string
  account_holder: string
  online_registration_number: string
  privacy_officer: string
  privacy_officer_email: string
  tax_invoice_email: string
  is_default: boolean
}

const initialCompanyInfo: CompanyInfo = {
  company_name: '',
  business_number: '',
  ceo_name: '',
  business_type: '',
  business_category: '',
  address: '',
  address_detail: '',
  phone: '',
  fax: '',
  email: '',
  bank_name: '국민은행',
  account_number: '',
  account_holder: '',
  online_registration_number: '',
  privacy_officer: '',
  privacy_officer_email: '',
  tax_invoice_email: '',
  is_default: false
}

export default function CompanyPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<CompanyInfo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyInfo | null>(null)
  const [formData, setFormData] = useState<CompanyInfo>(initialCompanyInfo)
  const supabase = createClient()

  // 회사 목록 로드
  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setCompanies(data || [])
    } catch (error) {
      console.error('회사 목록 로드 오류:', error)
      showToast('회사 목록을 불러오는데 실패했습니다.', 'error')
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleChange = (field: keyof CompanyInfo, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAdd = () => {
    setEditingCompany(null)
    setFormData(initialCompanyInfo)
    setShowForm(true)
  }

  const handleEdit = (company: CompanyInfo) => {
    setEditingCompany(company)
    setFormData(company)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCompany(null)
    setFormData(initialCompanyInfo)
  }

  const handleSave = async () => {
    // 필수 필드 검증
    if (!formData.company_name || !formData.business_number || !formData.ceo_name ||
        !formData.address || !formData.phone || !formData.email) {
      showToast('필수 항목을 모두 입력해주세요.', 'error')
      return
    }

    setLoading(true)
    try {
      if (editingCompany?.id) {
        // 수정
        const { error } = await supabase
          .from('company_info')
          .update(formData)
          .eq('id', editingCompany.id)

        if (error) throw error
        showToast('회사 정보가 수정되었습니다.', 'success')
      } else {
        // 추가
        const { error } = await supabase
          .from('company_info')
          .insert(formData)

        if (error) throw error
        showToast('회사 정보가 추가되었습니다.', 'success')
      }

      await loadCompanies()
      handleCancel()
    } catch (error: any) {
      console.error('저장 오류:', error)
      showToast(error.message || '저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('company_info')
        .delete()
        .eq('id', id)

      if (error) throw error

      showToast('회사 정보가 삭제되었습니다.', 'success')
      await loadCompanies()
    } catch (error: any) {
      console.error('삭제 오류:', error)
      showToast(error.message || '삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // 모든 회사의 is_default를 false로
      await supabase
        .from('company_info')
        .update({ is_default: false })
        .neq('id', id)

      // 선택한 회사만 is_default를 true로
      const { error } = await supabase
        .from('company_info')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error

      showToast('기본 회사로 설정되었습니다.', 'success')
      await loadCompanies()
    } catch (error: any) {
      console.error('기본 회사 설정 오류:', error)
      showToast(error.message || '설정 중 오류가 발생했습니다.', 'error')
    }
  }

  if (showForm) {
    return (
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text">
            {editingCompany ? '회사 정보 수정' : '회사 정보 추가'}
          </h1>
          <Button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm border border-border rounded hover:bg-surface-hover text-text"
          >
            목록으로
          </Button>
        </div>

        {/* 전체 폼 */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-text mb-1">
                회사명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="회사명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">
                사업자번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.business_number}
                onChange={(e) => handleChange('business_number', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="123-45-67890"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">
                대표자명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ceo_name}
                onChange={(e) => handleChange('ceo_name', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="대표자명"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">업태</label>
              <input
                type="text"
                value={formData.business_type}
                onChange={(e) => handleChange('business_type', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="도소매업"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">종목</label>
              <input
                type="text"
                value={formData.business_category}
                onChange={(e) => handleChange('business_category', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="농산물 유통"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">통신판매번호</label>
              <input
                type="text"
                value={formData.online_registration_number}
                onChange={(e) => handleChange('online_registration_number', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="2024-서울강남-0001"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4" />

          {/* 주소 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text mb-1">
                주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="서울특별시 강남구 테헤란로 123"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">상세주소</label>
              <input
                type="text"
                value={formData.address_detail}
                onChange={(e) => handleChange('address_detail', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="달래빌딩 5층"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4" />

          {/* 연락처 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text mb-1">
                전화 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="02-1234-5678"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">팩스</label>
              <input
                type="tel"
                value={formData.fax}
                onChange={(e) => handleChange('fax', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="02-1234-5679"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="contact@dalreamarket.com"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4" />

          {/* 계좌 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text mb-1">은행명</label>
              <select
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
              >
                <option>국민은행</option>
                <option>신한은행</option>
                <option>우리은행</option>
                <option>하나은행</option>
                <option>농협은행</option>
                <option>기업은행</option>
                <option>SC제일은행</option>
                <option>카카오뱅크</option>
                <option>토스뱅크</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">계좌번호</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="123-456-7890-12"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">예금주</label>
              <input
                type="text"
                value={formData.account_holder}
                onChange={(e) => handleChange('account_holder', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="달래마켓"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4" />

          {/* 개인정보/세금 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text mb-1">개인정보책임자</label>
              <input
                type="text"
                value={formData.privacy_officer}
                onChange={(e) => handleChange('privacy_officer', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="김개인"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">개인정보 이메일</label>
              <input
                type="email"
                value={formData.privacy_officer_email}
                onChange={(e) => handleChange('privacy_officer_email', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="privacy@dalreamarket.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">세금계산서 이메일</label>
              <input
                type="email"
                value={formData.tax_invoice_email}
                onChange={(e) => handleChange('tax_invoice_email', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary bg-background text-text"
                placeholder="tax@dalreamarket.com"
              />
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleCancel}
            className="px-4 py-1.5 text-sm border border-border rounded hover:bg-surface-hover text-text"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">회사 정보 관리</h1>
          <p className="mt-1 text-sm text-text-secondary">등록된 회사 목록을 관리합니다.</p>
        </div>
        <Button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
        >
          + 회사 추가
        </Button>
      </div>

      {/* 회사 목록 */}
      <div className="space-y-4">
        {companies.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <p className="text-text-secondary">등록된 회사가 없습니다.</p>
            <Button
              onClick={handleAdd}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              첫 회사 추가하기
            </Button>
          </div>
        ) : (
          companies.map((company) => (
            <div
              key={company.id}
              className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-text">{company.company_name}</h3>
                    {company.is_default && (
                      <span className="px-2 py-1 bg-primary text-white text-xs rounded">
                        기본 회사
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-text-secondary">사업자번호:</span>{' '}
                      <span className="text-text">{company.business_number}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">대표자:</span>{' '}
                      <span className="text-text">{company.ceo_name}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">전화:</span>{' '}
                      <span className="text-text">{company.phone}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">이메일:</span>{' '}
                      <span className="text-text">{company.email}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-text-secondary">주소:</span>{' '}
                      <span className="text-text">
                        {company.address} {company.address_detail}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {!company.is_default && (
                    <Button
                      onClick={() => handleSetDefault(company.id!)}
                      className="px-3 py-1.5 text-sm border border-border rounded hover:bg-surface-hover text-text"
                    >
                      기본으로
                    </Button>
                  )}
                  <Button
                    onClick={() => handleEdit(company)}
                    className="px-3 py-1.5 text-sm border border-border rounded hover:bg-surface-hover text-text"
                  >
                    수정
                  </Button>
                  <Button
                    onClick={() => handleDelete(company.id!)}
                    className="px-3 py-1.5 text-sm border border-red-500 text-red-500 rounded hover:bg-red-50"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  )
}
