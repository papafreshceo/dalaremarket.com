import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// 싱글톤 인스턴스
let client: SupabaseClient | undefined

// 클라이언트 컴포넌트에서 사용할 Supabase 클라이언트
export function createClient() {
  if (client) {
    return client
  }

  // Supabase SSR 클라이언트 생성 (명시적 쿠키 핸들러)
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          const cookies = document.cookie.split(';')
          for (const cookie of cookies) {
            const [key, value] = cookie.trim().split('=')
            if (key === name) {
              return decodeURIComponent(value)
            }
          }
          return undefined
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          let cookieStr = `${name}=${encodeURIComponent(value)}`
          if (options?.maxAge) cookieStr += `; max-age=${options.maxAge}`
          if (options?.path) cookieStr += `; path=${options.path}`
          if (options?.domain) cookieStr += `; domain=${options.domain}`
          if (options?.secure) cookieStr += `; secure`
          if (options?.sameSite) cookieStr += `; samesite=${options.sameSite}`
          document.cookie = cookieStr
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${options?.path || '/'}`
        }
      }
    }
  )

  return client
}

// 클라이언트 재생성 (세션 문제 시 사용)
export function resetClient() {
  client = undefined
}
