import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[Verify Code] API called')
    const supabase = await createClient()

    // 요청 데이터
    const { email, code } = await request.json()
    console.log('[Verify Code] Request data:', { email, code })

    if (!email || !code) {
      console.log('[Verify Code] Missing email or code')
      return NextResponse.json(
        { success: false, error: '이메일과 인증 코드를 입력해주세요' },
        { status: 400 }
      )
    }

    // 인증 코드 조회 (최신 것만)
    console.log('[Verify Code] Querying database...')
    const { data: verification, error: fetchError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('[Verify Code] Query result:', { verification, fetchError })

    if (fetchError) {
      console.error('[Verify Code] Fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: '인증 코드 조회 실패' },
        { status: 500 }
      )
    }

    if (!verification) {
      console.log('[Verify Code] No verification found')
      return NextResponse.json(
        { success: false, error: '인증 코드가 일치하지 않습니다' },
        { status: 400 }
      )
    }

    console.log('[Verify Code] Verification found, checking expiration...')

    // 만료 시간 확인 (타임존 문제 해결)
    // DB에서 가져온 시간에 Z를 붙여서 UTC로 명시
    const expiresAtStr = verification.expires_at.endsWith('Z')
      ? verification.expires_at
      : verification.expires_at + 'Z'
    const expiresAt = new Date(expiresAtStr)
    const now = new Date()

    console.log('[Verify Code] Expiration check:')
    console.log('  expires_at from DB:', verification.expires_at)
    console.log('  expiresAt (corrected):', expiresAt.toISOString())
    console.log('  now:', now.toISOString())
    console.log('  now > expiresAt:', now > expiresAt)
    console.log('  time difference (seconds):', (expiresAt.getTime() - now.getTime()) / 1000)

    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.' },
        { status: 400 }
      )
    }

    // 인증 완료 처리
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verification.id)

    if (updateError) {
      console.error('[Verify Code] Update error:', updateError)
      return NextResponse.json(
        { success: false, error: '인증 처리 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다',
      email: email,
    })

  } catch (error) {
    console.error('[Verify Code] Error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
