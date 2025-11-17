import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/email/resend'

// 템플릿 변수 치환 함수
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value)
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 요청 데이터
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일 주소를 입력해주세요' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '유효한 이메일 주소를 입력해주세요' },
        { status: 400 }
      )
    }

    // 이미 가입된 이메일인지 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '이미 가입된 이메일입니다' },
        { status: 400 }
      )
    }

    // 6자리 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 만료 시간 (5분 후)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // 기존 미인증 코드 삭제
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email)
      .eq('verified', false)

    // 새 인증 코드 저장
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        email,
        code,
        verified: false,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('[Email Verification] DB insert error:', insertError)
      return NextResponse.json(
        { success: false, error: '인증 코드 생성 실패' },
        { status: 500 }
      )
    }

    // 템플릿 가져오기
    const adminClient = createAdminClient()
    const { data: template, error: templateError } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('name', '이메일 인증')
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      console.error('[Email Verification] Template fetch error:', templateError)
      return NextResponse.json(
        { success: false, error: '이메일 템플릿을 찾을 수 없습니다' },
        { status: 500 }
      )
    }

    // 템플릿 변수 치환
    const htmlContent = replaceTemplateVariables(template.html_content, { code })

    // 이메일 발송
    const { error: emailError } = await resend.emails.send({
      from: '달래마켓 <notify@dalraemarket.com>',
      to: [email],
      subject: template.subject,
      html: htmlContent,
    })

    if (emailError) {
      console.error('[Email Verification] Send error:', emailError)
      return NextResponse.json(
        { success: false, error: '이메일 발송 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '인증 코드가 발송되었습니다',
      expiresAt: expiresAt.toISOString(),
    })

  } catch (error) {
    console.error('[Email Verification] Error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
