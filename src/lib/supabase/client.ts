import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// 싱글톤 인스턴스
let client: SupabaseClient | undefined

// 클라이언트 컴포넌트에서 사용할 Supabase 클라이언트 (싱글톤 패턴)
export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // 서버 사이드에서는 document가 없으므로 체크
          if (typeof document === 'undefined') return null

          const cookies = document.cookie.split(';')
          const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
          if (!cookie) return null
          return decodeURIComponent(cookie.split('=')[1])
        },
        set(name: string, value: string, options: any) {
          // 서버 사이드에서는 document가 없으므로 체크
          if (typeof document === 'undefined') return

          let cookie = `${name}=${encodeURIComponent(value)}`

          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          if (options?.path) {
            cookie += `; path=${options.path}`
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          }
          if (options?.secure) {
            cookie += '; secure'
          }

          document.cookie = cookie
        },
        remove(name: string, options: any) {
          this.set(name, '', { ...options, maxAge: 0 })
        }
      }
    }
  )

  return client
}