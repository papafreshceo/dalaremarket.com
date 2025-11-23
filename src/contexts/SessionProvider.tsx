'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface SessionContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  error: null,
  refreshSession: async () => {}
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false) // 중복 요청 방지
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const refreshSession = async () => {
    // 이미 갱신 중이면 중복 요청 방지
    if (isRefreshing) {
      console.log('[SessionProvider] Already refreshing, skipping...')
      return
    }
    
    try {
      setIsRefreshing(true)
      setError(null)

      // 세션 갱신 시도
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('[SessionProvider] Session error:', sessionError)
        // Rate limit 에러면 일정 시간 대기
        if (sessionError.message?.includes('rate limit')) {
          console.warn('[SessionProvider] Rate limit hit, waiting 60 seconds...')
          setTimeout(() => setIsRefreshing(false), 60000) // 60초 대기
          return
        }
        setError(sessionError.message)
        setUser(null)
        
        // 관리자 페이지에서 세션 오류시 로그인으로
        if (pathname?.startsWith('/admin')) {
          router.push('/platform?login=true')
        }
        return
      }

      if (session) {
        setUser(session.user)
        
        // 세션이 곧 만료되면 갱신 (10분 이내)
        const expiresAt = new Date(session.expires_at * 1000).getTime()
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now
        
        if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('[SessionProvider] Session expiring soon, refreshing...')
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('[SessionProvider] Refresh failed:', refreshError)
          } else {
            console.log('[SessionProvider] Session refreshed')
          }
        }
      } else {
        setUser(null)
        
        // 관리자 페이지인데 세션이 없으면 로그인으로
        if (pathname?.startsWith('/admin')) {
          router.push('/platform?login=true')
        }
      }
    } catch (err) {
      console.error('[SessionProvider] Unexpected error:', err)
      setError('세션 확인 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
      setIsRefreshing(false) // 갱신 완료
    }
  }

  useEffect(() => {
    // 초기 세션 확인 (한 번만)
    if (!user && !loading) {
      refreshSession()
    }

    // Auth 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SessionProvider] Auth state changed:', event)
        
        // Rate limit 방지를 위해 이벤트 필터링
        if (event === 'TOKEN_REFRESHED') {
          // 토큰 갱신은 무시 (자동으로 처리됨)
          return
        }
        
        if (session) {
          setUser(session.user)
          setError(null)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    // 페이지 포커스시 세션 확인 (디바운싱)
    let focusTimeout: NodeJS.Timeout
    const handleFocus = () => {
      clearTimeout(focusTimeout)
      focusTimeout = setTimeout(() => {
        console.log('[SessionProvider] Window focused, checking session...')
        if (!isRefreshing) {
          refreshSession()
        }
      }, 1000) // 1초 디바운싱
    }
    window.addEventListener('focus', handleFocus)

    // 주기적 세션 체크 (5분 → 10분으로 증가)
    const interval = setInterval(() => {
      console.log('[SessionProvider] Periodic session check...')
      if (!isRefreshing) {
        refreshSession()
      }
    }, 10 * 60 * 1000) // 10분마다

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
      clearTimeout(focusTimeout)
    }
  }, []) // pathname 제거하여 무한 루프 방지

  return (
    <SessionContext.Provider value={{ user, loading, error, refreshSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
