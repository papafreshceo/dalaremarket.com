import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/onesignal-notifications';
import logger from '@/lib/logger';

/**
 * POST /api/orders/notify-status-change
 *
 * 사용자가 주문 상태를 변경했을 때 관리자에게 그룹화된 알림 전송
 * - 취소요청: "{사업자명}님이 총 x건의 주문을 취소요청 하였습니다"
 * - 발주확정: "{사업자명}님이 총 x건 x원의 주문을 발주확정 하였습니다"
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const { orderIds, status, totalAmount } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!status || !['취소요청', '발주서확정'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    // 주문 정보 조회 (서브계정의 사업자명 포함)
    const { data: orders, error: ordersError } = await supabase
      .from('integrated_orders')
      .select('id, sub_account_id, sub_accounts(business_name)')
      .in('id', orderIds)
      .limit(1)
      .single();

    if (ordersError) {
      logger.error('[notify-status-change] 주문 조회 실패:', ordersError);
      return NextResponse.json(
        { success: false, error: '주문 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    if (!orders) {
      return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 서브계정의 사업자명 가져오기
    const businessName = (orders.sub_accounts as any)?.business_name || '알 수 없음';
    const orderCount = orderIds.length;

    // 상태별 알림 메시지 구성
    let title = '';
    let body = '';
    let icon = '';

    if (status === '취소요청') {
      icon = '🚫';
      title = '취소 요청';
      body = `${businessName}님이 총 ${orderCount}건의 주문을 취소요청 하였습니다`;
    } else if (status === '발주서확정') {
      icon = '✅';
      title = '발주 확정';
      if (totalAmount !== undefined) {
        body = `${businessName}님이 총 ${orderCount}건 공급가 ${totalAmount.toLocaleString()}원의 주문을 발주확정 하였습니다`;
      } else {
        body = `${businessName}님이 총 ${orderCount}건의 주문을 발주확정 하였습니다`;
      }
    }

    // 관리자에게 그룹화된 알림 전송
    await createNotification({
      sendToAdmins: true,
      type: 'admin_order_status_change',
      category: 'admin',
      title: `${icon} ${title}`,
      body,
      resourceType: 'orders',
      resourceId: orderIds.join(','),
      actionUrl: '/admin/order-platform',
      data: {
        order_ids: orderIds,
        order_count: orderCount,
        business_name: businessName,
        status,
        total_amount: totalAmount
      },
      priority: 'high',
    });

    logger.info('[notify-status-change] 알림 전송 완료:', {
      status,
      orderCount,
      businessName,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      orderCount,
      status
    });

  } catch (error: any) {
    logger.error('[notify-status-change] 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
