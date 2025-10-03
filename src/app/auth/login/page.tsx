'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)
  setLoading(true)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // 로그인 성공 - 사용자 역할 확인
    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role, approved')
        .eq('id', data.user.id)
        .single()

      console.log('User Data:', userData)  // 디버깅용

      if (!userData?.approved) {
        await supabase.auth.signOut()
        setError('계정이 아직 승인되지 않았습니다.')
        setLoading(false)
        return
      }

      // 리다이렉트 전에 페이지 확인
      if (userData.role === 'admin' || userData.role === 'employee') {
        window.location.href = '/admin/dashboard'  // router.push 대신 직접 이동
      } else {
        window.location.href = '/platform/dashboard'
      }
    }
  } catch (err) {
    console.error('Login error:', err)  // 에러 상세 확인
    setError('로그인 중 오류가 발생했습니다.')
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            달래아마켓 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              회원가입
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                로그인 상태 유지
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                비밀번호 찾기
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}