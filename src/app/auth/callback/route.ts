import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { autoCreateOrganizationFromUser } from '@/lib/auto-create-organization'
import { generateSellerCode } from '@/lib/user-codes'

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
        // 셀러 코드 생성
        let sellerCode: string | undefined
        try {
          sellerCode = await generateSellerCode()
        } catch (error) {
          console.error('Failed to generate seller code:', error)
          // 코드 생성 실패해도 사용자 생성은 진행
        }

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
            seller_code: sellerCode,
          })

        if (insertError) {
          console.error('Failed to create user profile:', insertError)
          // 프로필 생성 실패해도 로그인은 진행
        } else {
          // ✅ 신규 사용자: 기본 조직 자동 생성 (관리자 제외)
          try {
            // 사용자 role 확인
            const { data: newUserData } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single()

            // 관리자가 아닌 경우만 셀러계정 생성
            if (newUserData?.role !== 'admin' && newUserData?.role !== 'super_admin') {
              await autoCreateOrganizationFromUser(session.user.id)
            }
          } catch (error) {
            console.error('❌ 조직 자동 생성 실패:', error)
            // 조직 생성 실패해도 로그인은 진행
          }
        }
      } else {
        // 기존 사용자의 last_login_provider 업데이트
        await supabase
          .from('users')
          .update({ last_login_provider: provider })
          .eq('id', session.user.id)

        // ✅ 기존 사용자: 조직이 없으면 자동 생성 (관리자 제외)
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('primary_organization_id, role')
            .eq('id', session.user.id)
            .single()

          // 관리자가 아니고 셀러계정이 없는 경우만 생성
          if (!userData?.primary_organization_id &&
              userData?.role !== 'admin' &&
              userData?.role !== 'super_admin') {
            await autoCreateOrganizationFromUser(session.user.id)
          }
        } catch (error) {
          console.error('❌ 조직 확인/생성 실패:', error)
        }
      }

      // 로그인 점수 추가 (하루 1회)
      try {
        console.log('🎯 로그인 점수 추가 시도:', session.user.id)
        const { data: pointsResult, error: pointsError } = await supabase.rpc('add_login_points', { p_user_id: session.user.id })
        if (pointsError) {
          console.error('❌ 로그인 점수 오류:', pointsError)
        } else {
          console.log('✅ 로그인 점수 결과:', pointsResult)
        }
      } catch (error) {
        console.error('❌ Login points error:', error)
        // 점수 추가 실패해도 로그인은 진행
      }

      // 로그인 성공 - 공급상품 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/platform', requestUrl.origin))
    }
  }

  // code가 없거나 세션 생성 실패 시 메인 페이지로
  return NextResponse.redirect(new URL('/?error=invalid_request', requestUrl.origin))
}