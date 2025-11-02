import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name, phone, naver_id, agree_marketing, agree_push } =
      await request.json()

    if (!email || !naver_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 임시 비밀번호 생성
    const tempPassword = `naver_${naver_id}_${Date.now()}`

    // Supabase Auth에 사용자 생성
    const { data: authData, error: signUpError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name,
          phone,
          provider: 'naver',
        },
      })

    if (signUpError || !authData.user) {
      console.error('Sign up error:', signUpError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // users 테이블에 정보 저장
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      name,
      phone,
      role: 'platform_seller',
      approved: false,
      provider: 'naver',
      agree_marketing: agree_marketing || false,
      agree_push: agree_push || false,
    })

    if (insertError) {
      console.error('User insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save user data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      email,
      temp_password: tempPassword,
    })
  } catch (error) {
    console.error('Naver register API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
