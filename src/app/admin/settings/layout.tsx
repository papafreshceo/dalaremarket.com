// app/admin/settings/layout.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const settingsCategories = [
    {
      category: '기본 데이터 관리',
      items: [
        {
          title: '품종 마스터',
          description: '품종별 대/중/소분류 관리',
          href: '/admin/settings/itemmaster'
        },
        {
          title: '거래처 유형',
          description: '거래처 유형 추가 및 수정',
          href: '/admin/settings/partner-types'
        },
        {
          title: '카테고리',
          description: '원물 분류 체계 관리',
          href: '/admin/settings/categories'
        },
        {
          title: '공급상태',
          description: '원물/상품 공급상태 옵션',
          href: '/admin/settings/supply-status'
        },
        {
          title: '출고처/송장주체',
          description: '출고처 및 송장주체 관리',
          href: '/admin/settings/shipping-invoice'
        }
      ]
    },
    {
      category: '플랫폼 설정',
      items: [
        {
          title: '사이트 정보',
          description: '사이트명, 로고, SEO 설정',
          href: '/admin/settings/site'
        },
        {
          title: '배너 관리',
          description: '메인 배너 및 프로모션 배너',
          href: '/admin/settings/banners'
        },
        {
          title: '카테고리 노출',
          description: '플랫폼 카테고리 노출 순서',
          href: '/admin/settings/category-display'
        },
        {
          title: '결제 설정',
          description: '결제 수단 및 PG 연동',
          href: '/admin/settings/payment'
        },
        {
          title: '배송 설정',
          description: '배송사 및 배송비 정책',
          href: '/admin/settings/shipping'
        },
        {
          title: '알림 설정',
          description: '이메일 및 SMS 알림',
          href: '/admin/settings/notifications'
        }
      ]
    },
    {
      category: '사용자 및 권한',
      items: [
        {
          title: '사용자 관리',
          description: '직원 및 고객 계정',
          href: '/admin/settings/users'
        },
        {
          title: '사용자 초대',
          description: '관리자/직원 초대',
          href: '/admin/settings/invite'
        },
        {
          title: '권한 설정',
          description: '역할별 접근 권한',
          href: '/admin/settings/permissions'
        }
      ]
    },
    {
      category: '시스템',
      items: [
        {
          title: '회사 정보',
          description: '회사 기본 정보',
          href: '/admin/settings/company'
        },
        {
          title: '백업/복원',
          description: '데이터 백업 및 복원',
          href: '/admin/settings/backup'
        },
        {
          title: 'API 설정',
          description: 'API 키 및 웹훅',
          href: '/admin/settings/api'
        }
      ]
    }
  ]

  return (
    <div className="flex gap-6 h-full">
      {/* 좌측 사이드바 */}
      <div className="w-32 flex-shrink-0 space-y-4">
        <div className="text-lg font-bold text-gray-900">설정</div>

        {/* 카테고리별 설정 메뉴 */}
        <div className="space-y-3">
          {settingsCategories.map((category, idx) => (
            <div key={idx}>
              <div className="text-[11px] font-semibold text-gray-500 mb-1">
                {category.category}
              </div>
              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block pl-2 py-1 rounded transition-colors group ${
                        isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-[14px] font-medium transition-colors ${
                        isActive ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'
                      }`}>
                        {item.title}
                      </div>
                    </Link>
                  )
                })}
              </div>
              {idx < settingsCategories.length - 1 && (
                <div className="border-b border-gray-100 mt-3" />
              )}
            </div>
          ))}
        </div>

        {/* 시스템 정보 */}
        <div className="bg-gray-50 rounded p-2 border border-gray-200 mt-auto">
          <div className="text-[10px] font-semibold text-gray-700 mb-1.5">시스템 정보</div>
          <div className="space-y-1.5">
            <div>
              <div className="text-[9px] text-gray-500">버전</div>
              <div className="text-[10px] font-semibold text-gray-900">v1.0.0</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500">상태</div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <div className="text-[10px] font-semibold text-green-600">정상</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 콘텐츠 영역 */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}