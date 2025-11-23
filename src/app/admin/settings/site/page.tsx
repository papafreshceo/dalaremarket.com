'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface SiteSettings {
  id?: string
  site_name: string
  site_logo_url: string
  site_description: string
  site_keywords: string
  contact_email: string
  contact_phone: string
  business_hours: string
  footer_text: string
  company_name: string
  ceo_name: string
  business_number: string
  e_commerce_license_number: string
  address: string
  privacy_officer_name: string
  privacy_officer_email: string
}

export default function SiteSettingsPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '달래마켓',
    site_logo_url: 'https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png',
    site_description: '신선한 농산물을 직접 공급하는 B2B 플랫폼',
    site_keywords: '농산물, B2B, 도매, 납품, 신선식품',
    contact_email: 'contact@dalraemarket.com',
    contact_phone: '1588-0000',
    business_hours: '평일 09:00 - 18:00',
    footer_text: '© 2025 달래마켓. All rights reserved.',
    company_name: '(주)달래마켓',
    ceo_name: '홍길동',
    business_number: '123-45-67890',
    e_commerce_license_number: '2024-서울강남-12345',
    address: '서울특별시 강남구 테헤란로 123',
    privacy_officer_name: '김개인',
    privacy_officer_email: 'privacy@dalraemarket.com'
  })

  // DB에서 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single()

      if (data) {
        // undefined 값을 빈 문자열로 처리
        setSettings({
          id: data.id,
          site_name: data.site_name || '',
          site_logo_url: data.site_logo_url || '',
          site_description: data.site_description || '',
          site_keywords: data.site_keywords || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          business_hours: data.business_hours || '',
          footer_text: data.footer_text || '',
          company_name: data.company_name || '',
          ceo_name: data.ceo_name || '',
          business_number: data.business_number || '',
          e_commerce_license_number: data.e_commerce_license_number || '',
          address: data.address || '',
          privacy_officer_name: data.privacy_officer_name || '',
          privacy_officer_email: data.privacy_officer_email || ''
        })
      }
    }

    fetchSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (settings.id) {
        // ID가 있으면 UPDATE
        const { error } = await supabase
          .from('site_settings')
          .update(settings)
          .eq('id', settings.id)

        if (error) throw error
      } else {
        // ID가 없으면 INSERT
        const { error } = await supabase
          .from('site_settings')
          .insert(settings)

        if (error) throw error
      }

      showToast('사이트 정보가 저장되었습니다.', 'success')
    } catch (error) {
      console.error('저장 오류:', error)
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-text">사이트 정보</h1>
        <p className="mt-1 text-sm text-text-secondary">사이트명, 로고, SEO 설정을 관리합니다.</p>
      </div>

      {/* 기본 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">기본 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              사이트명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => handleChange('site_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="사이트명을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              대표 이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={settings.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              대표 전화번호
            </label>
            <input
              type="tel"
              value={settings.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="1588-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              운영 시간
            </label>
            <input
              type="text"
              value={settings.business_hours}
              onChange={(e) => handleChange('business_hours', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="평일 09:00 - 18:00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            로고 URL
          </label>
          <input
            type="url"
            value={settings.site_logo_url}
            onChange={(e) => handleChange('site_logo_url', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
            placeholder="https://example.com/logo.png"
          />
          {settings.site_logo_url && (
            <div className="mt-3">
              <img
                src={settings.site_logo_url}
                alt="로고 미리보기"
                className="h-12 object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* SEO 설정 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">SEO 설정</h2>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            사이트 설명
          </label>
          <textarea
            value={settings.site_description}
            onChange={(e) => handleChange('site_description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
            placeholder="사이트에 대한 간단한 설명을 입력하세요"
          />
          <p className="mt-1 text-xs text-text-tertiary">
            검색 엔진에 표시될 설명입니다. (권장: 150자 이내)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            키워드
          </label>
          <input
            type="text"
            value={settings.site_keywords}
            onChange={(e) => handleChange('site_keywords', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
            placeholder="키워드1, 키워드2, 키워드3"
          />
          <p className="mt-1 text-xs text-text-tertiary">
            쉼표(,)로 구분하여 입력하세요.
          </p>
        </div>
      </div>

      {/* 사업자 정보 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">사업자 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              상호명
            </label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="(주)회사명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              대표자명
            </label>
            <input
              type="text"
              value={settings.ceo_name}
              onChange={(e) => handleChange('ceo_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              사업자등록번호
            </label>
            <input
              type="text"
              value={settings.business_number}
              onChange={(e) => handleChange('business_number', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="123-45-67890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              통신판매업신고번호
            </label>
            <input
              type="text"
              value={settings.e_commerce_license_number}
              onChange={(e) => handleChange('e_commerce_license_number', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="2024-서울강남-12345"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            사업장 주소
          </label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
            placeholder="서울특별시 강남구 테헤란로 123"
          />
        </div>
      </div>

      {/* 개인정보처리책임자 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">개인정보처리책임자</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              책임자명
            </label>
            <input
              type="text"
              value={settings.privacy_officer_name}
              onChange={(e) => handleChange('privacy_officer_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="김개인"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              책임자 이메일
            </label>
            <input
              type="email"
              value={settings.privacy_officer_email}
              onChange={(e) => handleChange('privacy_officer_email', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              placeholder="privacy@example.com"
            />
          </div>
        </div>
      </div>

      {/* 푸터 설정 */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">푸터 설정</h2>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            푸터 텍스트
          </label>
          <input
            type="text"
            value={settings.footer_text}
            onChange={(e) => handleChange('footer_text', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
            placeholder="© 2025 회사명. All rights reserved."
          />
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
    </div>
  )
}
