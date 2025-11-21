'use client'

import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function LogoutButton() {
  const router = useRouter()
  const { showToast } = useToast()

  const handleLogout = async () => {
    try {
      const { logout } = await import('@/lib/logout');
      const result = await logout(router, '/');

      if (result.success) {
        showToast('로그아웃되었습니다.', 'success');
      } else {
        showToast('로그아웃 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showToast('로그아웃 중 오류가 발생했습니다.', 'error');
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="px-2.5 py-1.5 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-md hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
      title="로그아웃"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="font-medium">로그아웃</span>
    </button>
  )
}
