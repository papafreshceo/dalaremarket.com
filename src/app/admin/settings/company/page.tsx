'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface CompanyInfo {
  company_name: string
  business_number: string
  ceo_name: string
  business_type: string
  business_category: string

  address: string
  address_detail: string
  postal_code: string

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
}

export default function CompanyPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: '달래마켓',
    business_number: '123-45-67890',
    ceo_name: '홍길동',
    business_type: '도소매업',
    business_category: '농산물 유통',

    address: '서울특별시 강남구 테헤란로 123',
    address_detail: '달래빌딩 5층',
    postal_code: '06234',

    phone: '02-1234-5678',
    fax: '02-1234-5679',
    email: 'contact@dalreamarket.com',

    bank_name: '국민은행',
    account_number: '123-456-7890-12',
    account_holder: '달래마켓',

    online_registration_number: '2024-서울강남-0001',
    privacy_officer: '김개인',
    privacy_officer_email: 'privacy@dalreamarket.com',

    tax_invoice_email: 'tax@dalreamarket.com'
  })

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // 실제로는 Supabase에 저장
      // await supabase.from('company_info').upsert(companyInfo)

      showToast('회사 정보가 저장되었습니다.', 'success')
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const searchAddress = () => {
    showToast('주소 검색 기능은 추후 구현 예정입니다.', 'info')
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-text">회사 정보</h1>
        <p className="mt-1 text-sm text-text-secondary">회사의 기본 정보를 관리합니다.</p>
      </div>

      {/* 기본 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">기본 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-2">
              회사명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyInfo.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="회사명을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              사업자등록번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyInfo.business_number}
              onChange={(e) => handleChange('business_number', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="123-45-67890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              대표자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyInfo.ceo_name}
              onChange={(e) => handleChange('ceo_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="대표자명을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              업태
            </label>
            <input
              type="text"
              value={companyInfo.business_type}
              onChange={(e) => handleChange('business_type', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="도소매업"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              종목
            </label>
            <input
              type="text"
              value={companyInfo.business_category}
              onChange={(e) => handleChange('business_category', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="농산물 유통"
            />
          </div>
        </div>
      </div>

      {/* 주소 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">주소 정보</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              우편번호 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={companyInfo.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                className="w-32 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                placeholder="06234"
                readOnly
              />
              <Button
                onClick={searchAddress}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text"
              >
                주소 검색
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              주소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyInfo.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="서울특별시 강남구 테헤란로 123"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              상세주소
            </label>
            <input
              type="text"
              value={companyInfo.address_detail}
              onChange={(e) => handleChange('address_detail', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="달래빌딩 5층"
            />
          </div>
        </div>
      </div>

      {/* 연락처 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">연락처 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              대표 전화 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={companyInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="02-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              팩스
            </label>
            <input
              type="tel"
              value={companyInfo.fax}
              onChange={(e) => handleChange('fax', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="02-1234-5679"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={companyInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="contact@dalreamarket.com"
            />
          </div>
        </div>
      </div>

      {/* 계좌 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">계좌 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              은행명
            </label>
            <select
              value={companyInfo.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
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
            <label className="block text-sm font-medium text-text mb-2">
              계좌번호
            </label>
            <input
              type="text"
              value={companyInfo.account_number}
              onChange={(e) => handleChange('account_number', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="123-456-7890-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              예금주
            </label>
            <input
              type="text"
              value={companyInfo.account_holder}
              onChange={(e) => handleChange('account_holder', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="달래마켓"
            />
          </div>
        </div>
      </div>

      {/* 법적 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">법적 정보</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              통신판매업신고번호
            </label>
            <input
              type="text"
              value={companyInfo.online_registration_number}
              onChange={(e) => handleChange('online_registration_number', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="2024-서울강남-0001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                개인정보관리책임자
              </label>
              <input
                type="text"
                value={companyInfo.privacy_officer}
                onChange={(e) => handleChange('privacy_officer', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                placeholder="김개인"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                개인정보관리책임자 이메일
              </label>
              <input
                type="email"
                value={companyInfo.privacy_officer_email}
                onChange={(e) => handleChange('privacy_officer_email', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
                placeholder="privacy@dalreamarket.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              세금계산서 이메일
            </label>
            <input
              type="email"
              value={companyInfo.tax_invoice_email}
              onChange={(e) => handleChange('tax_invoice_email', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text"
              placeholder="tax@dalreamarket.com"
            />
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
