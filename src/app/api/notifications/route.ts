import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'

/**
 * GET /api/notifications
 * 로그인한 사용자의 알림 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // 쿼리 파라미터
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 알림 조회 쿼리 작성
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })

    // 필터링
    if (unreadOnly) {
      query = query.eq('read', false)
    }

    if (type) {
      query = query.eq('type', type)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error: fetchError, count } = await query

    if (fetchError) {
      console.error('알림 조회 실패:', fetchError)
      return NextResponse.json(
        { error: '알림 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    // 읽지 않은 알림 개수 조회
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)
      .eq('read', false)

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total_count: count || 0,
    })
  } catch (error) {
    console.error('알림 조회 오류:', error)
    return NextResponse.json(
      { error: '알림 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * 알림 읽음 처리
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const body = await request.json()
    const { notification_ids, mark_all } = body
    const supabase = await createClient()

    if (mark_all) {
      // 모든 알림 읽음 처리
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', auth.user.id)
        .eq('read', false)

      if (updateError) {
        console.error('알림 읽음 처리 실패:', updateError)
        return NextResponse.json(
          { error: '알림 읽음 처리에 실패했습니다' },
          { status: 500 }
        )
      }
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // 특정 알림들만 읽음 처리
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .in('id', notification_ids)
        .eq('user_id', auth.user.id)

      if (updateError) {
        console.error('알림 읽음 처리 실패:', updateError)
        return NextResponse.json(
          { error: '알림 읽음 처리에 실패했습니다' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'notification_ids 또는 mark_all 파라미터가 필요합니다' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '알림이 읽음 처리되었습니다',
    })
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error)
    return NextResponse.json(
      { error: '알림 읽음 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications
 * 알림 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('id')
    const supabase = await createClient()

    if (!notificationId) {
      return NextResponse.json(
        { error: '알림 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 본인의 알림만 삭제 가능
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', auth.user.id)

    if (deleteError) {
      console.error('알림 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '알림 삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '알림이 삭제되었습니다',
    })
  } catch (error) {
    console.error('알림 삭제 오류:', error)
    return NextResponse.json(
      { error: '알림 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
