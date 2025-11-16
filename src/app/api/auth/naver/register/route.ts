import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import logger from '@/lib/logger';
import { notifyAdminNewMember } from '@/lib/onesignal-notifications';

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
      logger.error('Sign up error:', signUpError);
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
      logger.error('User insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save user data' },
        { status: 500 }
      )
    }

    // 🔔 관리자에게 신규 회원가입 알림 전송
    try {
      await notifyAdminNewMember({
        userId: authData.user.id,
        userName: name || email.split('@')[0],
        userEmail: email,
        signupMethod: 'naver'
      });
    } catch (notificationError) {
      logger.error('신규 회원가입 알림 전송 실패:', notificationError);
      // 알림 실패해도 회원가입은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      email,
      temp_password: tempPassword,
    })
  } catch (error) {
    logger.error('Naver register API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
