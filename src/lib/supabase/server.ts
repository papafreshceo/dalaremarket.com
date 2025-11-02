import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// 서버 컴포넌트에서 사용할 Supabase 클라이언트
export async function createClient() {
  try {
    const cookieStore = await cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // 서버 컴포넌트에서는 쿠키 설정이 불가능할 수 있음
              console.error('Cookie setting error:', error)
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}

// Admin 권한을 가진 Supabase 클라이언트 (서비스 롤 키 사용)
// API routes에서만 사용하고, 클라이언트 사이드에 노출되지 않도록 주의
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}