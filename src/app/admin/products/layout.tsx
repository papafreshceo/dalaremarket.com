// app/admin/products/layout.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'

export default function ProductsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const productCategories = [
    {
      category: '상품 관리',
      items: [
        {
          title: '원물관리',
          description: '원물 정보, 시세 관리',
          href: '/admin/products/raw-materials'
        },
        {
          title: '옵션상품관리',
          description: '판매 상품 옵션 관리',
          href: '/admin/products/option-products'
        },
        {
          title: '원물매칭',
          description: '옵션상품-원물 연결',
          href: '/admin/products/material-matching'
        },
        {
          title: '카테고리 설정',
          description: '상품 분류 체계',
          href: '/admin/settings/categories'
        }
      ]
    },
    {
      category: '가격 및 재고',
      items: [
        {
          title: '가격표 관리',
          description: '고객별 가격표',
          href: '/admin/products/price-table'
        },
        {
          title: '재고 현황',
          description: '실시간 재고',
          href: '/admin/products/inventory'
        },
        {
          title: '시세 분석',
          description: '원물 시세 추이',
          href: '/admin/products/price-analysis'
        }
      ]
    },
    {
      category: '도구',
      items: [
        {
          title: '일괄 업로드',
          description: '엑셀 일괄 등록',
          href: '/admin/products/bulk-upload'
        },
        {
          title: '바코드 관리',
          description: '바코드 생성/출력',
          href: '/admin/products/barcode'
        }
      ]
    }
  ]

  return (
    <div className="flex gap-6 h-full">
      {/* 좌측 사이드바 */}
      <div className="w-32 flex-shrink-0 space-y-4">
        <div className="text-lg font-bold text-text">상품관리</div>

        {/* 카테고리별 메뉴 */}
        <div className="space-y-3">
          {productCategories.map((category, idx) => (
            <div key={idx}>
              <div className="text-[11px] font-semibold text-text-tertiary mb-1">
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
                        isActive ? 'bg-primary-100 text-primary' : 'hover:bg-surface-hover'
                      }`}
                    >
                      <div className={`text-[14px] font-medium transition-colors ${
                        isActive ? 'text-primary' : 'text-text-secondary group-hover:text-primary'
                      }`}>
                        {item.title}
                      </div>
                    </Link>
                  )
                })}
              </div>
              {idx < productCategories.length - 1 && (
                <div className="border-b border-border mt-3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 우측 콘텐츠 영역 */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
