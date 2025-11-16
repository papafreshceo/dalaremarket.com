import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, name, phone, naver_id } = await request.json()

    if (!email || !naver_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      // 기존 사용자 - Supabase Auth 사용자 찾기
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const authUser = authUsers.users.find(u => u.email === email)

      if (authUser) {
        // 세션 생성을 위해 임시 비밀번호 설정
        const tempPassword = `naver_${naver_id}_${Date.now()}`

        await supabase.auth.admin.updateUserById(authUser.id, {
          password: tempPassword,
        })

        // 클라이언트에 임시 비밀번호 반환 (세션 생성용)
        return NextResponse.json({
          success: true,
          user_type: 'existing',
          email,
          temp_password: tempPassword,
          redirect: '/',
        })
      }
    }

    // 신규 사용자 - 회원가입 페이지로 안내
    return NextResponse.json({
      success: true,
      user_type: 'new',
      email,
      name,
      phone,
      naver_id,
      needs_registration: true,
    })
  } catch (error) {
    logger.error('Naver login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
