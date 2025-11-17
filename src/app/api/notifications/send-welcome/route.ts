import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 요청 데이터
    const { userId, name } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터 누락' },
        { status: 400 }
      )
    }

    // OneSignal 설정
    const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.error('[Welcome Notification] OneSignal credentials missing')
      return NextResponse.json(
        { success: false, error: 'OneSignal 설정 누락' },
        { status: 500 }
      )
    }

    // OneSignal API로 알림 발송
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: 'tag', key: 'user_id', relation: '=', value: userId },
        ],
        headings: { en: '달래마켓에 오신 것을 환영합니다! 🎉' },
        contents: {
          en: `${name || '고객'}님, 회원가입을 축하드립니다. 달래마켓과 함께 성공적인 거래를 시작하세요!`,
        },
        data: {
          type: 'welcome',
          user_id: userId,
        },
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/platform`,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[Welcome Notification] OneSignal error:', result)
      return NextResponse.json(
        { success: false, error: '알림 발송 실패' },
        { status: 500 }
      )
    }

    // 알림 로그 저장
    await supabase.from('notifications').insert({
      user_id: userId,
      title: '달래마켓에 오신 것을 환영합니다! 🎉',
      message: `${name || '고객'}님, 회원가입을 축하드립니다. 달래마켓과 함께 성공적인 거래를 시작하세요!`,
      type: 'welcome',
      read: false,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: '환영 알림이 발송되었습니다',
      notificationId: result.id,
    })

  } catch (error) {
    console.error('[Welcome Notification] Error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
