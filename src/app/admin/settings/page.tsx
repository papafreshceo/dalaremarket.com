'use client';

import Link from 'next/link';
import {
  Palette, Bell, Shield, Database, Mail, Globe, Key,
  FileText, Building2, TrendingUp, Package, Truck, CreditCard,
  Image, Layout, MessageSquare, UserPlus, Settings, Wrench,
  ClipboardList, FileSpreadsheet, ShoppingCart, Tags, UserCog, Award, TrendingUp as ChartUp, Calendar
} from 'lucide-react';

export default function SettingsPage() {
  const settingsCategories = [
    {
      category: '기본 데이터 관리',
      cards: [
        {
          title: 'CS 유형 설정',
          description: 'CS 유형을 관리합니다 (환불, 재발송 등)',
          icon: ClipboardList,
          href: '/admin/settings/cs-types',
          color: 'from-amber-500 to-yellow-500',
        },
        {
          title: '거래처 유형',
          description: '거래처 유형을 추가 및 수정합니다',
          icon: Building2,
          href: '/admin/settings/partner-types',
          color: 'from-slate-500 to-gray-500',
        },
        {
          title: '카테고리',
          description: '원물 분류 체계를 관리합니다',
          icon: Tags,
          href: '/admin/settings/categories',
          color: 'from-lime-500 to-green-500',
        },
        {
          title: '공급상태 설정',
          description: '원물/옵션상품 공급상태를 관리합니다',
          icon: TrendingUp,
          href: '/admin/settings/supply-status',
          color: 'from-green-600 to-emerald-600',
        },
        {
          title: '마켓 매핑 설정',
          description: '마켓별 엑셀 필드 매핑을 설정합니다',
          icon: FileSpreadsheet,
          href: '/admin/settings/mapping',
          color: 'from-blue-600 to-indigo-600',
        },
        {
          title: '택배사 설정',
          description: '택배사별 헤더명 매핑을 관리합니다',
          icon: Truck,
          href: '/admin/settings/courier-settings',
          color: 'from-indigo-600 to-violet-600',
        },
        {
          title: '벤더사 양식',
          description: '벤더사별 엑셀 양식을 설정합니다',
          icon: FileText,
          href: '/admin/settings/vendor-templates',
          color: 'from-violet-600 to-purple-600',
        },
        {
          title: '마켓송장 양식',
          description: '마켓별 송장파일 양식을 설정합니다',
          icon: FileSpreadsheet,
          href: '/admin/settings/market-invoice-templates',
          color: 'from-purple-600 to-pink-600',
        },
      ]
    },
    {
      category: '플랫폼 설정',
      cards: [
        {
          title: '배너 관리',
          description: '메인 배너 및 프로모션 배너를 관리합니다',
          icon: Image,
          href: '/admin/settings/banners',
          color: 'from-rose-500 to-pink-500',
        },
        {
          title: '팝업 관리',
          description: '팝업 공지사항을 관리합니다',
          icon: Layout,
          href: '/admin/settings/popups',
          color: 'from-orange-500 to-amber-500',
        },
        {
          title: '프로모션 이미지',
          description: '메인 페이지 프로모션 이미지를 관리합니다',
          icon: Image,
          href: '/admin/settings/promotional-images',
          color: 'from-pink-500 to-rose-500',
        },
        {
          title: '카테고리 노출',
          description: '플랫폼 카테고리 노출 순서를 설정합니다',
          icon: Layout,
          href: '/admin/settings/category-display',
          color: 'from-emerald-500 to-teal-500',
        },
        {
          title: '결제 설정',
          description: '결제 수단 및 PG 연동을 설정합니다',
          icon: CreditCard,
          href: '/admin/settings/payment',
          color: 'from-green-500 to-emerald-500',
        },
        {
          title: '배송 설정',
          description: '배송사 및 배송비 정책을 관리합니다',
          icon: Truck,
          href: '/admin/settings/shipping',
          color: 'from-blue-500 to-indigo-500',
        },
        {
          title: '알림 설정',
          description: '이메일, SMS 알림 및 템플릿을 관리합니다',
          icon: Bell,
          href: '/admin/settings/notifications',
          color: 'from-yellow-500 to-orange-500',
        },
        {
          title: '챗봇 설정',
          description: 'AI 챗봇 관리 및 설정을 합니다',
          icon: MessageSquare,
          href: '/admin/settings/chatbot',
          color: 'from-cyan-500 to-blue-500',
        },
        {
          title: '관리자 닉네임',
          description: '셀러피드에서 사용할 관리자 닉네임을 관리합니다',
          icon: UserCog,
          href: '/admin/settings/admin-nicknames',
          color: 'from-violet-500 to-purple-500',
        },
        {
          title: '티어 등급 기준',
          description: '판매자 등급 기준 및 할인율을 설정합니다',
          icon: Award,
          href: '/admin/settings/tier-criteria',
          color: 'from-amber-500 to-yellow-500',
          badge: 'NEW'
        },
        {
          title: '랭킹 점수 산정',
          description: '랭킹 시스템의 점수 계산 기준을 설정합니다',
          icon: ChartUp,
          href: '/admin/settings/ranking-score',
          color: 'from-blue-500 to-cyan-500',
        },
        {
          title: '일정 관리',
          description: '공휴일/휴무일/할일/상품정보 등을 관리합니다',
          icon: Calendar,
          href: '/admin/settings/holidays',
          color: 'from-red-500 to-orange-500',
        },
      ]
    },
    {
      category: '핵심 설정',
      cards: [
        {
          title: '디자인 테마',
          description: '플랫폼 전체 디자인 테마를 관리하고 CSS 변수를 설정합니다',
          icon: Palette,
          href: '/admin/design-themes',
          color: 'from-purple-500 to-pink-500',
          badge: 'NEW'
        },
        {
          title: '보안 설정',
          description: '보안 정책 및 인증 방법을 설정합니다',
          icon: Shield,
          href: '/admin/settings/security',
          color: 'from-red-500 to-orange-500',
          badge: 'NEW'
        },
        {
          title: '사이트 정보',
          description: '사이트명, 로고, SEO 설정을 관리합니다',
          icon: Globe,
          href: '/admin/settings/site',
          color: 'from-teal-500 to-green-500',
        },
        {
          title: '회사 정보',
          description: '회사 기본 정보 및 사업자 정보를 관리합니다',
          icon: Building2,
          href: '/admin/settings/company',
          color: 'from-blue-600 to-cyan-600',
        },
      ]
    },
    {
      category: '권한 관리',
      cards: [
        {
          title: '사용자 초대',
          description: '관리자 및 직원을 초대합니다',
          icon: UserPlus,
          href: '/admin/settings/invite',
          color: 'from-indigo-500 to-purple-500',
        },
        {
          title: '권한 설정',
          description: '역할별 접근 권한을 설정합니다',
          icon: Shield,
          href: '/admin/settings/permissions',
          color: 'from-violet-500 to-purple-500',
        },
      ]
    },
    {
      category: '시스템',
      cards: [
        {
          title: '백업/복원',
          description: '데이터 백업 및 복원을 관리합니다',
          icon: Database,
          href: '/admin/settings/backup',
          color: 'from-yellow-500 to-amber-500',
        },
        {
          title: 'API 설정',
          description: 'API 키, 웹훅 및 API 문서를 관리합니다',
          icon: Key,
          href: '/admin/settings/api',
          color: 'from-indigo-500 to-purple-500',
        },
        {
          title: 'DB 문제 해결',
          description: '데이터베이스 진단 도구를 실행합니다',
          icon: Wrench,
          href: '/admin/settings/database-fix',
          color: 'from-red-600 to-orange-600',
        },
      ]
    },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">설정</h1>
        <p className="text-text-secondary">시스템 전체 설정을 관리합니다</p>
      </div>

      {/* 그룹별 칼럼 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {settingsCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* 카테고리 헤더 */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3">
              <h2 className="text-sm font-bold text-white">{category.category}</h2>
            </div>

            {/* 설정 목록 */}
            <div className="divide-y divide-border">
              {category.cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group relative block px-4 py-3 hover:bg-surface-hover transition-colors"
                  >
                    {/* 배지 */}
                    {card.badge && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                        {card.badge}
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      {/* 아이콘 */}
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>

                      {/* 텍스트 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text mb-0.5 group-hover:text-primary transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {card.description}
                        </p>
                      </div>

                      {/* 화살표 */}
                      <svg className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 정보 */}
      <div className="mt-8 p-6 bg-surface border border-border rounded-xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text mb-1">설정 변경 시 주의사항</h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              시스템 설정을 변경하면 전체 서비스에 영향을 줄 수 있습니다. 변경 전에 현재 설정을 백업하고, 테스트 환경에서 먼저 확인하는 것을 권장합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
