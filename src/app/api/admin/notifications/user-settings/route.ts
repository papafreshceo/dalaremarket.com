import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/notifications/user-settings
 * 사용자별 알림 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const adminClient = createAdminClient();

    // 사용자 알림 설정 조회 (notification_settings + users + onesignal_player_ids)
    let query = adminClient
      .from('users')
      .select(`
        id,
        email,
        name,
        profile_name,
        role,
        notification_settings (
          all_notifications_enabled,
          order_status_enabled,
          announcement_enabled,
          comment_reply_enabled,
          deposit_confirm_enabled,
          new_message_enabled
        ),
        onesignal_player_ids (
          player_id,
          is_active,
          device_type
        )
      `, { count: 'exact' })
      .order('email', { ascending: true });

    // 검색 조건
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,profile_name.ilike.%${search}%`);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      logger.error('사용자 알림 설정 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '사용자 알림 설정 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 데이터 가공
    const processedUsers = users?.map(user => {
      const settings = Array.isArray(user.notification_settings)
        ? user.notification_settings[0]
        : user.notification_settings;

      const playerIds = Array.isArray(user.onesignal_player_ids)
        ? user.onesignal_player_ids
        : [];

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_name: user.profile_name,
        role: user.role,
        settings: settings || {
          all_notifications_enabled: true,
          order_status_enabled: true,
          announcement_enabled: true,
          comment_reply_enabled: true,
          deposit_confirm_enabled: true,
          new_message_enabled: true,
        },
        push_subscription: {
          is_subscribed: playerIds.some((p: any) => p.is_active),
          device_count: playerIds.filter((p: any) => p.is_active).length,
          devices: playerIds.filter((p: any) => p.is_active).map((p: any) => ({
            type: p.device_type,
            player_id: p.player_id?.substring(0, 10) + '...',
          })),
        },
      };
    }) || [];

    // 통계
    const totalUsers = count || 0;
    const totalSubscribed = processedUsers.filter(u => u.push_subscription.is_subscribed).length;
    const totalDisabledAll = processedUsers.filter(u => !u.settings.all_notifications_enabled).length;

    return NextResponse.json({
      success: true,
      users: processedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        total_pages: Math.ceil(totalUsers / limit),
      },
      summary: {
        total_users: totalUsers,
        push_subscribed: totalSubscribed,
        push_unsubscribed: totalUsers - totalSubscribed,
        all_disabled: totalDisabledAll,
      },
    });

  } catch (error: any) {
    logger.error('GET /api/admin/notifications/user-settings 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
