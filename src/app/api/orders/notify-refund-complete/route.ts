import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/onesignal-notifications';
import logger from '@/lib/logger';

/**
 * POST /api/orders/notify-refund-complete
 *
 * 관리자가 환불완료 처리 시 사용자에게 알림 전송
 * - "{환불건수}건의 환불이 완료되었습니다. 환불금액: {총환불금액}원"
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인 (관리자)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const { organizationId, orderCount, totalRefundAmount } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: '조직 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!orderCount || !totalRefundAmount) {
      return NextResponse.json(
        { success: false, error: '환불 건수와 금액이 필요합니다.' },
        { status: 400 }
      );
    }

    // 조직 정보 조회
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('business_name')
      .eq('id', organizationId)
      .single();

    if (orgError || !orgData) {
      logger.error('[notify-refund-complete] 조직 조회 실패:', orgError);
      return NextResponse.json(
        { success: false, error: '조직 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 조직의 모든 사용자에게 알림 전송
    const { data: orgUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('primary_organization_id', organizationId);

    if (usersError) {
      logger.error('[notify-refund-complete] 사용자 조회 실패:', usersError);
      return NextResponse.json(
        { success: false, error: '사용자 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    if (!orgUsers || orgUsers.length === 0) {
      logger.warn('[notify-refund-complete] 조직에 속한 사용자가 없습니다:', organizationId);
      return NextResponse.json({
        success: true,
        message: '알림을 받을 사용자가 없습니다.'
      });
    }

    const userIds = orgUsers.map(u => u.id);

    // 알림 메시지 구성
    const title = '💰 환불 완료';
    const body = `${orderCount}건의 환불이 완료되었습니다. 환불금액: ${totalRefundAmount.toLocaleString()}원`;

    // 사용자들에게 알림 전송
    await createNotification({
      userIds,
      type: 'order_status',
      category: 'seller',
      title,
      body,
      resourceType: 'refund',
      resourceId: organizationId,
      actionUrl: '/platform/orders?status=refunded',
      data: {
        organization_id: organizationId,
        order_count: orderCount,
        total_refund_amount: totalRefundAmount,
        business_name: orgData.business_name
      },
      priority: 'high',
    });

    logger.info('[notify-refund-complete] 알림 전송 완료:', {
      organizationId,
      orderCount,
      totalRefundAmount,
      userCount: userIds.length
    });

    return NextResponse.json({
      success: true,
      orderCount,
      totalRefundAmount,
      notifiedUsers: userIds.length
    });

  } catch (error: any) {
    logger.error('[notify-refund-complete] 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
