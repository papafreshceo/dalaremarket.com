'use client'

import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function LogoutButton() {
  const router = useRouter()
  const { showToast } = useToast()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        showToast('로그아웃되었습니다.', 'success')
        router.push('/')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
    >
      로그아웃
    </button>
  )
}
