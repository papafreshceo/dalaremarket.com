import { NextRequest, NextResponse } from 'next/server'
import { notifyAdminNewMember } from '@/lib/onesignal-notifications'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // 요청 데이터
    const { userId, email, name, organizationName } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터 누락' },
        { status: 400 }
      )
    }

    // 관리자에게 신규 회원 가입 알림 전송
    const result = await notifyAdminNewMember({
      userId,
      userName: name || email.split('@')[0],
      userEmail: email,
      organizationName,
    })

    if (!result.success) {
      logger.error('[Admin New Member] Notification failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    logger.info('[Admin New Member] Notification sent successfully')
    return NextResponse.json({
      success: true,
      message: '관리자에게 알림 발송 완료',
      notificationIds: result.notificationIds,
    })

  } catch (error) {
    logger.error('[Admin New Member] Error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
