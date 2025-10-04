// app/admin/settings/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()

  const settingsMenu = [
    {
      title: '품종 마스터 관리',
      description: '품종별 대분류/중분류/소분류를 관리합니다.',
      href: '/admin/settings/itemmaster',
      icon: '📋',
      color: 'bg-teal-500'
    },
    {
      title: '거래처 유형 관리',
      description: '거래처 유형을 추가하거나 수정합니다.',
      href: '/admin/settings/partner-types',
      icon: '🏷️',
      color: 'bg-sky-500'
    },
    {
      title: '카테고리 관리',
      description: '원물 분류 체계(대/중/소분류)를 관리합니다.',
      href: '/admin/settings/categories',
      icon: '📂',
      color: 'bg-blue-500'
    },
    {
      title: '공급상태 관리',
      description: '원물/상품의 공급상태 옵션을 관리합니다.',
      href: '/admin/settings/supply-status',
      icon: '🏷️',
      color: 'bg-emerald-500'
    },
    {
      title: '사용자 관리',
      description: '직원 및 고객 계정을 관리합니다.',
      href: '/admin/settings/users',
      icon: '👥',
      color: 'bg-green-500'
    },
    {
      title: '권한 설정',
      description: '역할별 접근 권한을 설정합니다.',
      href: '/admin/settings/permissions',
      icon: '🔐',
      color: 'bg-purple-500'
    },
    {
      title: '회사 정보',
      description: '회사 기본 정보를 설정합니다.',
      href: '/admin/settings/company',
      icon: '🏢',
      color: 'bg-yellow-500'
    },
    {
      title: '배송 설정',
      description: '배송사 및 배송비를 설정합니다.',
      href: '/admin/settings/shipping',
      icon: '🚚',
      color: 'bg-orange-500'
    },
    {
      title: '알림 설정',
      description: '이메일 및 SMS 알림을 설정합니다.',
      href: '/admin/settings/notifications',
      icon: '🔔',
      color: 'bg-red-500'
    },
    {
      title: '백업/복원',
      description: '데이터 백업 및 복원을 관리합니다.',
      href: '/admin/settings/backup',
      icon: '💾',
      color: 'bg-gray-500'
    },
    {
      title: 'API 설정',
      description: 'API 키 및 웹훅을 관리합니다.',
      href: '/admin/settings/api',
      icon: '🔌',
      color: 'bg-indigo-500'
    }
  ]

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="mt-1 text-sm text-gray-600">
          시스템 설정 및 관리 도구
        </p>
      </div>

      {/* 설정 메뉴 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {settingsMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full">
              <div className="flex items-center mb-3">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-white text-xl`}>
                  {item.icon}
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {item.description}
              </p>
              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span>설정하기</span>
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 시스템 정보 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">시스템 정보</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">버전</p>
            <p className="text-sm font-medium text-gray-900">v1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">데이터베이스</p>
            <p className="text-sm font-medium text-gray-900">Supabase (PostgreSQL)</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">마지막 백업</p>
            <p className="text-sm font-medium text-gray-900">2024-01-03 14:30</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">시스템 상태</p>
            <p className="text-sm font-medium text-green-600">정상 작동중</p>
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => router.push('/admin/settings/categories')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🎯 카테고리 관리 바로가기
        </button>
        <button
          onClick={() => router.push('/admin/settings/supply-status')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          🏷️ 공급상태 관리 바로가기
        </button>
        <button
          onClick={() => alert('캐시를 삭제했습니다.')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          🔄 캐시 삭제
        </button>
        <button
          onClick={() => alert('로그를 다운로드합니다.')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          📥 로그 다운로드
        </button>
      </div>
    </div>
  )
}