import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', request.url))
  }

  try {
    // 1. 네이버 액세스 토큰 받기
    const tokenResponse = await fetch(
      `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&code=${code}&state=${state}`
    )

    const tokenData = await tokenResponse.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token error:', tokenData)
      return NextResponse.redirect(new URL('/auth/login?error=token_failed', request.url))
    }

    // 2. 네이버 사용자 정보 가져오기
    const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()

    if (userData.resultcode !== '00' || !userData.response) {
      console.error('User info error:', userData)
      return NextResponse.redirect(new URL('/auth/login?error=user_info_failed', request.url))
    }

    const naverUser = userData.response
    const email = naverUser.email
    const name = naverUser.name || naverUser.nickname
    const phone = naverUser.mobile?.replace(/-/g, '') || naverUser.mobile_e164?.replace('+82', '0')

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=no_email', request.url))
    }

    // 3. Supabase에 사용자 등록/로그인
    const supabase = await createClient()

    // 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      // 기존 사용자 - Supabase Auth 로그인
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: `naver_${naverUser.id}`, // 네이버 ID를 비밀번호로 사용
      })

      if (signInError) {
        // 비밀번호가 없거나 틀린 경우, 임시 비밀번호로 업데이트
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: `naver_${naverUser.id}` }
        )

        if (updateError) {
          console.error('Password update error:', updateError)
          return NextResponse.redirect(new URL('/auth/login?error=login_failed', request.url))
        }

        // 다시 로그인 시도
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: `naver_${naverUser.id}`,
        })

        if (retryError) {
          console.error('Retry login error:', retryError)
          return NextResponse.redirect(new URL('/auth/login?error=login_failed', request.url))
        }
      }

      // 로그인 성공
      return NextResponse.redirect(new URL('/platform/dashboard', request.url))
    } else {
      // 신규 사용자 - 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: `naver_${naverUser.id}`,
        options: {
          data: {
            name,
            phone,
            provider: 'naver',
          },
        },
      })

      if (signUpError || !authData.user) {
        console.error('Sign up error:', signUpError)
        return NextResponse.redirect(new URL('/auth/login?error=signup_failed', request.url))
      }

      // users 테이블에 정보 저장
      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        email,
        name,
        phone,
        role: 'platform_seller',
        approved: false, // 관리자 승인 대기
        provider: 'naver',
      })

      if (insertError) {
        console.error('User insert error:', insertError)
        return NextResponse.redirect(new URL('/auth/login?error=user_creation_failed', request.url))
      }

      // 회원가입 완료 - 승인 대기 페이지로
      return NextResponse.redirect(new URL('/auth/pending-approval', request.url))
    }
  } catch (error) {
    console.error('Naver OAuth error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url))
  }
}
