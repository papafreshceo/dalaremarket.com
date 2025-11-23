// src/lib/session-sync.ts

import { createClient } from '@/lib/supabase/client'

/**
 * 세션 동기화 유틸리티
 * 서버와 클라이언트 간 세션 불일치를 해결
 */
export async function syncSession() {
  const supabase = createClient()
  
  try {
    // 1. 현재 세션 가져오기
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('[SessionSync] Current session:', {
      hasSession: !!session,
      error: sessionError?.message,
      expiresAt: session?.expires_at
    })

    if (sessionError) {
      console.error('[SessionSync] Session error:', sessionError)
      return { success: false, error: sessionError }
    }

    // 2. 세션이 있으면 갱신
    if (session) {
      const { data: { user }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('[SessionSync] Refresh error:', refreshError)
        
        // 토큰이 만료된 경우 로그아웃
        if (refreshError.message.includes('refresh_token_not_found')) {
          await supabase.auth.signOut()
          window.location.href = '/platform?login=true'
        }
        
        return { success: false, error: refreshError }
      }

      console.log('[SessionSync] Session refreshed:', user?.id)
      return { success: true, user }
    } else {
      // 3. 세션이 없으면 쿠키 확인
      const cookies = document.cookie.split(';')
      const authCookies = cookies.filter(c => 
        c.includes('supabase-auth-token') || 
        c.includes('sb-') ||
        c.includes('auth-token')
      )
      
      console.log('[SessionSync] Auth cookies found:', authCookies.length)
      
      // 쿠키가 있는데 세션이 없으면 문제
      if (authCookies.length > 0) {
        console.warn('[SessionSync] Cookies exist but no session, clearing...')
        
        // 모든 auth 관련 쿠키 제거
        authCookies.forEach(cookie => {
          const name = cookie.split('=')[0].trim()
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        })
      }
      
      return { success: false, error: 'No session' }
    }
  } catch (error) {
    console.error('[SessionSync] Unexpected error:', error)
    return { success: false, error }
  }
}

/**
 * 세션 상태 디버깅
 */
export async function debugSession() {
  const supabase = createClient()
  
  console.group('🔍 Session Debug Info')
  
  // 1. 쿠키 확인
  console.log('Cookies:', document.cookie)
  
  // 2. localStorage 확인
  const storageKeys = Object.keys(localStorage).filter(k => 
    k.includes('supabase') || k.includes('auth')
  )
  console.log('Storage keys:', storageKeys)
  storageKeys.forEach(key => {
    console.log(`  ${key}:`, localStorage.getItem(key)?.substring(0, 50) + '...')
  })
  
  // 3. Supabase 세션 확인
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Supabase session:', session ? {
    user: session.user.email,
    expiresAt: new Date(session.expires_at * 1000).toLocaleString(),
    provider: session.user.app_metadata.provider
  } : 'No session')
  
  // 4. User 확인
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Supabase user:', user ? {
    id: user.id,
    email: user.email,
    role: user.role
  } : 'No user')
  
  console.groupEnd()
}

/**
 * 강제 로그아웃 및 정리
 */
export async function forceCleanup() {
  const supabase = createClient()
  
  console.log('🧹 Forcing cleanup...')
  
  // 1. Supabase 로그아웃
  await supabase.auth.signOut()
  
  // 2. 모든 쿠키 제거
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim()
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  })
  
  // 3. localStorage 정리
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('auth')) {
      localStorage.removeItem(key)
    }
  })
  
  // 4. sessionStorage 정리
  sessionStorage.clear()
  
  console.log('✅ Cleanup complete')
  
  // 5. 페이지 새로고침
  window.location.href = '/'
}
