'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface SiteSettings {
  site_name: string
  site_logo_url: string
  site_description: string
  site_keywords: string
  contact_email: string
  contact_phone: string
  business_hours: string
  footer_text: string
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
    contact_email: 'contact@dalreamarket.com',
    contact_phone: '1588-0000',
    business_hours: '평일 09:00 - 18:00',
    footer_text: '© 2025 달래마켓. All rights reserved.'
  })

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // 실제로는 Supabase에 저장
      // await supabase.from('site_settings').upsert(settings)

      showToast('사이트 정보가 저장되었습니다.', 'success')
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}
