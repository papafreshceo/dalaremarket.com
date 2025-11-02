import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()

    // OAuth 코드를 세션으로 교환
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('OAuth session error:', sessionError)
      return NextResponse.redirect(new URL('/?error=oauth_failed', requestUrl.origin))
    }

    if (session?.user) {
      // OAuth provider 확인 (google, kakao 등)
      const provider = session.user.app_metadata?.provider || 'email'

      // users 테이블에 사용자가 있는지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single()

      // 사용자가 없으면 생성 (소셜 로그인은 자동 승인)
      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '사용자',
            phone: session.user.user_metadata?.phone || null,
            role: 'seller',
            approved: true,
            last_login_provider: provider,
          })

        if (insertError) {
          console.error('Failed to create user profile:', insertError)
          // 프로필 생성 실패해도 로그인은 진행
        }
      } else {
        // 기존 사용자의 last_login_provider 업데이트
        await supabase
          .from('users')
          .update({ last_login_provider: provider })
          .eq('id', session.user.id)
      }

      // 로그인 성공 - 메인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
  }

  // code가 없거나 세션 생성 실패 시 메인 페이지로
  return NextResponse.redirect(new URL('/?error=invalid_request', requestUrl.origin))
}