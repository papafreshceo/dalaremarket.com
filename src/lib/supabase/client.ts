import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// 싱글톤 인스턴스
let client: SupabaseClient | undefined

// 문제있는 base64- 접두사 쿠키 제거
function clearProblematicCookies() {
  if (typeof document === 'undefined') return

  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=')
      if (name.includes('sb-') && name.includes('-auth-token')) {
        // 쿠키 값 확인
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1]

        // base64- 접두사가 있는 경우 쿠키 삭제
        if (value && value.startsWith('base64-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          console.log(`[Supabase] 문제있는 쿠키 제거: ${name}`)
        }
      }
    }
  } catch (error) {
    console.warn('[Supabase] 쿠키 정리 중 오류:', error)
  }
}

// 클라이언트 컴포넌트에서 사용할 Supabase 클라이언트 (싱글톤 패턴)
export function createClient() {
  if (client) {
    return client
  }

  // 문제있는 쿠키 제거
  clearProblematicCookies()

  // Supabase SSR 기본 쿠키 핸들러 사용 (커스텀 핸들러 제거)
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}