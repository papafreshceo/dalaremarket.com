import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[Check Duplicate] ===== API 호출됨 =====')
    const { email } = await request.json()
    console.log('[Check Duplicate] 받은 이메일:', email)

    if (!email) {
      console.log('[Check Duplicate] ❌ 이메일 없음')
      return NextResponse.json(
        { success: false, isDuplicate: false, error: '이메일을 입력해주세요' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log('[Check Duplicate] 정규화된 이메일:', normalizedEmail)

    // 서비스 롤 키를 사용하여 RLS 우회
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. users 테이블에서 이메일 확인
    console.log('[Check Duplicate] users 테이블 검색 시작...')
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    console.log('[Check Duplicate] 검색 결과 - existingUser:', existingUser)
    console.log('[Check Duplicate] 검색 결과 - userError:', userError)

    if (userError && userError.code !== 'PGRST116') {
      console.error('[Check Duplicate] Database error:', userError)
      return NextResponse.json(
        { success: false, isDuplicate: false, error: '이메일 확인 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    // 이미 존재하는 이메일
    if (existingUser) {
      console.log('[Check Duplicate] ❌ 중복 이메일 발견!')
      console.log('[Check Duplicate] 중복 사용자 ID:', existingUser.id)
      return NextResponse.json(
        {
          success: false,
          isDuplicate: true,
          error: '이미 가입된 이메일입니다',
        },
        { status: 400 }
      )
    }

    // 사용 가능한 이메일
    console.log('[Check Duplicate] ✅ 사용 가능한 이메일')
    return NextResponse.json(
      {
        success: true,
        isDuplicate: false,
        message: '사용 가능한 이메일입니다',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Check Duplicate] ❌ 서버 에러:', error)
    return NextResponse.json(
      { success: false, isDuplicate: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
